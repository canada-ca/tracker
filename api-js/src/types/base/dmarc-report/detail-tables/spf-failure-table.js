const {
  GraphQLInt,
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean,
  GraphQLID,
} = require('graphql')
const { connectionDefinitions } = require('graphql-relay')

const spfFailureTableType = new GraphQLObjectType({
  name: 'SpfFailureTable',
  description:
    'This table contains the data fields for senders who are in the SPF fail category.',
  fields: () => ({
    id: {
      type: GraphQLID,
      description: 'The ID of the object',
      resolve: async ({ id }) => id,
    },
    dnsHost: {
      type: GraphQLString,
      description: 'Host from reverse DNS of source IP address.',
      resolve: async ({ dnsHost }) => dnsHost,
    },
    envelopeFrom: {
      type: GraphQLString,
      description: 'Domain from SMTP banner message.',
      resolve: async ({ envelopeFrom }) => envelopeFrom,
    },
    guidance: {
      type: GraphQLString,
      description: 'Guidance for any issues that were found from the report.',
      resolve: async ({ guidance }) => guidance,
    },
    headerFrom: {
      type: GraphQLString,
      description: 'The address/domain used in the "From" field.',
      resolve: async ({ headerFrom }) => headerFrom,
    },
    sourceIpAddress: {
      type: GraphQLString,
      description: 'IP address of sending server.',
      resolve: async ({ sourceIpAddress }) => sourceIpAddress,
    },
    spfAligned: {
      type: GraphQLBoolean,
      description: 'Is SPF aligned.',
      resolve: async ({ spfAligned }) => spfAligned,
    },
    spfDomains: {
      type: GraphQLString,
      description: 'Domains used for SPF validation.',
      resolve: async ({ spfDomains }) => spfDomains,
    },
    spfResults: {
      type: GraphQLString,
      description:
        'The results of DKIM verification of the message. Can be pass, fail, neutral, soft-fail, temp-error, or perm-error.',
      resolve: async ({ spfResults }) => spfResults,
    },
    totalMessages: {
      type: GraphQLInt,
      description: 'Total messages from this sender.',
      resolve: async ({ totalMessages }) => totalMessages,
    },
  }),
})

const spfFailureConnection = connectionDefinitions({
  name: 'SpfFailureTable',
  nodeType: spfFailureTableType,
})

module.exports = {
  spfFailureConnection,
  spfFailureTableType,
}
