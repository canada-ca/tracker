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

const { RoleEnums, LanguageEnums, PeriodEnums } = require('../enums')
const { Acronym, Domain, Slug, Selectors, Year } = require('../scalars')
const { periodType } = require('./dmarc-report')
const { domainStatus } = require('./domain-status')
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
const domainType = new GraphQLObjectType({
  name: 'Domain',
  fields: () => ({
    id: globalIdField('domains'),
    domain: {
      type: Domain,
      description: 'Domain that scans will be ran on.',
      resolve: ({ domain }) => domain,
    },
    lastRan: {
      type: GraphQLString,
      description: 'The last time that a scan was ran on this domain.',
      resolve: ({ lastRan }) => lastRan,
    },
    selectors: {
      type: new GraphQLList(Selectors),
      description:
        'Domain Keys Identified Mail (DKIM) selector strings associated with domain.',
      resolve: ({ selectors }) => selectors,
    },
    status: {
      type: domainStatus,
      description: 'The domains scan status, based on the latest scan data.',
      resolve: ({ status }) => status,
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
      resolve: ({ _id, _key }) => {
        return { _id, _key }
      },
    },
    web: {
      type: webScanType,
      description: 'HTTPS, and SSL scan results.',
      resolve: ({ _id, _key }) => {
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
        { month },
        {
          userKey,
          loaders: { dmarcReportLoader },
          auth: { checkDomainOwnership, userRequired, tokenize },
        },
        info,
      ) => {
        await userRequired()
        const permitted = await checkDomainOwnership({
          domainId: _id,
        })

        if (!permitted) {
          console.warn(
            `User: ${userKey} attempted to access dmarc report period data for ${_key}, but does not belong to an org with ownership.`,
          )
          throw new Error(
            `Unable to retrieve dmarc report information for: ${domain}`,
          )
        }

        const {
          data: { dmarcSummaryByPeriod },
        } = await dmarcReportLoader({ info, domain, userKey, tokenize })
        dmarcSummaryByPeriod.domainKey = _key
        dmarcSummaryByPeriod.selectedMonth = month
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
          moment,
          userKey,
          loaders: { dmarcReportLoader },
          auth: { checkDomainOwnership, userRequired, tokenize },
        },
        info,
      ) => {
        await userRequired()
        const permitted = await checkDomainOwnership({
          domainId: _id,
        })

        if (!permitted) {
          console.warn(
            `User: ${userKey} attempted to access dmarc report period data for ${_key}, but does not belong to an org with ownership.`,
          )
          throw new Error(
            `Unable to retrieve dmarc report information for: ${domain}`,
          )
        }

        const {
          data: { yearlyDmarcSummaries },
        } = await dmarcReportLoader({ info, domain, userKey, tokenize })
        return yearlyDmarcSummaries.map((report) => {
          report.domainKey = _key
          report.selectedMonth = String(
            moment(report.startDate).format('MMMM'),
          ).toLowerCase()
          return report
        })
      },
    },
  }),
  interfaces: [nodeInterface],
  description: 'Domain object containing information for a given domain.',
})

const domainConnection = connectionDefinitions({
  name: 'Domain',
  nodeType: domainType,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description: 'The total amount of domains the user has access to.',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
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
      type: GraphQLString,
      description: `The time when the scan was initiated.`,
      resolve: ({ timestamp }) => timestamp,
    },
    results: {
      type: dkimResultConnection.connectionType,
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
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description: 'The total amount of dkim scans related to a given domain.',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
})

const dkimResultType = new GraphQLObjectType({
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
      resolve: ({ selector }) => selector,
    },
    record: {
      type: GraphQLString,
      description: 'DKIM record retrieved during the scan of the domain.',
      resolve: ({ record }) => record,
    },
    keyLength: {
      type: GraphQLString,
      description: 'Size of the Public Key in bits',
      resolve: ({ keyLength }) => keyLength,
    },
    rawJson: {
      type: GraphQLJSON,
      description: 'Raw scan result.',
      resolve: ({ rawJson }) => JSON.stringify(rawJson),
    },
    guidanceTags: {
      type: guidanceTagConnection.connectionType,
      args: {
        ...connectionArgs,
      },
      description: 'Key tags found during scan.',
      resolve: async (
        { guidanceTags },
        args,
        { loaders: { dkimGuidanceTagConnectionsLoader } },
      ) => {
        const dkimTags = await dkimGuidanceTagConnectionsLoader({
          dkimGuidanceTags: guidanceTags,
          ...args,
        })
        return dkimTags
      },
    },
  }),
  interfaces: [nodeInterface],
  description: 'Individual scans results for the given dkim selector.',
})

const dkimResultConnection = connectionDefinitions({
  name: 'DKIMResult',
  nodeType: dkimResultType,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description:
        'The total amount of dkim results related to a given domain.',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
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
      type: GraphQLString,
      description: `The time when the scan was initiated.`,
      resolve: ({ timestamp }) => timestamp,
    },
    dmarcPhase: {
      type: GraphQLInt,
      description: `DMARC phase found during scan.`,
      resolve: ({ dmarcPhase }) => dmarcPhase,
    },
    record: {
      type: GraphQLString,
      description: `DMARC record retrieved during scan.`,
      resolve: ({ record }) => record,
    },
    pPolicy: {
      type: GraphQLString,
      description: `The requested policy you wish mailbox providers to apply
when your email fails DMARC authentication and alignment checks. `,
      resolve: ({ pPolicy }) => pPolicy,
    },
    spPolicy: {
      type: GraphQLString,
      description: `This tag is used to indicate a requested policy for all
subdomains where mail is failing the DMARC authentication and alignment checks.`,
      resolve: ({ spPolicy }) => spPolicy,
    },
    pct: {
      type: GraphQLInt,
      description: `The percentage of messages to which the DMARC policy is to be applied.`,
      resolve: ({ pct }) => pct,
    },
    rawJson: {
      type: GraphQLJSON,
      description: 'Raw scan result.',
      resolve: ({ rawJson }) => JSON.stringify(rawJson),
    },
    guidanceTags: {
      type: guidanceTagConnection.connectionType,
      args: {
        ...connectionArgs,
      },
      description: `Key tags found during DMARC Scan.`,
      resolve: async (
        { guidanceTags },
        args,
        { loaders: { dmarcGuidanceTagConnectionsLoader } },
      ) => {
        const dmarcTags = await dmarcGuidanceTagConnectionsLoader({
          dmarcGuidanceTags: guidanceTags,
          ...args,
        })
        return dmarcTags
      },
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
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description: 'The total amount of dmarc scans related to a given domain.',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
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
      type: GraphQLString,
      description: `The time the scan was initiated.`,
      resolve: ({ timestamp }) => timestamp,
    },
    lookups: {
      type: GraphQLInt,
      description: `The amount of DNS lookups.`,
      resolve: ({ lookups }) => lookups,
    },
    record: {
      type: GraphQLString,
      description: `SPF record retrieved during the scan of the given domain.`,
      resolve: ({ record }) => record,
    },
    spfDefault: {
      type: GraphQLString,
      description: `Instruction of what a recipient should do if there is not a match to your SPF record.`,
      resolve: ({ spfDefault }) => spfDefault,
    },
    rawJson: {
      type: GraphQLJSON,
      description: 'Raw scan result.',
      resolve: ({ rawJson }) => JSON.stringify(rawJson),
    },
    guidanceTags: {
      type: guidanceTagConnection.connectionType,
      args: {
        ...connectionArgs,
      },
      description: `Key tags found during scan.`,
      resolve: async (
        { guidanceTags },
        args,
        { loaders: { spfGuidanceTagConnectionsLoader } },
      ) => {
        const spfTags = await spfGuidanceTagConnectionsLoader({
          spfGuidanceTags: guidanceTags,
          ...args,
        })
        return spfTags
      },
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
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description: 'The total amount of spf scans related to a given domain.',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
})

const webScanType = new GraphQLObjectType({
  name: 'WebScan',
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
      type: GraphQLString,
      description: `The time the scan was initiated.`,
      resolve: ({ timestamp }) => timestamp,
    },
    implementation: {
      type: GraphQLString,
      description: `State of the HTTPS implementation on the server and any issues therein.`,
      resolve: ({ implementation }) => implementation,
    },
    enforced: {
      type: GraphQLString,
      description: `Degree to which HTTPS is enforced on the server based on behaviour.`,
      resolve: ({ enforced }) => enforced,
    },
    hsts: {
      type: GraphQLString,
      description: `Presence and completeness of HSTS implementation.`,
      resolve: ({ hsts }) => hsts,
    },
    hstsAge: {
      type: GraphQLString,
      description: `Denotes how long the domain should only be accessed using HTTPS`,
      resolve: ({ hstsAge }) => hstsAge,
    },
    preloaded: {
      type: GraphQLString,
      description: `Denotes whether the domain has been submitted and included within HSTS preload list.`,
      resolve: ({ preloaded }) => preloaded,
    },
    rawJson: {
      type: GraphQLJSON,
      description: 'Raw scan result.',
      resolve: ({ rawJson }) => JSON.stringify(rawJson),
    },
    guidanceTags: {
      type: guidanceTagConnection.connectionType,
      args: {
        ...connectionArgs,
      },
      description: `Key tags found during scan.`,
      resolve: async (
        { guidanceTags },
        args,
        { loaders: { httpsGuidanceTagConnectionsLoader } },
      ) => {
        const httpsTags = await httpsGuidanceTagConnectionsLoader({
          httpsGuidanceTags: guidanceTags,
          ...args,
        })
        return httpsTags
      },
    },
  }),
  interfaces: [nodeInterface],
  description: `Hyper Text Transfer Protocol Secure scan results.`,
})

const httpsConnection = connectionDefinitions({
  name: 'HTTPS',
  nodeType: httpsType,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description: 'The total amount of https scans for a given domain.',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
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
      type: GraphQLString,
      description: `The time when the scan was initiated.`,
      resolve: ({ timestamp }) => timestamp,
    },
    rawJson: {
      type: GraphQLJSON,
      description: 'Raw scan result.',
      resolve: ({ rawJson }) => JSON.stringify(rawJson),
    },
    guidanceTags: {
      type: guidanceTagConnection.connectionType,
      args: {
        ...connectionArgs,
      },
      description: `Key tags found during scan.`,
      resolve: async (
        { guidanceTags },
        args,
        { loaders: { sslGuidanceTagConnectionsLoader } },
      ) => {
        const sslTags = await sslGuidanceTagConnectionsLoader({
          sslGuidanceTags: guidanceTags,
          ...args,
        })
        return sslTags
      },
    },
  }),
  interfaces: [nodeInterface],
  description: `Secure Socket Layer scan results.`,
})

const sslConnection = connectionDefinitions({
  name: 'SSL',
  nodeType: sslType,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description: 'The total amount of https scans for a given domain.',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
})

/* End domain related objects */

const organizationType = new GraphQLObjectType({
  name: 'Organization',
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
      type: domainConnection.connectionType,
      description: 'The domains which are associated with this organization.',
      args: {
        ownership: {
          type: GraphQLBoolean,
          description:
            'Limit domains to those that belong to an organization that has ownership.',
        },
        ...connectionArgs,
      },
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
    affiliations: {
      type: userAffiliationsConnection.connectionType,
      description: 'Organization affiliations to various users.',
      args: connectionArgs,
      resolve: async (
        { _id },
        args,
        {
          i18n,
          auth: { checkPermission },
          loaders: { affiliationLoaderByOrgId },
        },
      ) => {
        const permission = await checkPermission({ orgId: _id })
        if (permission === 'admin' || permission === 'super_admin') {
          const affiliations = await affiliationLoaderByOrgId({
            orgId: _id,
            ...args,
          })
          return affiliations
        }
        throw new Error(
          i18n._(
            t`Cannot query affiliations on organization without admin permission or higher.`,
          ),
        )
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
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description: 'The total amount of organizations the user has access to.',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
})

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

module.exports = {
  dkimType,
  dkimConnection,
  dkimResultType,
  dkimResultConnection,
  dmarcType,
  dmarcConnection,
  domainType,
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
