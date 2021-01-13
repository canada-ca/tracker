const { GraphQLObjectType } = require('graphql')
const organizationMutations = require('./organizations')
const scanMutations = require('./scans')
const userMutations = require('./user')
const userAffiliationMutations = require('./user-affiliations')

const createMutationSchema = () => {
  return new GraphQLObjectType({
    name: 'Mutation',
    fields: () => ({
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
