const { GraphQLObjectType } = require('graphql')
const { dkimConnection } = require('./dkim')
const { dmarcConnection } = require('./dmarc')
const { spfConnection } = require('./spf')
const { Domain } = require('../../../../scalars')
const { connectionArgs } = require('graphql-relay')
const { GraphQLDateTime } = require('graphql-scalars')

const emailScanType = new GraphQLObjectType({
  name: 'EmailScan',
  fields: () => ({
    domain: {
      type: Domain,
      description: `The domain the scan was ran on.`,
      resolve: async ({ _key }, _, { loaders: { domainLoaderByKey } }) => {
        const domain = await domainLoaderByKey.load(_key)
        return domain
      },
    },
    dkim: {
      type: dkimConnection.connectionType,
      args: {
        starDate: {
          type: GraphQLDateTime,
          description: 'Start date for date filter.',
        },
        endDate: {
          type: GraphQLDateTime,
          description: 'End date for date filter.',
        },
        ...connectionArgs,
      },
      description: `DomainKeys Identified Mail (DKIM) Signatures scan results.`,
      resolve: async ({ dkim }) => dkim,
    },
    dmarc: {
      type: dmarcConnection.connectionType,
      args: {
        starDate: {
          type: GraphQLDateTime,
          description: 'Start date for date filter.',
        },
        endDate: {
          type: GraphQLDateTime,
          description: 'End date for date filter.',
        },
        ...connectionArgs,
      },
      description: `Domain-based Message Authentication, Reporting, and Conformance (DMARC) scan results.`,
      resolve: async ({ dmarc }) => dmarc,
    },
    spf: {
      type: spfConnection.connectionType,
      args: {
        starDate: {
          type: GraphQLDateTime,
          description: 'Start date for date filter.',
        },
        endDate: {
          type: GraphQLDateTime,
          description: 'End date for date filter.',
        },
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
