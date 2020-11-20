const { SSL_SCAN_CHANNEL } = process.env

const { GraphQLNonNull, GraphQLString } = require('graphql')
const { sslSubType } = require('../types')

const sslScanData = {
  type: sslSubType,
  description:
    'This subscription allows the user to receive ssl data directly from the scanners in real time.',
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
    pubsub.asyncIterator(SSL_SCAN_CHANNEL),
}

module.exports = {
  sslScanData,
}
