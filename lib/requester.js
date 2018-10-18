const basePath = '/v1/analyses'

exports.do = (options, apiKey, apiUrl) => {
  return new Promise((resolve, reject) => {
    const lib = apiUrl.protocol === 'http:' ? require('http') : require('https')

    const postData = JSON.stringify(options)

    const postOptions = {
      protocol: apiUrl.protocol,
      hostname: apiUrl.hostname,
      port: apiUrl.port,
      path: basePath,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-type': 'application/json',
        'Content-length': postData.length
      }
    }

    const errMap = new Map([
      [400, 'validation failed'],
      [401, `unauthorized analysis request, API key: ${apiKey}`],
      [429, 'request limit exceeded'],
      [500, 'received error from API server']])
    const postRequest = lib.request(postOptions, res => {
      if (res.statusCode < 200 || res.statusCode > 299) {
        reject(new Error(`Failed to get response, status code ${res.statusCode}: ${errMap.get(res.statusCode)}`))
        return
      }

      let rawData = ''
      res.on('data', chunk => { rawData += chunk })
      res.on('end', () => {
        let data = ''
        try {
          data = JSON.parse(rawData)
        } catch (err) {
          reject(err)
        }
        resolve(data.uuid)
      })
    })

    postRequest.on('error', err => {
      if (err.errno === 'ENOTFOUND') {
        reject(new Error(`Could not connect to API server at ${apiUrl.href}`))
      }
    })

    postRequest.write(postData)
    postRequest.end()
  })
}
