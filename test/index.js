const main = require('../index')
const assert = require('assert')

describe('main module', () => {
  describe('#getAnalisys', () => {
    it('is a function', () => {
      assert.ok(typeof main.getAnalysis === 'function')
    })

    it('requires options', () => {
      assert.throws(() => main.getAnalysis())
    })

    it('requires a bytecode option', () => {
      assert.throws(() => main.getAnalysis({}))
    })

    it('returns a thenable', () => {
      const result = main.getAnalysis({bytecode: 'my-bytecode'})

      assert.ok(typeof result.then === 'function')
    })
  })
})
