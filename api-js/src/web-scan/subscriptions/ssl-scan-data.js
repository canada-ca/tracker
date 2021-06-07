import { sslSubType } from '../objects'

const { SSL_SCAN_CHANNEL } = process.env

export const sslScanData = {
  type: sslSubType,
  description:
    'This subscription allows the user to receive ssl data directly from the scanners in real time.',
  resolve: (scan) => {
    return scan
  },
  subscribe: async (_context, _args, { pubsub, userKey }) =>
    pubsub.asyncIterator(`${SSL_SCAN_CHANNEL}/${userKey}`),
}
