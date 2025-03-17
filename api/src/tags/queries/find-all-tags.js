import { GraphQLBoolean, GraphQLList } from 'graphql'
import { tagType } from '../objects'

export const findAllTags = {
  type: new GraphQLList(tagType),
  description: '',
  args: {
    isVisible: {
      type: GraphQLBoolean,
      description: '',
    },
  },
  resolve: async (_, args, { userKey, loaders: { loadAllTags } }) => {
    const tags = await loadAllTags({ ...args })
    console.info(`User: ${userKey} successfully retrieved tags.`)
    return tags
  },
}
