const request = require('request')
const util = require('./util')
const basePath = 'v1/analyses'

// Note: this has been heavily customized for the MythX and
// running some sort of "analyze" function
exports.do = (input, accessToken, apiUrl) => {
  return new Promise((resolve, reject) => {
    const options = {
      url: util.joinUrl(apiUrl.href, basePath),
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

      /* eslint-disable prefer-promise-reject-errors */
      if (res.statusCode < 200 || res.statusCode > 299) {
        const errMsg = `Failed in retrieving analysis response: ${res.error} (HTTP status code: ${res.status})`
        if (res.statusCode === 401) {
          reject('MythX credentials are incorrect.')
          return
        } else if (res.statusCode === 400) {
          reject(res.body.error)
          return
        } else if (res.statusCode === 413) {
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
        reject(`${errMsg}: ${msgs.join(', ')}`)
        return
      }
      if (typeof data !== 'object') {
        // eslint-disable-next-line prefer-promise-reject-errors
        reject(`Non JSON data returned: ${data}`)
      }
      /* eslint-enable prefer-promise-reject-errors */

      resolve(data)
    })
  })
}
