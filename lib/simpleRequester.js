const request = require('request')
const HttpErrors = require('http-errors')

exports.do = options => {
  return new Promise((resolve, reject) => {
    const reqOptions = { url: options.url }
    if (options.accessToken) {
      reqOptions.headers = {
        'Authorization': `Bearer ${options.accessToken}`
      }
    }
    request(reqOptions, (error, res, body) => {
      if (error) {
        reject(error)
        return
      }
      if (res.statusCode === 401) {
        const prefix = 'HTTP status 401: '
        try {
          body = JSON.parse(body)
          reject(new Error(`${prefix}${body.error}`))
        } catch (err) {
          reject(new Error(`${prefix}${err}`))
          return
        }
        reject(HttpErrors(res.statusCode, body.error))
        return
      } else if (res.statusCode !== 200) {
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
