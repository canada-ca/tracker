import { GraphQLNonNull, GraphQLString } from 'graphql'
import { sslSubType } from '../objects'

const { SSL_SCAN_CHANNEL } = process.env

export const sslScanData = {
  type: sslSubType,
  description:
    'This subscription allows the user to receive ssl data directly from the scanners in real time.',
  args: {
    subscriptionId: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'Subscription ID retrieved from the requestScan mutation.',
    },
  },
  resolve: ({ scan }) => scan,
  subscribe: async (_context, { subscriptionId }, { pubsub }) =>
    pubsub.asyncIterator(`${SSL_SCAN_CHANNEL}/${subscriptionId}`),
}
