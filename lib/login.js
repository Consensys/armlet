const request = require('request')

const basePath = 'v1/auth/login'

exports.do = (email, ethAddress, password, apiUrl) => {
  return new Promise((resolve, reject) => {
    const options = { form: { email, ethAddress, password } }
    const url = `${apiUrl.href}${basePath}`

    request.post(url, options, (error, res, body) => {
      if (error) {
        reject(error)
        return
      }

      if (res.statusCode !== 200) {
        reject(new Error(`Invalid status code ${res.statusCode}, ${body}`))
        return
      }

      try {
        body = JSON.parse(body)
      } catch (err) {
        reject(new Error(`JSON parse error ${err}`))
        return
      }

      if (!body.refresh) {
        reject(new Error(`Refresh Token missing`))
      }

      if (!body.access) {
        reject(new Error(`Access Token missing`))
      }

      resolve(body)
    })
  })
}
