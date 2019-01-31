const url = require('url')

const requester = require('./lib/requester')
const simpleRequester = require('./lib/simpleRequester')
const poller = require('./lib/poller')
const login = require('./lib/login')
const refresh = require('./lib/refresh')

const defaultApiUrl = process.env['MYTHX_API_URL'] || 'https://api.mythx.io'
const defaultApiVersion = 'v1'
const trialUserId = '123456789012345678901234'

class Client {
  /**
   *  Creates a client object. Internally this has login information, and from that
   *  an access token. By saving state, we can use and refresh the access token
   *  periodically.
   *
   *  @param {auth} object         - login or authentication information which contains
   *                               (email | ethAddress) and a password or...
   *                                apiKey
   *  @param {inputApiUrl} string  - Optional. A URL of a MythX API server we want to contect
   *                                 to.
   *
   */
  constructor (auth, inputApiUrl = defaultApiUrl) {
    const { email, ethAddress, apiKey, password } = auth || {}

    let userId
    if (!password && !email && !ethAddress && !apiKey) {
      userId = trialUserId
    }

    if (password && !email && !ethAddress && !apiKey) {
      throw new TypeError('Please provide an user id auth option.')
    }

    if (!apiKey && !userId && (!password && (email || ethAddress))) {
      throw new TypeError('Please provide a password auth option.')
    }

    const apiUrl = new url.URL(inputApiUrl)
    if (!apiUrl.hostname) {
      throw new TypeError(`${inputApiUrl} is not a valid URL`)
    }

    this.userId = userId
    this.email = email
    this.ethAddress = ethAddress
    this.password = password
    this.accessToken = apiKey
    this.apiUrl = apiUrl
  }

  /**
    * Runs MythX analysis.
    * Deprecated. See analyzeWithStatus() instead.
    *
    * @param {options} object - structure which must contain
    *      {data} object       - information containing Smart Contract information to be analyzed
    *      {timeout} number    - optional timeout value in milliseconds
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
      const tokens = await login.do(this.email, this.ethAddress, this.userId, this.password, this.apiUrl)
      this.accessToken = tokens.access
      this.refreshToken = tokens.refresh
    }

    let uuid
    try {
      uuid = await requester.do(options, this.accessToken, this.apiUrl)
    } catch (e) {
      if (e.statusCode !== 401) {
        throw e
      }
      const tokens = await refresh.do(this.accessToken, this.refreshToken, this.apiUrl)
      this.accessToken = tokens.access
      this.refreshToken = tokens.refresh

      uuid = await requester.do(options, this.accessToken, this.apiUrl)
    }

    let result
    try {
      result = await poller.do(uuid, this.accessToken, this.apiUrl, undefined, options.timeout)
    } catch (e) {
      if (e.statusCode !== 401) {
        throw e
      }
      const tokens = await refresh.do(this.accessToken, this.refreshToken, this.apiUrl)
      this.accessToken = tokens.access
      this.refreshToken = tokens.refresh

      result = await poller.do(uuid, this.accessToken, this.apiUrl, undefined, options.timeout)
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
      const tokens = await login.do(this.email, this.ethAddress, this.userId, this.password, this.apiUrl)
      this.accessToken = tokens.access
      this.refreshToken = tokens.refresh
    }
    const url = `${this.apiUrl.href}${defaultApiVersion}/analyses?dateFrom=${options.dateFrom}&dateTo=${options.dateTo}&offset=${options.offset}`
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

  async getStatus (uuid, inputApiUrl = defaultApiUrl) {
    let accessToken = this.accessToken
    if (!accessToken) {
      const tokens = await login.do(this.email, this.ethAddress, this.userId, this.password, this.apiUrl)
      accessToken = tokens.access
    }
    const url = `${inputApiUrl}/${defaultApiVersion}/analyses/${uuid}`
    return simpleRequester.do({ url, accessToken: accessToken, json: true })
  }

  async getIssues (uuid, inputApiUrl = defaultApiUrl) {
    if (!this.accessToken) {
      const tokens = await login.do(this.email, this.ethAddress, this.userId, this.password, this.apiUrl)
      this.accessToken = tokens.access
    }
    const url = `${inputApiUrl}/${defaultApiVersion}/analyses/${uuid}/issues`
    return simpleRequester.do({ url, accessToken: this.accessToken, json: true })
  }
}

module.exports.ApiVersion = (inputApiUrl = defaultApiUrl) => {
  return simpleRequester.do({ url: `${inputApiUrl}/${defaultApiVersion}/version`, json: true })
}

module.exports.OpenApiSpec = (inputApiUrl = defaultApiUrl) => {
  return simpleRequester.do({ url: `${inputApiUrl}/${defaultApiVersion}/openapi.yaml` })
}

module.exports.Client = Client
module.exports.defaultApiUrl = new url.URL(defaultApiUrl)
module.exports.defaultApiHost = defaultApiUrl
module.exports.defaultApiVersion = defaultApiVersion
module.exports.trialUserId = trialUserId
