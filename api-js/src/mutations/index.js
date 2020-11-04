const { GraphQLObjectType } = require('graphql')
const domainMutations = require('./domain')
const organizationMutations = require('./organizations')
const scanMutations = require('./scans')
const userMutations = require('./user')
const userAffiliationMutations = require('./user-affiliations')

const createMutationSchema = (i18n) => {
  return new GraphQLObjectType({
    name: 'Mutation',
    fields: () => ({
      // Domain Mutations
      ...domainMutations,
      // Organization Mutations
      ...organizationMutations,
      // Scan Mutations
      ...scanMutations,
      // User Mutations
      ...userMutations,
      // User Affiliations Mutations
      ...userAffiliationMutations,
    }),
  })
}

module.exports = {
  createMutationSchema,
}
