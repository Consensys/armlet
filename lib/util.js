const url = require('url')

/**
 * Wait for the specified time.
 *
 * @param {Number} time Interval duration [ms].
 * @return {Promise} Resolves after the specified delay.
 */
exports.timer = async time =>
  new Promise(resolve => setTimeout(resolve, time))

exports.joinUrl = (base, path) => {
  const u = new url.URL(path, base)
  return u.href
}
