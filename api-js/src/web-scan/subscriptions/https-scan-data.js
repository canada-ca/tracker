import { httpsSubType } from '../objects'

const { HTTPS_SCAN_CHANNEL } = process.env

export const httpsScanData = {
  type: httpsSubType,
  description:
    'This subscription allows the user to receive https data directly from the scanners in real time.',
  resolve: (scan) => {
    return scan
  },
  subscribe: async (_context, _args, { pubsub, userKey }) =>
    pubsub.asyncIterator(`${HTTPS_SCAN_CHANNEL}/${userKey}`),
}
