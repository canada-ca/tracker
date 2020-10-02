const { GraphQLObjectType } = require('graphql')
const { GraphQLDate } = require('graphql-scalars')
const { dkimConnection } = require('./dkim')
const { dmarcConnection } = require('./dmarc')
const { spfConnection } = require('./spf')
const { Domain } = require('../../../../scalars')
const { connectionArgs } = require('graphql-relay')

const emailScanType = new GraphQLObjectType({
  name: 'EmailScan',
  fields: () => ({
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
    dkim: {
      type: dkimConnection.connectionType,
      args: {
        ...connectionArgs,
      },
      description: `DomainKeys Identified Mail (DKIM) Signatures scan results.`,
      resolve: async ({ dkim }) => dkim,
    },
    dmarc: {
      type: dmarcConnection.connectionType,
      args: {
        ...connectionArgs,
      },
      description: `Domain-based Message Authentication, Reporting, and Conformance (DMARC) scan results.`,
      resolve: async ({ dmarc }) => dmarc,
    },
    spf: {
      type: spfConnection.connectionType,
      args: {
        ...connectionArgs,
      },
      description: `Sender Policy Framework (SPF) scan results.`,
      resolve: async ({ spf }) => spf,
    },
  }),
  description: `Results of DKIM, DMARC, and SPF scans on the given domain.`,
})

module.exports = {
  emailScanType,
}
