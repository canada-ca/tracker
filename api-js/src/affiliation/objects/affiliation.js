import { GraphQLInt, GraphQLObjectType } from 'graphql'
import { connectionDefinitions, globalIdField } from 'graphql-relay'

import { RoleEnums } from '../../enums'
import { organizationType } from '../../organization/objects'
import { userSharedType } from '../../user/objects'
import { nodeInterface } from '../../node'

export const affiliationType = new GraphQLObjectType({
  name: 'Affiliation',
  fields: () => ({
    id: globalIdField('affiliations'),
    permission: {
      type: RoleEnums,
      description: "User's level of access to a given organization.",
      resolve: ({ permission }) => permission,
    },
    user: {
      type: userSharedType,
      description: 'The affiliated users information.',
      resolve: async ({ _to }, _args, { loaders: { userLoaderByKey } }) => {
        const userKey = _to.split('/')[1]
        const user = await userLoaderByKey.load(userKey)
        user.id = user._key
        return user
      },
    },
    organization: {
      type: organizationType,
      description: 'The affiliated organizations information.',
      resolve: async ({ _from }, _args, { loaders: { orgLoaderByKey } }) => {
        const orgKey = _from.split('/')[1]
        const org = await orgLoaderByKey.load(orgKey)
        org.id = org._key
        return org
      },
    },
  }),
  interfaces: [nodeInterface],
  description:
    'User Affiliations containing the permission level for the given organization, the users information, and the organizations information.',
})

export const affiliationConnection = connectionDefinitions({
  name: 'Affiliation',
  nodeType: affiliationType,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description: 'The total amount of affiliations the user has access to.',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
})
