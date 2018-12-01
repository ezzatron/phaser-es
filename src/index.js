const glob = require('glob-promise')
const {generate} = require('astring')
const {join} = require('path')
const {mkdir, readFile, writeFile} = require('pn/fs')

const {commandStdout, passthru} = require('./child-process')
const {generatePackageJson, latestPackageVersion} = require('./npm')
const {readJsonFile} = require('./fs')
const {rewriteIndexSource} = require('./source')

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

  const packagePath = join(outputPath, 'node_modules', package)
  const indexModulePaths = await glob(join(packagePath, '**/index.js'))

  const ast = rewriteIndexSource(await readFile(indexModulePaths[0]))

  console.log(generate(ast))
}
