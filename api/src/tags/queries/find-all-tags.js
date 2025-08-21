import { GraphQLBoolean, GraphQLList, GraphQLID } from 'graphql'
import { tagType } from '../objects'
import { fromGlobalId } from 'graphql-relay'

export const findAllTags = {
  type: new GraphQLList(tagType),
  description: 'All dynamically generated tags users have access to.',
  args: {
    orgId: {
      type: GraphQLID,
      description: 'The organization you wish to query the tags from.',
    },
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
      loaders: { loadAllTags, loadOrgByKey },
      validators: { cleanseInput },
    },
  ) => {
    const user = await userRequired()
    verifiedRequired({ user })

    let orgKey = null
    if (args.orgId) {
      const { type: _orgType, id: orgId } = fromGlobalId(cleanseInput(args.orgId))
      // Get Org from db
      const org = await loadOrgByKey.load(orgId)
      orgKey = org?._key
    } else {
      const isSuperAdmin = await checkSuperAdmin()
      superAdminRequired({ user, isSuperAdmin })
    }

    const tags = await loadAllTags({ ...args, orgId: orgKey })
    console.info(`User: ${userKey} successfully retrieved tags.`)
    return tags
  },
}
