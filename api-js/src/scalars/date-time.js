const { Kind, GraphQLError, GraphQLScalarType } = require('graphql')

module.exports.DateTime = new GraphQLScalarType({
  name: 'DateTime',
  description: 'Use JavaScript Date object for date/time fields.',

  serialize(value) {
    let v = value

    if (
      !(v instanceof Date) &&
      typeof v !== 'string' &&
      typeof v !== 'number'
    ) {
      throw new TypeError(
        `Value is not an instance of Date, Date string or number: ${JSON.stringify(
          v,
        )}`,
      )
    }

    if (typeof v === 'string') {
      v = new Date()
      v.setTime(Date.parse(value))
    } else if (typeof v === 'number') {
      v = new Date(v)
    }

    if (Number.isNaN(v.getTime())) {
      throw new TypeError(`Value is not a vaild Date: ${JSON.stringify(v)}`)
    }

    return v.toJSON()
  },

  parseValue(value) {
    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      throw new TypeError(`Value is not a vaild Date: ${value}`)
    }

    return date
  },

  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING && ast.kind !== Kind.INT) {
      throw new GraphQLError(
        `Can only parse strings & integers to dates but got a: ${ast.kind}`,
      )
    }

    const result = new Date(
      ast.kind === Kind.INT ? Number(ast.value) : ast.value,
    )

    if (Number.isNaN(result.getTime())) {
      throw new GraphQLError(`Value is not a vaild Date: ${ast.value}`)
    }

    return result
  },
})
