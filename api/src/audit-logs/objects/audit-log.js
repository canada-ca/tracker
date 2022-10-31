import { GraphQLObjectType, GraphQLString } from 'graphql'
import { globalIdField } from 'graphql-relay'
import { DomainRemovalReasonEnum } from '../../enums'
import { UserActionEnums } from '../../enums/user-action'
import { nodeInterface } from '../../node'
import { initiatedByType } from './initiated-by'
import { targetResourceType } from './target-resource'

export const auditLogType = new GraphQLObjectType({
  name: 'AuditLog',
  description:
    'A record of activity that modified the state of a user, domain, or organization',
  fields: () => ({
    id: globalIdField('auditLog'),
    timestamp: {
      type: GraphQLString,
      description: 'Datetime string the activity occured.',
      resolve: ({ timestamp }) => timestamp,
    },
    initiatedBy: {
      type: initiatedByType,
      description: 'Username of admin that initiated the activity.',
      resolve: ({ initiatedBy }) => initiatedBy,
    },
    action: {
      type: UserActionEnums,
      description: 'Type of activity that was initiated.',
      resolve: ({ action }) => action,
    },
    target: {
      type: targetResourceType,
      description: 'Information on targeted resource.',
      resolve: ({ target }) => target,
    },
    reason: {
      type: DomainRemovalReasonEnum,
      description: 'Optional reason for action, used for domain removal.',
      resolve: ({ reason }) => reason,
    },
  }),
  interfaces: [nodeInterface],
})
