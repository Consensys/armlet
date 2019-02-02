const HttpErrors = require('http-errors')
const moment = require('moment')
const humanizeDuration = require('humanize-duration')

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
               'Analysis continues on server and may have completed; so run again?')
    }, timeout)
  })

  const pollPromise = new Promise((resolve, reject) => {
    const lib = apiUrl.protocol === 'http:' ? require('http') : require('https')
    const getOptions = {
      protocol: apiUrl.protocol,
      hostname: apiUrl.hostname,
      port: apiUrl.port,
      path: `/v1/analyses/${uuid}/issues`,
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
    const getFunc = () => {
      lib.get(
        getOptions,
        res => {
          if (res.statusCode === 401) {
            clearActions()
            reject(HttpErrors(401, `Unauthorized analysis request, access token: ${accessToken}`))
          }
          if (res.statusCode === 500) {
            clearActions()
            reject(HttpErrors(500, 'received error 500 from API server'))
          }

          let rawData = ''
          res.on('data', chunk => { rawData += chunk })
          res.on('end', () => {
            let data = {}
            try {
              if (rawData !== '') {
                // Data can be the empty string on MythX internal
                // error. The caller will pick out the exact error from the
                // status
                data = JSON.parse(rawData)
              }
            } catch (err) {
              clearActions()
              reject(err)
            }
            if (res.statusCode === 200) {
              clearActions()
              resolve(data)
            }
          })
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
