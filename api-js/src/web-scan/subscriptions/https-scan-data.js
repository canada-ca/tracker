import { httpsSubType } from '../objects'

const { HTTPS_SCAN_CHANNEL } = process.env

export const httpsScanData = {
  type: httpsSubType,
  description:
    'This subscription allows the user to receive https data directly from the scanners in real time.',
  resolve: ({ sharedId, domainKey, results, status }) => ({
    sharedId,
    domainKey,
    status,
    ...results,
  }),
  subscribe: async (_context, _args, { pubsubs: { httpsPubSub }, userKey }) =>
    httpsPubSub.asyncIterator(`${HTTPS_SCAN_CHANNEL}/${userKey}`),
}
