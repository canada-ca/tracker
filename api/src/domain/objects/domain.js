import { t } from '@lingui/macro'
import { GraphQLBoolean, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql'
import { connectionArgs, globalIdField } from 'graphql-relay'

import { domainStatus } from './domain-status'
import { AssetStateEnums, PeriodEnums, DmarcPhaseEnum } from '../../enums'
import { nodeInterface } from '../../node'
import { CveID, Domain, Selectors, Year } from '../../scalars'
import { dmarcSummaryType } from '../../dmarc-summaries/objects'
import { dnsScanConnection } from '../../dns-scan/objects/dns-scan-connection'
import { webConnection } from '../../web-scan/objects'
import { organizationOrder } from '../../organization/inputs'
import { organizationConnection } from '../../organization/objects'
import { GraphQLDateTime } from 'graphql-scalars'
import { dnsOrder } from '../../dns-scan/inputs'
import { webOrder } from '../../web-scan/inputs/web-order'
import { additionalFinding } from '../../additional-findings/objects/additional-finding'
import { tagType } from '../../tags/objects'

export const domainType = new GraphQLObjectType({
  name: 'Domain',
  fields: () => ({
    id: globalIdField('domain'),
    domain: {
      type: Domain,
      description: 'Domain that scans will be ran on.',
      resolve: ({ domain }) => domain,
    },
    dmarcPhase: {
      type: DmarcPhaseEnum,
      description: 'The current dmarc phase the domain is compliant to.',
      resolve: ({ phase }) => phase,
    },
    hasDMARCReport: {
      type: GraphQLBoolean,
      description: 'Whether or not the domain has a aggregate dmarc report.',
      resolve: async ({ _id }, _, { auth: { checkDomainOwnership } }) => {
        return await checkDomainOwnership({
          domainId: _id,
        })
      },
    },
    lastRan: {
      type: GraphQLString,
      description: 'The last time that a scan was ran on this domain.',
      resolve: ({ lastRan }) => lastRan,
    },
    rcode: {
      type: GraphQLString,
      description: `The status code when performing a DNS lookup for this domain.`,
    },
    selectors: {
      type: new GraphQLList(Selectors),
      description: 'Domain Keys Identified Mail (DKIM) selector strings associated with domain.',
      resolve: async (
        { _id },
        _,
        { userKey, auth: { checkDomainPermission, userRequired }, loaders: { loadDkimSelectorsByDomainId } },
      ) => {
        await userRequired()
        const permitted = await checkDomainPermission({ domainId: _id })
        if (!permitted) {
          console.warn(`User: ${userKey} attempted to access selectors for ${_id}, but does not have permission.`)
          throw new Error(t`Cannot query domain selectors without permission.`)
        }

        return await loadDkimSelectorsByDomainId({
          domainId: _id,
        })
      },
    },
    status: {
      type: domainStatus,
      description: 'The domains scan status, based on the latest scan data.',
      resolve: ({ status }) => status,
    },
    archived: {
      description: 'Value that determines if a domain is excluded from any results and scans.',
      type: GraphQLBoolean,
      resolve: ({ archived }) => archived,
    },
    blocked: {
      description: 'Value that determines if a domain is possibly blocked.',
      type: GraphQLBoolean,
      resolve: ({ blocked }) => blocked,
    },
    wildcardSibling: {
      description: 'Value that determines if a domain has a wildcard sibling.',
      type: GraphQLBoolean,
      resolve: ({ wildcardSibling }) => wildcardSibling,
    },
    wildcardEntry: {
      description: 'Value that determines if a domain has a wildcard entry.',
      type: GraphQLBoolean,
      resolve: ({ wildcardEntry }) => wildcardEntry,
    },
    webScanPending: {
      description: 'Value that determines if a domain has a web scan pending.',
      type: GraphQLBoolean,
      resolve: ({ webScanPending }) => webScanPending,
    },
    organizations: {
      type: organizationConnection.connectionType,
      args: {
        orderBy: {
          type: organizationOrder,
          description: 'Ordering options for organization connections',
        },
        search: {
          type: GraphQLString,
          description: 'String argument used to search for organizations.',
        },
        isAdmin: {
          type: GraphQLBoolean,
          description: 'Filter orgs based off of the user being an admin of them.',
        },
        includeSuperAdminOrg: {
          type: GraphQLBoolean,
          description: 'Filter org list to either include or exclude the super admin org.',
        },
        ...connectionArgs,
      },
      description: 'The organization that this domain belongs to.',
      resolve: async ({ _id }, args, { auth: { checkSuperAdmin }, loaders: { loadOrgConnectionsByDomainId } }) => {
        const isSuperAdmin = await checkSuperAdmin()

        return await loadOrgConnectionsByDomainId({
          domainId: _id,
          isSuperAdmin,
          ...args,
        })
      },
    },
    dnsScan: {
      type: dnsScanConnection.connectionType,
      args: {
        startDate: {
          type: GraphQLDateTime,
          description: 'Start date for date filter.',
        },
        endDate: {
          type: GraphQLDateTime,
          description: 'End date for date filter.',
        },
        orderBy: {
          type: dnsOrder,
          description: 'Ordering options for DNS connections.',
        },
        limit: {
          type: GraphQLInt,
          description: 'Number of DNS scans to retrieve.',
        },
        ...connectionArgs,
      },
      description: `DNS scan results.`,
      resolve: async (
        { _id },
        args,
        { userKey, auth: { checkDomainPermission, userRequired }, loaders: { loadDnsConnectionsByDomainId } },
      ) => {
        await userRequired()
        const permitted = await checkDomainPermission({ domainId: _id })
        if (!permitted) {
          console.warn(
            `User: ${userKey} attempted to access dns scan results for ${_id}, but does not have permission.`,
          )
          throw new Error(t`Cannot query dns scan results without permission.`)
        }

        return await loadDnsConnectionsByDomainId({
          domainId: _id,
          ...args,
        })
      },
    },
    web: {
      type: webConnection.connectionType,
      description: 'HTTPS, and TLS scan results.',
      args: {
        startDate: {
          type: GraphQLDateTime,
          description: 'Start date for date filter.',
        },
        endDate: {
          type: GraphQLDateTime,
          description: 'End date for date filter.',
        },
        orderBy: {
          type: webOrder,
          description: 'Ordering options for web connections.',
        },
        limit: {
          type: GraphQLInt,
          description: 'Number of web scans to retrieve.',
        },
        excludePending: {
          type: GraphQLBoolean,
          description: `Exclude web scans which have pending status.`,
        },
        ...connectionArgs,
      },
      resolve: async (
        { _id },
        args,
        { userKey, auth: { checkDomainPermission, userRequired }, loaders: { loadWebConnectionsByDomainId } },
      ) => {
        await userRequired()
        const permitted = await checkDomainPermission({ domainId: _id })
        if (!permitted) {
          console.warn(
            `User: ${userKey} attempted to access web scan results for ${_id}, but does not have permission.`,
          )
          throw new Error(t`Cannot query web scan results without permission.`)
        }

        return await loadWebConnectionsByDomainId({
          domainId: _id,
          ...args,
        })
      },
    },
    additionalFindings: {
      type: additionalFinding,
      description: 'Additional findings imported from an external ASM tool.',
      resolve: async (
        { _id },
        _,
        { userKey, auth: { checkDomainPermission, userRequired }, loaders: { loadAdditionalFindingsByDomainId } },
      ) => {
        await userRequired()
        const permitted = await checkDomainPermission({ domainId: _id })
        if (!permitted) {
          console.warn(
            `User: ${userKey} attempted to access additional findings for domain: ${_id}, but does not have permission.`,
          )
          throw new Error(t`Cannot query additional findings without permission.`)
        }

        return await loadAdditionalFindingsByDomainId({
          domainId: _id,
        })
      },
    },
    ignoredCves: {
      type: new GraphQLList(CveID),
      description: 'List of CVEs that have been ignored by the user.',
      resolve: ({ ignoredCves }) => ignoredCves || [],
    },
    dmarcSummaryByPeriod: {
      description: 'Summarized DMARC aggregate reports.',
      args: {
        month: {
          type: new GraphQLNonNull(PeriodEnums),
          description: 'The month in which the returned data is relevant to.',
        },
        year: {
          type: new GraphQLNonNull(Year),
          description: 'The year in which the returned data is relevant to.',
        },
      },
      type: dmarcSummaryType,
      resolve: async (
        { _id, _key, domain },
        { month, year },
        {
          i18n,
          userKey,
          loaders: { loadDmarcSummaryEdgeByDomainIdAndPeriod, loadStartDateFromPeriod },
          auth: { checkDomainOwnership, userRequired },
        },
      ) => {
        await userRequired()
        const permitted = await checkDomainOwnership({
          domainId: _id,
        })

        if (!permitted) {
          console.warn(
            `User: ${userKey} attempted to access dmarc report period data for ${_key}, but does not belong to an org with ownership.`,
          )
          throw new Error(i18n._(t`Unable to retrieve DMARC report information for: ${domain}`))
        }

        const startDate = loadStartDateFromPeriod({ period: month, year })

        const dmarcSummaryEdge = await loadDmarcSummaryEdgeByDomainIdAndPeriod({
          domainId: _id,
          startDate,
        })

        return {
          domainKey: _key,
          _id: dmarcSummaryEdge._to,
          startDate: startDate,
        }
      },
    },
    yearlyDmarcSummaries: {
      description: 'Yearly summarized DMARC aggregate reports.',
      type: new GraphQLList(dmarcSummaryType),
      resolve: async (
        { _id, _key, domain },
        __,
        { i18n, userKey, loaders: { loadDmarcYearlySumEdge }, auth: { checkDomainOwnership, userRequired } },
      ) => {
        await userRequired()

        const permitted = await checkDomainOwnership({
          domainId: _id,
        })

        if (!permitted) {
          console.warn(
            `User: ${userKey} attempted to access dmarc report period data for ${_key}, but does not belong to an org with ownership.`,
          )
          throw new Error(i18n._(t`Unable to retrieve DMARC report information for: ${domain}`))
        }

        const dmarcSummaryEdges = await loadDmarcYearlySumEdge({
          domainId: _id,
        })

        return dmarcSummaryEdges.map((edge) => ({
          domainKey: _key,
          _id: edge._to,
          startDate: edge.startDate,
        }))
      },
    },
    claimTags: {
      description: 'List of labelled tags users of an organization have applied to the claimed domain.',
      type: new GraphQLList(tagType),
      args: {
        isVisible: {
          type: GraphQLBoolean,
          description: 'Filter tags to only those that are visible.',
          defaultValue: true,
        },
      },
      resolve: async ({ claimTags }, args, { loaders: { loadTagByTagId } }) => {
        const loadedTags = await loadTagByTagId.loadMany(claimTags)
        return loadedTags.filter((tag) => {
          return args.isVisible ? tag.visible : true
        })
      },
    },
    userHasPermission: {
      description:
        'Value that determines if a user is affiliated with a domain, whether through organization affiliation, verified organization network affiliation, or through super admin status.',
      type: GraphQLBoolean,
      resolve: async ({ _id }, __, { auth: { checkDomainPermission } }) => {
        return await checkDomainPermission({
          domainId: _id,
        })
      },
    },
    ignoreRua: {
      description: 'Value that determines if a domain is ignoring rua reports.',
      type: GraphQLBoolean,
      resolve: ({ ignoreRua }) => ignoreRua,
    },
    assetState: {
      description: 'Value that determines if a domain is considered an asset.',
      type: AssetStateEnums,
      resolve: ({ assetState }) => assetState,
    },
    hasEntrustCertificate: {
      type: GraphQLBoolean,
      description: `Whether or not the certificate chain contains an Entrust certificate.`,
      resolve: ({ hasEntrustCertificate }) => hasEntrustCertificate,
    },
    cveDetected: {
      type: GraphQLBoolean,
      description: `Whether or not a CVE has been detected in the domain's additional findings.`,
      resolve: ({ cveDetected }) => cveDetected,
    },
  }),
  interfaces: [nodeInterface],
  description: 'Domain object containing information for a given domain.',
})
