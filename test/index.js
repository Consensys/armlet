const analyze = require('../index')
require('chai')
  .use(require('chai-as-promised'))
  .should()

describe('main module', () => {
  describe('#getAnalisys', () => {
    describe('interface', () => {
      it('should be a function', () => {
        analyze.should.be.a('function')
      })

      it('should return a thenable', () => {
        const result = analyze('my-bytecode', 'apiKey')

        result.then.should.be.a('function')
      })

      it('should require a bytecode param', async () => {
        await analyze(undefined, 'apiKey').should.be.rejectedWith(TypeError)
      })

      it('should require an apiKey param', async () => {
        await analyze('bytecode').should.be.rejectedWith(TypeError)
      })

      it('should require a valid api URL if given', async () => {
        await analyze('my-bytecode', 'my-api-key', 'not-a-real-url').should.be.rejectedWith(TypeError)
      })
    })

    describe('functionality', () => {

    })
  })
})
