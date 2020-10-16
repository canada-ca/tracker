const {
  GraphQLInt,
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean,
  GraphQLID,
} = require('graphql')
const { connectionDefinitions } = require('graphql-relay')

const dkimFailureTableType = new GraphQLObjectType({
  name: 'DkimFailureTable',
  description:
    'This table contains the data fields for senders who are in the DKIM fail category.',
  fields: () => ({
    id: {
      type: GraphQLID,
      description: 'The ID of the object.',
      resolve: async ({ id }) => id,
    },
    dkimAligned: {
      type: GraphQLBoolean,
      description: 'Is DKIM aligned.',
      resolve: async ({ dkimAligned }) => dkimAligned,
    },
    dkimDomains: {
      type: GraphQLString,
      description: 'Domains used for DKIM validation',
      resolve: async ({ dkimDomains }) => dkimDomains,
    },
    dkimResults: {
      type: GraphQLString,
      description:
        'The results of DKIM verification of the message. Can be pass, fail, neutral, temp-error, or perm-error.',
      resolve: async ({ dkimResults }) => dkimResults,
    },
    dkimSelectors: {
      type: GraphQLString,
      description: 'Pointer to a DKIM public key record in DNS.',
      resolve: async ({ dkimSelectors }) => dkimSelectors,
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
    totalMessages: {
      type: GraphQLInt,
      description: 'Total messages from this sender.',
      resolve: async ({ totalMessages }) => totalMessages,
    },
  }),
})

const dkimFailureConnection = connectionDefinitions({
  name: 'DkimFailureTable',
  nodeType: dkimFailureTableType,
})

module.exports = {
  dkimFailureConnection,
  dkimFailureTableType,
}
