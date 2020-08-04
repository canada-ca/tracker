const { Kind, GraphQLError, GraphQLScalarType } = require('graphql')

const validate = (value) => {
  const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

  if (typeof value !== 'string') {
    throw new TypeError(`Value is not string: ${typeof value}`)
  }

  if (!SLUG_REGEX.test(value)) {
    throw new TypeError(`Value is not a vaild slug: ${value}`)
  }
  return value
}

module.exports.Slug = new GraphQLScalarType({
  name: 'Slug',
  description:
    'A field whos values contain numbers, letters, dashes, and underscores.',
  serialize: validate,
  parseValue: validate,

  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError(
        `Can only validate strings as slug but got a: ${ast.kind}`,
      )
    }
    return validate(ast.value)
  },
})
