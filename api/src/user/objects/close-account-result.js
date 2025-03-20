import { GraphQLObjectType, GraphQLString } from 'graphql'
import { userSharedType } from './user-shared'

export const closeAccountResult = new GraphQLObjectType({
  name: 'CloseAccountResult',
  description: 'This object is used to inform the user of the status of closing their account.',
  fields: () => ({
    status: {
      type: GraphQLString,
      description: 'Status of closing the users account.',
      resolve: ({ status }) => status,
    },
    user: {
      type: userSharedType,
      description: 'Information of the closed user account.',
      resolve: ({ user }) => user,
    },
  }),
})
