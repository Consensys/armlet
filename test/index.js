const main = require('../index')
const assert = require('assert')

describe('main module', () => {
  describe('#getAnalisys', () => {
    it('is a function', () => {
      assert.ok(typeof main.getAnalysis === 'function')
    })
  })
})
