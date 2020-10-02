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

const dmarcType = new GraphQLObjectType({
  name: 'DMARC',
  fields: () => ({
    id: globalIdField('dmarc'),
    domain: {
      type: Domain,
      description: `The domain the scan was ran on.`,
      resolve: async ({ domain }) => domain,
    },
    timestamp: {
      type: GraphQLDate,
      description: `The time when the scan was initiated.`,
      resolve: async ({ timestamp }) => timestamp,
    },
    dmarcPhase: {
      type: GraphQLInt,
      description: `DMARC phase found during scan.`,
      resolve: async ({ dmarcPhase }) => dmarcPhase,
    },
    record: {
      type: GraphQLString,
      description: `DMARC record retrieved during scan.`,
      resolve: async ({ record }) => record,
    },
    pPolicy: {
      type: GraphQLString,
      description: `The requested policy you wish mailbox providers to apply
            when your email fails DMARC authentication and alignment checks. `,
      resolve: async ({ pPolicy }) => pPolicy,
    },
    spPolicy: {
      type: GraphQLString,
      description: `This tag is used to indicate a requested policy for all
            subdomains where mail is failing the DMARC authentication and alignment checks.`,
      resolve: async ({ spPolicy }) => spPolicy,
    },
    pct: {
      type: GraphQLInt,
      description: `The percentage of messages to which the DMARC policy is to be applied.`,
      resolve: async ({ pct }) => pct,
    },
    dmarcGuidanceTags: {
      type: GraphQLList(GraphQLString),
      description: `Key tags found during DMARC Scan.`,
      resolve: async ({ dmarcGuidanceTags }) => dmarcGuidanceTags,
    },
  }),
  interfaces: [nodeInterface],
  description: `Domain-based Message Authentication, Reporting, and Conformance
    (DMARC) is a scalable mechanism by which a mail-originating
    organization can express domain-level policies and preferences for
    message validation, disposition, and reporting, that a mail-receiving
    organization can use to improve mail handling.`,
})

const dmarcConnection = connectionDefinitions({
  name: 'DMARC',
  nodeType: dmarcType,
})

module.exports = {
  dmarcType,
  dmarcConnection,
}

