const { GraphQLObjectType } = require('graphql')
const { nodeField } = require('../types')
const domainQueries = require('./domains')
const userQueries = require('./user')
const organizationQueries = require('./organizations')
const summaryQueries = require('./summaries')
const verifiedDomainQueries = require('./verified-domains')
const verifiedOrganizationsQueries = require('./verified-organizations')

const createQuerySchema = () => {
  return new GraphQLObjectType({
    name: 'Query',
    fields: () => ({
      // Node Query
      node: nodeField,
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
      ...verifiedOrganizationsQueries,
    }),
  })
}

module.exports = {
  createQuerySchema,
}
