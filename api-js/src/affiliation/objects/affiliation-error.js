import { GraphQLInt, GraphQLObjectType, GraphQLString } from 'graphql'

export const affiliationError = new GraphQLObjectType({
  name: 'AffiliationError',
  description:
    'This object is used to inform the user if any errors occurred while executing affiliation mutations.',
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
