const {} = require('graphql')

const mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: () => ({}),
})

module.exports = {
  mutation,
}
