exports.getAnalysis = (options) => {
  if (!options || !options.bytecode) {
    throw new Error('Please provide an options param with a bytecode member.')
  }

  return new Promise((resolve, reject) => {})
}
