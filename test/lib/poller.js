const nock = require('nock')
const url = require('url')
require('chai')
  .use(require('chai-as-promised'))
  .should()

const poller = require('../../lib/poller')

describe('poller', () => {
  describe('#do', () => {
    const defaultApiUrl = url.parse('https://api.mythril.ai')
    const httpApiUrl = url.parse('http://localhost:3100')
    const validApiKey = 'valid-api-key'
    const uuid = 'my-uuid'
    const basePath = `/mythril/v1/analysis/${uuid}/issues`
    const expectedIssues = [
      {
        title: 'Unchecked SUICIDE',
        description: 'The function `_function_0xcbf0b0c0` executes the SUICIDE instruction. The remaining Ether is sent to an address provided as a function argument.\n\nIt seems that this function can be called without restrictions.',
        function: '_function_0xcbf0b0c0',
        type: 'Warning',
        address: 156,
        debug: 'SOLVER OUTPUT:\ncalldata_MAIN_0: 0xcbf0b0c000000000000000000000000000000000000000000000000000000000\ncalldatasize_MAIN: 0x4\ncallvalue: 0x0\n'
      }
    ]

    it('should poll issues with empty results', async () => {
      const emptyResult = []

      nock(defaultApiUrl.href, {
        reqheaders: {
          authorization: `Bearer ${validApiKey}`
        }
      })
        .get(basePath)
        .times(3)
        .reply(400, {
          status: 400,
          error: 'Result is not Finished',
          stack: 'BadRequestError: Result is not Finished\n    at getIssues (/home/fgimenez/workspace/mythril-api/src/services/AnalysisService.js:129:11)\n    at <anonymous>'
        })
      nock(defaultApiUrl.href, {
        reqheaders: {
          authorization: `Bearer ${validApiKey}`
        }
      })
        .get(basePath)
        .reply(200, emptyResult)

      await poller.do(uuid, validApiKey, defaultApiUrl, 10).should.eventually.deep.equal(emptyResult)
    })

    it('should poll issues with non-empty results', async () => {
      nock(defaultApiUrl.href, {
        reqheaders: {
          authorization: `Bearer ${validApiKey}`
        }
      })
        .get(basePath)
        .times(3)
        .reply(400, {
          status: 400,
          error: 'Result is not Finished',
          stack: 'BadRequestError: Result is not Finished\n    at getIssues (/home/fgimenez/workspace/mythril-api/src/services/AnalysisService.js:129:11)\n    at <anonymous>'
        })
      nock(defaultApiUrl.href, {
        reqheaders: {
          authorization: `Bearer ${validApiKey}`
        }
      })
        .get(basePath)
        .reply(200, expectedIssues)

      await poller.do(uuid, validApiKey, defaultApiUrl, 10).should.eventually.deep.equal(expectedIssues)
    })

    it('should be able to query http API', async () => {
      nock(httpApiUrl.href, {
        reqheaders: {
          authorization: `Bearer ${validApiKey}`
        }
      })
        .get(basePath)
        .times(3)
        .reply(400, {
          status: 400,
          error: 'Result is not Finished',
          stack: 'BadRequestError: Result is not Finished\n    at getIssues (/home/fgimenez/workspace/mythril-api/src/services/AnalysisService.js:129:11)\n    at <anonymous>'
        })
      nock(httpApiUrl.href, {
        reqheaders: {
          authorization: `Bearer ${validApiKey}`
        }
      })
        .get(basePath)
        .reply(200, expectedIssues)

      await poller.do(uuid, validApiKey, httpApiUrl, 10).should.eventually.deep.equal(expectedIssues)
    })

    it('should reject on server error', async () => {
      nock(defaultApiUrl.href, {
        reqheaders: {
          authorization: `Bearer ${validApiKey}`
        }
      })
        .get(basePath)
        .reply(500)

      await poller.do(uuid, validApiKey, defaultApiUrl, 10).should.be.rejectedWith(Error)
    })

    it('should reject on authentication error', async () => {
      const inValidApiKey = 'invalid-api-key'

      nock(defaultApiUrl.href, {
        reqheaders: {
          authorization: `Bearer ${inValidApiKey}`
        }
      })
        .get(basePath)
        .reply(401, 'Unauthorized')

      await poller.do(uuid, inValidApiKey, defaultApiUrl, 10).should.be.rejectedWith(Error)
    })

    it('should reject on non-JSON data', async () => {
      nock(defaultApiUrl.href, {
        reqheaders: {
          authorization: `Bearer ${validApiKey}`
        }
      })
        .get(basePath)
        .times(3)
        .reply(400, {
          status: 400,
          error: 'Result is not Finished',
          stack: 'BadRequestError: Result is not Finished\n    at getIssues (/home/fgimenez/workspace/mythril-api/src/services/AnalysisService.js:129:11)\n    at <anonymous>'
        })
      nock(defaultApiUrl.href, {
        reqheaders: {
          authorization: `Bearer ${validApiKey}`
        }
      })
        .get(basePath)
        .reply(200, 'non-json-data')

      await poller.do(uuid, validApiKey, defaultApiUrl, 10).should.be.rejectedWith(SyntaxError)
    })
  })
})
