const request = require('request')
const HttpErrors = require('http-errors')

exports.do = options => {
  return new Promise((resolve, reject) => {
    request(options.url, (error, res, body) => {
      if (error) {
        reject(error)
        return
      }
      if (res.statusCode !== 200) {
        reject(HttpErrors(res.statusCode, 'Invalid status code, expected 200'))
        return
      }
      if (options.json) {
        try {
          body = JSON.parse(body)
        } catch (err) {
          reject(new Error(`JSON parse error ${err}`))
          return
        }
      }
      resolve(body)
    })
  })
}
