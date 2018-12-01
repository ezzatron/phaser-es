const {dirname} = require('path')
const {parse} = require('acorn')
const {readFile} = require('pn/fs')
const {simple} = require('acorn-walk')

module.exports = {
  buildModuleTree,
}

async function buildModuleTree (entryPath) {
  const tree = {}
  const toParse = [[tree, entryPath]]
  let entry

  while (entry = toParse.pop()) {
    const [tree, entryPath] = entry
    const ast = parse(await readFile(entryPath))

    const exports = findExports(ast)

    if (exports.length > 0) tree.children = {}

    exports.forEach(([name, moduleId]) => {
      const subTree = {moduleId}
      tree.children[name] = subTree

      if (!moduleId.startsWith('.')) return

      const subEntryPath = require.resolve(moduleId, {paths: [dirname(entryPath)]})
      toParse.push([subTree, subEntryPath])
    })
  }

  return tree
}

function findExports (ast) {
  const exports = []

  simple(ast, {
    Property ({key, value}) {
      if (!isRequire(value)) return
      if (key.type !== 'Identifier') return

      exports.push([key.name, value.arguments[0].value])
    },
  })

  return exports
}

function isRequire (node) {
  const {type, callee, arguments} = node

  return type === 'CallExpression' && callee.name === 'require' && arguments.length > 0
}
