import { GraphQLObjectType, GraphQLString } from 'graphql'
import { globalIdField } from 'graphql-relay'
import { GraphQLEmailAddress } from 'graphql-scalars'

import { nodeInterface } from '../../node'

export const userSharedType = new GraphQLObjectType({
  name: 'SharedUser',
  fields: () => ({
    id: globalIdField('user'),
    displayName: {
      type: GraphQLString,
      description: 'Users display name.',
      resolve: ({ displayName }) => displayName,
    },
    userName: {
      type: GraphQLEmailAddress,
      description: 'Users email address.',
      resolve: ({ userName }) => userName,
    },
  }),
  interfaces: [nodeInterface],
  description: `This object is used for showing none personal user details, 
and is used for limiting admins to the personal details of users.`,
})
