const request = require('request')

exports.do = options => {
  return new Promise((resolve, reject) => {
    request(
      {
        url: options.url,
        headers: {
          'Authorization': `Bearer ${options.apiKey}`
        }
      }, (error, res, body) => {
        if (error) {
          reject(error)
          return
        }
        if (res.statusCode !== 200) {
          reject(new Error(`Invalid status code ${res.statusCode}`))
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
