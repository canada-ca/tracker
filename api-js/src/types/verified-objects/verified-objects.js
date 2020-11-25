const {
  GraphQLObjectType,
  GraphQLInt,
  GraphQLString,
  GraphQLBoolean,
} = require('graphql')
const {
  globalIdField,
  connectionArgs,
  connectionDefinitions,
} = require('graphql-relay')
const { GraphQLDateTime } = require('graphql-scalars')

const { Domain, Acronym, Slug } = require('../../scalars')
const { nodeInterface } = require('../node')
const { domainStatus } = require('../base/domain-status')
const { organizationSummaryType } = require('../base/organization-summary')

/* Domain related objects */
const verifiedDomainType = new GraphQLObjectType({
  name: 'VerifiedDomain',
  fields: () => ({
    id: globalIdField('verifiedDomains'),
    domain: {
      type: Domain,
      description: 'Domain that scans will be ran on.',
      resolve: ({ domain }) => domain,
    },
    lastRan: {
      type: GraphQLDateTime,
      description: 'The last time that a scan was ran on this domain.',
      resolve: ({ lastRan }) => lastRan,
    },
    status: {
      type: domainStatus,
      description: 'The domains scan status, based on the latest scan data.',
      resolve: ({ status }) => status,
    },
    organizations: {
      type: verifiedOrganizationConnections.connectionType,
      args: connectionArgs,
      description: 'The organization that this domain belongs to.',
      resolve: async (
        { _id },
        args,
        { loaders: { verifiedOrgLoaderConnectionsByDomainId } },
      ) => {
        const orgs = await verifiedOrgLoaderConnectionsByDomainId({
          domainId: _id,
          ...args,
        })
        return orgs
      },
    },
  }),
  interfaces: [nodeInterface],
  description: 'Domain object containing information for a given domain.',
})

const verifiedDomainConnection = connectionDefinitions({
  name: 'VerifiedDomain',
  nodeType: verifiedDomainType,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description: 'The total amount of verified domains.',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
})

/* End domain related objects */

const verifiedOrganizationType = new GraphQLObjectType({
  name: 'VerifiedOrganization',
  fields: () => ({
    id: globalIdField('verifiedOrganizations'),
    acronym: {
      type: Acronym,
      description: 'The organizations acronym.',
      resolve: ({ acronym }) => acronym,
    },
    name: {
      type: GraphQLString,
      description: 'The full name of the organization.',
      resolve: ({ name }) => name,
    },
    slug: {
      type: Slug,
      description: 'Slugified name of the organization.',
      resolve: ({ slug }) => slug,
    },
    zone: {
      type: GraphQLString,
      description: 'The zone which the organization belongs to.',
      resolve: ({ zone }) => zone,
    },
    sector: {
      type: GraphQLString,
      description: 'The sector which the organization belongs to.',
      resolve: ({ sector }) => sector,
    },
    country: {
      type: GraphQLString,
      description: 'The country in which the organization resides.',
      resolve: ({ country }) => country,
    },
    province: {
      type: GraphQLString,
      description: 'The province in which the organization resides.',
      resolve: ({ province }) => province,
    },
    city: {
      type: GraphQLString,
      description: 'The city in which the organization resides.',
      resolve: ({ city }) => city,
    },
    verified: {
      type: GraphQLBoolean,
      description: 'Wether the organization is a verified organization.',
      resolve: ({ verified }) => verified,
    },
    summaries: {
      type: organizationSummaryType,
      description:
        'Summaries based on scan types that are preformed on the given organizations domains.',
      resolve: ({ summaries }) => summaries,
    },
    domainCount: {
      type: GraphQLInt,
      description: 'The number of domains associated with this organization.',
      resolve: ({ domainCount }) => domainCount,
    },
    domains: {
      type: verifiedDomainConnection.connectionType,
      description: 'The domains which are associated with this organization.',
      args: connectionArgs,
      resolve: async (
        { _id },
        args,
        { loaders: { verifiedDomainLoaderConnectionsByOrgId } },
      ) => {
        const domains = await verifiedDomainLoaderConnectionsByOrgId({
          orgId: _id,
          ...args,
        })
        return domains
      },
    },
  }),
  interfaces: [nodeInterface],
  description:
    'Verified Organization object containing information for a given Organization.',
})

const verifiedOrganizationConnections = connectionDefinitions({
  name: 'VerifiedOrganization',
  nodeType: verifiedOrganizationType,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description: 'The total amount of verified organizations.',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
})

module.exports = {
  verifiedDomainType,
  verifiedDomainConnection,
  verifiedOrganizationType,
  verifiedOrganizationConnections,
}
