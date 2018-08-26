exports.getAnalysis = (options) => {
  return new Promise((resolve, reject) => {
    if (!options || !options.bytecode) {
      throw new Error('Please provide an options param with a bytecode member.')
    }
  })
}
