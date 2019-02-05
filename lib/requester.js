const request = require('request')
const basePath = 'v1/analyses'

// Note: this has been heavily customized for the MythX and
// running some sort of "analyze" function
exports.do = (input, accessToken, apiUrl) => {
  return new Promise((resolve, reject) => {
    const options = {
      url: `${apiUrl.href}${basePath}`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      json: input
    }

    request(options, (err, res, data) => {
      if (err) {
        reject(err)
        return
      }
      if (res.statusCode < 200 || res.statusCode > 299) {
        const errMsg = `Failed to get response, status code ${res.statusCode}`
        if (res.statusCode === 401) {
          // eslint-disable-next-line prefer-promise-reject-errors
          reject('MythX credentials are incorrect.')
          return
        } else if (res.statusCode === 400) {
          // eslint-disable-next-line prefer-promise-reject-errors
          reject(res.body)
          return
        } else if (res.statusCode === 413) {
          // eslint-disable-next-line prefer-promise-reject-errors
          reject('The JSON data for the Smart Contract(s) sent are too large to process.\nTry submitting fewer Smart Contracts or submit smaller pieces for analysis.')
          return
        } else if (!data || !data.details) {
          reject(errMsg)
          return
        }
        const msgs = data.details.reduce((acc, detail) => {
          acc.push(detail.message)
          return acc
        }, [])
        reject(new Error(`${errMsg}: ${msgs.join(', ')}`))
        return
      }
      if (typeof data !== 'object') {
        reject(new SyntaxError('Non JSON data returned'))
      }
      resolve(data.uuid)
    })
  })
}
