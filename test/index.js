const main = require('../index')
require('chai')
  .use(require('chai-as-promised'))
  .should()

describe('main module', () => {
  describe('#getAnalisys', () => {
    describe('interface', () => {
      it('should be a function', () => {
        main.analyze.should.be.a('function')
      })

      it('should return a thenable', () => {
        const result = main.analyze({bytecode: 'my-bytecode'})

        result.then.should.be.a('function')
      })

      it('should require options', async () => {
        await main.analyze().should.be.rejectedWith(TypeError)
      })

      it('should require a bytecode option', async () => {
        await main.analyze({}).should.be.rejectedWith(TypeError)
      })

      it('should require a valid api URL if given', async () => {
        await main.analyze({bytecode: 'my-bytecode'}, 'not-a-real-url').should.be.rejectedWith(TypeError)
      })
    })

    describe('functionality', () => {

    })
  })
})
