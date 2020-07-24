const { GraphQLObjectType, GraphQLList, GraphQLString } = require('graphql')
const { globalIdField } = require('graphql-relay')
const { DateTime, Url } = require('../../../../scalars')
const { nodeInterface } = require('../../../node')

const sslType = new GraphQLObjectType({
  name: 'SSL',
  fields: () => ({
    id: globalIdField('ssl'),
    domain: {
      type: Url,
      description: 'The domain the scan was ran on.',
    },
    timestamp: {
      type: DateTime,
      description: 'The time when the scan was initiated.',
    },
    sslGuidanceTags: {
      type: GraphQLList(GraphQLString),
      description: 'Key tags found during scan.',
    },
  }),
  interfaces: [nodeInterface],
  description: 'Secure Socket Layer scan results.',
})

module.exports = {
  sslType,
}
