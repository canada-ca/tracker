const { DMARC_SCAN_CHANNEL } = process.env

const { GraphQLNonNull, GraphQLString } = require('graphql')
const { dmarcSubType } = require('../types')

const dmarcScanData = {
  type: dmarcSubType,
  description:
    'This subscription allows the user to receive dmarc data directly from the scanners in real time.',
  args: {
    subscriptionId: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'Subscription ID retrieved from the requestScan mutation.',
    },
  },
  resolve: ({ scan }) => scan,
  subscribe: async (_context, { subscriptionId }, { pubsub }) =>
    pubsub.asyncIterator(`${DMARC_SCAN_CHANNEL}/${subscriptionId}`),
}

module.exports = {
  dmarcScanData,
}
