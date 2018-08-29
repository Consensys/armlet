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
        const result = analyze({bytecode: 'my-bytecode'})

        result.then.should.be.a('function')
      })

      it('should require options', async () => {
        await analyze().should.be.rejectedWith(TypeError)
      })

      it('should require a bytecode option', async () => {
        await analyze({}).should.be.rejectedWith(TypeError)
      })

      it('should require a valid api URL if given', async () => {
        await analyze({bytecode: 'my-bytecode'}, 'my-api-key', 'not-a-real-url').should.be.rejectedWith(TypeError)
      })
    })

    describe('functionality', () => {

    })
  })
})
