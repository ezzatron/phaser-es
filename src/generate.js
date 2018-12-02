const {generate} = require('astring')
const {basename, dirname, join} = require('path')

module.exports = {
  moduleTreeToFiles,
}

function moduleTreeToFiles (package, tree) {
  const files = {}
  const toGenerate = [['index.js', join(package, 'src'), tree]]
  let entry

  while (entry = toGenerate.pop()) {
    const [filePath, baseModuleId, children] = entry

    if (!children) continue

    const fileDirPath = dirname(filePath)
    const childEntries = Object.entries(children)

    files[filePath] = generate(buildBranchAst(baseModuleId, childEntries))

    childEntries.forEach(([name, {path, moduleId, children}]) => {
      const childPath = join(fileDirPath, path)
      const childModuleId = basename(path) === 'index.js'
        ? join(baseModuleId, moduleId)
        : join(baseModuleId, dirname(moduleId))

      toGenerate.push([childPath, childModuleId, children])
    })
  }

  return files
}

function buildBranchAst (baseModuleId, childEntries) {
  const imports = []
  const exports = []

  childEntries.forEach(([name, {moduleId, children}]) => {
    const specifierType = children ? 'ImportNamespaceSpecifier' : 'ImportDefaultSpecifier'
    const childModuleId = children ? moduleId : join(baseModuleId, moduleId)

    imports.push({
      type: 'ImportDeclaration',
      specifiers: [{
        type: specifierType,
        local: {type: 'Identifier', name},
      }],
      source: {type: 'Literal', value: childModuleId},
    })

    exports.push({
      type: 'ExportSpecifier',
      local: {type: 'Identifier', name},
      exported: {type: 'Identifier', name},
    })
  })

  imports.sort(importComparator)
  exports.sort(exportComparator)

  return {
    type: 'Program',
    body: [
      ...imports,

      {
        type: 'ExportNamedDeclaration',
        specifiers: exports,
      },
    ],
  }
}

function importComparator (a, b) {
  const aSpecifier = a.specifiers[0]
  const bSpecifier = b.specifiers[0]

  const isANamespace = aSpecifier.type === 'ImportNamespaceSpecifier'
  const isBNamespace = bSpecifier.type === 'ImportNamespaceSpecifier'

  if (isANamespace && !isBNamespace) return -1
  if (isBNamespace && !isANamespace) return 1

  return aSpecifier.local.name.localeCompare(bSpecifier.local.name)
}

function exportComparator (a, b) {
  return a.local.name.localeCompare(b.local.name)
}
