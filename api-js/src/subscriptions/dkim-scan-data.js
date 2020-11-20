const { DKIM_SCAN_CHANNEL } = process.env

const { GraphQLNonNull, GraphQLString } = require('graphql')
const { dkimSubType } = require('../types')

const dkimScanData = {
  type: dkimSubType,
  description:
    'This subscription allows the user to receive dkim data directly from the scanners in real time.',
  args: {
    subscriptionId: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'Subscription ID retrieved from the requestScan mutation.',
    },
  },
  resolve: (payload) => {
    return payload
  },
  subscribe: async (_context, _args, { pubsub }) =>
    pubsub.asyncIterator(DKIM_SCAN_CHANNEL),
}

module.exports = {
  dkimScanData,
}
