import { dkimSubType } from '../objects'

const { DKIM_SCAN_CHANNEL } = process.env

export const dkimScanData = {
  type: dkimSubType,
  description:
    'This subscription allows the user to receive dkim data directly from the scanners in real time.',
  resolve: (scan) => {
    return scan
  },
  subscribe: async (_context, _args, { pubsubs: { dkimPubSub }, userKey }) =>
    dkimPubSub.asyncIterator(`${DKIM_SCAN_CHANNEL}/${userKey}`),
}
