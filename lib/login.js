const request = require('request')
const util = require('./util')

const basePath = 'v1/auth/login'

exports.do = (ethAddress, password, apiUrl) => {
  return new Promise((resolve, reject) => {
    const options = { form: { ethAddress, password } }
    const url = util.joinUrl(apiUrl.href, basePath)

    request.post(url, options, (error, res, body) => {
      if (error) {
        reject(error)
        return
      }

      // Handle redirect
      if (res.statusCode === 308 && apiUrl.protocol === 'http:') {
        apiUrl.protocol = 'https:'
        this.do(ethAddress, password, apiUrl).then(result => {
          resolve(result)
        }).catch(error => {
          reject(error)
        })
        return
      }

      /* eslint-disable prefer-promise-reject-errors */
      if (res.statusCode !== 200) {
        try {
          body = JSON.parse(body)
          reject(`${body.error} (HTTP status ${res.statusCode})`)
        } catch (err) {
          reject(`${body} (HTTP status ${res.statusCode})`)
        }
        return
      }

      try {
        body = JSON.parse(body)
      } catch (err) {
        reject(`JSON parse error ${err}`)
        return
      }

      if (!body.refresh) {
        reject(`Refresh Token missing`)
      }

      if (!body.access) {
        reject(`Access Token missing`)
      }
      /* eslint-enable prefer-promise-reject-errors */

      resolve(body)
    })
  })
}
