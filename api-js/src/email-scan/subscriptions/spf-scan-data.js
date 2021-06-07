import { spfSubType } from '../objects'

const { SPF_SCAN_CHANNEL } = process.env

export const spfScanData = {
  type: spfSubType,
  description:
    'This subscription allows the user to receive spf data directly from the scanners in real time.',
  resolve: (scan) => {
    return scan
  },
  subscribe: async (_context, _args, { pubsubs: { spfPubSub }, userKey }) =>
    spfPubSub.asyncIterator(`${SPF_SCAN_CHANNEL}/${userKey}`),
}
