const armlet = require('../index')
const Client = require('../index').Client
const sinon = require('sinon')
const url = require('url')
require('chai')
  .use(require('chai-as-promised'))
  .should()

const requester = require('../lib/requester')
const simpleRequester = require('../lib/simpleRequester')
const poller = require('../lib/poller')

describe('main module', () => {
  const data = {deployedBytecode: 'my-bitecode'}
  const apiKey = 'my-apikey'
  const userEmail = 'my-userEmail'
  const apiUrl = 'http://localhost:3100'

  describe('#armlet', () => {
    describe('interface', () => {
      afterEach(() => {
        requester.do.restore()
        poller.do.restore()
        simpleRequester.do.restore()
      })

      beforeEach(() => {
        sinon.stub(requester, 'do')
          .returns(new Promise((resolve, reject) => resolve(true)))
        sinon.stub(poller, 'do')
          .returns(new Promise((resolve, reject) => resolve(true)))
        sinon.stub(simpleRequester, 'do')
          .returns(new Promise((resolve, reject) => resolve(true)))
      })

      describe('Client', () => {
        it('should be a function', () => {
          armlet.Client.should.be.a('function')
        })

        describe('should have a constructor which should', () => {
          it('require an auth option', () => {
            (() => new Client()).should.throw(TypeError)
          })

          it('require an apiKey auth option', () => {
            (() => new Client({userEmail: userEmail})).should.throw(TypeError)
          })

          it('require an userEmail auth option', () => {
            (() => new Client({apiKey: apiKey})).should.throw(TypeError)
          })

          it('require a valid apiUrl if given', () => {
            (() => new Client({userEmail: userEmail, apiKey: apiKey}, 'not-a-valid-url')).should.throw(TypeError)
          })

          it('initialize apiUrl to a default value if not given', () => {
            const instance = new Client({userEmail: userEmail, apiKey: apiKey})

            instance.apiUrl.should.be.deep.equal(armlet.defaultApiUrl)
          })
        })

        describe('instances should', () => {
          beforeEach(() => {
            this.instance = new Client({userEmail: userEmail, apiKey: apiKey})
          })

          it('be created with a constructor', () => {
            this.instance.constructor.name.should.be.equal('Client')
          })

          describe('have an analyze method which', () => {
            it('should be a function', () => {
              this.instance.analyze.should.be.a('function')
            })

            it('should require a deployedBytecode option', async () => {
              await this.instance.analyze().should.be.rejectedWith(TypeError)
            })
          })
        })
      })

      describe('ApiVersion', () => {
        it('should be a function', () => {
          armlet.ApiVersion.should.be.a('function')
        })

        it('should return a thenable', () => {
          const result = armlet.ApiVersion(apiUrl)

          result.then.should.be.a('function')
        })
      })

      describe('OpenApiSpec', () => {
        it('should be a function', () => {
          armlet.OpenApiSpec.should.be.a('function')
        })

        it('should return a thenable', () => {
          const result = armlet.OpenApiSpec(apiUrl)

          result.then.should.be.a('function')
        })
      })
    })

    describe('functionality', () => {
      const uuid = 'analysis-uuid'
      const issues = ['issue1', 'issue2']
      const parsedApiUrl = url.parse(apiUrl)

      describe('Client', () => {
        afterEach(() => {
          requester.do.restore()
          poller.do.restore()
        })

        beforeEach(() => {
          this.instance = new Client({userEmail: userEmail, apiKey: apiKey}, apiUrl)
        })

        it('should chain requester and poller', async () => {
          sinon.stub(requester, 'do')
            .withArgs({data}, apiKey, parsedApiUrl)
            .returns(new Promise(resolve => {
              resolve(uuid)
            }))
          sinon.stub(poller, 'do')
            .withArgs(uuid, apiKey, parsedApiUrl)
            .returns(new Promise(resolve => {
              resolve(issues)
            }))

          await this.instance.analyze({data}).should.eventually.equal(issues)
        })

        it('should reject with requester failures', async () => {
          const errorMsg = 'Booom! from requester'
          sinon.stub(requester, 'do')
            .withArgs({data}, apiKey, parsedApiUrl)
            .returns(new Promise((resolve, reject) => {
              reject(new Error(errorMsg))
            }))
          sinon.stub(poller, 'do')
            .withArgs(uuid, apiKey, parsedApiUrl)
            .returns(new Promise(resolve => {
              resolve(issues)
            }))

          await this.instance.analyze({data}).should.be.rejectedWith(Error, errorMsg)
        })

        it('should reject with poller failures', async () => {
          const errorMsg = 'Booom! from poller'
          sinon.stub(requester, 'do')
            .withArgs({data}, apiKey, parsedApiUrl)
            .returns(new Promise(resolve => {
              resolve(uuid)
            }))
          sinon.stub(poller, 'do')
            .withArgs(uuid, apiKey, parsedApiUrl)
            .returns(new Promise((resolve, reject) => {
              reject(new Error(errorMsg))
            }))

          await this.instance.analyze({data}).should.be.rejectedWith(Error, errorMsg)
        })

        it('should pass timeout option to poller', async () => {
          const timeout = 10

          sinon.stub(requester, 'do')
            .withArgs({data, timeout}, apiKey, parsedApiUrl)
            .returns(new Promise(resolve => {
              resolve(uuid)
            }))
          sinon.stub(poller, 'do')
            .withArgs(uuid, apiKey, parsedApiUrl, undefined, timeout)
            .returns(new Promise(resolve => {
              resolve(issues)
            }))

          await this.instance.analyze({data, timeout}).should.eventually.equal(issues)
        })
      })

      describe('ApiVersion', () => {
        const url = `${apiUrl}/${armlet.defaultApiVersion}/version`
        afterEach(() => {
          simpleRequester.do.restore()
        })

        it('should use simpleRequester', async () => {
          const result = {result: 'result'}

          sinon.stub(simpleRequester, 'do')
            .withArgs({url, json: true})
            .returns(new Promise(resolve => {
              resolve(result)
            }))

          await armlet.ApiVersion(apiUrl).should.eventually.equal(result)
        })

        it('should reject with simpleRequester failures', async () => {
          const errorMsg = 'Booom!'
          sinon.stub(simpleRequester, 'do')
            .withArgs({url, json: true})
            .returns(new Promise((resolve, reject) => {
              reject(new Error(errorMsg))
            }))

          await armlet.ApiVersion(apiUrl).should.be.rejectedWith(Error, errorMsg)
        })
      })

      describe('OpenApiSpec', () => {
        const url = `${apiUrl}/${armlet.defaultApiVersion}/openapi.yaml`

        afterEach(() => {
          simpleRequester.do.restore()
        })

        it('should use simpleRequester', async () => {
          const result = 'result'

          sinon.stub(simpleRequester, 'do')
            .withArgs({url})
            .returns(new Promise(resolve => {
              resolve(result)
            }))

          await armlet.OpenApiSpec(apiUrl).should.eventually.equal(result)
        })

        it('should reject with simpleRequester failures', async () => {
          const errorMsg = 'Booom!'
          sinon.stub(simpleRequester, 'do')
            .withArgs({url})
            .returns(new Promise((resolve, reject) => {
              reject(new Error(errorMsg))
            }))

          await armlet.OpenApiSpec(apiUrl).should.be.rejectedWith(Error, errorMsg)
        })
      })
    })
  })
})
