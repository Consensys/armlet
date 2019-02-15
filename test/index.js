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
const util = require('../lib/util')

const ethAddress = '0x74B904af705Eb2D5a6CDc174c08147bED478a60d'
const password = 'my-password'

describe('main module', () => {
  const data = { deployedBytecode: 'my-bitecode' }
  const apiUrl = 'http://localhost:3100'

  describe('#armlet', () => {
    describe('#interface', () => {
      afterEach(() => {
        requester.do.restore()
        poller.do.restore()
        simpleRequester.do.restore()
        util.timer.restore()
      })

      beforeEach(() => {
        sinon.stub(util, 'timer')
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
          it('initialize with trial userId', () => {
            const instance = new Client()

            instance.userId.should.be.deep.equal(armlet.trialUserId)
          })

          it('require a password auth option if ethAddress is provided', () => {
            (() => new Client({ ethAddress })).should.throw(TypeError)
          })

          it('require an user id auth option', () => {
            (() => new Client({ password })).should.throw(TypeError)
          })

          it('require a valid apiUrl if given', () => {
            (() => new Client({ ethAddress, password }, 'not-a-valid-url')).should.throw(TypeError)
          })

          it('initialize apiUrl to a default value if not given', () => {
            const instance = new Client({ ethAddress, password })

            instance.apiUrl.should.be.deep.equal(armlet.defaultApiUrl)
          })

          it('initialize apiUrl to the given value', () => {
            const instance = new Client({ ethAddress, password }, apiUrl)

            instance.apiUrl.should.be.deep.equal(new url.URL(apiUrl))
          })

          it('accept an apiKey auth and store it as accessToken', () => {
            const instance = new Client({ apiKey: 'my-apikey' })

            instance.accessToken.should.be.equal('my-apikey')
          })

          describe('instances should', () => {
            beforeEach(() => {
              this.instance = new Client({ ethAddress, password })
            })

            it('be created with a constructor', () => {
              this.instance.constructor.name.should.be.equal('Client')
            })
            describe('have an analyze method which', () => {
              it('should be a function', () => {
                this.instance.analyze.should.be.a('function')
              })

              it('should require a data option', async () => {
                await this.instance.analyze({ 'field': 'value' }).should.be.rejectedWith(TypeError)
              })
            })
            describe('have an analyses method which', () => {
              it('should be a function', () => {
                this.instance.analyses.should.be.a('function')
              })

              it('should require a dataFrom option', async () => {
                const options = { dataTo: '2018-12-04', offset: 15 }
                await this.instance.analyses(options).should.be.rejectedWith(TypeError)
              })
            })
            describe('have an analyzeWithStatus method which', () => {
              it('should be a function', () => {
                this.instance.analyzeWithStatus.should.be.a('function')
              })

              it('should call analyze and getStatus methods', async () => {
                const input = { data: 'content' }
                const analyzeStub = sinon.stub(this.instance, 'analyze')
                  .resolves({ issues: 'issues', uuid: 'uuid' })
                const getStatusStub = sinon.stub(this.instance, 'getStatus')
                  .resolves('stubbed')

                await this.instance.analyzeWithStatus(input)
                  .should.eventually.deep.equal({ issues: { issues: 'issues' }, status: 'stubbed' })
                analyzeStub.calledWith(input).should.be.equal(true)
                getStatusStub.calledWith('uuid').should.be.equal(true)

                analyzeStub.restore()
                getStatusStub.restore()
              })
            })
            describe('have a getStatus method which', () => {
              it('should be a function', () => {
                this.instance.getStatus.should.be.a('function')
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
    const parsedApiUrl = new url.URL(apiUrl)
    const refreshToken = 'refresh-token'
    const accessToken = 'access-token'

    describe('Client', () => {
      describe('as authenticated user', () => {
        beforeEach(() => {
          this.instance = new Client({ ethAddress, password }, apiUrl)
        })

        describe('getStatus', () => {
          afterEach(() => {
            simpleRequester.do.restore()
            login.do.restore()
          })

          it('should login and chain simpleRequester', async () => {
            const uuid = '1234'
            sinon.stub(login, 'do')
              .withArgs(ethAddress, undefined, password, parsedApiUrl)
              .returns(new Promise(resolve => {
                resolve({ access: accessToken, refresh: refreshToken })
              }))
            sinon.stub(simpleRequester, 'do')
              .withArgs({ url: `${apiUrl}/v1/analyses/${uuid}`, accessToken, json: true })
              .returns(new Promise(resolve => {
                resolve('stubbed')
              }))
            await this.instance.getStatus(uuid).should.eventually.equal('stubbed')
          })
        })

        describe('analyze', () => {
          afterEach(() => {
            requester.do.restore()
            poller.do.restore()
            util.timer.restore()
          })

          describe.skip('when the client logs in for the first time', () => {
            afterEach(() => {
              login.do.restore()
            })
            it('should login and chain requester and poller', async () => {
              sinon.stub(util, 'timer')
              sinon.stub(login, 'do')
                .withArgs(ethAddress, undefined, password, parsedApiUrl)
                .returns(new Promise(resolve => {
                  resolve({ access: accessToken, refresh: refreshToken })
                }))
              sinon.stub(requester, 'do')
                .withArgs({ data }, accessToken, parsedApiUrl)
                .returns(new Promise(resolve => {
                  resolve({ uuid })
                }))
              sinon.stub(poller, 'do')
                .withArgs(uuid, accessToken, parsedApiUrl)
                .returns(new Promise(resolve => {
                  resolve({ issues })
                }))

              await this.instance.analyze({ data }).should.eventually.deep.equal({ issues, uuid })
            })

            it('should reject with login failures', async () => {
              const errorMsg = 'Invalid MythX credentials for ethereum address 0x74B904af705Eb2D5a6CDc174c08147bED478a60d given.'
              sinon.stub(util, 'timer')
              sinon.stub(login, 'do')
                .withArgs(ethAddress, undefined, password, parsedApiUrl)
                .returns(new Promise((resolve, reject) => {
                  reject(new Error(errorMsg))
                }))
              sinon.stub(requester, 'do')
                .withArgs({ data }, accessToken, parsedApiUrl)
                .returns(new Promise(resolve => {
                  resolve({ uuid })
                }))
              sinon.stub(poller, 'do')
                .withArgs(uuid, accessToken, parsedApiUrl)
                .returns(new Promise(resolve => {
                  resolve({ issues })
                }))

              await this.instance.analyze({ data }).should.be.rejectedWith(errorMsg)
            })

            it('should reject with requester failures', async () => {
              sinon.stub(util, 'timer')
              const errorMsg = 'Booom! from requester'
              sinon.stub(login, 'do')
                .withArgs(ethAddress, undefined, password, parsedApiUrl)
                .returns(new Promise(resolve => {
                  resolve({ access: accessToken, refresh: refreshToken })
                }))
              sinon.stub(requester, 'do')
                .withArgs({ data }, accessToken, parsedApiUrl)
                .returns(new Promise((resolve, reject) => {
                  reject(new Error(errorMsg))
                }))
              sinon.stub(poller, 'do')
                .withArgs(uuid, accessToken, parsedApiUrl)
                .returns(new Promise(resolve => {
                  resolve({ issues })
                }))

              await this.instance.analyze({ data }).should.be.rejectedWith(Error, errorMsg)
            })

            it('should reject with poller failures', async () => {
              sinon.stub(util, 'timer')
              const errorMsg = 'Booom! from poller'
              sinon.stub(login, 'do')
                .withArgs(ethAddress, undefined, password, parsedApiUrl)
                .returns(new Promise(resolve => {
                  resolve({ access: accessToken, refresh: refreshToken })
                }))
              sinon.stub(requester, 'do')
                .withArgs({ data }, accessToken, parsedApiUrl)
                .returns(new Promise(resolve => {
                  resolve({ uuid })
                }))
              sinon.stub(poller, 'do')
                .withArgs(uuid, accessToken, parsedApiUrl)
                .returns(new Promise((resolve, reject) => {
                  reject(new Error(errorMsg))
                }))

              await this.instance.analyze({ data }).should.be.rejectedWith(Error, errorMsg)
            })

            it('should pass timeout option to poller', async () => {
              const timeout = 10
              sinon.stub(util, 'timer')
              sinon.stub(login, 'do')
                .withArgs(ethAddress, undefined, password, parsedApiUrl)
                .returns(new Promise(resolve => {
                  resolve({ access: accessToken, refresh: refreshToken })
                }))
              sinon.stub(requester, 'do')
                .withArgs({ data, timeout }, accessToken, parsedApiUrl)
                .returns(new Promise(resolve => {
                  resolve({ uuid, status: 'Finished' })
                }))
              sinon.stub(poller, 'do')
                .withArgs(uuid, accessToken, parsedApiUrl, 1000, timeout)
                .returns(new Promise(resolve => {
                  resolve({ issues })
                }))
              await this.instance.analyze({ data, timeout }).should.eventually.deep.equal({ issues, uuid })
            })

            it('should pass default initial delay option to poller', async () => {
              const timeout = 40000
              sinon.stub(util, 'timer')
              sinon.stub(login, 'do')
                .withArgs(ethAddress, undefined, password, parsedApiUrl)
                .returns(new Promise(resolve => {
                  resolve({ access: accessToken, refresh: refreshToken })
                }))
              sinon.stub(requester, 'do')
                .withArgs({ data, timeout }, accessToken, parsedApiUrl)
                .returns(new Promise(resolve => {
                  resolve({ uuid })
                }))
              sinon.stub(poller, 'do')
                .withArgs(uuid, accessToken, parsedApiUrl, 1000, timeout - armlet.defaultInitialDelay)
                .returns(new Promise(resolve => {
                  resolve({ issues })
                }))
              await this.instance.analyze({ data, timeout }).should.eventually.deep.equal({ issues, uuid })
              util.timer.getCall(0).args[0].should.equal(armlet.defaultInitialDelay)
            })

            it('should pass initial delay option to poller', async () => {
              const timeout = 40000
              const initialDelay = 31000
              sinon.stub(util, 'timer')
              sinon.stub(login, 'do')
                .withArgs(ethAddress, undefined, password, parsedApiUrl)
                .returns(new Promise(resolve => {
                  resolve({ access: accessToken, refresh: refreshToken })
                }))
              sinon.stub(requester, 'do')
                .withArgs({ data, timeout, initialDelay }, accessToken, parsedApiUrl)
                .returns(new Promise(resolve => {
                  resolve({ uuid })
                }))
              sinon.stub(poller, 'do')
                .withArgs(uuid, accessToken, parsedApiUrl, 1000, 9000)
                .returns(new Promise(resolve => {
                  resolve({ issues })
                }))
              await this.instance.analyze({ data, timeout, initialDelay }).should.eventually.deep.equal({ issues, uuid })
              util.timer.getCall(0).args[0].should.equal(initialDelay)
            })
          })

          describe('when the client is already logged in', () => {
            it('should not call login again', async () => {
              sinon.stub(util, 'timer')
              this.instance.accessToken = accessToken

              sinon.stub(requester, 'do')
                .withArgs({ data }, accessToken, parsedApiUrl)
                .returns(new Promise(resolve => {
                  resolve({ uuid })
                }))
              sinon.stub(poller, 'do')
                .withArgs(uuid, accessToken, parsedApiUrl)
                .returns(new Promise(resolve => {
                  resolve({ issues })
                }))

              await this.instance.analyze({ data }).should.eventually.deep.equal({ issues, uuid })
            })
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
            requester.do.restore()
            poller.do.restore()
            util.timer.restore()
          })

          it('should refresh expired tokens when requester fails', async () => {
            sinon.stub(util, 'timer')
            const requesterStub = sinon.stub(requester, 'do')
            requesterStub.withArgs({ data }, accessToken, parsedApiUrl)
              .returns(new Promise((resolve, reject) => {
                reject(HttpErrors.Unauthorized())
              }))
            requesterStub.withArgs({ data }, newAccessToken, parsedApiUrl)
              .returns(new Promise(resolve => {
                resolve({ uuid })
              }))

            sinon.stub(refresh, 'do')
              .withArgs(accessToken, refreshToken, parsedApiUrl)
              .returns(new Promise(resolve => {
                resolve({ access: newAccessToken, refresh: newRefreshToken })
              }))

            sinon.stub(poller, 'do')
              .withArgs(uuid, newAccessToken, parsedApiUrl)
              .returns(new Promise(resolve => {
                resolve({ issues })
              }))

            await this.instance.analyze({ data }).should.eventually.deep.equal({ issues, uuid })
          })

          it('should refresh expired tokens when poller fails', async () => {
            sinon.stub(util, 'timer')
            const pollerStub = sinon.stub(poller, 'do')
            pollerStub.withArgs(uuid, accessToken, parsedApiUrl)
              .returns(new Promise((resolve, reject) => {
                reject(HttpErrors.Unauthorized())
              }))
            pollerStub.withArgs(uuid, newAccessToken, parsedApiUrl)
              .returns(new Promise(resolve => {
                resolve({ issues })
              }))

            sinon.stub(requester, 'do')
              .withArgs({ data }, accessToken, parsedApiUrl)
              .returns(new Promise(resolve => {
                resolve({ uuid })
              }))

            sinon.stub(refresh, 'do')
              .withArgs(accessToken, refreshToken, parsedApiUrl)
              .returns(new Promise(resolve => {
                resolve({ access: newAccessToken, refresh: newRefreshToken })
              }))

            await this.instance.analyze({ data }).should.eventually.deep.equal({ issues, uuid })
          })
        })

        describe('analyses', () => {
          const dateFrom = '2018-11-24'
          const dateTo = '2018-11-25'
          const offset = 5
          const baseUrl = `${apiUrl}/${armlet.defaultApiVersion}/analyses`
          const url = `${baseUrl}?dateFrom=${dateFrom}&dateTo=${dateTo}&offset=${offset}`
          const analyses = ['analysis1', 'analysis2']

          describe('when the client logs in for the first time', () => {
            afterEach(() => {
              login.do.restore()
              simpleRequester.do.restore()
            })

            it('should login and call simpleRequester', async () => {
              sinon.stub(login, 'do')
                .withArgs(ethAddress, undefined, password, parsedApiUrl)
                .returns(new Promise(resolve => {
                  resolve({ access: accessToken, refresh: refreshToken })
                }))
              sinon.stub(simpleRequester, 'do')
                .withArgs({ url, accessToken, json: true })
                .returns(new Promise(resolve => {
                  resolve(analyses)
                }))

              await this.instance.analyses({ dateFrom, dateTo, offset }).should.eventually.equal(analyses)
            })

            it('should reject with login failures', async () => {
              const errorMsg = 'Booom! from login'
              sinon.stub(login, 'do')
                .withArgs(ethAddress, undefined, password, parsedApiUrl)
                .returns(new Promise((resolve, reject) => {
                  reject(new Error(errorMsg))
                }))
              sinon.stub(simpleRequester, 'do')
                .withArgs({ url, accessToken, json: true })
                .returns(new Promise(resolve => {
                  resolve(analyses)
                }))

              await this.instance.analyses({ dateFrom, dateTo, offset }).should.be.rejectedWith(Error, errorMsg)
            })

            it('should reject with simpleRequester failures', async () => {
              const errorMsg = 'Booom! from simpleRequester'
              sinon.stub(login, 'do')
                .withArgs(ethAddress, undefined, password, parsedApiUrl)
                .returns(new Promise(resolve => {
                  resolve({ access: accessToken, refresh: refreshToken })
                }))
              sinon.stub(simpleRequester, 'do')
                .withArgs({ url, accessToken, json: true })
                .returns(new Promise((resolve, reject) => {
                  reject(new Error(errorMsg))
                }))

              await this.instance.analyses({ dateFrom, dateTo, offset }).should.be.rejectedWith(Error, errorMsg)
            })
          })

          describe('when the client is already logged in', () => {
            afterEach(() => {
              simpleRequester.do.restore()
            })

            it('should not call login again', async () => {
              this.instance.accessToken = accessToken

              sinon.stub(simpleRequester, 'do')
                .withArgs({ url, accessToken, json: true })
                .returns(new Promise(resolve => {
                  resolve(analyses)
                }))

              await this.instance.analyses({ dateFrom, dateTo, offset }).should.eventually.equal(analyses)
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
              simpleRequester.do.restore()
            })

            it('should refresh expired tokens when simpleRequester fails', async () => {
              const requesterStub = sinon.stub(simpleRequester, 'do')
              requesterStub.withArgs({ url, accessToken, json: true })
                .returns(new Promise((resolve, reject) => {
                  reject(HttpErrors.Unauthorized())
                }))
              requesterStub.withArgs({ url, accessToken: newAccessToken, json: true })
                .returns(new Promise(resolve => {
                  resolve(analyses)
                }))

              sinon.stub(refresh, 'do')
                .withArgs(accessToken, refreshToken, parsedApiUrl)
                .returns(new Promise(resolve => {
                  resolve({ access: newAccessToken, refresh: newRefreshToken })
                }))

              await this.instance.analyses({ dateFrom, dateTo, offset }).should.eventually.equal(analyses)
            })
          })
        })
      })

      describe('as anonymous user', () => {
        beforeEach(() => {
          this.instance = new Client({ }, apiUrl)
        })

        describe('analyze', () => {
          it('should login and chain requester and poller', async () => {
            sinon.stub(util, 'timer')
            sinon.stub(login, 'do')
              .withArgs(undefined, armlet.trialUserId, undefined, parsedApiUrl)
              .returns(new Promise(resolve => {
                resolve({ access: accessToken, refresh: refreshToken })
              }))
            sinon.stub(requester, 'do')
              .withArgs({ data }, accessToken, parsedApiUrl)
              .returns(new Promise(resolve => {
                resolve({ uuid })
              }))
            sinon.stub(poller, 'do')
              .withArgs(uuid, accessToken, parsedApiUrl)
              .returns(new Promise(resolve => {
                resolve({ issues })
              }))

            await this.instance.analyze({ data }).should.eventually.deep.equal({ issues, uuid })
          })

          afterEach(() => {
            requester.do.restore()
            poller.do.restore()
            login.do.restore()
          })
        })
      })
    })

    describe('ApiVersion', () => {
      const url = `${apiUrl}/${armlet.defaultApiVersion}/version`
      afterEach(() => {
        simpleRequester.do.restore()
      })

      it('should use simpleRequester', async () => {
        const result = { result: 'result' }

        sinon.stub(simpleRequester, 'do')
          .withArgs({ url, json: true })
          .returns(new Promise(resolve => {
            resolve(result)
          }))

        await armlet.ApiVersion(apiUrl).should.eventually.equal(result)
      })

      it('should reject with simpleRequester failures', async () => {
        const errorMsg = 'Booom!'
        sinon.stub(simpleRequester, 'do')
          .withArgs({ url, json: true })
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
          .withArgs({ url })
          .returns(new Promise(resolve => {
            resolve(result)
          }))

        await armlet.OpenApiSpec(apiUrl).should.eventually.equal(result)
      })

      it('should reject with simpleRequester failures', async () => {
        const errorMsg = 'Booom!'
        sinon.stub(simpleRequester, 'do')
          .withArgs({ url })
          .returns(new Promise((resolve, reject) => {
            reject(new Error(errorMsg))
          }))

        await armlet.OpenApiSpec(apiUrl).should.be.rejectedWith(Error, errorMsg)
      })
    })
  })
})
