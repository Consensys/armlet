const nock = require('nock')
require('chai')
  .use(require('chai-as-promised'))
  .should()

const simpleRequester = require('../../lib/simpleRequester')

describe('simpleRequester', () => {
  describe('#do', () => {
    const httpsApiUrl = 'https://localhost:3100'
    const textContent = 'content'
    const basePath = '/somepath'
    const url = `${httpsApiUrl}${basePath}`

    it('should do non-JSON requests', async () => {
      nock(httpsApiUrl)
        .get(basePath)
        .reply(200, textContent)

      await simpleRequester.do({url: url}).should.eventually.equal(textContent)
    })

    it('should reject on api server connection failure', async () => {
      const invalidApiHostname = 'http://not-a-valid-hostname'

      await simpleRequester.do({url: invalidApiHostname}).should.be.rejectedWith(Error)
    })

    it('should reject on api server 500', async () => {
      nock(httpsApiUrl)
        .get(basePath)
        .reply(500)

      await simpleRequester.do({url: url}).should.be.rejectedWith(Error)
    })

    it('should reject on non-JSON data', async () => {
      nock(httpsApiUrl)
        .get(basePath)
        .reply(200, textContent)

      await simpleRequester.do({url: url, json: true}).should.be.rejectedWith(Error)
    })
  })
})
