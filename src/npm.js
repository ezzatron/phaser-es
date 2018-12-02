const {join} = require('path')

const {commandStdout} = require('./child-process')
const {readJsonFile} = require('./fs')

module.exports = {
  generatePackageJson,
  latestPackageVersion,
}

async function latestPackageVersion (package) {
  return commandStdout({}, 'npm', 'view', package, 'dist-tags.latest')
}

async function generatePackageJson (package, version) {
  const {license, repository} = await readJsonFile(join(__dirname, '../package.json'))

  return {
    name: 'phaser-es',
    description: 'Phaser with ES2015 modules',
    version,
    repository,
    license,
    main: 'index.js',
    dependencies: {
      [package]: version,
    },
  }
}
