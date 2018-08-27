const basePath = '/mythril/v1/analysis'

exports.do = (options, apiUrl, apiKey) => {
  return new Promise((resolve, reject) => {
    const lib = apiUrl.protocol === 'http:' ? require('http') : require('https')

    const postData = JSON.stringify({
      type: 'bytecode',
      contract: options.bytecode
    })

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

    /*
    const errMap = new Map([
      [400, 'validation failed'],
      [401, `unauthorized analysis request, API key: ${this.apiKey}`],
      [429, 'request limit exceeded'],
      [500, 'received error from API server']])
    */
    const postRequest = lib.request(postOptions, (res) => {
      /*
      if (res.statusCode < 200 || res.statusCode > 299) {
        reject(new Error(`Failed to get response, status code ${res.statusCode}: ${errMap.get(res.statusCode)}`))
      }
      */
      let rawData = ''
      res.on('data', (chunk) => { rawData += chunk })
      res.on('end', () => {
        const data = JSON.parse(rawData)
        resolve(data.uuid)
      })
    })

    /*
    postRequest.on('error', (err) => {
      if (err.errno === 'ENOTFOUND') {
        reject(new Error (`Could not connect to API server at ${this.apiUrl.href}`))
      }
    })
    */
    postRequest.write(postData)
    postRequest.end()
  })
}
