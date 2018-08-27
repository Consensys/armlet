const main = require('../index')
require('chai')
  .use(require('chai-as-promised'))
  .should()

describe('main module', () => {
  describe('#getAnalisys', () => {
    describe('interface', () => {
      it('is a function', () => {
        main.getAnalysis.should.be.a('function')
      })

      it('returns a thenable', () => {
        const result = main.getAnalysis({bytecode: 'my-bytecode'})

        result.then.should.be.a('function')
      })

      it('requires options', async () => {
        await main.getAnalysis().should.be.rejectedWith(TypeError)
      })

      it('requires a bytecode option', async () => {
        await main.getAnalysis({}).should.be.rejectedWith(TypeError)
      })

      it('requires a valid api URL if given', async () => {
        await main.getAnalysis({bytecode: 'my-bytecode'}, 'not-a-real-url').should.be.rejectedWith(TypeError)
      })
    })

    describe('functionality', () => {

    })
  })
})
