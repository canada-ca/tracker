import { GraphQLObjectType, GraphQLString } from 'graphql'
import { userPersonalType } from './user-personal'

export const authResultType = new GraphQLObjectType({
  name: 'AuthResult',
  description: `An object used to return information when users sign up or authenticate.`,
  fields: () => ({
    authToken: {
      type: GraphQLString,
      description: `JWT used for accessing controlled content.`,
      resolve: ({ token }) => token,
    },
    refreshToken: {
      type: GraphQLString,
      description: `JWT used to refresh authentication token.`,
      resolve: ({ refreshToken }) => refreshToken,
    },
    user: {
      type: userPersonalType,
      description: `User that has just been created or signed in.`,
      resolve: ({ user }) => user,
    },
  }),
})
