import {t} from '@lingui/macro'
import {GraphQLBoolean, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString,} from 'graphql'
import {connectionArgs, globalIdField} from 'graphql-relay'

import {domainStatus} from './domain-status'
import {PeriodEnums} from '../../enums'
import {nodeInterface} from '../../node'
import {Domain, Selectors, Year} from '../../scalars'
import {dmarcSummaryType} from '../../dmarc-summaries/objects'
import {dnsScanConnection} from '../../dns-scan/objects/dns-scan-connection'
import {webScanType} from '../../web-scan/objects'
import {organizationOrder} from '../../organization/inputs'
import {organizationConnection} from '../../organization/objects'
import {GraphQLDate} from "graphql-scalars";
import {dmarcOrder} from "../../email-scan/inputs";

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
      type: GraphQLString,
      description: 'The current dmarc phase the domain is compliant to.',
      resolve: ({ phase }) => phase,
    },
    hasDMARCReport: {
      type: GraphQLBoolean,
      description: 'Whether or not the domain has a aggregate dmarc report.',
      resolve: async (
        { _id },
        _,
        { auth: { checkDomainOwnership, userRequired, loginRequiredBool } },
      ) => {
        if (loginRequiredBool) await userRequired()
        const hasDMARCReport = await checkDomainOwnership({
          domainId: _id,
        })

        return hasDMARCReport
      },
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
          description:
            'Filter orgs based off of the user being an admin of them.',
        },
        includeSuperAdminOrg: {
          type: GraphQLBoolean,
          description:
            'Filter org list to either include or exclude the super admin org.',
        },
        ...connectionArgs,
      },
      description: 'The organization that this domain belongs to.',
      resolve: async (
        { _id },
        args,
        {
          auth: { checkSuperAdmin },
          loaders: { loadOrgConnectionsByDomainId },
        },
      ) => {
        const isSuperAdmin = await checkSuperAdmin()

        const orgs = await loadOrgConnectionsByDomainId({
          domainId: _id,
          isSuperAdmin,
          ...args,
        })
        return orgs
      },
    },
    dnsScan: {
      type: dnsScanConnection.connectionType,
      args: {
        startDate: {
          type: GraphQLDate,
          description: 'Start date for date filter.',
        },
        endDate: {
          type: GraphQLDate,
          description: 'End date for date filter.',
        },
        orderBy: {
          type: dmarcOrder,
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
        { loaders: { loadDnsConnectionsByDomainId } },
      ) => {
        return await loadDnsConnectionsByDomainId({
          domainId: _id,
          ...args,
        })
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
      type: dmarcSummaryType,
      resolve: async (
        { _id, _key, domain },
        { month, year },
        {
          i18n,
          userKey,
          loaders: {
            loadDmarcSummaryEdgeByDomainIdAndPeriod,
            loadStartDateFromPeriod,
          },
          auth: { checkDomainOwnership, userRequired, loginRequiredBool },
        },
      ) => {
        if (loginRequiredBool) {
          await userRequired()
          const permitted = await checkDomainOwnership({
            domainId: _id,
          })

          if (!permitted) {
            console.warn(
              `User: ${userKey} attempted to access dmarc report period data for ${_key}, but does not belong to an org with ownership.`,
            )
            throw new Error(
              i18n._(
                t`Unable to retrieve DMARC report information for: ${domain}`,
              ),
            )
          }
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
        {
          i18n,
          userKey,
          loaders: { loadDmarcYearlySumEdge },
          auth: { checkDomainOwnership, userRequired, loginRequiredBool },
        },
      ) => {
        if (loginRequiredBool) {
          await userRequired()

          const permitted = await checkDomainOwnership({
            domainId: _id,
          })

          if (!permitted) {
            console.warn(
              `User: ${userKey} attempted to access dmarc report period data for ${_key}, but does not belong to an org with ownership.`,
            )
            throw new Error(
              i18n._(
                t`Unable to retrieve DMARC report information for: ${domain}`,
              ),
            )
          }
        }

        const dmarcSummaryEdges = await loadDmarcYearlySumEdge({
          domainId: _id,
        })

        const edges = dmarcSummaryEdges.map((edge) => ({
          domainKey: _key,
          _id: edge._to,
          startDate: edge.startDate,
        }))

        return edges
      },
    },
  }),
  interfaces: [nodeInterface],
  description: 'Domain object containing information for a given domain.',
})
