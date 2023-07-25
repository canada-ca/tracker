import { t } from '@lingui/macro'
import { GraphQLBoolean, GraphQLInt, GraphQLObjectType, GraphQLString, GraphQLList } from 'graphql'
import { connectionArgs, globalIdField } from 'graphql-relay'

import { organizationSummaryType } from './organization-summary'
import { nodeInterface } from '../../node'
import { Acronym, Slug } from '../../scalars'
import { affiliationUserOrder } from '../../affiliation/inputs'
import { affiliationConnection } from '../../affiliation/objects'
import { domainOrder, domainFilter } from '../../domain/inputs'
import { domainConnection } from '../../domain/objects'
import { logActivity } from '../../audit-logs'

export const organizationType = new GraphQLObjectType({
  name: 'Organization',
  fields: () => ({
    id: globalIdField('organization'),
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
      description: 'Whether the organization is a verified organization.',
      resolve: ({ verified }) => verified,
    },
    summaries: {
      type: organizationSummaryType,
      description: 'Summaries based on scan types that are preformed on the given organizations domains.',
      resolve: ({ summaries }) => summaries,
    },
    domainCount: {
      type: GraphQLInt,
      description: 'The number of domains associated with this organization.',
      resolve: ({ domainCount }) => domainCount,
    },
    toCsv: {
      type: GraphQLString,
      description:
        'CSV formatted output of all domains in the organization including their email and web scan statuses.',
      args: {
        filters: {
          type: new GraphQLList(domainFilter),
          description: 'Filters used to limit domains returned.',
        },
      },
      resolve: async (
        { _id },
        args,
        {
          i18n,
          userKey,
          query,
          transaction,
          collections,
          auth: { checkPermission, userRequired, verifiedRequired },
          loaders: { loadOrganizationDomainStatuses },
        },
      ) => {
        const user = await userRequired()
        verifiedRequired({ user })

        const permission = await checkPermission({ orgId: _id })
        if (!['user', 'admin', 'owner', 'super_admin'].includes(permission)) {
          console.error(
            `User "${userKey}" attempted to retrieve CSV output for organization "${_id}". Permission: ${permission}`,
          )
          throw new Error(t`Permission Denied: Please contact organization user for help with retrieving this domain.`)
        }

        const domains = await loadOrganizationDomainStatuses({
          orgId: _id,
          ...args,
        })
        const headers = [
          'domain',
          'https',
          'hsts',
          'certificates',
          'protocols',
          'ciphers',
          'curves',
          'spf',
          'dkim',
          'dmarc',
          'tags',
          'hidden',
          'nxdomain',
          'blocked',
        ]
        let csvOutput = headers.join(',')
        domains.forEach((domain) => {
          let csvLine = `${domain.domain}`
          csvLine += headers.slice(1).reduce((previousValue, currentHeader) => {
            return `${previousValue},${domain.status[currentHeader]}`
          }, '')
          csvOutput += `\n${csvLine}`
        })

        // Get org names to use in activity log
        let orgNamesCursor
        try {
          orgNamesCursor = await query`
            LET org = DOCUMENT(organizations, ${_id})
            RETURN {
              "orgNameEN": org.orgDetails.en.name,
              "orgNameFR": org.orgDetails.fr.name,
            }
          `
        } catch (err) {
          console.error(
            `Database error occurred when user: ${userKey} attempted to export org: ${_id}. Error while creating cursor for retrieving organization names. error: ${err}`,
          )
          throw new Error(i18n._(t`Unable to export organization. Please try again.`))
        }

        let orgNames
        try {
          orgNames = await orgNamesCursor.next()
        } catch (err) {
          console.error(
            `Cursor error occurred when user: ${userKey} attempted to export org: ${_id}. Error while retrieving organization names. error: ${err}`,
          )
          throw new Error(i18n._(t`Unable to export organization. Please try again.`))
        }

        await logActivity({
          transaction,
          collections,
          query,
          initiatedBy: {
            id: user._key,
            userName: user.userName,
            role: permission,
          },
          action: 'export',
          target: {
            resource: {
              en: orgNames.orgNameEN,
              fr: orgNames.orgNameFR,
            },
            organization: {
              id: _id,
              name: orgNames.orgNameEN,
            }, // name of resource being acted upon
            resourceType: 'organization',
          },
        })

        return csvOutput
      },
    },
    domains: {
      type: domainConnection.connectionType,
      description: 'The domains which are associated with this organization.',
      args: {
        orderBy: {
          type: domainOrder,
          description: 'Ordering options for domain connections.',
        },
        ownership: {
          type: GraphQLBoolean,
          description: 'Limit domains to those that belong to an organization that has ownership.',
        },
        search: {
          type: GraphQLString,
          description: 'String used to search for domains.',
        },
        filters: {
          type: new GraphQLList(domainFilter),
          description: 'Filters used to limit domains returned.',
        },
        ...connectionArgs,
      },
      resolve: async (
        { _id },
        args,

        { auth: { checkPermission }, loaders: { loadDomainConnectionsByOrgId } },
      ) => {
        // Check to see requesting users permission to the org is
        const permission = await checkPermission({ orgId: _id })
        const connections = await loadDomainConnectionsByOrgId({
          orgId: _id,
          permission,
          ...args,
        })
        return connections
      },
    },
    affiliations: {
      type: affiliationConnection.connectionType,
      description: 'Organization affiliations to various users.',
      args: {
        orderBy: {
          type: affiliationUserOrder,
          description: 'Ordering options for affiliation connections.',
        },
        search: {
          type: GraphQLString,
          description: 'String used to search for affiliated users.',
        },
        includePending: {
          type: GraphQLBoolean,
          description: 'Exclude (false) or include only (true) pending affiliations in the results.',
        },
        ...connectionArgs,
      },
      resolve: async (
        { _id },
        args,
        { i18n, auth: { checkPermission }, loaders: { loadAffiliationConnectionsByOrgId } },
      ) => {
        const permission = await checkPermission({ orgId: _id })
        if (['admin', 'owner', 'super_admin'].includes(permission) === false) {
          throw new Error(i18n._(t`Cannot query affiliations on organization without admin permission or higher.`))
        }

        const affiliations = await loadAffiliationConnectionsByOrgId({
          orgId: _id,
          ...args,
        })
        return affiliations
      },
    },
    userHasPermission: {
      type: GraphQLBoolean,
      description:
        'Value that determines if a user is affiliated with an organization, whether through organization affiliation, verified affiliation, or through super admin status.',
      resolve: async ({ _id }, _args, { auth: { checkPermission } }) => {
        const permission = await checkPermission({ orgId: _id })
        return ['user', 'admin', 'super_admin', 'owner'].includes(permission)
      },
    },
  }),
  interfaces: [nodeInterface],
  description: 'Organization object containing information for a given Organization.',
})
