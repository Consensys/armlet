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

  async analyze (options) {
    if (options === undefined || options.data === undefined || options.data.deployedBytecode === undefined) {
      throw new TypeError('Please provide a deployedBytecode option.')
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
    return result
  }

  async analyses (options) {
    if (options === undefined || options.dateFrom === undefined) {
      throw new TypeError('Please provide a dateFrom option.')
    }

    if (!this.accessToken) {
      const tokens = await login.do(this.email, this.ethAddress, this.password, this.apiUrl)
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
