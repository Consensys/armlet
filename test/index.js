const analyze = require('../index')
const sinon = require('sinon')
const url = require('url')
require('chai')
  .use(require('chai-as-promised'))
  .should()

const requester = require('../lib/requester')
const poller = require('../lib/poller')

describe('main module', () => {
  const bytecode = 'my-bitecode'
  const apiKey = 'my-apikey'

  describe('#armlet', () => {
    afterEach(() => {
      requester.do.restore()
      poller.do.restore()
    })

    describe('interface', () => {
      beforeEach(() => {
        sinon.stub(requester, 'do')
          .returns(new Promise((resolve, reject) => resolve(true)))
        sinon.stub(poller, 'do')
          .returns(new Promise((resolve, reject) => resolve(true)))
      })

      it('should be a function', () => {
        analyze.should.be.a('function')
      })

      it('should return a thenable', () => {
        const result = analyze(bytecode, apiKey)

        result.then.should.be.a('function')
      })

      it('should require a bytecode param', async () => {
        await analyze(undefined, apiKey).should.be.rejectedWith(TypeError)
      })

      it('should require an apiKey param', async () => {
        await analyze(bytecode).should.be.rejectedWith(TypeError)
      })

      it('should require a valid api URL if given', async () => {
        await analyze(bytecode, apiKey, 'not-a-real-url').should.be.rejectedWith(TypeError)
      })
    })

    describe('functionality', () => {
      const uuid = 'analysis-uuid'
      const issues = ['issue1', 'issue2']
      const apiUrl = 'http://localhost:3100'
      const parsedApiUrl = url.parse(apiUrl)

      it('should chain requester and poller', async () => {
        sinon.stub(requester, 'do')
          .withArgs(bytecode, apiKey, parsedApiUrl)
          .returns(new Promise((resolve, reject) => {
            resolve(uuid)
          }))
        sinon.stub(poller, 'do')
          .withArgs(uuid, apiKey, parsedApiUrl)
          .returns(new Promise((resolve, reject) => {
            resolve(issues)
          }))

        await analyze(bytecode, apiKey, apiUrl).should.eventually.equal(issues)
      })

      it('should reject with requester failures', async () => {
        const errorMsg = 'Booom! from requester'
        sinon.stub(requester, 'do')
          .withArgs(bytecode, apiKey, parsedApiUrl)
          .returns(new Promise((resolve, reject) => {
            reject(new Error(errorMsg))
          }))
        sinon.stub(poller, 'do')
          .withArgs(uuid, apiKey, parsedApiUrl)
          .returns(new Promise((resolve, reject) => {
            resolve(issues)
          }))

        await analyze(bytecode, apiKey, apiUrl).should.be.rejectedWith(Error, errorMsg)
      })

      it('should reject with poller failures', async () => {
        const errorMsg = 'Booom! from poller'
        sinon.stub(requester, 'do')
          .withArgs(bytecode, apiKey, parsedApiUrl)
          .returns(new Promise((resolve, reject) => {
            resolve(uuid)
          }))
        sinon.stub(poller, 'do')
          .withArgs(uuid, apiKey, parsedApiUrl)
          .returns(new Promise((resolve, reject) => {
            reject(new Error(errorMsg))
          }))

        await analyze(bytecode, apiKey, apiUrl).should.be.rejectedWith(Error, errorMsg)
      })
    })
  })
})
