import { GraphQLInt, GraphQLObjectType, GraphQLString } from 'graphql'

export const resetPasswordError = new GraphQLObjectType({
  name: 'ResetPasswordError',
  description: '',
  fields: () => ({
    code: {
      type: GraphQLInt,
      description: '',
      resolve: ({ code }) => code,
    },
    description: {
      type: GraphQLString,
      description: '',
      resolve: ({ description }) => description,
    },
  }),
})
