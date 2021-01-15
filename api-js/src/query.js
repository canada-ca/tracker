import { GraphQLObjectType } from 'graphql'

import { nodeField, nodesField } from './node'
import * as domainQueries from './domain/queries'
import * as organizationQueries from './organization/queries'
import * as summaryQueries from './summaries/queries'
import * as userQueries from './user/queries'
import * as verifiedDomainQueries from './verified-domains/queries'
import * as verifiedOrgQueries from './verified-organizations/queries'

export const createQuerySchema = () => {
  return new GraphQLObjectType({
    name: 'Query',
    fields: () => ({
      node: nodeField,
      nodes: nodesField,
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
    }),
  })
}
