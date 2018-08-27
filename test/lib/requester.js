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
    })
  })
})
