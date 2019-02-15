const url = require('url')

const requester = require('./lib/requester')
const simpleRequester = require('./lib/simpleRequester')
const poller = require('./lib/poller')
const login = require('./lib/login')
const refresh = require('./lib/refresh')
const util = require('./lib/util')

const defaultApiUrl = process.env['MYTHX_API_URL'] || 'https://api.mythx.io'
const defaultApiVersion = 'v1'
const trialUserId = '123456789012345678901234'

// No MythX job we've seen is faster than this value.  So if an
// analysis request isn't cached, then the *first* poll for status
// will be delayed by this amount of time.
const defaultInitialDelay = 30000 // 30 seconds

class Client {
  /**
   *  Creates a client object. Internally this has login information, and from that
   *  an access token. By saving state, we can use and refresh the access token
   *  periodically.
   *
   *  @param {auth} object         - login or authentication information which contains
   *                               ethAddress and a password or...
   *                                apiKey
   *  @param {inputApiUrl} string  - Optional. A URL of a MythX API server we want to contect
   *                                 to.
   *
   */
  constructor (auth, inputApiUrl = defaultApiUrl) {
    const { ethAddress, apiKey, password } = auth || {}

    let userId
    if (!password && !ethAddress && !apiKey) {
      userId = trialUserId
    }

    if (password && !ethAddress && !apiKey) {
      throw new TypeError('Please provide an user id auth option.')
    }

    if (!apiKey && !userId && (!password && ethAddress)) {
      throw new TypeError('Please provide a password auth option.')
    }

    const apiUrl = new url.URL(inputApiUrl)
    if (!apiUrl.hostname) {
      throw new TypeError(`${inputApiUrl} is not a valid URL`)
    }

    this.userId = userId
    this.ethAddress = ethAddress
    this.password = password
    this.accessToken = apiKey
    this.apiUrl = apiUrl
  }

  /**
    * Runs MythX analysis.
    * Deprecated. See analyzeWithStatus() instead.
    *
    * @param {options} object      - structure which must contain
    *      {data} object           - information containing Smart Contract information to be analyzed
    *      {timeout} number        - optional timeout value in milliseconds
    *      {clientToolName} string - optional; sets up for client tool usage tracking
    *      {initialDelay} number   - optional; After submitting an analysis and seeing that it is
                                     not cached, the first status API call will be delayed by this
                                     number of milliseconds

minimum value for how long a non-cached analyses will take
    *                              this must be larger than defaultInitialDelay which we believe to be
    *                              the smallest reasonable value.
    *
    * @returns an array-like object of issues, and a uuid attribute which can
    *          be subsequently used to retrieve the information from our stored
    *          database using getIssues().
    *
    **/
  async analyze (options) {
    if (options === undefined || options.data === undefined) {
      throw new TypeError('Please provide a data option.')
    }

    if (!this.accessToken) {
      let tokens
      try {
        tokens = await login.do(this.ethAddress, this.userId, this.password, this.apiUrl)
      } catch (e) {
        let authType = ''
        if (this.ethAddress) {
          authType = ` for ethereum address ${this.ethAddress}`
        }
        // eslint-disable-next-line no-throw-literal
        throw (`Invalid MythX credentials${authType} given.`)
      }
      this.accessToken = tokens.access
      this.refreshToken = tokens.refresh
    }

    let requestResponse
    try {
      requestResponse = await requester.do(options, this.accessToken, this.apiUrl)
    } catch (e) {
      if (e.statusCode !== 401) {
        throw e
      }
      const tokens = await refresh.do(this.accessToken, this.refreshToken, this.apiUrl)
      this.accessToken = tokens.access
      this.refreshToken = tokens.refresh

      requestResponse = await requester.do(options, this.accessToken, this.apiUrl)
    }

    const uuid = requestResponse.uuid
    let timeout = options.timeout

    // debug -
    // console.log(`now: ${Math.trunc(Date.now() / 1000)}`)

    // FIXME: this might not be optimal. The test should be negated
    // and then do the *only* subset of poller that needs to be done,
    // given that we know this is finished. Instead, I think we'll
    // make one more additional request of status only to find out
    // that it is still finished.
    if (requestResponse.status !== 'Finished') {
      // Compute the initial delay as the larger of the default value
      // and what is passed in.
      const initialDelay = Math.max(options.initialDelay || 0, defaultInitialDelay)
      await util.timer(initialDelay)
      timeout -= initialDelay
    }

    let result
    try {
      result = await poller.do(uuid, this.accessToken, this.apiUrl, timeout)
    } catch (e) {
      if (e.statusCode !== 401) {
        throw e
      }
      const tokens = await refresh.do(this.accessToken, this.refreshToken, this.apiUrl)
      this.accessToken = tokens.access
      this.refreshToken = tokens.refresh

      result = await poller.do(uuid, this.accessToken, this.apiUrl, timeout)
    }
    result.uuid = uuid
    return result
  }

  /**
    * Retrieves status records of past MythX analyses requests.
    *
    * @param {options} object - structure which must contain
    *      {data} object       - information containing Smart Contract information to be analyzed
    *      {timeout} number    - optional timeout value in milliseconds
    *
    * @returns an array-like object of issue status from our stored database.
    *
    **/
  async analyses (options) {
    if (options === undefined || options.dateFrom === undefined) {
      throw new TypeError('Please provide a dateFrom option.')
    }

    if (!this.accessToken) {
      const tokens = await login.do(this.ethAddress, this.userId, this.password, this.apiUrl)
      this.accessToken = tokens.access
      this.refreshToken = tokens.refresh
    }
    const url = util.joinUrl(this.apiUrl.href, `${defaultApiVersion}/analyses?dateFrom=${options.dateFrom}&dateTo=${options.dateTo}&offset=${options.offset}`)
    let analyses
    try {
      analyses = await simpleRequester.do({ url, accessToken: this.accessToken, json: true })
    } catch (e) {
      if (e.statusCode !== 401) {
        throw e
      }
      const tokens = await refresh.do(this.accessToken, this.refreshToken, this.apiUrl)
      this.accessToken = tokens.access
      this.refreshToken = tokens.refresh

      analyses = await simpleRequester.do({ url, accessToken: this.accessToken, json: true })
    }
    return analyses
  }

  /**
    * Runs MythX analysis return issue information and metadata regarding the run
    *
    * @param {options} object - structure which must contain:
    *      {data} object       - information containing Smart Contract information to be analyzed
    *      {timeout} number    - optional timeout value in milliseconds
    *      {clientToolName} string - optional; sets up for client tool usage tracking
    *
    * @returns object which contains:
    *      (issues}  object - an like object which of issues is grouped by (file) input container.
    *      {status}  object - status information as returned in each object of analyses().
    *
    **/
  async analyzeWithStatus (options) {
    const issues = await this.analyze(options)
    const uuid = issues.uuid
    delete issues.uuid
    const status = await this.getStatus(uuid)
    return {
      issues,
      status
    }
  }

  async getStatusOrIssues (uuid, url, inputApiUrl) {
    let accessToken = this.accessToken
    if (!accessToken) {
      const tokens = await login.do(this.ethAddress, this.userId, this.password, this.apiUrl)
      accessToken = tokens.access
    }
    let promise
    await simpleRequester.do({ url, accessToken: accessToken, json: true })
      .then(result => {
        promise = new Promise(function (resolve, reject) {
          resolve(result)
        })
      }).catch(err => {
        if (err.status === 404) {
          err.error = `Analysis with UUID ${uuid} not found.`
        }
        promise = new Promise(function (resolve, reject) {
          reject(err.error)
        })
      })
    return promise
  }

  async getStatus (uuid, inputApiUrl = defaultApiUrl) {
    const url = util.joinUrl(this.apiUrl.href, `${defaultApiVersion}/analyses/${uuid}`)
    return this.getStatusOrIssues(uuid, url, inputApiUrl)
  }

  async getIssues (uuid, inputApiUrl = defaultApiUrl) {
    const url = util.joinUrl(this.apiUrl.href, `${defaultApiVersion}/analyses/${uuid}/issues`)
    return this.getStatusOrIssues(uuid, url, inputApiUrl)
  }

  async listAnalyses (inputApiUrl = defaultApiUrl) {
    let accessToken = this.accessToken
    if (!accessToken) {
      const tokens = await login.do(this.ethAddress, this.userId, this.password, this.apiUrl)
      accessToken = tokens.access
    }
    const url = util.joinUrl(inputApiUrl, `${defaultApiVersion}/analyses`)
    return simpleRequester.do({ url, accessToken: accessToken, json: true })
  }
}

module.exports.ApiVersion = (inputApiUrl = defaultApiUrl) => {
  const url = util.joinUrl(inputApiUrl, `${defaultApiVersion}/version`)
  return simpleRequester.do({ url, json: true })
}

module.exports.OpenApiSpec = (inputApiUrl = defaultApiUrl) => {
  const url = util.joinUrl(inputApiUrl, `${defaultApiVersion}/openapi.yaml`)
  return simpleRequester.do({ url })
}

module.exports.Client = Client
module.exports.defaultApiUrl = new url.URL(defaultApiUrl)
module.exports.defaultApiHost = defaultApiUrl
module.exports.defaultApiVersion = defaultApiVersion
module.exports.trialUserId = trialUserId
module.exports.defaultInitialDelay = defaultInitialDelay
