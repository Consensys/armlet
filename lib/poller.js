const url = require('url')

exports.do = (uuid, apiKey, apiUrl = url.parse('https://api.mythril.ai'), pollStep = 1000) => {
  return new Promise((resolve, reject) => {
    const lib = apiUrl.protocol === 'http:' ? require('http') : require('https')
    const getOptions = {
      protocol: apiUrl.protocol,
      hostname: apiUrl.hostname,
      port: apiUrl.port,
      path: `/mythril/v1/analysis/${uuid}/issues`,
      headers: {
        authorization: `Bearer ${apiKey}`
      }
    }
    const getFunc = () => {
      lib.get(
        getOptions,
        (res) => {
          /*
          if (res.statusCode === 401) {
            self.emit('err', `Unauthorized analysis request, API key: ${this.apiKey}`)
            clearInterval(intervalID)
            return
          }
          if (res.statusCode === 500) {
            self.emit('err', 'received error 500 from API server')
            clearInterval(intervalID)
          }
          */
          let rawData = ''
          res.on('data', (chunk) => { rawData += chunk })
          res.on('end', () => {
            const data = JSON.parse(rawData)
            if (res.statusCode === 200) {
              clearInterval(intervalID)
              resolve(data)
            }
          })
        }
      )
    }
    const intervalID = setInterval(getFunc, pollStep)
  })
}
