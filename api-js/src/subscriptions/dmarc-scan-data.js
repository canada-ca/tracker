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
  resolve: async (payload, _args, { auth: { userRequired } }) => {
    await userRequired()
    return payload
  },
  subscribe: async (_context, _args, { pubsub }) =>
    pubsub.asyncIterator(DMARC_SCAN_CHANNEL),
}

module.exports = {
  dmarcScanData,
}
