const armlet = require('../index')
const Client = require('../index').Client
const sinon = require('sinon')
const url = require('url')
const HttpErrors = require('http-errors')
require('chai')
  .use(require('chai-as-promised'))
  .should()

const requester = require('../lib/requester')
const simpleRequester = require('../lib/simpleRequester')
const poller = require('../lib/poller')
const login = require('../lib/login')
const refresh = require('../lib/refresh')

const email = 'user@example.com'
const password = 'my-password'

describe('main module', () => {
  const data = {deployedBytecode: 'my-bitecode'}
  const apiUrl = 'http://localhost:3100'

  describe('#armlet', () => {
    describe('#interface', () => {
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

          it('require a password auth option', () => {
            (() => new Client({email})).should.throw(TypeError)
          })

          it('require an email auth option', () => {
            (() => new Client({password})).should.throw(TypeError)
          })

          it('require a valid apiUrl if given', () => {
            (() => new Client({email, password}, 'not-a-valid-url')).should.throw(TypeError)
          })

          it('initialize apiUrl to a default value if not given', () => {
            const instance = new Client({email, password})

            instance.apiUrl.should.be.deep.equal(armlet.defaultApiUrl)
          })

          describe('instances should', () => {
            beforeEach(() => {
              this.instance = new Client({email: email, password: password})
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
  })

  describe('functionality', () => {
    const uuid = 'analysis-uuid'
    const issues = ['issue1', 'issue2']
    const parsedApiUrl = url.parse(apiUrl)
    const refreshToken = 'refresh'
    const accessToken = 'access'

    describe('Client', () => {
      beforeEach(() => {
        this.instance = new Client({email: email, password: password}, apiUrl)
      })

      afterEach(() => {
        requester.do.restore()
        poller.do.restore()
      })

      describe('when the client logs in for the first time', () => {
        afterEach(() => {
          login.do.restore()
        })
        it('should login and chain requester and poller', async () => {
          sinon.stub(login, 'do')
            .withArgs(email, password, parsedApiUrl)
            .returns(new Promise(resolve => {
              resolve({accessToken, refreshToken})
            }))
          sinon.stub(requester, 'do')
            .withArgs({data}, accessToken, parsedApiUrl)
            .returns(new Promise(resolve => {
              resolve(uuid)
            }))
          sinon.stub(poller, 'do')
            .withArgs(uuid, accessToken, parsedApiUrl)
            .returns(new Promise(resolve => {
              resolve(issues)
            }))

          await this.instance.analyze({data}).should.eventually.equal(issues)
        })

        it('should reject with login failures', async () => {
          const errorMsg = 'Booom! from login'
          sinon.stub(login, 'do')
            .withArgs(email, password, parsedApiUrl)
            .returns(new Promise((resolve, reject) => {
              reject(new Error(errorMsg))
            }))
          sinon.stub(requester, 'do')
            .withArgs({data}, accessToken, parsedApiUrl)
            .returns(new Promise(resolve => {
              resolve(uuid)
            }))
          sinon.stub(poller, 'do')
            .withArgs(uuid, accessToken, parsedApiUrl)
            .returns(new Promise(resolve => {
              resolve(issues)
            }))

          await this.instance.analyze({data}).should.be.rejectedWith(Error, errorMsg)
        })

        it('should reject with requester failures', async () => {
          const errorMsg = 'Booom! from requester'
          sinon.stub(login, 'do')
            .withArgs(email, password, parsedApiUrl)
            .returns(new Promise(resolve => {
              resolve({accessToken, refreshToken})
            }))
          sinon.stub(requester, 'do')
            .withArgs({data}, accessToken, parsedApiUrl)
            .returns(new Promise((resolve, reject) => {
              reject(new Error(errorMsg))
            }))
          sinon.stub(poller, 'do')
            .withArgs(uuid, accessToken, parsedApiUrl)
            .returns(new Promise(resolve => {
              resolve(issues)
            }))

          await this.instance.analyze({data}).should.be.rejectedWith(Error, errorMsg)
        })

        it('should reject with poller failures', async () => {
          const errorMsg = 'Booom! from poller'
          sinon.stub(login, 'do')
            .withArgs(email, password, parsedApiUrl)
            .returns(new Promise(resolve => {
              resolve({accessToken, refreshToken})
            }))
          sinon.stub(requester, 'do')
            .withArgs({data}, accessToken, parsedApiUrl)
            .returns(new Promise(resolve => {
              resolve(uuid)
            }))
          sinon.stub(poller, 'do')
            .withArgs(uuid, accessToken, parsedApiUrl)
            .returns(new Promise((resolve, reject) => {
              reject(new Error(errorMsg))
            }))

          await this.instance.analyze({data}).should.be.rejectedWith(Error, errorMsg)
        })

        it('should pass timeout option to poller', async () => {
          const timeout = 10
          sinon.stub(login, 'do')
            .withArgs(email, password, parsedApiUrl)
            .returns(new Promise(resolve => {
              resolve({accessToken, refreshToken})
            }))
          sinon.stub(requester, 'do')
            .withArgs({data, timeout}, accessToken, parsedApiUrl)
            .returns(new Promise(resolve => {
              resolve(uuid)
            }))
          sinon.stub(poller, 'do')
            .withArgs(uuid, accessToken, parsedApiUrl, undefined, timeout)
            .returns(new Promise(resolve => {
              resolve(issues)
            }))

          await this.instance.analyze({data, timeout}).should.eventually.equal(issues)
        })
      })

      describe('when the client is already logged in', () => {
        it('should not call login again', async () => {
          this.instance.accessToken = accessToken

          sinon.stub(requester, 'do')
            .withArgs({data}, accessToken, parsedApiUrl)
            .returns(new Promise(resolve => {
              resolve(uuid)
            }))
          sinon.stub(poller, 'do')
            .withArgs(uuid, accessToken, parsedApiUrl)
            .returns(new Promise(resolve => {
              resolve(issues)
            }))

          await this.instance.analyze({data}).should.eventually.equal(issues)
        })
      })

      describe('refresh', () => {
        const newAccessToken = 'newAccessToken'
        const newRefreshToken = 'newRefreshToken'

        beforeEach(() => {
          this.instance.accessToken = accessToken
          this.instance.refreshToken = refreshToken
        })

        afterEach(() => {
          refresh.do.restore()
        })

        it('should refresh expired tokens when requester fails', async () => {
          const requesterStub = sinon.stub(requester, 'do')
          requesterStub.withArgs({data}, accessToken, parsedApiUrl)
            .returns(new Promise((resolve, reject) => {
              reject(HttpErrors.Unauthorized())
            }))
          requesterStub.withArgs({data}, newAccessToken, parsedApiUrl)
            .returns(new Promise(resolve => {
              resolve(uuid)
            }))

          sinon.stub(refresh, 'do')
            .withArgs(accessToken, refreshToken, parsedApiUrl)
            .returns(new Promise(resolve => {
              resolve({accessToken: newAccessToken, refreshToken: newRefreshToken})
            }))

          sinon.stub(poller, 'do')
            .withArgs(uuid, newAccessToken, parsedApiUrl)
            .returns(new Promise(resolve => {
              resolve(issues)
            }))

          await this.instance.analyze({data}).should.eventually.equal(issues)
        })

        it('should refresh expired tokens when poller fails', async () => {
          const pollerStub = sinon.stub(poller, 'do')
          pollerStub.withArgs(uuid, accessToken, parsedApiUrl)
            .returns(new Promise((resolve, reject) => {
              reject(HttpErrors.Unauthorized())
            }))
          pollerStub.withArgs(uuid, newAccessToken, parsedApiUrl)
            .returns(new Promise(resolve => {
              resolve(issues)
            }))

          sinon.stub(requester, 'do')
            .withArgs({data}, accessToken, parsedApiUrl)
            .returns(new Promise(resolve => {
              resolve(uuid)
            }))

          sinon.stub(refresh, 'do')
            .withArgs(accessToken, refreshToken, parsedApiUrl)
            .returns(new Promise(resolve => {
              resolve({accessToken: newAccessToken, refreshToken: newRefreshToken})
            }))

          await this.instance.analyze({data}).should.eventually.equal(issues)
        })
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
