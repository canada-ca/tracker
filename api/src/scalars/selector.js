import { Kind, GraphQLError, GraphQLScalarType } from 'graphql'

const validate = (value) => {
  const SLUG_REGEX = /\w+/
  if (typeof value !== typeof 'string') {
    throw new TypeError(`Value is not a string: ${typeof value}`)
  }
  if (!SLUG_REGEX.test(value)) {
    throw new TypeError(`Value is not a valid selector: ${value}`)
  }

  return value
}

export const Selectors = new GraphQLScalarType({
  name: 'Selector',
  description:
    'A field that conforms to a string.',
  serialize: validate,
  parseValue: validate,

  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError(
        `Can only validate strings as selectors but got a: ${ast.kind}`,
      )
    }
    return validate(ast.value)
  },
})
