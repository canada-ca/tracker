const j = require('jscodeshift')

// This script transforms the following code:
// const collectionStrings = []
// for (const property in collections) {
//   collectionStrings.push(property.toString())
//   }
// }
// const trx = await transaction(collectionStrings)
//
// into
//
// const trx = await transaction(collections)

export default (file, _api, { schemaPath }) => {
  const ast = j(file.source)

  // Remove the collectionStrings variable:
  // const collectionStrings = []
  ast
    .find(j.VariableDeclaration, {
      kind: 'const',
      declarations: [
        {
          id: { type: 'Identifier', name: 'collectionStrings' },
        },
      ],
    })
    .remove()

  // Remove the for loop:
  // for (const property in collections) {
  //   collectionStrings.push(property.toString())
  // }
  ast
    .find(j.ForInStatement, {
      type: 'ForInStatement',
      left: {
        type: 'VariableDeclaration',
        kind: 'const',
        declarations: [
          {
            type: 'VariableDeclarator',
            id: { type: 'Identifier', name: 'property' },
          },
        ],
      },
      right: { type: 'Identifier', name: 'collections' },
      body: { type: 'BlockStatement', body: [{ type: 'ExpressionStatement' }] },
    })
    .remove()

  // Change the call to transaction from
  // const trx = await transaction(collectionStrings)
  // to
  // const trx = await transaction(collections)
  const trx = ast
    .find(j.VariableDeclaration, {
      kind: 'const',
      declarations: [
        {
          id: {
            type: 'Identifier',
            name: 'trx',
          },
          init: {
            type: 'AwaitExpression',
            argument: {
              type: 'CallExpression',
              callee: { name: 'transaction' },
            },
          },
        },
      ],
    })
    .replaceWith((path) => {
      const node = path.value
      node.declarations[0].init.argument.arguments[0] = j.identifier(
        'collections',
      )
      return node
    })

  return ast.toSource({
    trailingComma: true,
    arrowParensAlways: true,
    quote: 'single',
  })
}
