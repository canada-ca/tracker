import { findMyDomains, findDomainByDomain } from '../domain'
const { GraphQLObjectType } = require('graphql')
const userQueries = require('./user')
const organizationQueries = require('./organizations')
const summaryQueries = require('./summaries')
const verifiedDomainQueries = require('./verified-domains')
const verifiedOrganizationsQueries = require('./verified-organizations')
const { nodeField, nodesField } = require('../types')

const createQuerySchema = () => {
  return new GraphQLObjectType({
    name: 'Query',
    fields: () => ({
      node: nodeField,
      nodes: nodesField,
      // Domain Queries
      findMyDomains,
      findDomainByDomain,
      // Organization Queries
      ...organizationQueries,
      // Summary Queries
      ...summaryQueries,
      // User Queries
      ...userQueries,
      // Verified Domain Queries
      ...verifiedDomainQueries,
      // Verified Organization Queries
      ...verifiedOrganizationsQueries,
    }),
  })
}

module.exports = {
  createQuerySchema,
}
