import {
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql'

import {
  connectionArgs,
  connectionDefinitions,
  globalIdField,
} from 'graphql-relay'

import { dmarcSummaryType } from '../../dmarc-summaries/objects'
import { emailScanType } from '../../email-scan/objects'
import { webScanType } from '../../web-scan/objects'
import { Domain, Selectors, Year } from '../../scalars'
import { PeriodEnums } from '../../enums'
import { domainStatus } from './domain-status'
import { nodeInterface } from '../../node'
import { organizationConnection } from '../../organization/objects'

export const domainType = new GraphQLObjectType({
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
      type: dmarcSummaryType,
      resolve: async (
        { _id, _key, domain },
        { month, year },
        {
          userKey,
          loaders: {
            dmarcSummaryEdgeLoaderByDomainIdPeriod,
            loadStartDateFromPeriod,
          },
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
          throw new Error(
            `Unable to retrieve dmarc report information for: ${domain}`,
          )
        }

        const startDate = loadStartDateFromPeriod({ period: month, year })

        const dmarcSummaryEdge = await dmarcSummaryEdgeLoaderByDomainIdPeriod({
          domainId: _id,
          startDate,
        })

        return dmarcSummaryEdge
      },
    },
    yearlyDmarcSummaries: {
      description: 'Yearly summarized DMARC aggregate reports.',
      type: new GraphQLList(dmarcSummaryType),
      resolve: async (
        { _id, _key, domain },
        __,
        {
          userKey,
          loaders: { dmarcYearlySumEdgeLoader },
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
          throw new Error(
            `Unable to retrieve dmarc report information for: ${domain}`,
          )
        }

        const dmarcSummaryEdges = await dmarcYearlySumEdgeLoader({
          domainId: _id,
        })
        return dmarcSummaryEdges
      },
    },
  }),
  interfaces: [nodeInterface],
  description: 'Domain object containing information for a given domain.',
})

export const domainConnection = connectionDefinitions({
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
