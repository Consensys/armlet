const request = require('request')
const util = require('./util')

const basePath = 'v1/auth/refresh'

exports.do = (refreshToken, accessToken, apiUrl) => {
  return new Promise((resolve, reject) => {
    const options = { form: { refreshToken, accessToken } }
    const url = util.joinUrl(apiUrl.href, basePath)

    request.post(url, options, (error, res, body) => {
      if (error) {
        reject(error)
        return
      }

      if (res.statusCode !== 200) {
        reject(new Error(`Invalid status code ${res.statusCode}`))
        return
      }

      try {
        body = JSON.parse(body)
      } catch (err) {
        reject(new Error(`JSON parse error ${err}`))
        return
      }

      if (!body.refreshToken) {
        reject(new Error(`Refresh Token missing`))
      }

      if (!body.accessToken) {
        reject(new Error(`Access Token missing`))
      }

      resolve(body)
    })
  })
}
