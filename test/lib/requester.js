const requester = require('../../lib/requester')
require('chai')
  .use(require('chai-as-promised'))
  .should()

describe('requester', () => {
  describe('#do', () => {
    describe('interface', () => {
      it('is a function', () => {
        requester.do.should.be.a('function')
      })

      it('returns a thenable', () => {
        const result = requester.do({bytecode: 'my-bytecode', apiUrl: 'my-api-url'})

        result.then.should.be.a('function')
      })
    })

    describe('functionality', () => {

    })
  })
})
