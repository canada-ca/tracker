import { GraphQLObjectType, GraphQLString } from 'graphql'
import { globalIdField } from 'graphql-relay'
import { nodeInterface } from '../../node'
import { initiatedByType } from './initiated-by'
import { targetResourceType } from './target-resource'

export const auditLogType = new GraphQLObjectType({
  name: 'AuditLog',
  description: '',
  fields: () => ({
    id: globalIdField('auditLog'),
    timestamp: {
      type: GraphQLString,
      description: 'Domain that scans will be ran on.',
      resolve: ({ timestamp }) => timestamp,
    },
    initiatedBy: {
      type: initiatedByType,
      description: 'Domain that scans will be ran on.',
      resolve: ({ initiatedBy }) => initiatedBy,
    },
    action: {
      type: GraphQLString,
      description: 'Domain that scans will be ran on.',
      resolve: ({ action }) => action,
    },
    target: {
      type: targetResourceType,
      description: 'Domain that scans will be ran on.',
      resolve: ({ target }) => target,
    },
    reason: {
      type: GraphQLString,
      description: 'Domain that scans will be ran on.',
      resolve: ({ reason }) => reason,
    },
  }),
  interfaces: [nodeInterface],
})
