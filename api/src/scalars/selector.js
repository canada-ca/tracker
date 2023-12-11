import { Kind, GraphQLError, GraphQLScalarType } from 'graphql'

const validateSelector = (value) => {
  if (typeof value !== typeof 'string') {
    throw new TypeError(`Value is not a string: ${typeof value}`)
  }

  return value
}

export const Selectors = new GraphQLScalarType({
  name: 'Selector',
  description: 'A field that conforms to a DKIM selector',
  serialize: validateSelector,
  parseValue: validateSelector,

  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError(`Can only validate strings as selectors but got a: ${ast.kind}`)
    }
    return validateSelector(ast.value)
  },
})

const validateSelectorInput = (value) => {
  const SLUG_REGEX = /^(?:[a-zA-Z0-9](\.?[a-zA-Z0-9])*|\*)$/
  if (typeof value !== typeof 'string') {
    throw new TypeError(`Value is not a string: ${typeof value}`)
  }
  if (!SLUG_REGEX.test(value)) {
    throw new TypeError(`Value is not a valid selector: ${value}`)
  }

  return value
}

export const SelectorsInput = new GraphQLScalarType({
  name: 'SelectorInput',
  description:
    'A field that conforms to a DKIM selector for input. Must be either a single asterisk or a string where only alphanumeric characters and periods are allowed, string must also start and end with alphanumeric characters',
  serialize: validateSelectorInput,
  parseValue: validateSelectorInput,

  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError(`Can only validate strings as selectors but got a: ${ast.kind}`)
    }
    return validateSelectorInput(ast.value)
  },
})
