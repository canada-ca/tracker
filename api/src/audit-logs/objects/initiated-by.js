import { GraphQLObjectType, GraphQLString } from 'graphql'
import { globalIdField } from 'graphql-relay'
import { GraphQLEmailAddress, GraphQLIP } from 'graphql-scalars'
import { RoleEnums } from '../../enums'

export const initiatedByType = new GraphQLObjectType({
  name: 'InitiatedBy',
  description: 'Information on the user that initiated the logged action',
  fields: () => ({
    id: globalIdField('user'),
    userName: {
      type: GraphQLEmailAddress,
      description: 'User email address.',
      resolve: ({ userName }) => userName,
    },
    ipAddress: {
      type: GraphQLIP,
      description: 'User IP address.',
      resolve: async ({ ipAddress }, _args, { auth: { checkSuperAdmin, superAdminRequired } }) => {
        const isSuperAdmin = await checkSuperAdmin()
        superAdminRequired({ isSuperAdmin })

        return ipAddress
      },
    },
    role: {
      type: RoleEnums,
      description: 'User permission level.',
      resolve: ({ role }) => role,
    },
    organization: {
      type: GraphQLString,
      description: 'User affiliated organization.',
      resolve: ({ organization }) => organization,
    },
  }),
})
