import { GraphQLBoolean, GraphQLList, GraphQLObjectType, GraphQLString } from 'graphql'
import { TagOwnershipEnums } from '../../enums/tag-ownership'
import { organizationType } from '../../organization/objects'

export const tagType = new GraphQLObjectType({
  name: 'Tag',
  fields: () => ({
    tagId: {
      type: GraphQLString,
      description: 'A unique identifier for the tag.',
      resolve: ({ tagId }) => tagId,
    },
    label: {
      type: GraphQLString,
      description: 'The display name or label of the tag.',
      resolve: ({ label }) => label,
    },
    description: {
      type: GraphQLString,
      description: 'A brief description of the tag.',
      resolve: ({ description }) => description,
    },
    isVisible: {
      type: GraphQLBoolean,
      description: 'Indicates whether the tag is visible to users.',
      resolve: ({ visible }) => visible,
    },
    ownership: {
      type: TagOwnershipEnums,
      description: '',
      resolve: ({ ownership }) => ownership,
    },
    organizations: {
      type: new GraphQLList(organizationType),
      description: '',
      resolve: async (
        { tagId, organizations, ownership },
        _,
        {
          userKey,
          auth: { userRequired, verifiedRequired, checkSuperAdmin, superAdminRequired },
          loaders: { loadOrgByKey },
        },
      ) => {
        const user = await userRequired()
        verifiedRequired({ user })

        const isSuperAdmin = await checkSuperAdmin()
        superAdminRequired({ user, isSuperAdmin })

        if (ownership === 'global') return []

        const orgs = []
        for (const orgId of organizations) {
          const org = await loadOrgByKey.load(orgId)
          if (!org) continue
          orgs.push(org)
        }

        console.info(`User: ${userKey} successfully retrieved affiliated orgs for tag: ${tagId}.`)

        return orgs
      },
    },
  }),
})
