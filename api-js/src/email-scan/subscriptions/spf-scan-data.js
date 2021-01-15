import { GraphQLNonNull, GraphQLString } from 'graphql'
import { spfSubType } from '../objects'

const { SPF_SCAN_CHANNEL } = process.env

export const spfScanData = {
  type: spfSubType,
  description:
    'This subscription allows the user to receive spf data directly from the scanners in real time.',
  args: {
    subscriptionId: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'Subscription ID retrieved from the requestScan mutation.',
    },
  },
  resolve: ({ scan }) => scan,
  subscribe: async (_context, { subscriptionId }, { pubsub }) =>
    pubsub.asyncIterator(`${SPF_SCAN_CHANNEL}/${subscriptionId}`),
}
