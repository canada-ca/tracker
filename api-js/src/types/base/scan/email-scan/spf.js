const {
  GraphQLObjectType,
  GraphQLInt,
  GraphQLString,
  GraphQLList,
} = require('graphql')
const { globalIdField } = require('graphql-relay')
const { nodeInterface } = require('../../node')
const { Url, DateTime } = require('../../../scalars')

const spfType = new GraphQLObjectType({
  name: 'SPF',
  fields: () => ({
    id: globalIdField('spf'),
    domain: {
      type: Url,
      description: 'The domain the scan was ran on.',
    },
    timestamp: {
      type: DateTime,
      description: 'The time the scan was initiated.',
    },
    lookups: {
      type: GraphQLInt,
      description: 'The amount of DNS lookups.',
    },
    record: {
      type: GraphQLString,
      description: 'SPF record retrieved durig the scan of the given domain.',
    },
    spfDefault: {
      type: GraphQLString,
      description:
        'Instruction of what a recipient should do if there is not a match to your SPF record.',
    },
    spfGuidanceTags: {
      type: new GraphQLList(GraphQLString),
      description: 'Key tags found during scan.',
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
