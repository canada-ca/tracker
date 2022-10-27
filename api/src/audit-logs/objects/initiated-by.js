import { GraphQLObjectType, GraphQLString } from 'graphql'
import { globalIdField } from 'graphql-relay'
import { GraphQLEmailAddress } from 'graphql-scalars'
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
