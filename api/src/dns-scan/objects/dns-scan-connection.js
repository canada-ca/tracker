import {GraphQLInt} from 'graphql'
import {connectionDefinitions} from 'graphql-relay'

import {dnsScanType} from './dns-scan'

export const dnsScanConnection = connectionDefinitions({
  name: 'DNSScan',
  nodeType: dnsScanType,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description: 'The total amount of DNS scans related to a given domain.',
      resolve: ({totalCount}) => totalCount,
    },
  }),
})
