const nock = require('nock')
const url = require('url')
require('chai')
  .use(require('chai-as-promised'))
  .should()

const login = require('../../lib/login')

describe('login', () => {
  describe('#do', () => {
    const apiUrl = 'https://localhost:3100'
    const parsedApiUrl = new url.URL(apiUrl)
    const email = 'content'
    const ethAddress = '0x74B904af705Eb2D5a6CDc174c08147bED478a60d'
    const userId = '123456'
    const password = 'password'
    const auth = { email, ethAddress, userId, password }
    const loginPath = '/v1/auth/login'
    const refresh = 'refresh-token'
    const access = 'access-token'
    const jsonTokens = { refresh, access }

    it('should return refresh and access tokens', async () => {
      nock(apiUrl)
        .post(loginPath, auth)
        .reply(200, jsonTokens)

      await login.do(email, ethAddress, userId, password, parsedApiUrl).should.eventually.deep.equal(jsonTokens)
    })

    it('should redirect refresh and access tokens', async () => {
      nock('http://localhost:3100')
        .post(loginPath, auth)
        .reply(200, jsonTokens)

      const parsedApiUrlHttp = new url.URL('http://localhost:3100')
      await login.do(email, ethAddress, userId, password, parsedApiUrlHttp)
        .should.eventually.deep.equal(jsonTokens)
    })

    it('should reject on api server connection failure', async () => {
      const invalidUrlObject = 'not-an-url-object'

      await login.do(email, ethAddress, userId, password, invalidUrlObject).should.be.rejectedWith(Error)
    })

    it('should reject on api server status code != 200', async () => {
      nock(apiUrl)
        .post(loginPath, auth)
        .reply(500)

      await login.do(email, ethAddress, userId, password, parsedApiUrl).should.be.rejectedWith('HTTP status 500')
    })

    it('should reject on non-JSON data', async () => {
      nock(apiUrl)
        .post(loginPath, auth)
        .reply(200, 'jsonTextTokens')

      await login.do(email, ethAddress, userId, password, parsedApiUrl).should.be.rejectedWith(Error, 'JSON parse error')
    })

    it('should reject if refreshToken is not present', async () => {
      nock(apiUrl)
        .post(loginPath, auth)
        .reply(200, { access })

      await login.do(email, ethAddress, userId, password, parsedApiUrl).should.be.rejectedWith(Error, 'Refresh Token missing')
    })

    it('should reject if accessToken is not present', async () => {
      nock(apiUrl)
        .post(loginPath, auth)
        .reply(200, { refresh })

      await login.do(email, ethAddress, userId, password, parsedApiUrl).should.be.rejectedWith(Error, 'Access Token missing')
    })
  })
})
