const nock = require('nock')
const chai = require('chai')
chai.use(require('chai-as-promised')).should()
var expect = chai.expect

const armlet = require('../../index')
const simpleRequester = require('../../lib/simpleRequester')
const requester = require('../../lib/requester')

describe('simpleRequestOk', () => {
  const versionUri = `/${requester.defaultApiVersion}/version`
  const testReply = {
    'api': 'v1.0.25',
    'mythril': 'v0.18.11'
  }

  before(() => {
    nock(armlet.defaultApiHost)
      .get(versionUri)
      .reply(200, testReply)
  })

  const versionUrl = `${armlet.defaultApiHost}${versionUri}`
  it('returns API versions', () => {
    const reply = simpleRequester.do({url: versionUrl, json: true})
    reply.then(result => {
      result['api'].should.equal(testReply['api'])
      result['mythril'].should.equal(testReply['mythril'])
    })
  })
})

describe('simpleJSONParseFail', () => {
  const versionUri = `/${requester.defaultApiVersion}/version`
  const testReply = 'Some text'

  before(() => {
    nock(armlet.defaultApiHost)
      .get(versionUri)
      .reply(200, testReply)
  })

  const versionUrl = `${armlet.defaultApiHost}${versionUri}`
  it('returns API versions', () => {
    expect(simpleRequester.do({url: versionUrl, json: true})
      .should.be.rejected)
  })
})
