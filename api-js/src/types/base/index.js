const { DMARC_REPORT_API_TOKEN, DMARC_REPORT_API_SECRET } = process.env

const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean,
  GraphQLInt,
  GraphQLID,
  GraphQLList,
  GraphQLNonNull,
} = require('graphql')
const {
  globalIdField,
  connectionDefinitions,
  connectionArgs,
} = require('graphql-relay')
const {
  GraphQLDateTime,
  GraphQLEmailAddress,
} = require('graphql-scalars')
const { RoleEnums, LanguageEnums, PeriodEnums } = require('../../enums')
const { Acronym, Domain, Slug, Selectors, Year } = require('../../scalars')
const { nodeInterface } = require('../node')
const { emailScanType, webScanType } = require('./scan')
const { periodType } = require('./dmarc-report')

const domainType = new GraphQLObjectType({
  name: 'Domain',
  fields: () => ({
    id: globalIdField('domains'),
    domain: {
      type: Domain,
      description: 'Domain that scans will be ran on.',
      resolve: async ({ domain }) => domain,
    },
    lastRan: {
      type: GraphQLDateTime,
      description: 'The last time that a scan was ran on this domain.',
      resolve: async ({ lastRan }) => lastRan,
    },
    selectors: {
      type: new GraphQLList(Selectors),
      description:
        'Domain Keys Identified Mail (DKIM) selector strings associated with domain.',
      resolve: async ({ selectors }) => selectors,
    },
    organizations: {
      type: organizationConnection.connectionType,
      args: connectionArgs,
      description: 'The organization that this domain belongs to.',
      resolve: async (
        { _id },
        args,
        { loaders: { orgLoaderConnectionArgsByDomainId } },
      ) => {
        const orgs = await orgLoaderConnectionArgsByDomainId({
          domainId: _id,
          ...args,
        })
        return orgs
      },
    },
    email: {
      type: emailScanType,
      description: 'DKIM, DMARC, and SPF scan results.',
      resolve: async () => {},
    },
    web: {
      type: webScanType,
      description: 'HTTPS, and SSL scan results.',
      args: connectionArgs,
      resolve: async () => {},
    },
    dmarcSummaryByPeriod: {
      description: 'Summarized DMARC aggregate reports.',
      args: {
        month: {
          type: GraphQLNonNull(PeriodEnums),
          description: 'The month in which the returned data is relevant to.',
        },
        year: {
          type: GraphQLNonNull(Year),
          description: 'The year in which the returned data is relevant to.',
        },
      },
      type: periodType,
      resolve: async (
        { _id, _key, domain },
        __,
        {
          query,
          userId,
          loaders: { dmarcReportLoader, userLoaderByKey },
          auth: { checkDomainOwnership, userRequired, tokenize },
        },
        info,
      ) => {
        const user = await userRequired(userId, userLoaderByKey)
        const permitted = await checkDomainOwnership({
          userId: user._id,
          domainId: _id,
          query,
        })

        if (!permitted) {
          console.warn(
            `User: ${userId} attempted to access dmarc report period data for ${_key}, but does not belong to an org with ownership.`,
          )
          throw new Error(
            `Unable to retrieve dmarc report information for: ${domain}`,
          )
        }

        const {
          data: { dmarcSummaryByPeriod },
        } = await dmarcReportLoader({ info, domain, userId, tokenize })
        return dmarcSummaryByPeriod
      },
    },
    yearlyDmarcSummaries: {
      description: 'Yearly summarized DMARC aggregate reports.',
      type: new GraphQLList(periodType),
      resolve: async (
        { _id, _key, domain },
        __,
        {
          query,
          userId,
          loaders: { dmarcReportLoader, userLoaderByKey },
          auth: { checkDomainOwnership, userRequired, tokenize },
        },
        info,
      ) => {
        const user = await userRequired(userId, userLoaderByKey)
        const permitted = await checkDomainOwnership({
          userId: user._id,
          domainId: _id,
          query,
        })

        if (!permitted) {
          console.warn(
            `User: ${userId} attempted to access dmarc report period data for ${_key}, but does not belong to an org with ownership.`,
          )
          throw new Error(
            `Unable to retrieve dmarc report information for: ${domain}`,
          )
        }

        const {
          data: { yearlyDmarcSummaries },
        } = await dmarcReportLoader({ info, domain, userId, tokenize })
        return yearlyDmarcSummaries
      },
    },
  }),
  interfaces: [nodeInterface],
  description: 'Domain object containing information for a given domain.',
})

const domainConnection = connectionDefinitions({
  name: 'Domain',
  nodeType: domainType,
})

const organizationType = new GraphQLObjectType({
  name: 'Organization',
  fields: () => ({
    id: globalIdField('organizations'),
    acronym: {
      type: Acronym,
      description: 'The organizations acronym.',
      resolve: async ({ acronym }) => {
        return acronym
      },
    },
    name: {
      type: GraphQLString,
      description: 'The full name of the organization.',
      resolve: async ({ name }) => {
        return name
      },
    },
    slug: {
      type: Slug,
      description: 'Slugified name of the organization.',
      resolve: async ({ slug }) => {
        return slug
      },
    },
    zone: {
      type: GraphQLString,
      description: 'The zone which the organization belongs to.',
      resolve: async ({ zone }) => {
        return zone
      },
    },
    sector: {
      type: GraphQLString,
      description: 'The sector which the organization belongs to.',
      resolve: async ({ sector }) => {
        return sector
      },
    },
    country: {
      type: GraphQLString,
      description: 'The country in which the organization resides.',
      resolve: async ({ country }) => {
        return country
      },
    },
    province: {
      type: GraphQLString,
      description: 'The province in which the organization resides.',
      resolve: async ({ province }) => {
        return province
      },
    },
    city: {
      type: GraphQLString,
      description: 'The city in which the organization resides.',
      resolve: async ({ city }) => {
        return city
      },
    },
    blueCheck: {
      type: GraphQLBoolean,
      description: 'Wether the organization is a verified organization.',
      resolve: async ({ blueCheck }) => {
        return blueCheck
      },
    },
    domainCount: {
      type: GraphQLInt,
      description: 'The number of domains associated with this organization.',
      resolve: async () => {},
    },
    domains: {
      type: domainConnection.connectionType,
      description: 'The domains which are associated with this organization.',
      args: connectionArgs,
      resolve: async () => {},
    },
  }),
  interfaces: [nodeInterface],
  description:
    'Organization object containing information for a given Organization.',
})

const organizationConnection = connectionDefinitions({
  name: 'Organization',
  nodeType: organizationType,
})

const userType = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    id: globalIdField('users'),
    userName: {
      type: GraphQLEmailAddress,
      description: 'Users email address.',
      resolve: async ({ userName }) => {
        return userName
      },
    },
    displayName: {
      type: GraphQLString,
      description: 'Name displayed to other users.',
      resolve: async ({ displayName }) => {
        return displayName
      },
    },
    preferredLang: {
      type: LanguageEnums,
      description: 'Users preferred language.',
      resolve: async ({ preferredLang }) => {
        return preferredLang
      },
    },
    tfaValidated: {
      type: GraphQLBoolean,
      description: 'Has the user completed two factor authentication.',
      resolve: async ({ tfaValidated }) => {
        return tfaValidated
      },
    },
    emailValidated: {
      type: GraphQLBoolean,
      description: 'Has the user email verified their account.',
      resolve: async ({ emailValidated }) => {
        return emailValidated
      },
    },
    affiliations: {
      type: userAffiliationsConnection.connectionType,
      description: 'Users affiliations to various organizations.',
      args: connectionArgs,
      resolve: async () => {},
    },
  }),
  interfaces: [nodeInterface],
  description: `This object can be queried to retrieve the current logged in users
    information or if the user is an org or super admin they can query a user
    by their user name`,
})

const userConnection = connectionDefinitions({
  name: 'User',
  nodeType: userType,
})

const userAffiliationsType = new GraphQLObjectType({
  name: 'UserAffiliations',
  fields: () => ({
    id: globalIdField('affiliations'),
    userId: {
      type: GraphQLID,
      description: "Affiliated user's ID",
      resolve: async () => {},
    },
    permission: {
      type: RoleEnums,
      description: "User's level of access to a given organization.",
      resolve: async () => {},
    },
    user: {
      type: userType,
      description: 'The affiliated users information.',
      resolve: async () => {},
    },
    organization: {
      type: organizationType,
      description: 'The affiliated organizations information.',
      resolve: async () => {},
    },
  }),
  interfaces: [nodeInterface],
  description:
    'User Affiliations containing the permission level for the given organization, the users information, and the organizations information.',
})

const userAffiliationsConnection = connectionDefinitions({
  name: 'UserAffiliations',
  nodeType: userAffiliationsType,
})

module.exports = {
  domainType,
  domainConnection,
  organizationType,
  organizationConnection,
  userType,
  userConnection,
  userAffiliationsType,
  userAffiliationsConnection,
}
