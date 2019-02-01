require('chai')
  .use(require('chai-as-promised'))
  .should()
const helper = require('../../lib/helper')

describe('helper', () => {
  [[0, 'less than a millisecond'],
    [1000, '1 second'],
    [60000, '1 minute'],
    [61000, '1 minute, 1 second'],
    [3660000, '1 hour, 1 minute'],
    [60060, '1 minute, 60 ms'],
    [120000, '2 minutes'],
    [600120, '10 minutes, 120 ms'],
    [86400000, '1 day']
  ].forEach(pair => {
    const [ms, expect] = pair
    it('should convert millseconds to human-readible time', async () => {
      helper.elapsedFmt(ms).should.equal(expect)
    })
  })
})
