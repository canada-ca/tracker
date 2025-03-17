import { GraphQLUnionType } from 'graphql'
import { tagErrorType, tagType } from '../objects'

export const updateTagUnion = new GraphQLUnionType({
  name: 'UpdateTagUnion',
  description: `This union is used with the \`UpdateTag\` mutation,
allowing for users to update a tag and add it to their org,
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
