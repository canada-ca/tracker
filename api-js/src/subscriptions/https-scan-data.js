const { HTTPS_SCAN_CHANNEL } = process.env

const { GraphQLNonNull, GraphQLString } = require('graphql')
const { httpsSubType } = require('../types')

const httpsScanData = {
  type: httpsSubType,
  description:
    'This subscription allows the user to receive https data directly from the scanners in real time.',
  args: {
    subscriptionId: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'Subscription ID retrieved from the requestScan mutation.',
    },
  },
  resolve: ({ scan }) => scan,
  subscribe: async (_context, { subscriptionId }, { pubsub }) =>
    pubsub.asyncIterator(`${HTTPS_SCAN_CHANNEL}/${subscriptionId}`),
}

module.exports = {
  httpsScanData,
}
