import { GraphQLScalarType, Kind, GraphQLError } from 'graphql'

const validate = (value) => {
  const YEAR_REGEX = /^\d{4}$/

  if (typeof value !== 'string') {
    throw new TypeError(`Value is not string: ${typeof value}`)
  }

  if (!YEAR_REGEX.test(value)) {
    throw new TypeError(`Value is not a valid year: ${value}`)
  }
  return value
}

export const Year = new GraphQLScalarType({
  name: 'Year',
  description: 'A field that conforms to a 4 digit integer.',
  serialize: validate,
  parseValue: validate,

  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError(
        `Can only validate strings as year but got a: ${ast.kind}`,
      )
    }
    return validate(ast.value)
  },
})
