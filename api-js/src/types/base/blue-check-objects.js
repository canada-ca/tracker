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

/* Domain related objects */
const blueCheckDomainType = new GraphQLObjectType({
  name: 'BlueCheckDomain',
  fields: () => ({
    id: globalIdField('domains'),
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
    organizations: {
      type: blueCheckOrganizationConnections.connectionType,
      args: connectionArgs,
      description: 'The organization that this domain belongs to.',
      resolve: async () => {},
    },
  }),
  interfaces: [nodeInterface],
  description: 'Domain object containing information for a given domain.',
})

const blueCheckDomainConnection = connectionDefinitions({
  name: 'BlueCheckDomain',
  nodeType: blueCheckDomainType,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description: 'The total amount of blue check domains.',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
})

/* End domain related objects */

const blueCheckOrganizationType = new GraphQLObjectType({
  name: 'BlueCheckOrganization',
  fields: () => ({
    id: globalIdField('organizations'),
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
    blueCheck: {
      type: GraphQLBoolean,
      description: 'Wether the organization is a verified organization.',
      resolve: ({ blueCheck }) => blueCheck,
    },
    domainCount: {
      type: GraphQLInt,
      description: 'The number of domains associated with this organization.',
      resolve: ({ domainCount }) => domainCount,
    },
    domains: {
      type: blueCheckDomainConnection.connectionType,
      description: 'The domains which are associated with this organization.',
      args: connectionArgs,
      resolve: async () => {},
    },
  }),
  interfaces: [nodeInterface],
  description:
    'BlueCheck Organization object containing information for a given Organization.',
})

const blueCheckOrganizationConnections = connectionDefinitions({
  name: 'BlueCheckOrganization',
  nodeType: blueCheckOrganizationType,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description: 'The total amount of blue check organizations.',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
})

module.exports = {
  blueCheckDomainType,
  blueCheckDomainConnection,
  blueCheckOrganizationType,
  blueCheckOrganizationConnections,
}
