import { GraphQLInt } from 'graphql'
import { connectionDefinitions } from 'graphql-relay'

import { mxRecordType } from './mx-record'

export const mxRecordConnection = connectionDefinitions({
  name: 'DNSScan',
  nodeType: mxRecordType,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description: 'The total amount of DNS scans related to a given domain.',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
})
