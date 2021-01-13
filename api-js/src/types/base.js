import { domainConnection, domainType, domainStatus } from '../domain'

const { CIPHER_KEY } = process.env
const crypto = require('crypto')
const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
} = require('graphql')
const {
  globalIdField,
  connectionDefinitions,
  connectionArgs,
  nodeDefinitions,
} = require('graphql-relay')
const {
  GraphQLDateTime,
  GraphQLEmailAddress,
  GraphQLPhoneNumber,
  GraphQLJSON,
} = require('graphql-scalars')
const { t } = require('@lingui/macro')

const {
  RoleEnums,
  LanguageEnums,
  PeriodEnums,
  TfaSendMethodEnum,
} = require('../enums')
const { Acronym, Domain, Slug, Selectors, Year } = require('../scalars')
const { periodType } = require('./dmarc-report')
const { organizationSummaryType } = require('./organization-summary')
const { refLinksType } = require('./ref-links')

const { nodeField, nodesField, nodeInterface } = nodeDefinitions(
  (_globalId) => {},
  (object) => {
    switch (object) {
      default:
        return null
    }
  },
)

/* Domain related objects */










/* End domain related objects */



const userPersonalType = new GraphQLObjectType({
  name: 'PersonalUser',
  fields: () => ({
    id: globalIdField('users'),
    userName: {
      type: GraphQLEmailAddress,
      description: 'Users email address.',
      resolve: ({ userName }) => userName,
    },
    displayName: {
      type: GraphQLString,
      description: 'Name displayed to other users.',
      resolve: ({ displayName }) => displayName,
    },
    phoneNumber: {
      type: GraphQLPhoneNumber,
      description: 'The phone number the user has setup with tfa.',
      resolve: ({ phoneDetails }) => {
        const { iv, tag, phoneNumber: encrypted } = phoneDetails
        const decipher = crypto.createDecipheriv(
          'aes-256-ccm',
          String(CIPHER_KEY),
          Buffer.from(iv, 'hex'),
          { authTagLength: 16 },
        )
        decipher.setAuthTag(Buffer.from(tag, 'hex'))
        let decrypted = decipher.update(encrypted, 'hex', 'utf8')
        decrypted += decipher.final('utf8')
        return decrypted
      },
    },
    preferredLang: {
      type: LanguageEnums,
      description: 'Users preferred language.',
      resolve: ({ preferredLang }) => preferredLang,
    },
    phoneValidated: {
      type: GraphQLBoolean,
      description: 'Has the user completed phone validation.',
      resolve: ({ phoneValidated }) => phoneValidated,
    },
    emailValidated: {
      type: GraphQLBoolean,
      description: 'Has the user email verified their account.',
      resolve: ({ emailValidated }) => emailValidated,
    },
    tfaSendMethod: {
      type: TfaSendMethodEnum,
      description: 'The method in which TFA codes are sent.',
      resolve: ({ tfaSendMethod }) => tfaSendMethod,
    },
    affiliations: {
      type: userAffiliationsConnection.connectionType,
      description: 'Users affiliations to various organizations.',
      args: connectionArgs,
      resolve: async (
        { _id },
        args,
        { loaders: { affiliationLoaderByUserId } },
      ) => {
        const affiliations = await affiliationLoaderByUserId({
          uId: _id,
          ...args,
        })
        return affiliations
      },
    },
  }),
  interfaces: [nodeInterface],
  description: `This object is used for showing personal user details, 
and is used for only showing the details of the querying user.`,
})

const userSharedType = new GraphQLObjectType({
  name: 'SharedUser',
  fields: () => ({
    id: globalIdField('users'),
    userName: {
      type: GraphQLEmailAddress,
      description: 'Users email address.',
      resolve: ({ userName }) => userName,
    },
  }),
  interfaces: [nodeInterface],
  description: `This object is used for showing none personal user details, 
and is used for limiting admins to the personal details of users.`,
})

const userAffiliationsType = new GraphQLObjectType({
  name: 'UserAffiliations',
  fields: () => ({
    id: globalIdField('affiliations'),
    permission: {
      type: RoleEnums,
      description: "User's level of access to a given organization.",
      resolve: ({ permission }) => permission,
    },
    user: {
      type: userSharedType,
      description: 'The affiliated users information.',
      resolve: async ({ _to }, _args, { loaders: { userLoaderByKey } }) => {
        const userKey = _to.split('/')[1]
        const user = await userLoaderByKey.load(userKey)
        user.id = user._key
        return user
      },
    },
    organization: {
      type: organizationType,
      description: 'The affiliated organizations information.',
      resolve: async ({ _from }, _args, { loaders: { orgLoaderByKey } }) => {
        const orgKey = _from.split('/')[1]
        const org = await orgLoaderByKey.load(orgKey)
        org.id = org._key
        return org
      },
    },
  }),
  interfaces: [nodeInterface],
  description:
    'User Affiliations containing the permission level for the given organization, the users information, and the organizations information.',
})

const userAffiliationsConnection = connectionDefinitions({
  name: 'UserAffiliations',
  nodeType: userAffiliationsType,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description: 'The total amount of affiliations the user has access to.',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
})

const guidanceTagType = new GraphQLObjectType({
  name: 'GuidanceTag',
  description:
    'Details for a given guidance tag based on https://github.com/canada-ca/tracker/wiki/Guidance-Tags',
  fields: () => ({
    id: globalIdField('guidanceTags'),
    tagId: {
      type: GraphQLString,
      description: 'The guidance tag ID.',
      resolve: ({ tagId }) => tagId,
    },
    tagName: {
      type: GraphQLString,
      description: 'The guidance tag name.',
      resolve: ({ tagName }) => tagName,
    },
    guidance: {
      type: GraphQLString,
      description:
        'Guidance for changes to record, or to maintain current stance.',
      resolve: ({ guidance }) => guidance,
    },
    refLinks: {
      type: GraphQLList(refLinksType),
      description: 'Links to implementation guidance for a given tag.',
      resolve: ({ refLinksGuide }) => refLinksGuide,
    },
    refLinksTech: {
      type: GraphQLList(refLinksType),
      description: 'Links to technical information for a given tag.',
      resolve: ({ refLinksTechnical }) => refLinksTechnical,
    },
  }),
  interfaces: [nodeInterface],
})

const guidanceTagConnection = connectionDefinitions({
  name: 'GuidanceTag',
  nodeType: guidanceTagType,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description: 'The total amount of guidance tags for a given scan type.',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
})

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
      type: verifiedOrganizationConnection.connectionType,
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

const verifiedOrganizationConnection = connectionDefinitions({
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

export {
  dkimType,
  dkimConnection,
  dkimResultType,
  dkimResultConnection,
  dmarcType,
  dmarcConnection,
  domainConnection,
  emailScanType,
  httpsType,
  httpsConnection,
  guidanceTagType,
  guidanceTagConnection,
  nodeField,
  nodesField,
  organizationType,
  organizationConnection,
  spfType,
  spfConnection,
  sslType,
  sslConnection,
  webScanType,
  userPersonalType,
  userSharedType,
  userAffiliationsType,
  userAffiliationsConnection,
  verifiedDomainType,
  verifiedDomainConnection,
  verifiedOrganizationType,
  verifiedOrganizationConnection,
}
