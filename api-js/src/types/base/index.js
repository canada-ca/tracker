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
const { GraphQLDateTime, GraphQLEmailAddress } = require('graphql-scalars')
const { RoleEnums, LanguageEnums, PeriodEnums } = require('../../enums')
const { Acronym, Domain, Slug, Selectors, Year } = require('../../scalars')
const { nodeInterface } = require('../node')
const { periodType } = require('./dmarc-report')

/* Domain related objects */
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
      resolve: async ({ _id, _key }) => {
        return { _id, _key }
      },
    },
    web: {
      type: webScanType,
      description: 'HTTPS, and SSL scan results.',
      resolve: async ({ _id, _key }) => {
        return { _id, _key }
      },
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

const emailScanType = new GraphQLObjectType({
  name: 'EmailScan',
  fields: () => ({
    domain: {
      type: domainType,
      description: `The domain the scan was ran on.`,
      resolve: async ({ _key }, _, { loaders: { domainLoaderByKey } }) => {
        const domain = await domainLoaderByKey.load(_key)
        domain.id = domain._key
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
      resolve: async (
        { _id },
        args,
        { loaders: { dkimLoaderConnectionsByDomainId } },
      ) => {
        const dkim = await dkimLoaderConnectionsByDomainId({
          domainId: _id,
          ...args,
        })
        return dkim
      },
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
      resolve: async (
        { _id },
        args,
        { loaders: { dmarcLoaderConnectionsByDomainId } },
      ) => {
        const dmarc = await dmarcLoaderConnectionsByDomainId({
          domainId: _id,
          ...args,
        })
        return dmarc
      },
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
      resolve: async (
        { _id },
        args,
        { loaders: { spfLoaderConnectionsByDomainId } },
      ) => {
        const spf = await spfLoaderConnectionsByDomainId({
          domainId: _id,
          ...args,
        })
        return spf
      },
    },
  }),
  description: `Results of DKIM, DMARC, and SPF scans on the given domain.`,
})

const dkimType = new GraphQLObjectType({
  name: 'DKIM',
  fields: () => ({
    id: globalIdField('dkim'),
    domain: {
      type: domainType,
      description: `The domain the scan was ran on.`,
      resolve: async ({ domainId }, _, { loaders: { domainLoaderByKey } }) => {
        const domainKey = domainId.split('/')[1]
        const domain = await domainLoaderByKey.load(domainKey)
        domain.id = domain._key
        return domain
      },
    },
    timestamp: {
      type: GraphQLDateTime,
      description: `The time when the scan was initiated.`,
      resolve: async ({ timestamp }) => timestamp,
    },
    results: {
      type: dkimResultsConnection.connectionType,
      args: {
        ...connectionArgs,
      },
      description: 'Individual scans results for each dkim selector.',
      resolve: async (
        { _id },
        args,
        { loaders: { dkimResultsLoaderConnectionByDkimId } },
      ) => {
        const dkimResults = await dkimResultsLoaderConnectionByDkimId({
          dkimId: _id,
          ...args,
        })
        return dkimResults
      },
    },
  }),
  interfaces: [nodeInterface],
  description: `DomainKeys Identified Mail (DKIM) permits a person, role, or
    organization that owns the signing domain to claim some
    responsibility for a message by associating the domain with the
    message.  This can be an author's organization, an operational relay,
    or one of their agents.`,
})

const dkimConnection = connectionDefinitions({
  name: 'DKIM',
  nodeType: dkimType,
})

const dkimResultsType = new GraphQLObjectType({
  name: 'DKIMResult',
  fields: () => ({
    id: globalIdField('dkimResult'),
    dkim: {
      type: dkimType,
      description: 'The dkim scan information that this result belongs to.',
      resolve: async ({ dkimId }, _, { loaders: { dkimLoaderByKey } }) => {
        const dkimKey = dkimId.split('/')[1]
        const dkim = await dkimLoaderByKey.load(dkimKey)
        dkim.id = dkim._key
        return dkim
      },
    },
    selector: {
      type: GraphQLString,
      description: 'The selector the scan was ran on.',
      resolve: async ({ selector }) => selector,
    },
    record: {
      type: GraphQLString,
      description: 'DKIM record retrieved during the scan of the domain.',
      resolve: async ({ record }) => record,
    },
    keyLength: {
      type: GraphQLString,
      description: 'Size of the Public Key in bits',
      resolve: async ({ keyLength }) => keyLength,
    },
    dkimGuidanceTags: {
      type: new GraphQLList(GraphQLString),
      description: 'Key tags found during scan.',
      resolve: async ({ dkimGuidanceTags }) => dkimGuidanceTags,
    },
  }),
  interfaces: [nodeInterface],
  description: 'Individual scans results for the given dkim selector.',
})

const dkimResultsConnection = connectionDefinitions({
  name: 'DKIMResult',
  nodeType: dkimResultsType,
})

const dmarcType = new GraphQLObjectType({
  name: 'DMARC',
  fields: () => ({
    id: globalIdField('dmarc'),
    domain: {
      type: domainType,
      description: `The domain the scan was ran on.`,
      resolve: async ({ domainId }, _, { loaders: { domainLoaderByKey } }) => {
        const domainKey = domainId.split('/')[1]
        const domain = await domainLoaderByKey.load(domainKey)
        domain.id = domain._key
        return domain
      },
    },
    timestamp: {
      type: GraphQLDateTime,
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

const spfType = new GraphQLObjectType({
  name: 'SPF',
  fields: () => ({
    id: globalIdField('spf'),
    domain: {
      type: domainType,
      description: `The domain the scan was ran on.`,
      resolve: async ({ domainId }, _, { loaders: { domainLoaderByKey } }) => {
        const domainKey = domainId.split('/')[1]
        const domain = await domainLoaderByKey.load(domainKey)
        domain.id = domain._key
        return domain
      },
    },
    timestamp: {
      type: GraphQLDateTime,
      description: `The time the scan was initiated.`,
      resolve: async ({ timestamp }) => timestamp,
    },
    lookups: {
      type: GraphQLInt,
      description: `The amount of DNS lookups.`,
      resolve: async ({ lookups }) => lookups,
    },
    record: {
      type: GraphQLString,
      description: `SPF record retrieved during the scan of the given domain.`,
      resolve: async ({ record }) => record,
    },
    spfDefault: {
      type: GraphQLString,
      description: `Instruction of what a recipient should do if there is not a match to your SPF record.`,
      resolve: async ({ spfDefault }) => spfDefault,
    },
    spfGuidanceTags: {
      type: GraphQLList(GraphQLString),
      description: `Key tags found during scan.`,
      resolve: async ({ spfGuidanceTags }) => spfGuidanceTags,
    },
  }),
  interfaces: [nodeInterface],
  description: `Email on the Internet can be forged in a number of ways.  In
  particular, existing protocols place no restriction on what a sending
  host can use as the "MAIL FROM" of a message or the domain given on
  the SMTP HELO/EHLO commands.  Version 1 of the Sender Policy Framework (SPF)
  protocol is where ADministrative Management Domains (ADMDs) can explicitly
  authorize the hosts that are allowed to use their domain names, and a
  receiving host can check such authorization.`,
})

const spfConnection = connectionDefinitions({
  name: 'SPF',
  nodeType: spfType,
})

const webScanType = new GraphQLObjectType({
  name: 'WebScan',
  fields: () => ({
    id: globalIdField('web-scan'),
    domain: {
      type: domainType,
      description: `The domain the scan was ran on.`,
      resolve: async ({ _key }, _, { loaders: { domainLoaderByKey } }) => {
        const domain = await domainLoaderByKey.load(_key)
        domain.id = domain._key
        return domain
      },
    },
    https: {
      type: httpsConnection.connectionType,
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
      description: `Hyper Text Transfer Protocol Secure scan results.`,
      resolve: async (
        { _id },
        args,
        { loaders: { httpsLoaderConnectionsByDomainId } },
      ) => {
        const https = await httpsLoaderConnectionsByDomainId({
          domainId: _id,
          ...args,
        })
        return https
      },
    },
    ssl: {
      type: sslConnection.connectionType,
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
      description: `Secure Socket Layer scan results.`,
      resolve: async (
        { _id },
        args,
        { loaders: { sslLoaderConnectionsByDomainId } },
      ) => {
        const ssl = await sslLoaderConnectionsByDomainId({
          domainId: _id,
          ...args,
        })
        return ssl
      },
    },
  }),
  interfaces: [nodeInterface],
  description: `Results of HTTPS, and SSL scan on the given domain.`,
})

const httpsType = new GraphQLObjectType({
  name: 'HTTPS',
  fields: () => ({
    id: globalIdField('https'),
    domain: {
      type: domainType,
      description: `The domain the scan was ran on.`,
      resolve: async ({ domainId }, _, { loaders: { domainLoaderByKey } }) => {
        const domainKey = domainId.split('/')[1]
        const domain = await domainLoaderByKey.load(domainKey)
        domain.id = domain._key
        return domain
      },
    },
    timestamp: {
      type: GraphQLDateTime,
      description: `The time the scan was initiated.`,
      resolve: async ({ timestamp }) => timestamp,
    },
    implementation: {
      type: GraphQLString,
      description: `State of the HTTPS implementation on the server and any issues therein.`,
      resolve: async ({ implementation }) => implementation,
    },
    enforced: {
      type: GraphQLString,
      description: `Degree to which HTTPS is enforced on the server based on behaviour.`,
      resolve: async ({ enforced }) => enforced,
    },
    hsts: {
      type: GraphQLString,
      description: `Presence and completeness of HSTS implementation.`,
      resolve: async ({ hsts }) => hsts,
    },
    hstsAge: {
      type: GraphQLString,
      description: `Denotes how long the domain should only be accessed using HTTPS`,
      resolve: async ({ hstsAge }) => hstsAge,
    },
    preloaded: {
      type: GraphQLString,
      description: `Denotes whether the domain has been submitted and included within HSTS preload list.`,
      resolve: async ({ preloaded }) => preloaded,
    },
    httpsGuidanceTags: {
      type: GraphQLList(GraphQLString),
      description: `Key tags found during scan.`,
      resolve: async ({ httpsGuidanceTags }) => httpsGuidanceTags,
    },
  }),
  interfaces: [nodeInterface],
  description: `Hyper Text Transfer Protocol Secure scan results.`,
})

const httpsConnection = connectionDefinitions({
  name: 'HTTPS',
  nodeType: httpsType,
})

const sslType = new GraphQLObjectType({
  name: 'SSL',
  fields: () => ({
    id: globalIdField('ssl'),
    domain: {
      type: domainType,
      description: `The domain the scan was ran on.`,
      resolve: async ({ domainId }, _, { loaders: { domainLoaderByKey } }) => {
        const domainKey = domainId.split('/')[1]
        const domain = await domainLoaderByKey.load(domainKey)
        domain.id = domain._key
        return domain
      },
    },
    timestamp: {
      type: GraphQLDateTime,
      description: `The time when the scan was initiated.`,
      resolve: async ({ timestamp }) => timestamp,
    },
    sslGuidanceTags: {
      type: GraphQLList(GraphQLString),
      description: `Key tags found during scan.`,
      resolve: async ({ sslGuidanceTags }) => sslGuidanceTags,
    },
  }),
  interfaces: [nodeInterface],
  description: `Secure Socket Layer scan results.`,
})

const sslConnection = connectionDefinitions({
  name: 'SSL',
  nodeType: sslType,
})

/* End domain related objects */

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
      resolve: async (
        { _id },
        { loaders: { domainLoaderCountByOrgId } },
      ) => {
        const count = await domainLoaderCountByOrgId({
          orgId: _id,
        })
        return count
      },
    },
    domains: {
      type: domainConnection.connectionType,
      description: 'The domains which are associated with this organization.',
      args: connectionArgs,
      resolve: async (
        { _id },
        args,
        { loaders: { domainLoaderConnectionsByOrgId } },
      ) => {
        const connections = await domainLoaderConnectionsByOrgId({
          orgId: _id,
          ...args,
        })
        return connections
      },
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
