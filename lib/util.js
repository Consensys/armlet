const url = require('url')

exports.joinUrl = (base, path) => {
  const u = new url.URL(path, base)
  return u.href
}
