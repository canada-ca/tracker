const { Kind, GraphQLError, GraphQLScalarType } = require('graphql')

const validate = (value) => {
  const SLUG_REGEX = /\w+\._domainkey/

  if (!Array.isArray(value)) {
    throw new TypeError(`Value is not list: ${typeof value}`)
  }

  for (var i = 0; i < value.length; i++) {
    if (typeof value[i] !== typeof 'string') {
      throw new TypeError(`Value is not a string: ${value[i]}`)
    }
    if (!SLUG_REGEX.test(value[i])) {
      throw new TypeError(`Value is not a vaild selector: ${value[i]}`)
    }
  }

  return value
}

module.exports.Selectors = new GraphQLScalarType({
  name: 'Selector',
  description:
    'A field that conforms to a list of strings, with strings ending in ._domainkey.',
  serialize: validate,
  parseValue: validate,

  parseLiteral(ast) {
    if (ast.kind !== Kind.LIST) {
      throw new GraphQLError(
        `Can only validate lists as selectors but got a: ${ast.kind}`,
      )
    }
    return validate(ast.value)
  },
})
