const j = require('jscodeshift')
const path = require('path')

export default (file, _api, { schemaPath }) => {
  const cwd = path.parse(path.resolve(file.path)).dir

  const pathToSchema = path.relative(path.join(cwd), path.join(schemaPath))
  const schemaImport = j.importDeclaration(
    [j.importDefaultSpecifier(j.identifier('dbschema'))],
    j.literal(pathToSchema),
  )

  const ast = j(file.source)

  const imports = ast.find(j.ImportDeclaration)

  function appendToImports(thing) {
    if (imports.length) {
      return j(imports.at(imports.length - 1).get()).insertAfter(thing)
    }
  }

  const functions = ast.find(j.CallExpression, {
    callee: { type: 'Identifier', name: 'ensure' },
  })

  // ensure function found
  if (functions.length) {
    // is there an import for schema already?
    const si = ast.find(j.ImportDefaultSpecifier, {
      type: 'ImportDefaultSpecifier',
      local: { type: 'Identifier', name: 'dbschema' },
    })
    console.log({ length: si.size(), si: si.nodes() })
    if (si.size() == 0) {
      appendToImports(schemaImport)
    }

    // delete the old databaseOptions import
    ast
      .find(j.ImportDeclaration, {
        type: 'ImportDeclaration',
        specifiers: [
          {
            type: 'ImportSpecifier',
            local: { type: 'Identifier', name: 'databaseOptions' },
          },
        ],
      })
      .remove()

    // replace the old args with the new args
    functions.replaceWith((nodePath) => {
      const { node } = nodePath

      const argsObject = object({
        properties: [
          property({
            key: 'variables',
            value: object({
              properties: [
                property({
                  key: 'dbname',
                  value: functionCall({
                    name: 'dbNameFromFile',
                    args: [variable('__filename')],
                  }),
                }),
                property({ key: 'username', value: string('root') }),
                property({ key: 'rootPassword', value: variable('rootPass') }),
                property({ key: 'password', value: variable('rootPass') }),
                shorthandProperty('url'),
              ],
            }),
          }),
          property({ key: 'schema', value: variable('dbschema') }),
        ],
      })
      node.arguments = [argsObject]
      return node
    })

    return ast.toSource({
      trailingComma: true,
      arrowParensAlways: true,
      quote: 'single',
    })
  }
}

function property({ key = 'username', value = 'root' }) {
  if (typeof value == 'string') {
    return j.objectProperty(j.identifier(key), j.literal(value))
  } else {
    return j.objectProperty(j.identifier(key), value)
  }
}

function functionCall({ name, args }) {
  return j.callExpression(j.identifier(name), args)
}

function shorthandProperty(name) {
  const prop = j.objectProperty(j.identifier(name), j.identifier(name))
  prop.shorthand = true
  return prop
}

function string(str) {
  return j.literal(str)
}

function variable(name) {
  return j.identifier(name)
}

function object({ properties }) {
  return j.objectExpression(properties)
}
