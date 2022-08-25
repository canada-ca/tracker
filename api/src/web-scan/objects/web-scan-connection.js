import { GraphQLInt } from 'graphql'
import { connectionDefinitions } from 'graphql-relay'

import {webScanType} from "./web-scan";

export const webScanConnection = connectionDefinitions({
  name: 'WebScan',
  nodeType: webScanType,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description: 'The total amount of DNS scans related to a given domain.',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
})
