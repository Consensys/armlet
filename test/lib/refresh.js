const nock = require('nock')
require('chai')
  .use(require('chai-as-promised'))
  .should()

const refresh = require('../../lib/refresh')

describe('refresh', () => {
  describe('#do', () => {
    const httpsApiUrl = 'https://localhost:3100'
    const refreshPath = '/v1/auth/refresh'
    const expiredRefreshToken = 'expiredRefresh'
    const expiredAccessToken = 'expiredAccess'
    const expiredJsonTokens = {refreshToken: expiredRefreshToken, accessToken: expiredAccessToken}
    const renewedJsonTokens = {refreshToken: 'renewedRefresh', accessToken: 'renewedAccess'}

    it('should return renewed refresh and access tokens', async () => {
      nock(httpsApiUrl)
        .post(refreshPath, expiredJsonTokens)
        .reply(200, renewedJsonTokens)

      await refresh.do(expiredRefreshToken, expiredAccessToken, httpsApiUrl).should.eventually.deep.equal(renewedJsonTokens)
    })

    it('should reject on api server connection failure', async () => {
      const invalidApiHostname = 'http://not-a-valid-hostname'

      await refresh.do(expiredRefreshToken, expiredAccessToken, invalidApiHostname).should.be.rejectedWith(Error)
    })

    it('should reject on api server status code != 200', async () => {
      nock(httpsApiUrl)
        .post(refreshPath, expiredJsonTokens)
        .reply(500)

      await refresh.do(expiredRefreshToken, expiredAccessToken, httpsApiUrl).should.be.rejectedWith(Error, 'Invalid status code')
    })

    it('should reject on non-JSON data', async () => {
      nock(httpsApiUrl)
        .post(refreshPath, expiredJsonTokens)
        .reply(200, 'newjsonTextTokens')

      await refresh.do(expiredRefreshToken, expiredAccessToken, httpsApiUrl).should.be.rejectedWith(Error, 'JSON parse error')
    })

    it('should reject if refreshToken is not present in response', async () => {
      nock(httpsApiUrl)
        .post(refreshPath, expiredJsonTokens)
        .reply(200, {accessToken: 'access'})

      await refresh.do(expiredRefreshToken, expiredAccessToken, httpsApiUrl).should.be.rejectedWith(Error, 'Refresh Token missing')
    })

    it('should reject if accessToken is not present', async () => {
      nock(httpsApiUrl)
        .post(refreshPath, expiredJsonTokens)
        .reply(200, {refreshToken: 'refresh'})

      await refresh.do(expiredRefreshToken, expiredAccessToken, httpsApiUrl).should.be.rejectedWith(Error, 'Access Token missing')
    })
  })
})
