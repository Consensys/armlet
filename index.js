const url = require('url')

const defaultApiUrl = 'https://api.mythril.ai'

exports.getAnalysis = (options, inputApiUrl = defaultApiUrl) => {
  return new Promise((resolve, reject) => {
    if (!options || !options.bytecode) {
      throw new TypeError('Please provide an options param with a bytecode member.')
    }

    const apiUrl = url.parse(inputApiUrl)
    if (apiUrl.hostname === null) {
      throw new TypeError(`${inputApiUrl} is not a valid URL`)
    }
  })
}
