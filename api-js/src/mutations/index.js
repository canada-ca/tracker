const {} = require('graphql')

const { createDomain, removeDomain, updateDomain } = require('./domain')
const {
  createOrganization,
  removeOrganization,
  updateOrganization,
} = require('./organizations')
const { requestScan } = require('./scans')

const mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: () => ({
    createDomain,
    removeDomain,
    updateDomain,
    createOrganization,
    removeOrganization,
    updateOrganization,
    requestScan,
  }),
})

module.exports = {
  mutation,
}
