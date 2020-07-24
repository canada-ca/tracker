const {} = require('graphql')

const { createDomain, removeDomain, updateDomain } = require('./domain')

const mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: () => ({
    createDomain,
    removeDomain,
    updateDomain,
  }),
})

module.exports = {
  mutation,
}
