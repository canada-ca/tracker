const { GraphQLObjectType } = require('graphql')

const subscriptions = new GraphQLObjectType({
  name: 'Subscription',
  fields: () => ({}),
})

module.exports = {
  subscriptions,
}
