import { dmarcSubType } from '../objects'

const { DMARC_SCAN_CHANNEL } = process.env

export const dmarcScanData = {
  type: dmarcSubType,
  description:
    'This subscription allows the user to receive dmarc data directly from the scanners in real time.',
  resolve: (scan) => {
    console.log(typeof scan)
    return scan
  },
  subscribe: async (_context, _args, { pubsub, userKey }) => {
    return pubsub.asyncIterator(`${DMARC_SCAN_CHANNEL}/${userKey}`)
  },
}
