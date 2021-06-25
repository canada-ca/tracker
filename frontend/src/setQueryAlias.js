import { visit } from 'graphql'

export function setQueryAlias({ query: ast, alias = 'pagination' }) {
  const visitor = {
    leave: (node) => {
      if (node.kind === 'OperationDefinition') {
        const [field] = node.selectionSet.selections
        field.alias = { kind: 'Name', value: alias }
      }
      return node
    },
  }

  const newAst = visit(ast, visitor)

  return { query: newAst, alias }
}

