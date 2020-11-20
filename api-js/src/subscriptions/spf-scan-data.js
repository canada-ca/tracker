const { SPF_SCAN_CHANNEL } = process.env

const { GraphQLNonNull, GraphQLString } = require('graphql')
const { spfSubType } = require('../types')

const spfScanData = {
  type: spfSubType,
  description:
    'This subscription allows the user to receive spf data directly from the scanners in real time.',
  args: {
    subscriptionId: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'Subscription ID retrieved from the requestScan mutation.',
    },
  },
  resolve: async (payload) => {
    return payload
  },
  subscribe: async (_context, _args, { pubsub }) =>
    pubsub.asyncIterator(SPF_SCAN_CHANNEL),
}

module.exports = {
  spfScanData,
}
