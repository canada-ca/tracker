const { GraphQLObjectType, GraphQLString, GraphQLList } = require('graphql')
const { globalIdField } = require('graphql-relay')
const { nodeInterface } = require('../../../node')
const { Url, DateTime } = require('../../../../scalars')

const httpsType = new GraphQLObjectType({
  name: 'HTTPS',
  fields: () => ({
    id: globalIdField('https'),
    domain: {
      type: Url,
      description: 'The domain the scan was ran on.',
    },
    timestamp: {
      type: DateTime,
      description: 'The time the scan was initiated.',
    },
    implementation: {
      type: GraphQLString,
      description:
        'State of the HTTPS implementation on the server and any issues therein.',
    },
    enforced: {
      type: GraphQLString,
      description:
        'Degree to which HTTPS is enforced on the server based on behaviour.',
    },
    hsts: {
      type: GraphQLString,
      description: 'Presence and completeness of HSTS implementation.',
    },
    hstsAge: {
      type: GraphQLString,
      description:
        'Denotes how long the domain should only be accessed using HTTPS',
    },
    preloaded: {
      type: GraphQLString,
      description:
        'Denotes whether the domain has been submitted and included within HSTS preload list.',
    },
    httpsGuidanceTags: {
      type: new GraphQLList(GraphQLString),
      description: 'Key tags found during scan.',
    },
  }),
  interfaces: [nodeInterface],
  description: 'Hyper Text Transfer Protocol Secure scan results.',
})

module.exports = {
  httpsType,
}
