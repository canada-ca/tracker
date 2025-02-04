import { GraphQLObjectType, GraphQLString } from 'graphql'
import { userPersonalType } from './user-personal'

export const dismissMessageResult = new GraphQLObjectType({
  name: 'DismissMessageResult',
  description: 'This object is used to inform the user if the message was successfully dismissed.',
  fields: () => ({
    status: {
      type: GraphQLString,
      description: 'Status of the message dismissal.',
      resolve: ({ status }) => status,
    },
    user: {
      type: userPersonalType,
      description: 'The user object that was updated.',
      resolve: ({ user }) => user,
    },
  }),
})
