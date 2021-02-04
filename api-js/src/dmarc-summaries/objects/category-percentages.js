import { GraphQLObjectType, GraphQLInt } from 'graphql'

export const categoryPercentagesType = new GraphQLObjectType({
  name: 'CategoryPercentages',
  description: 'This object displays the percentages of the category totals.',
  fields: () => ({
    failPercentage: {
      type: GraphQLInt,
      description: 'Percentage of messages that are failing all checks.',
      resolve: ({ fail }) => fail,
    },
    fullPassPercentage: {
      type: GraphQLInt,
      description: 'Percentage of messages that are passing all checks.',
      resolve: ({ pass }) => pass,
    },
    passDkimOnlyPercentage: {
      type: GraphQLInt,
      description: 'Percentage of messages that are passing only dkim.',
      resolve: ({ passDkimOnly }) => passDkimOnly,
    },
    passSpfOnlyPercentage: {
      type: GraphQLInt,
      description: 'Percentage of messages that are passing only spf.',
      resolve: ({ passSpfOnly }) => passSpfOnly,
    },
    totalMessages: {
      type: GraphQLInt,
      description: 'The total amount of messages sent by this domain.',
      resolve: ({ totalMessages }) => totalMessages,
    },
  }),
})
