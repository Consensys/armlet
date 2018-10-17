const url = require('url')

const requester = require('./lib/requester')
const simpleRequester = require('./lib/simpleRequester')
const simpleAuthRequester = require('./lib/simpleAuthRequester')
const poller = require('./lib/poller')

const defaultApiUrl = process.env['MYTHRIL_API_URL'] || 'https://api.mythril.ai'
const defaultApiVersion = 'v1'

class Client {
  constructor (auth, inputApiUrl = defaultApiUrl) {
    if (auth === undefined) {
      throw new TypeError('Please provide auth options.')
    }

    if (auth.apiKey === undefined) {
      throw new TypeError('Please provide an apiKey auth option.')
    }

    if (auth.userEmail === undefined) {
      throw new TypeError('Please provide an userEmail auth option.')
    }

    const apiUrl = url.parse(inputApiUrl)
    if (apiUrl.hostname === null) {
      throw new TypeError(`${inputApiUrl} is not a valid URL`)
    }

    this.userEmail = auth.userEmail
    this.apiKey = auth.apiKey
    this.apiUrl = apiUrl
  }

  analyze (options) {
    return new Promise((resolve, reject) => {
      if (options === undefined || options.data === undefined || options.data.deployedBytecode === undefined) {
        throw new TypeError('Please provide a deployedBytecode option.')
      }

      requester.do(options, this.apiKey, this.apiUrl)
        .then(uuid => {
          return poller.do(uuid, this.apiKey, this.apiUrl, undefined, options.timeout)
        }).then(issues => {
          resolve(issues)
        }).catch(err => {
          reject(err)
        })
    })
  }

  listAnalyses (queryString) {
    let options = {
      url: `${this.apiUrl.href}${defaultApiVersion}/analyses`,
      json: true,
      apiKey: this.apiKey,
      qs: queryString
    }
    return simpleAuthRequester.do(options)
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
