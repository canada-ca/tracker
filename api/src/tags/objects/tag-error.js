import { GraphQLInt, GraphQLObjectType, GraphQLString } from 'graphql'

export const tagErrorType = new GraphQLObjectType({
  name: 'TagError',
  description: 'This object is used to inform the user if any errors occurred while using a tag mutation.',
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
