const url = require('url')

const requester = require('./lib/requester')
const simpleRequester = require('./lib/simpleRequester')
const poller = require('./lib/poller')
const login = require('./lib/login')
const refresh = require('./lib/refresh')

const defaultApiUrl = process.env['MYTHRIL_API_URL'] || 'https://api.mythril.ai'
const defaultApiVersion = 'v1'

class Client {
  constructor (auth, inputApiUrl = defaultApiUrl) {
    if (auth === undefined) {
      throw new TypeError('Please provide auth options.')
    }

    if (auth.email === undefined && auth.ethAddress === undefined) {
      throw new TypeError('Please provide an user id auth option.')
    }

    if (auth.password === undefined) {
      throw new TypeError('Please provide a password auth option.')
    }

    const apiUrl = url.parse(inputApiUrl)
    if (apiUrl.hostname === null) {
      throw new TypeError(`${inputApiUrl} is not a valid URL`)
    }

    this.email = auth.email
    this.ethAddress = auth.ethAddress
    this.password = auth.password
    this.apiUrl = apiUrl
  }

  async analyze (options) {
    if (options === undefined || options.data === undefined || options.data.deployedBytecode === undefined) {
      throw new TypeError('Please provide a deployedBytecode option.')
    }

    if (!this.accessToken) {
      const tokens = await login.do(this.email, this.ethAddress, this.password, this.apiUrl)
      this.accessToken = tokens.accessToken
      this.refreshToken = tokens.refreshToken
    }

    let uuid
    try {
      uuid = await requester.do(options, this.accessToken, this.apiUrl)
    } catch (e) {
      if (e.statusCode !== 401) {
        throw e
      }
      const tokens = await refresh.do(this.accessToken, this.refreshToken, this.apiUrl)
      this.accessToken = tokens.accessToken
      this.refreshToken = tokens.refreshToken

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
      this.accessToken = tokens.accessToken
      this.refreshToken = tokens.refreshToken

      result = await poller.do(uuid, this.accessToken, this.apiUrl, undefined, options.timeout)
    }
    return result
  }
}

module.exports.ApiVersion = (inputApiUrl = defaultApiUrl) => {
  return simpleRequester.do({url: `${inputApiUrl}/${defaultApiVersion}/version`, json: true})
}

module.exports.OpenApiSpec = (inputApiUrl = defaultApiUrl) => {
  return simpleRequester.do({url: `${inputApiUrl}/${defaultApiVersion}/openapi.yaml`})
}

module.exports.Client = Client
module.exports.defaultApiUrl = url.parse(defaultApiUrl)
module.exports.defaultApiHost = defaultApiUrl
module.exports.defaultApiVersion = defaultApiVersion
