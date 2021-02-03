// This is the pattern we are matching:
// console.log("something")
function replaceConsoleDotLogWithLog(root, j) {
  root
    .find(j.CallExpression, {
      callee: {
        type: 'MemberExpression',
        object: { name: 'console' },
        property: { name: 'log' },
      },
    })
    .replaceWith((nodePath) => {
      const { node } = nodePath
      const ast = j.memberExpression(
        j.identifier('logger'),
        j.callExpression(j.identifier('info'), [...node.arguments]),
      )
      return ast
    })
}

function replaceConsoleDotErrorWithError(root, j) {
  root
    .find(j.CallExpression, {
      callee: {
        type: 'MemberExpression',
        object: { name: 'console' },
        property: { name: 'error' },
      },
    })
    .replaceWith((nodePath) => {
      const { node } = nodePath
      const ast = j.memberExpression(
        j.identifier('logger'),
        j.callExpression(j.identifier('error'), [...node.arguments]),
      )
      return ast
    })
}

function replaceConsoleDotInfoWithInfo(root, j) {
  root
    .find(j.CallExpression, {
      callee: {
        type: 'MemberExpression',
        object: { name: 'console' },
        property: { name: 'info' },
      },
    })
    .replaceWith((nodePath) => {
      const { node } = nodePath
      var ast = j.memberExpression(
        j.identifier('logger'),
        j.callExpression(j.identifier('info'), [...node.arguments]),
      )
      return ast
    })
}

function replaceConsoleDotWarnWithWarn(root, j) {
  root
    .find(j.CallExpression, {
      callee: {
        type: 'MemberExpression',
        object: { name: 'console' },
        property: { name: 'warn' },
      },
    })
    .replaceWith((nodePath) => {
      const { node } = nodePath
      var ast = j.memberExpression(
        j.identifier('logger'),
        j.callExpression(j.identifier('warn'), [...node.arguments]),
      )
      return ast
    })
}

module.exports = function (fileInfo, api, _options) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  replaceConsoleDotLogWithLog(root, j)
  replaceConsoleDotErrorWithError(root, j)
  replaceConsoleDotWarnWithWarn(root, j)
  replaceConsoleDotInfoWithInfo(root, j)
  // match a function call
  return root.toSource()
}
