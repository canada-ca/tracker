import {GraphQLInt, GraphQLObjectType, GraphQLString} from 'graphql'

export const closeAccountError = new GraphQLObjectType({
  name: 'CloseAccountError',
  description:
    'This object is used to inform the user if any errors occurred while closing their account.',
  fields: () => ({
    code: {
      type: GraphQLInt,
      description: 'Error code to inform user what the issue is related to.',
      resolve: ({code}) => code,
    },
    description: {
      type: GraphQLString,
      description: 'Description of the issue encountered.',
      resolve: ({description}) => description,
    },
  }),
})
