import { GraphQLInt, GraphQLObjectType, GraphQLString } from 'graphql'

export const signInError = new GraphQLObjectType({
  name: 'SignInError',
  description:
    'This object is used when the user has validated either their email or phone.',
  fields: () => ({
    code: {
      type: GraphQLInt,
      description: 'Error code to inform user what the issue is related to.',
      resolve: ({ code }) => code,
    },
    description: {
      type: GraphQLString,
      description: 'Description of the issue that was encountered.',
      resolve: ({ description }) => description,
    },
  }),
})
