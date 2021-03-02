import { GraphQLObjectType } from 'graphql'
import { authResultType } from './auth-result'

export const regularSignInResult = new GraphQLObjectType({
  name: 'RegularSignInResult',
  description:
    'This object is used when a user signs in and has not validated via email or phone.',
  fields: () => ({
    authResult: {
      type: authResultType,
      description: 'The authenticated users information, and JWT.',
      resolve: ({ authResult }) => authResult,
    },
  }),
})
