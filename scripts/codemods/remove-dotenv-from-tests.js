// This is the pattern we are matching:
// const dotenv = require('dotenv-safe')
// dotenv.config()
function removeRequireDotEnv(root, j) {
  const dotenvVariables = root
    .findVariableDeclarators()
    .filter(j.filters.VariableDeclarator.requiresModule('dotenv-safe'))

  if (dotenvVariables.size() > 0) {
    const dotenvVariableName = dotenvVariables.nodes()[0].id.name
    root
      .find(j.CallExpression, {
        callee: {
          object: {
            name: dotenvVariableName,
          },
          property: {
            name: 'config',
          },
        },
      })
      .remove()
  }

  dotenvVariables.remove()
}

// This is the pattern we are matching:
// require('dotenv-safe').config({
//   allowEmptyValues: true,
// })
function removeRequireDotConfigCall(root, j) {
  root
    .find(j.CallExpression, {
      callee: {
        property: {
          name: 'config',
        },
        // verify that we call config on the result of require()
        object: {
          callee: {
            name: 'require',
          },
          // but only when the argument to require is dotenv-safe
          arguments: [
            {
              value: 'dotenv-safe',
            },
          ],
        },
      },
    })
    .remove()
}

module.exports = function (fileInfo, api, _options) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  removeRequireDotConfigCall(root, j)
  removeRequireDotEnv(root, j)
  // match a function call
  return root.toSource()
}
