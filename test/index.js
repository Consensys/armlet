const main = require('../index')
const assert = require('assert')

describe('main module', () => {
  describe('#getAnalisys', () => {
    describe('interface', () => {
      it('is a function', () => {
        assert.ok(typeof main.getAnalysis === 'function')
      })

      it('returns a thenable', () => {
        const result = main.getAnalysis({bytecode: 'my-bytecode'})

        assert.ok(typeof result.then === 'function')
      })

      it('requires options', () => {
        main.getAnalysis().catch((err) => {
          assert.ok(err)
        })
      })

      it('requires a bytecode option', () => {
        main.getAnalysis({}).catch((err) => {
          assert.ok(err)
        })
      })
    })

    describe('functionality', () => {

    })
  })
})
