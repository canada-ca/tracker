const { GraphQLObjectType, GraphQLNonNull } = require('graphql')
const { globalIdField, connectionDefinitions } = require('graphql-relay')
const { Url, DateTime } = require('../../../scalars')
const { nodeInterface } = require('../../node')
const { dkimType } = require('./dkim')
const { dmarcType } = require('./dmarc')
const { spfType } = require('./spf')

const emailScanType = new GraphQLObjectType({
    name: 'EmailScan',
    fields: () => ({
        id: globalIdField('email-scan'),
        domain: {
            type: Url,
            description: 'The domain the scan was ran on.',
        },
        timestamp: {
            type: DateTime,
            description: 'The time the scan was initiated.',
        },
        dkim: {
            type: dkimType,
            description: 'DomainKeys Identified Mail (DKIM) Signatures scan results.'
        },
        dmarc: {
            type: dmarcType,
            description:'Domain-based Message Authentication, Reporting, and Conformance (DMARC) scan results.',
        },
        spf: {
            type: spfType,
            description: 'Sender Policy Framework (SPF) scan results.',
        },
    }),
    interfaces: [nodeInterface],
    description: 'Results of DKIM, DMARC, and SPF scans on the given domain.',
})

const emailScanConnection = connectionDefinitions({
    name: 'EmailScan',
    nodeType: GraphQLNonNull(emailScanType)
})

module.exports = {
    emailScanType,
    emailScanConnection,
}