const {dirname} = require('path')
const {parse} = require('acorn')
const {readFile} = require('pn/fs')
const {simple} = require('acorn-walk')

module.exports = {
  buildModuleTree,
}

async function buildModuleTree (entryPath) {
  const tree = {}
  const addChild = (name, child) => { tree[name] = child }
  const toParse = [[entryPath, addChild]]
  let entry

  while (entry = toParse.pop()) {
    const [entryPath, addChild] = entry
    const ast = parse(await readFile(entryPath))

    findExports(ast).forEach(([name, moduleId]) => {
      const branch = {moduleId}
      addChild(name, branch)

      if (!moduleId.startsWith('.')) return

      const subEntryPath = require.resolve(moduleId, {paths: [dirname(entryPath)]})
      toParse.push([subEntryPath, createAddChild(branch)])
    })
  }

  return tree
}

function createAddChild (branch) {
  return function addChild (name, child) {
    if (!branch.children) branch.children = {}

    branch.children[name] = child
  }
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
