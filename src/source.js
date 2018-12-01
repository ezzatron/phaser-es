const {parse} = require('acorn')
const {readFile} = require('pn/fs')
const {simple} = require('acorn-walk')

module.exports = {
  rewriteIndexSource,
}

function rewriteIndexSource (source) {
  const original = parse(source)
  const moduleExports = findModuleExports(original)

  let match

  if (match = findSimpleModuleIndex(moduleExports)) return generateSimpleModuleIndexAst(match)

  return original
}

function findSimpleModuleIndex (ast) {
  if (ast.type !== 'ObjectExpression') return null

  const index = []

  for (const property of ast.properties) {
    if (property.type !== 'Property') return null

    const {key, value} = property

    if (value.type !== 'CallExpression' || value.callee.name !== 'require' || value.arguments.length < 1) return null

    index.push([key.name, value.arguments[0].value])
  }

  return index.length > 0 ? index : null
}

function generateSimpleModuleIndexAst (index) {
  const imports = index.map(([key, value]) => ({
    type: 'ImportDeclaration',
    specifiers: [{
      type: 'ImportDefaultSpecifier',
      local: {type: 'Identifier', name: key},
    }],
    source: {type: 'Literal', value},
  }))

  return {
    type: 'Program',
    body: [...imports],
  }
}

function findModuleExports (ast) {
  return findLastAssignmentTo(ast, 'module', 'exports')
}

function findLastAssignmentTo (ast, object, property) {
  let result

  simple(ast, {
    AssignmentExpression (node) {
      const nodeObject = node.left.object && node.left.object.name
      const nodeProperty = node.left.property && node.left.property.name

      if (nodeObject === object && nodeProperty === property) result = node.right
    },
  })

  return result
}
