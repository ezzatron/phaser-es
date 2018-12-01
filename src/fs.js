const {readFile} = require('pn/fs')

module.exports = {
  readJsonFile,
}

async function readJsonFile (filePath) {
  return JSON.parse(await readFile(filePath))
}
