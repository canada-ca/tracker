const { GraphQLScalarType, Kind, GraphQLError } = require('graphql')

const validate = (value) => {
  const URL_REGEX = /[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/

  if (typeof value !== 'string') {
    throw new TypeError(`Value is not string: ${value}`)
  }

  if (!URL_REGEX.test(value)) {
    throw new TypeError(`Value is not a vaild email address: ${value}`)
  }
  return value
}

module.exports.Url = new GraphQLScalarType({
  name: 'URL',
  description:
    '    A field whose value conforms to the standard URL format as specified in RFC3986:https://www.ietf.org/rfc/rfc3986.txt.',
  serialize: validate,
  parseValue: validate,

  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError(
        `Can only validate strings as email address but got a: ${ast.value}`,
      )
    }
    return validate(ast.value)
  },
})
