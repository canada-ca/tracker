const {} = require('graphql')
const { query } = require('./queries')
const { mutation } = require('./mutations')
const { subscription } = require('./subscriptions')

const schema = new GraphQLSchema({
  query,
  mutation,
  subscription,
})

module.exports = {
  schema,
}
