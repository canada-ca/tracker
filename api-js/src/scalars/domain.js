const { Kind, GraphQLError, GraphQLScalarType } = require('graphql')
const psl = require('psl')

const validate = (value) => {
  if (typeof value !== typeof 'string') {
    throw new TypeError(`Value is not a string: ${typeof value}`)
  }
  if (!psl.isValid(value)) {
    throw new TypeError(`Value is not a valid domain: ${value}`)
  }

  return value
}

module.exports.Domain = new GraphQLScalarType({
  name: 'DomainScalar',
  description: 'String that conforms to a domain structure.',
  serialize: validate,
  parseValue: validate,

  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError(
        `Can only validate strings as domains but got a: ${ast.kind}`,
      )
    }
    return validate(ast.value)
  },
})
