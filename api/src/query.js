import { GraphQLObjectType } from 'graphql'

import { nodeField, nodesField } from './node'
import * as dmarcSummariesQueries from './dmarc-summaries/queries'
import * as domainQueries from './domain/queries'
import * as organizationQueries from './organization/queries'
import * as summaryQueries from './summaries/queries'
import * as userQueries from './user/queries'
import * as verifiedDomainQueries from './verified-domains/queries'
import * as verifiedOrgQueries from './verified-organizations/queries'
import * as auditLogQueries from './audit-logs/queries'
import * as additionalFindingsQueries from './additional-findings/queries'

export const createQuerySchema = () => {
  return new GraphQLObjectType({
    name: 'Query',
    fields: () => ({
      node: nodeField,
      nodes: nodesField,
      // Audit Log Queries
      ...auditLogQueries,
      // Dmarc Summary Queries
      ...dmarcSummariesQueries,
      // Domain Queries
      ...domainQueries,
      // Organization Queries
      ...organizationQueries,
      // Summary Queries
      ...summaryQueries,
      // User Queries
      ...userQueries,
      // Verified Domain Queries
      ...verifiedDomainQueries,
      // Verified Organization Queries
      ...verifiedOrgQueries,
      ...additionalFindingsQueries,
    }),
  })
}
