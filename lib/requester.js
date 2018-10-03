const request = require('request')

const basePath = '/v1/analyses'

exports.do = (bytecode, apiKey, apiUrl) => {
  return new Promise((resolve, reject) => {
    const lib = apiUrl.protocol === 'http:' ? require('http') : require('https')

    const postData = JSON.stringify({
      type: 'bytecode',
      contract: bytecode
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

    const errMap = new Map([
      [400, 'validation failed'],
      [401, `unauthorized analysis request, API key: ${this.apiKey}`],
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

exports.SimpleRequest = options => {
  return new Promise((resolve, reject) => {
    request(options.url, (error, res, body) => {
      if (error) reject(error)
      if (res.statusCode !== 200) {
        reject(new Error(`Invalid status code ${res.statusCode}`))
      } else {
        try {
          if (options.json) body = JSON.parse(body)
          resolve(body)
        } catch (err) {
          reject(new Error(`JSON parse error ${err}`))
        }
      }
    })
  })
}
