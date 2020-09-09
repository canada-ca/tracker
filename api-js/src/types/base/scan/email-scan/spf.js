const {
  GraphQLObjectType,
  GraphQLInt,
  GraphQLString,
  GraphQLList,
} = require('graphql')
const { globalIdField } = require('graphql-relay')
const { GraphQLDateTime, GraphQLURL } = require('graphql-scalars')
const { nodeInterface } = require('../../../node')

const spfType = new GraphQLObjectType({
  name: 'SPF',
  fields: () => ({
    id: globalIdField('spf'),
    domain: {
      type: GraphQLURL,
      description: `The domain the scan was ran on.`,
      resolve: async () => {},
    },
    timestamp: {
      type: GraphQLDateTime,
      description: `The time the scan was initiated.`,
      resolve: async () => {},
    },
    lookups: {
      type: GraphQLInt,
      description: `The amount of DNS lookups.`,
      resolve: async () => {},
    },
    record: {
      type: GraphQLString,
      description: `SPF record retrieved during the scan of the given domain.`,
      resolve: async () => {},
    },
    spfDefault: {
      type: GraphQLString,
      description: `Instruction of what a recipient should do if there is not a match to your SPF record.`,
      resolve: async () => {},
    },
    spfGuidanceTags: {
      type: GraphQLList(GraphQLString),
      description: `Key tags found during scan.`,
      resolve: async () => {},
    },
  }),
  interfaces: [nodeInterface],
  description: `Email on the Internet can be forged in a number of ways.  In
  particular, existing protocols place no restriction on what a sending
  host can use as the "MAIL FROM" of a message or the domain given on
  the SMTP HELO/EHLO commands.  Version 1 of the Sender Policy Framework (SPF)
  protocol is where ADministrative Management Domains (ADMDs) can explicitly
  authorize the hosts that are allowed to use their domain names, and a
  receiving host can check such authorization.`,
})

module.exports = {
  spfType,
}
