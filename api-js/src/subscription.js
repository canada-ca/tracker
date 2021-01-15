import { GraphQLObjectType } from 'graphql'

import * as emailScanSubscriptions from './email-scan/subscriptions'
import * as webScanSubscriptions from './web-scan/subscriptions'

export const createSubscriptionSchema = () => {
  return new GraphQLObjectType({
    name: 'Subscription',
    fields: () => ({
      ...emailScanSubscriptions,
      ...webScanSubscriptions,
    }),
  })
}
