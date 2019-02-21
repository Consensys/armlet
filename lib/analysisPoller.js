/*
  The routines here are customized to handling polling analysis requests.
  It uses geometrically-increasing delay between successive polls and
  no mor that maxPolls will be tried for any single request.
*/
const fetch = require('omni-fetch')
const humanizeDuration = require('humanize-duration')

const util = require('./util')

/**
 * Throws timeout error.
 *
 * @param {String} status - MythX server stats, e.g. "Queued", "In Progress", ...
 * @param {Number} timeout-  Number of milliseconds to wait for analysis requiest to finish
 * @param {String} uuid - Analysis UUID to use in the error message.
 */
function failOnTimeout (status, timeout, uuid) {
  const t = humanizeDuration(timeout)
  /* eslint-disable no-throw-literal */
  throw (
    `User or default timeout reached after ${t}. The analysis job is ${status.toLowerCase()} ` +
    `and the result may become available later. UUID: ${uuid}\n`
  )
  /* eslint-enable no-throw-literal */
}

/**
 * Gets the array of issues from the API.
 *
 * @param {String} uuid - Analysis UUID.
 * @param {String} accessToken - gives access to use MythX service
 * @param {Object} apiUrl - URL object.
 * @return {Promise} Resolves with API response, or rejects with
 *  an error object.
 */
async function getIssues (uuid, accessToken, apiUrl) {
  const res = await fetch(`${apiUrl.origin}/v1/analyses/${uuid}/issues`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
  await handleErrors(res, accessToken, uuid)
  return res.json()
}
exports.getIssues = getIssues

/**
 * Handles error responses, throwing errors, if necessary.
 *
 * @param {Object} response - HTTP response.
 * @param {String} accessToken - gives access to use MythX service
 * @param {String} uuid Analysis UUID.
 */
async function handleErrors (response, accessToken, uuid) {
  const { status } = response
  if (status < 200 || status > 299) {
    let msg = `Failed in retrieving analysis response, HTTP status code: ${status}. UUID: ${uuid}`
    switch (status) {
      case 404:
        msg = `Unauthorized analysis request, access token: ${accessToken}`
        break
    }
    // eslint-disable-next-line no-throw-literal
    throw msg
  }
}

/*
   FIXME: the below routine is covered by index.js's getStatusOrIssues
   However in contrast to the above, I don't think it handles doesn't
   handle the JWT refresh token.
*/

/**
 * Get status on an analysis request.
 *
 * @param {String} uuid Analysis UUID.
 * @param {String} accessToken gives access to use MythX service
 * @param {Object} apiUrl URL object.
 * @return {Promise} Resolves with API response payload, or rejects with
 *  an error object.
 */
async function getStatus (uuid, accessToken, apiUrl) {
  /* Checks analysis status. */
  let res = await fetch(`${apiUrl.origin}/v1/analyses/${uuid}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
  await handleErrors(res, accessToken, uuid)
  const { status } = await res.json()
  switch (status) {
    case 'Finished': break
    /* eslint-disable no-throw-literal */
    case 'Error': throw 'Analysis failed'
    /* eslint-enable no-throw-literal */
    default: return [status, null]
  }

  /* Analysis finished successfully: fetches the list of issues. */
  res = await fetch(`${apiUrl.origin}/v1/analyses/${uuid}/issues`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
  await handleErrors(res, accessToken)
  return [status, res.json()]
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
// 2) successive values increase in a quadratic way. The formula for
//    exponential growth is too hard for Wolfram Alpha, and it probably grows
//    too steeply as well.

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
  timeout,
  initialDelay,
  debug = false
) {
  const start = Date.now()

  // In theory, timeout - initalDelay is > 0, but for robustness,
  // ensure it is greater than 0. (In debugging, it has sometimes been negative.
  const remainTime = Math.max(timeout - initialDelay, 0)

  const pollC = exports.inverseFn(remainTime)
  if (debug) {
    console.log(`timeout ${timeout}`)
    console.log(`now: ${Math.trunc(Date.now() / 1000)}`)
  }

  let status = 'unknown'

  for (let i = 1; i <= maxPolls; i++) {
    // Geek note: an optimizing compiler would use "strength reduction"
    // to turn the below exponentiation by two into a multiplication,
    // but I am too lazy and the result wouild be to ugly and confusing
    // to warrant my using it here.
    const pollStep = (pollC * i) ** 2

    if (debug) {
      console.log(`polling interval: ${humanizeDuration(pollStep)}, previous status: ${status}`)
    }

    await util.timer(Math.min(pollStep, start + remainTime - Date.now()))

    let statusResponse
    if (Date.now() - start >= timeout) {
      failOnTimeout(status, timeout, uuid)
    }
    [status, statusResponse] = await getStatus(uuid, accessToken, apiUrl)
    if (statusResponse) {
      return statusResponse
    }
  }
  /* The below is similar but a intentially slightly different than failOnTimeout(). The slight difference
     allows us to distinguish which path was taken, even though they really mean the same thing.
  */
  /* eslint-disable no-throw-literal */
  throw (
    `Timeout reached after ${humanizeDuration(timeout)}. The analysis job status is ${status.toLowerCase()} ` +
    `and the result may become available later. UUID: ${uuid}\n`
  )
  /* eslint-enable no-throw-literal */
}
