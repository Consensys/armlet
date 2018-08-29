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
      .then((uuid) => {
        return poller.do(uuid, apiKey, apiUrl)
      }).then((issues) => {
        resolve(issues)
      })
  })
}
