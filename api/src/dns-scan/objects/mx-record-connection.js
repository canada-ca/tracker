import { GraphQLInt } from 'graphql'
import { connectionDefinitions } from 'graphql-relay'

import { mxRecordDiffType } from './mx-record'

export const mxRecordConnection = connectionDefinitions({
  name: 'MXRecordDiff',
  nodeType: mxRecordDiffType,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description: 'The total amount of DNS scans related to a given domain.',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
})
