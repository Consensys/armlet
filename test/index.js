const analyze = require('../index')
const Client = require('../index').Client
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
  const userEmail = 'my-userEmail'

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

      describe('default', () => {
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

      describe('Client', () => {
        it('should be a function', () => {
          analyze.should.be.a('function')
        })

        describe('should have a constructor which should', () => {
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

            instance.apiUrl.should.be.deep.equal(analyze.defaultApiUrl)
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

            it('should require a bytecode option', async () => {
              await this.instance.analyze().should.be.rejectedWith(TypeError)
            })
          })
        })
      })
    })

    describe('functionality', () => {
      const uuid = 'analysis-uuid'
      const issues = ['issue1', 'issue2']
      const apiUrl = 'http://localhost:3100'
      const parsedApiUrl = url.parse(apiUrl)

      describe('default', () => {
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

      describe('Client', () => {
        beforeEach(() => {
          this.instance = new Client({userEmail: userEmail, apiKey: apiKey}, apiUrl)
        })

        it('should chain requester and poller', async () => {
          sinon.stub(requester, 'do')
            .withArgs(bytecode, apiKey, parsedApiUrl)
            .returns(new Promise(resolve => {
              resolve(uuid)
            }))
          sinon.stub(poller, 'do')
            .withArgs(uuid, apiKey, parsedApiUrl)
            .returns(new Promise(resolve => {
              resolve(issues)
            }))

          await this.instance.analyze({bytecode: bytecode}).should.eventually.equal(issues)
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
            .returns(new Promise(resolve => {
              resolve(issues)
            }))

          await this.instance.analyze({bytecode: bytecode}).should.be.rejectedWith(Error, errorMsg)
        })

        it('should reject with poller failures', async () => {
          const errorMsg = 'Booom! from poller'
          sinon.stub(requester, 'do')
            .withArgs(bytecode, apiKey, parsedApiUrl)
            .returns(new Promise(resolve => {
              resolve(uuid)
            }))
          sinon.stub(poller, 'do')
            .withArgs(uuid, apiKey, parsedApiUrl)
            .returns(new Promise((resolve, reject) => {
              reject(new Error(errorMsg))
            }))

          await this.instance.analyze({bytecode: bytecode}).should.be.rejectedWith(Error, errorMsg)
        })

        it('should pass timeout option to poller', async () => {
          const timeout = 10

          sinon.stub(requester, 'do')
            .withArgs(bytecode, apiKey, parsedApiUrl)
            .returns(new Promise(resolve => {
              resolve(uuid)
            }))
          sinon.stub(poller, 'do')
            .withArgs(uuid, apiKey, parsedApiUrl, undefined, timeout)
            .returns(new Promise(resolve => {
              resolve(issues)
            }))

          await this.instance.analyze({bytecode: bytecode, timeout: timeout}).should.eventually.equal(issues)
        })
      })
    })
  })
})
