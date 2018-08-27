const defaultApiUrl = 'https://api.mythril.ai'
const url = require('url')

exports.getAnalysis = (options, apiUrl = defaultApiUrl) => {
  return new Promise((resolve, reject) => {
    if (!options || !options.bytecode) {
      throw new TypeError('Please provide an options param with a bytecode member.')
    }
    const parsedApiUrl = url.parse(apiUrl)
    if (parsedApiUrl.hostname === null) {
      throw new TypeError(`${apiUrl} is not a valid URL`)
    }
  })
}
