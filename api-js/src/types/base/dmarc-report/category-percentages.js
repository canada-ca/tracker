const { GraphQLObjectType, GraphQLInt, GraphQLFloat } = require('graphql')

const categoryPercentagesType = new GraphQLObjectType({
  name: 'CategoryPercentages',
  description: 'This object displays the percentages of the category totals.',
  fields: () => ({
    failPercentage: {
      type: GraphQLFloat,
      description: 'Percentage of messages that are failing all checks.',
      resolve: async ({ fail, fullPass, passDkimOnly, passSpfOnly }) => {
        const total = [fail, fullPass, passDkimOnly, passSpfOnly].reduce(
          (a, b) => a + b,
          0,
        )

        if (fail === 0) return 0

        const percentage = (fail / total) * 100
        return percentage.toFixed(2)
      },
    },
    fullPassPercentage: {
      type: GraphQLFloat,
      description: 'Percentage of messages that are passing all checks.',
      resolve: async ({ fail, fullPass, passDkimOnly, passSpfOnly }) => {
        const total = [fail, fullPass, passDkimOnly, passSpfOnly].reduce(
          (a, b) => a + b,
          0,
        )

        if (fullPass === 0) return 0

        const percentage = (fullPass / total) * 100
        return percentage.toFixed(2)
      },
    },
    passDkimOnlyPercentage: {
      type: GraphQLFloat,
      description: 'Percentage of messages that are passing only dkim.',
      resolve: async ({ fail, fullPass, passDkimOnly, passSpfOnly }) => {
        const total = [fail, fullPass, passDkimOnly, passSpfOnly].reduce(
          (a, b) => a + b,
          0,
        )

        if (passDkimOnly === 0) return 0

        const percentage = (passDkimOnly / total) * 100
        return percentage.toFixed(2)
      },
    },
    passSpfOnlyPercentage: {
      type: GraphQLFloat,
      description: 'Percentage of messages that are passing only spf.',
      resolve: async ({ fail, fullPass, passDkimOnly, passSpfOnly }) => {
        const total = [fail, fullPass, passDkimOnly, passSpfOnly].reduce(
          (a, b) => a + b,
          0,
        )

        if (passSpfOnly === 0) return 0

        const percentage = (passSpfOnly / total) * 100
        return percentage.toFixed(2)
      },
    },
    totalMessages: {
      type: GraphQLInt,
      description: 'The total amount of messages sent by this domain.',
      resolve: async ({ fail, fullPass, passDkimOnly, passSpfOnly }) => {
        const total = [fail, fullPass, passDkimOnly, passSpfOnly].reduce(
          (a, b) => a + b,
          0,
        )
        return total
      },
    },
  }),
})

module.exports = {
  categoryPercentagesType,
}
