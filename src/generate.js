const {generate} = require('astring')
const {join} = require('path')

module.exports = {
  moduleTreeToFiles,
}

function moduleTreeToFiles (package, tree) {
  const files = {}
  const toGenerate = [['', join(package, 'src'), tree]]
  let entry

  while (entry = toGenerate.pop()) {
    const [basePath, baseModuleId, children] = entry

    if (!children) continue

    const childEntries = Object.entries(children)

    files[join(basePath, 'index.js')] = generate(buildBranchAst(baseModuleId, childEntries))

    childEntries.forEach(([name, {moduleId, children}]) => {
      const childPath = join(basePath, moduleId)
      const childModuleId = join(baseModuleId, moduleId)

      toGenerate.push([childPath, childModuleId, children])
    })
  }

  return files
}

function buildBranchAst (baseModuleId, childEntries) {
  const imports = childEntries.map(([name, {moduleId, children}]) => {
    const childModuleId = children ? moduleId : join(baseModuleId, moduleId)

    return {
      type: 'ImportDeclaration',
      specifiers: [{
        type: 'ImportDefaultSpecifier',
        local: {type: 'Identifier', name},
      }],
      source: {type: 'Literal', value: childModuleId},
    }
  })

  return {
    type: 'Program',
    body: [...imports],
  }
}
