import {Kind, GraphQLError, GraphQLScalarType} from 'graphql'

const validate = (value) => {
  const ACRONYM_REGEX = /^[A-Za-z0-9_-]{1,50}$/

  if (typeof value !== 'string') {
    throw new TypeError(`Value is not string: ${typeof value}`)
  }

  if (!ACRONYM_REGEX.test(value)) {
    throw new TypeError(`Value is not a valid acronym: ${value}`)
  }
  return value
}

export const Acronym = new GraphQLScalarType({
  name: 'Acronym',
  description:
    'A field whose value consists of upper case or lower case letters or underscores with a length between 1 and 50.',
  serialize: validate,
  parseValue: validate,

  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError(
        `Can only validate strings as acronyms but got a: ${ast.kind}`,
      )
    }
    return validate(ast.value)
  },
})
