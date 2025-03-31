import { GraphQLUnionType } from 'graphql'
import { tagErrorType, tagType } from '../objects'

export const createTagUnion = new GraphQLUnionType({
  name: 'CreateTagUnion',
  description: `This union is used with the \`CreateTag\` mutation,
allowing for users to create a tag and add it to their org,
and support any errors that may occur`,
  types: [tagErrorType, tagType],
  resolveType({ _type }) {
    if (_type === 'tag') {
      return tagType.name
    } else {
      return tagErrorType.name
    }
  },
})
