const fetch = require('omni-fetch')
const moment = require('moment')

const util = require('./util')

/**
 * Throws timeout error.
 *
 * @param {Number} timeout Number of milliseconds to wait for analysis requiest to finish
 * @param {String} uuid Analysis UUID to use in the error message.
 */
function failOnTimeout (timeout, uuid) {
  const t = moment.duration(timeout).as('seconds')
  /* eslint-disable no-throw-literal */
  throw (
    `User-specified or default time out reached after ${t} seconds.\n` +
    'Analysis continues on server and may have completed; so run again?\n' +
    `For status reference, UUID is ${uuid}\n`
  )
  /* eslint-enable no-throw-literal */
}

/**
 * Handles error responses, throwing errors, if necessary.
 *
 * @param {Object} response HTTP response.
 * @param {String} accessToken gives access to use MythX service
 */
async function handleErrors (response, accessToken) {
  const { status } = response
  if (status < 200 || status > 299) {
    let msg
    switch (status) {
      case 404:
        msg = `Unauthorized analysis request, access token: ${accessToken}`
        break
      default:
        msg = (await response.json()).error
    }
    // eslint-disable-next-line no-throw-literal
    throw msg
  }
}

/**
 * Poll wait on an analysis request.
 *
 * @param {String} uuid Analysis UUID.
 * @param {String} accessToken gives access to use MythX service
 * @param {Object} apiUrl URL object.
 * @return {Promise} Resolves with API response payload, or rejects with
 *  an error object.
 */
async function ping (uuid, accessToken, apiUrl) {
  /* Checks analysis status. */
  let res = await fetch(`${apiUrl.origin}/v1/analyses/${uuid}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
  await handleErrors(res, accessToken)
  const { status } = await res.json()
  switch (status) {
    case 'Finished': break
    /* eslint-disable no-throw-literal */
    case 'Error': throw 'Analysis failed'
    /* eslint-enable no-throw-literal */
    default: return null
  }

  /* Analysis finished successfully: fetches the list of issues. */
  res = await fetch(`${apiUrl.origin}/v1/analyses/${uuid}/issues`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
  await handleErrors(res, accessToken)
  return res.json()
}

// No matter how long the timeout, maxPolls is the number of requests
// that will happen per analysis request.
const maxPolls = 10
exports.maxPolls = maxPolls

// We use the sequence:
//    (c*i)**2,  i=1 to maxPolls
// for successive polling delays.
//
//  To figure out a value of "c" so that the sum of the sequence adds to "timeout":
//
//  timeout = sum (x*i)**2,  i=1 to 10 solve for x
//
//  c = +/- sqrt(timeout) / sqrt(385)
//
// See https://www.wolframalpha.com/input/?i=n+%3D+sum+(x*i)**2,++i%3D1+to+10+solve+for+x
//
//  We use the positive root.
//
// The idea embodied in the equation is that:
// 1) no matter what the timeout value, there will at most 10 polls
// 2) successive values increase in a quadratic way. (The formula for
//    exponential growth is too hard for Wolfram Alpha.)

exports.inverseFn = function (timeout) {
  return Math.sqrt(timeout) / Math.sqrt(385)
}

/**
 * Gets the list of issues detected by the API for the specified analysis,
 * waiting until the analysis is finished up to a given polling interval.
 *
 * @param {String} uuid Analysis UUID.
 * @param {String} accessToken Auth token.
 * @param {Object} apiUrl URL object of API base (without /v1, though).
 * @param {Number} timeout Optional. Operation timeout [ms]. Defaults to 30 sec.
 * @param {Number} initialTimeout Optional. Operation timeout [ms]. Defaults to 30 sec.
 *  (For initial polling only)
 * @return {Promise} Resolves to the list of issues, or rejects with an error.
 */
exports.do = async function (
  uuid,
  accessToken,
  apiUrl,
  timeout = 30000,
  initialTimeout = null
) {
  const start = Date.now()
  const pollC = exports.inverseFn(timeout)

  // debug -
  // console.log(`timeout ${timeout}`)
  // console.log(`now: ${Math.trunc(Date.now() / 1000)}`)

  for (let i = 1; i <= maxPolls; i++) {
    const pollStep = (pollC * i) ** 2
    console.log(pollStep)
    const t = initialTimeout || timeout

    if (!initialTimeout) {
      await util.timer(Math.min(pollStep, start + t - Date.now()))
    }
    if (Date.now() - start >= timeout) failOnTimeout(t, uuid)

    const res = await ping(uuid, accessToken, apiUrl)
    if (res) return res
    initialTimeout = null
  }
  /* eslint-disable no-throw-literal */
  throw `Polling failed after ${maxPolls} retries.`
  /* eslint-enable no-throw-literal */
}
