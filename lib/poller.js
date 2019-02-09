const HttpErrors = require('http-errors')
const moment = require('moment')
const humanizeDuration = require('humanize-duration')
const request = require('request')

exports.do = (uuid, accessToken, apiUrl, pollStep = 1000, timeout = 30000) => {
  let pollIntervalID = null
  let timeoutID = null

  const clearActions = () => {
    clearTimeout(timeoutID)
    clearInterval(pollIntervalID)
  }

  const timeoutPromise = new Promise((resolve, reject) => {
    timeoutID = setTimeout(() => {
      clearActions()
      const duration = humanizeDuration(moment.duration(timeout)
        .asMilliseconds())
      // eslint-disable-next-line prefer-promise-reject-errors
      reject(`User-specified or default time out reached after ${duration}.\n` +
             'Analysis continues on server and may have completed; so run again?\n' +
             `For status reference, UUID is ${uuid}\n`)
    }, timeout)
  })

  const pollPromise = new Promise((resolve, reject) => {
    const options = {
      url: `${apiUrl.href}v1/analyses/${uuid}/issues`,
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
    const getFunc = () => {
      request.get(
        options,
        (err, res, body) => {
          const errMsg = `Failed in retrieving issues response, HTTP status code: ${res.statusCode}\n${res.statusMessage}`
          if (err) {
            clearActions()
            reject(errMsg)
          }
          if (res.statusCode === 401) {
            clearActions()
            reject(HttpErrors(401, `Unauthorized analysis request, access token: ${accessToken}`))
          }
          if (res.statusCode === 500) {
            clearActions()
            reject(HttpErrors(500, 'received error 500 from API server'))
          }

          let data = {}
          try {
            if (body !== '') {
              // Data can be the empty string on MythX internal
              // error. The caller will pick out the exact error from the
              // status
              data = JSON.parse(body)
            }
          } catch (err) {
            clearActions()
            reject(err)
          }
          if (res.statusCode === 200) {
            clearActions()
            resolve(data)
          }
        }
      )
    }
    pollIntervalID = setInterval(getFunc, pollStep)
  })

  return Promise.race([
    timeoutPromise,
    pollPromise
  ])
}
