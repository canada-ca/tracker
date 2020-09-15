const { GraphQLObjectType, GraphQLString, GraphQLInt } = require('graphql')

const tableStructureType = new GraphQLObjectType({
  name: 'TableStructure',
  description: `GraphQL object that contains the fields of each detail table.`,
  fields: () => ({
    sourceIpAddress: {
      type: GraphQLString,
      description: `IP address of sending server.`,
      resolve: async () => {},
    },
    envelopeFrom: {
      type: GraphQLString,
      description: `Domain from SMTP banner message.`,
      resolve: async () => {},
    },
    spfDomains: {
      type: GraphQLString,
      description: `Domains used for SPF validation.`,
      resolve: async () => {},
    },
    dkimDomains: {
      type: GraphQLString,
      description: `Domains used for DKIM validation.`,
      resolve: async () => {},
    },
    dkimSelectors: {
      type: GraphQLString,
      description: `Pointer to a DKIM public key record in DNS.`,
      resolve: async () => {},
    },
    totalMessages: {
      type: GraphQLInt,
      description: `Total messages related to this record.`,
      resolve: async () => {},
    },
    countryCode: {
      type: GraphQLString,
      description: `Geographic location of source IP address.`,
      resolve: async () => {},
    },
    ispOrg: {
      type: GraphQLString,
      description: `Owner of ISP for source IP address.`,
      resolve: async () => {},
    },
    prefixOrg: {
      type: GraphQLString,
      description: `Owner of prefix for source IP address.`,
      resolve: async () => {},
    },
    asName: {
      type: GraphQLString,
      description: `Name of AS for source IP address.`,
      resolve: async () => {},
    },
    asNum: {
      type: GraphQLString,
      description: `Number of AS for source IP address.`,
      resolve: async () => {},
    },
    asOrg: {
      type: GraphQLString,
      description: `Owner of AS for source IP address.`,
      resolve: async () => {},
    },
    dnsHost: {
      type: GraphQLString,
      description: `Host from reverse DNS of source IP address.`,
      resolve: async () => {},
    },
    dnsDomain: {
      type: GraphQLString,
      description: `Domain from reverse DNS of source IP address.`,
      resolve: async () => {},
    },
  }),
})

module.exports = {
  tableStructureType,
}
