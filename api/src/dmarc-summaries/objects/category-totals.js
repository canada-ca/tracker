import { GraphQLObjectType, GraphQLInt } from 'graphql'

export const categoryTotalsType = new GraphQLObjectType({
  name: 'CategoryTotals',
  description:
    'This object displays the total amount of messages that fit into each category.',
  fields: () => ({
    passSpfOnly: {
      type: GraphQLInt,
      description: 'Amount of messages that are passing SPF, but failing DKIM.',
      resolve: ({ passSpfOnly }) => passSpfOnly,
    },
    passDkimOnly: {
      type: GraphQLInt,
      description: 'Amount of messages that are passing DKIM, but failing SPF.',
      resolve: ({ passDkimOnly }) => passDkimOnly,
    },
    fullPass: {
      type: GraphQLInt,
      description: 'Amount of messages that are passing SPF and DKIM.',
      resolve: ({ pass }) => pass,
    },
    fail: {
      type: GraphQLInt,
      description: 'Amount of messages that fail both SPF and DKIM.',
      resolve: ({ fail }) => fail,
    },
  }),
})
