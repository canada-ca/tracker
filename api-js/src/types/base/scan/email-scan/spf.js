const {
  GraphQLObjectType,
  GraphQLInt,
  GraphQLString,
  GraphQLList,
} = require('graphql')
const { globalIdField, connectionDefinitions } = require('graphql-relay')
const { GraphQLDate } = require('graphql-scalars')
const { nodeInterface } = require('../../../node')
const { Domain } = require('../../../../scalars')

const spfType = new GraphQLObjectType({
  name: 'SPF',
  fields: () => ({
    id: globalIdField('spf'),
    domain: {
      type: Domain,
      description: `The domain the scan was ran on.`,
      resolve: async ({ domain }) => domain,
    },
    timestamp: {
      type: GraphQLDate,
      description: `The time the scan was initiated.`,
      resolve: async ({ timestamp }) => timestamp,
    },
    lookups: {
      type: GraphQLInt,
      description: `The amount of DNS lookups.`,
      resolve: async ({ lookups }) => lookups,
    },
    record: {
      type: GraphQLString,
      description: `SPF record retrieved during the scan of the given domain.`,
      resolve: async ({ record }) => record,
    },
    spfDefault: {
      type: GraphQLString,
      description: `Instruction of what a recipient should do if there is not a match to your SPF record.`,
      resolve: async ({ spfDefault }) => spfDefault,
    },
    spfGuidanceTags: {
      type: GraphQLList(GraphQLString),
      description: `Key tags found during scan.`,
      resolve: async ({ spfGuidanceTags }) => spfGuidanceTags,
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

const spfConnection = connectionDefinitions({
  name: 'SPF',
  nodeType: spfType,
})

module.exports = {
spfType,
spfConnection,
}
