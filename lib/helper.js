// Format elapsed vale into a human-readable value, e.g.
// 2 minutes, 1 second.
function elapsedFmt (elapsed) {
  function addUnit (elapsed, div, unit, timeStr) {
    let modulus = elapsed % div
    if ((modulus) !== 0) {
      let addStr = `${modulus} ${unit}`
      if (modulus > 1) addStr += 's'
      if (timeStr !== '') addStr += ', '
      timeStr = `${addStr}${timeStr}`
    }
    elapsed = Math.floor(elapsed / div)
    return [elapsed, timeStr]
  }

  let timeStr = '';
  [elapsed, timeStr] = addUnit(elapsed, 1000, 'm', '')
  if (elapsed === 0) return 'less than a millisecond'
  for (const [units, unitName] of [
    [60, 'second'], [60, 'minute'], [24, 'hour'], [1000, 'day']]) {
    [elapsed, timeStr] = addUnit(elapsed, units, unitName, timeStr)
  }
  return timeStr
};

module.exports = {
  elapsedFmt
}
