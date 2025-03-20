import { GraphQLObjectType, GraphQLString } from 'graphql'
import { userPersonalType } from './user-personal'

export const completeTourResult = new GraphQLObjectType({
  name: 'CompleteTourResult',
  description:
    'This object is used to inform the user if confirming that they have completed the tour was successful or not.',
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
