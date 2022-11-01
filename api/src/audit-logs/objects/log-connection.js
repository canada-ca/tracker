import { GraphQLInt } from 'graphql'
import { connectionDefinitions } from 'graphql-relay'

import { auditLogType } from '../objects/audit-log'

export const logConnection = connectionDefinitions({
  name: 'AuditLog',
  nodeType: auditLogType,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description: 'The total amount of logs the user has access to.',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
})
