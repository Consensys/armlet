const nock = require('nock')
const url = require('url')
require('chai')
  .use(require('chai-as-promised'))
  .should()

const requester = require('../../lib/requester')

describe('requester', () => {
  describe('#do', () => {
    describe('functionality', () => {
      const httpApiUrl = url.parse('http://localhost:3100')
      const httpsApiUrl = url.parse('https://localhost:3100')
      const validApiKey = 'valid-api-key'
      const bytecode = 'bytecode'
      const uuid = 'my-uuid'
      const basePath = '/mythril/v1/analysis'

      it('requests analysis for http API', async () => {
        nock(`${httpApiUrl.href}`, {
          reqheaders: {
            authorization: `Bearer ${validApiKey}`
          }
        })
          .post(basePath, {
            type: 'bytecode',
            contract: bytecode
          })
          .reply(200, {
            result: 'Queued',
            uuid: uuid
          })

        await requester.do({bytecode: bytecode}, httpApiUrl, validApiKey).should.eventually.equal(uuid)
      })

      it('requests analysis for https API', async () => {
        nock(`${httpsApiUrl.href}`, {
          reqheaders: {
            authorization: `Bearer ${validApiKey}`
          }
        })
          .post(basePath, {
            type: 'bytecode',
            contract: bytecode
          })
          .reply(200, {
            result: 'Queued',
            uuid: uuid
          })

        await requester.do({bytecode: bytecode}, httpsApiUrl, validApiKey).should.eventually.equal(uuid)
      })

      it('rejects on api server connection failure', async () => {
        const invalidApiHostname = url.parse('http://hostname')

        await requester.do({bytecode: bytecode}, invalidApiHostname, validApiKey).should.be.rejectedWith(Error)
      })

      it('rejects on api server 500', async () => {
        nock(`${httpApiUrl.href}`, {
          reqheaders: {
            authorization: `Bearer ${validApiKey}`
          }
        })
          .post(basePath, {
            type: 'bytecode',
            contract: bytecode
          })
          .reply(500)

        await requester.do({bytecode: bytecode}, httpApiUrl, validApiKey).should.be.rejectedWith(Error)
      })

      it('rejects on request limit errors', async () => {
        const expectedErrorMsg = 'request limit exceeded'
        nock(`${httpApiUrl.href}`, {
          reqheaders: {
            authorization: `Bearer ${validApiKey}`
          }
        })
          .post(basePath, {
            type: 'bytecode',
            contract: bytecode
          })
          .reply(429, {
            error: expectedErrorMsg
          })

        await requester.do({bytecode: bytecode}, httpApiUrl, validApiKey).should.be.rejectedWith(Error)
      })

      it('rejects on validation errors', async () => {
        const expectedErrorMsg = 'validation failed'
        nock(`${httpApiUrl.href}`, {
          reqheaders: {
            authorization: `Bearer ${validApiKey}`
          }
        })
          .post(basePath, {
            type: 'bytecode',
            contract: bytecode
          })
          .reply(400, {
            error: expectedErrorMsg
          })

        await requester.do({bytecode: bytecode}, httpApiUrl, validApiKey).should.be.rejectedWith(Error)
      })

      it('rejects on authentication errors', async () => {
        const inValidApiKey = 'my-invalid-api--key-sigh'

        nock(`${httpApiUrl.href}`, {
          reqheaders: {
            authorization: `Bearer ${inValidApiKey}`
          }
        })
          .post(basePath, {
            type: 'bytecode',
            contract: bytecode
          })
          .reply(401, 'Unauthorized')

        await requester.do({bytecode: bytecode}, httpApiUrl, inValidApiKey).should.be.rejectedWith(Error)
      })
    })
  })
})
