const url = require('url')

const requester = require('./lib/requester')
const simpleRequester = require('./lib/simpleRequester')
const poller = require('./lib/poller')

const defaultApiUrl = 'https://api.mythril.ai'
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
      if (options === undefined || options.data === undefined || options.data.bytecode === undefined) {
        throw new TypeError('Please provide a bytecode option.')
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
