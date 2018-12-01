const nullLogger = {
  log: () => {},
}

module.exports = async function compile (options = {}) {
  const {moduleId, constraint, outputPath, logger = nullLogger} = options
  const moduleIdWithConstraint = `${moduleId}@${constraint}`

  logger.log(
    `Compiling phaser-es from module ${JSON.stringify(moduleIdWithConstraint)} into path ${JSON.stringify(outputPath)}`
  )
}
