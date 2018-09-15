exports.do = (uuid, apiKey, apiUrl, pollStep = 1000, timeout = 10000) => {
  let pollIntervalID = null
  let timeoutID = null

  const clearActions = () => {
    clearTimeout(timeoutID)
    clearInterval(pollIntervalID)
  }

  const timeoutPromise = new Promise((resolve, reject) => {
    timeoutID = setTimeout(() => {
      clearActions()
      reject(new Error(`Timed out in ${timeout} ms.`))
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
        'Authorization': `Bearer ${apiKey}`
      }
    }
    const getFunc = () => {
      lib.get(
        getOptions,
        res => {
          if (res.statusCode === 401) {
            clearActions()
            reject(new Error(`Unauthorized analysis request, API key: ${this.apiKey}`))
          }
          if (res.statusCode === 500) {
            clearActions()
            reject(new Error('received error 500 from API server'))
          }

          let rawData = ''
          res.on('data', chunk => { rawData += chunk })
          res.on('end', () => {
            let data = ''
            try {
              data = JSON.parse(rawData)
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
