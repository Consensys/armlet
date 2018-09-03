const url = require('url')

const requester = require('./lib/requester')
const poller = require('./lib/poller')

const defaultApiUrl = 'https://api.mythril.ai'

module.exports = (bytecode, apiKey, inputApiUrl = defaultApiUrl) => {
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
  constructor (auth, inputApiUrl = defaultApiUrl) {
    if (auth === undefined || auth.apiKey === undefined) {
      throw new TypeError('Please provide an apiKey auth option.')
    }

    const apiUrl = url.parse(inputApiUrl)
    if (apiUrl.hostname === null) {
      throw new TypeError(`${inputApiUrl} is not a valid URL`)
    }

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
          return poller.do(uuid, this.apiKey, this.apiUrl)
        }).then(issues => {
          resolve(issues)
        }).catch(err => {
          reject(err)
        })
    })
  }
}

module.exports.Client = Client
module.exports.defaultApiUrl = url.parse(defaultApiUrl)
