const glob = require('glob-promise')
const {dirname, join} = require('path')
const {mkdir, readFile, writeFile} = require('pn/fs')

const {buildModuleTree} = require('./parse')
const {commandStdout, passthru} = require('./child-process')
const {generatePackageJson, latestPackageVersion} = require('./npm')
const {moduleTreeToFiles} = require('./generate')
const {readJsonFile} = require('./fs')

const nullLogger = {
  log: () => {},
}

module.exports = async function compile (options = {}) {
  const {package, outputPath, logger = nullLogger} = options
  const {version = await latestPackageVersion(package)} = options

  if (version.startsWith('^') || version.startsWith('~')) throw new Error('Release constraints are not supported.')

  const packageWithConstraint = `${package}@${version}`

  logger.log(
    'Building phaser-es, '
    + `based on module ${JSON.stringify(packageWithConstraint)}, `
    + `into path ${JSON.stringify(outputPath)}`
  )

  await mkdir(outputPath, {recursive: true})

  await writeFile(
    join(outputPath, 'package.json'),
    JSON.stringify(await generatePackageJson(package, version), null, 2)
  )

  await passthru({cwd: outputPath}, 'npm', 'install', '--no-package-lock', '--scripts-prepend-node-path')

  const nodeModulesPath = join(outputPath, 'node_modules')
  const tree = await buildModuleTree(require.resolve(package, {paths: [nodeModulesPath]}))
  const files = moduleTreeToFiles(package, tree)

  const writes = Object.entries(files).map(async ([filePath, source]) => {
    const finalPath = join(outputPath, filePath)

    await await mkdir(dirname(finalPath), {recursive: true})
    await writeFile(finalPath, source)
  })

  await Promise.all(writes)
}
