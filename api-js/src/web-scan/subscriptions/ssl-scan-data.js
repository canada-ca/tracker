import { sslSubType } from '../objects'

const { SSL_SCAN_CHANNEL } = process.env

export const sslScanData = {
  type: sslSubType,
  description:
    'This subscription allows the user to receive ssl data directly from the scanners in real time.',
  resolve: ({ domainKey, results }) => ({ domainKey, ...results }),
  subscribe: async (_context, _args, { pubsubs: { sslPubSub }, userKey }) =>
    sslPubSub.asyncIterator(`${SSL_SCAN_CHANNEL}/${userKey}`),
}
