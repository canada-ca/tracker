import { GraphQLBoolean, GraphQLList } from 'graphql'
import { tagType } from '../objects'

export const findAllTags = {
  type: new GraphQLList(tagType),
  description: 'All dynamically generated tags users have access to.',
  args: {
    isVisible: {
      type: GraphQLBoolean,
      description: 'Indicates whether the tag is visible to users.',
    },
  },
  resolve: async (_, args, { userKey, loaders: { loadAllTags } }) => {
    const tags = await loadAllTags({ ...args })
    console.info(`User: ${userKey} successfully retrieved tags.`)
    return tags
  },
}
