import { dmarcSubType } from '../objects'

const { DMARC_SCAN_CHANNEL } = process.env

export const dmarcScanData = {
  type: dmarcSubType,
  description:
    'This subscription allows the user to receive dmarc data directly from the scanners in real time.',
  resolve: (scan) => {
    return scan
  },
  subscribe: async (_context, _args, { pubsubs: { dmarcPubSub }, userKey }) =>
    dmarcPubSub.asyncIterator(`${DMARC_SCAN_CHANNEL}/${userKey}`),
}
