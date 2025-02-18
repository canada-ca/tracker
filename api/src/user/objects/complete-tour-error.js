import { GraphQLInt, GraphQLObjectType, GraphQLString } from 'graphql'

export const completeTourError = new GraphQLObjectType({
  name: 'CompleteTourError',
  description:
    'This object is used to inform the user if confirming that they have completed the tour was unsuccessful.',
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
