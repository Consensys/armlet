const url = require('url')

const requester = require('./lib/requester')
const poller = require('./lib/poller')

const defaultApiHost = 'https://api.mythril.ai'
const defaultApiVersion = 'v1'

module.exports = (bytecode, apiKey, inputApiUrl = defaultApiHost) => {
  return new Promise((resolve, reject) => {
    if (bytecode === undefined) {
      throw new TypeError('Please provide a bytecode param.')
    }

    if (apiKey === undefined) {
      throw new TypeError('Please provide an apiKey param.')
    }

    const apiUrl = url.parse(inputApiUrl)
    if (apiUrl.hostname === null) {
      throw new TypeError(`${inputApiUrl} is not a valid URL`)
    }

    requester.do(bytecode, apiKey, apiUrl)
      .then(uuid => {
        return poller.do(uuid, apiKey, apiUrl)
      }).then(issues => {
        resolve(issues)
      }).catch(err => {
        reject(err)
      })
  })
}

class Client {
  constructor (auth, inputApiUrl = defaultApiHost) {
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
      if (options === undefined || options.bytecode === undefined) {
        throw new TypeError('Please provide a bytecode option.')
      }

      requester.do(options.bytecode, this.apiKey, this.apiUrl)
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

module.exports.ApiVersion = (url = `${defaultApiHost}/${defaultApiVersion}/version`) => {
  return requester.SimpleRequest({url: url, json: true})
}

module.exports.OpenApiSpec = (url = `${defaultApiHost}/${defaultApiVersion}/openapi.yaml`) => {
  return requester.SimpleRequest({url: url, json: false})
}

module.exports.Client = Client
module.exports.defaultApiUrl = url.parse(defaultApiHost)
module.exports.defaultApiHost = defaultApiHost
module.exports.defaultApiVersion = defaultApiVersion
