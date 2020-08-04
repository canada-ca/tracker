const {
  GraphQLObjectType,
  GraphQLInt,
  GraphQLString,
  GraphQLList,
} = require('graphql')
const { globalIdField } = require('graphql-relay')
const { GraphQLDateTime, GraphQLURL } = require('graphql-scalars')
const { nodeInterface } = require('../../../node')

const dmarcType = new GraphQLObjectType({
  name: 'DMARC',
  fields: () => ({
    id: globalIdField('dmarc'),
    domain: {
      type: GraphQLURL,
      description: `The domain the scan was ran on.`,
      resolve: async () => {},
    },
    timestamp: {
      type: GraphQLDateTime,
      description: `The time when the scan was initiated.`,
      resolve: async () => {},
    },
    dmarcPhase: {
      type: GraphQLInt,
      description: `DMARC phase found during scan.`,
      resolve: async () => {},
    },
    record: {
      type: GraphQLString,
      description: `DMARC record retrieved during scan.`,
      resolve: async () => {},
    },
    pPolicy: {
      type: GraphQLString,
      description: `The requested policy you wish mailbox providers to apply
            when your email fails DMARC authentication and alignment checks. `,
      resolve: async () => {},
    },
    spPolicy: {
      type: GraphQLString,
      description: `This tag is used to indicate a requested policy for all
            subdomains where mail is failing the DMARC authentication and alignment checks.`,
      resolve: async () => {},
    },
    pct: {
      type: GraphQLInt,
      description: `The percentage of messages to which the DMARC policy is to be applied.`,
      resolve: async () => {},
    },
    dmarcGuidanceTags: {
      type: GraphQLList(GraphQLString),
      description: `Key tags found during DMARC Scan.`,
      resolve: async () => {},
    },
  }),
  interfaces: [nodeInterface],
  description: `Domain-based Message Authentication, Reporting, and Conformance
    (DMARC) is a scalable mechanism by which a mail-originating
    organization can express domain-level policies and preferences for
    message validation, disposition, and reporting, that a mail-receiving
    organization can use to improve mail handling.`,
})

module.exports = {
  dmarcType,
}
