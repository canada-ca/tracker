import { GraphQLScalarType, Kind } from 'graphql'
import { filterEnum } from '../enums/system-filter-value'

// Convert enum name → value into a plain JS object
const enumValueMap = filterEnum.getValues().reduce((acc, { name, value }) => {
  acc[name] = value
  return acc
}, {})

export const FilterValueScalar = new GraphQLScalarType({
  name: 'FilterValue',
  description: 'Filter value: either a system-defined enum name or a user-defined tag string.',
  serialize(value) {
    return value
  },
  parseValue(value) {
    if (typeof value !== 'string') {
      throw new TypeError(`FilterValue must be a string, got ${typeof value}`)
    }

    if (Object.prototype.hasOwnProperty.call(enumValueMap, value)) {
      return enumValueMap[value]
    }

    return value
  },
  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new TypeError(`FilterValue must be a string`)
    }

    const input = ast.value
    if (Object.prototype.hasOwnProperty.call(enumValueMap, input)) {
      return enumValueMap[input]
    }

    return input
  },
})
