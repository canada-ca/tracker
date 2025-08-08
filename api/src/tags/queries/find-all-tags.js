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
  resolve: async (
    _,
    args,
    {
      userKey,
      auth: { userRequired, verifiedRequired, checkSuperAdmin, superAdminRequired },
      loaders: { loadAllTags },
    },
  ) => {
    const user = await userRequired()
    verifiedRequired({ user })

    const isSuperAdmin = await checkSuperAdmin()
    superAdminRequired({ user, isSuperAdmin })

    const tags = await loadAllTags({ ...args })
    console.info(`User: ${userKey} successfully retrieved tags.`)
    return tags
  },
}
