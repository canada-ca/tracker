const { GraphQLObjectType, GraphQLInt, GraphQLString, GraphQLList } = require('graphql')
const { globalIdField } = require('graphql-relay')
const { nodeInterface } = require('../../node')
const { Url, DateTime } = require('../../../scalars')

const dmarcType = new GraphQLObjectType({
    name: 'DMARC',
    fields: () => ({
        id: globalIdField('dmarc'),
        domain: {
            type: Url,
            description: 'The domain the scan was ran on.',
        },
        timestamp: {
            type: DateTime,
            description: 'The time when the scan was initiated.',
        },
        dmarcPhase: {
            type: GraphQLInt,
            description: 'DMARC phase found during scan.',
        },
        record: {
            type: GraphQLString,
            description: 'DMARC record retrieved during scan.',
        },
        pPolicy: {
            type: GraphQLString,
            description: `The requested policy you wish mailbox providers to apply
            when your email fails DMARC authentication and alignment checks. `,
        },
        spPolicy: {
            type: GraphQLString,
            description: `This tag is used to indicate a requested policy for all 
            subdomains where mail is failing the DMARC authentication and alignment checks.`,
        },
        pct: {
            type: GraphQLInt,
            description:
        'The percentage of messages to which the DMARC policy is to be applied.',
        },
        dmarcGuidanceTags: {
            type: new GraphQLList(GraphQLString),
            description: 'Key tags found during DMARC Scan.',
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
    dmarcType
}