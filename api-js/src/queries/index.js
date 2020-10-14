const { GraphQLObjectType } = require('graphql')
const { nodeField } = require('../types')
// const { i18n: internationalization } = require('lingui-i18n')
const domainQueries = require('./domains')
const organizationQueries = require('./organizations')
const summaryQueries = require('./summaries')

// const createQuerySchema = i18n => {
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
    }),
  })
}

module.exports = {
  createQuerySchema,
}
