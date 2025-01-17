import { t } from '@lingui/macro'
import { GraphQLID, GraphQLNonNull, GraphQLString } from 'graphql'
import { fromGlobalId, mutationWithClientMutationId } from 'graphql-relay'

import { Domain } from '../../scalars'
import { logActivity } from '../../audit-logs'

export const requestDiscovery = new mutationWithClientMutationId({
  name: 'RequestDiscovery',
  description: 'This mutation is used to start a subdomain discovery scan on a requested domain.',
  inputFields: () => ({
    domain: {
      type: Domain,
      description: 'The base domain that the subdomain scan will be ran on.',
    },
    orgId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The global id of the organization you wish to assign new found domains to.',
    },
  }),
  outputFields: () => ({
    status: {
      type: GraphQLString,
      description: 'Informs the user if the scan was dispatched successfully.',
      resolve: ({ status }) => status,
    },
  }),
  mutateAndGetPayload: async (
    args,
    {
      query,
      collections,
      transaction,
      i18n,
      userKey,
      publish,
      request: { ip },
      auth: { checkDomainPermission, userRequired, verifiedRequired, checkSuperAdmin, superAdminRequired },
      loaders: { loadDomainByDomain, loadOrgByKey },
      validators: { cleanseInput },
    },
  ) => {
    // Get User
    const user = await userRequired()
    verifiedRequired({ user })

    // Keep feature to super admins while in beta
    const isSuperAdmin = await checkSuperAdmin()
    superAdminRequired({ user, isSuperAdmin })

    // Cleanse input
    const { type: _orgType, id: orgId } = fromGlobalId(cleanseInput(args.orgId))
    const domainInput = cleanseInput(args.domain)

    // Check to see if domain is valid for subdomain discovery.
    // Discovery should not be performed on a domain that is not a subdomain of canada.ca or gc.ca, or on the root domains themselves
    const regex = /^[A-Za-z0-9](?:[A-Za-z0-9\-.]+[A-Za-z0-9])?.(canada|gc).ca$/gm
    const found = domainInput.match(regex)
    if (typeof found === 'undefined' || found?.length !== 1) {
      console.warn(
        `User: ${userKey} attempted to start a subdomain discovery scan on: ${domainInput} however domain is not a valid domain.`,
      )
      throw new Error(i18n._(t`Unable to request a subdomain discovery scan on an invalid domain.`))
    }

    // Check to see if domain exists
    const domain = await loadDomainByDomain.load(domainInput)

    if (typeof domain === 'undefined') {
      console.warn(
        `User: ${userKey} attempted to start a subdomain discovery scan on: ${domainInput} however domain cannot be found.`,
      )
      throw new Error(i18n._(t`Unable to request a subdomain discovery scan on an unknown domain.`))
    }

    // Check to see if org exists
    const org = await loadOrgByKey.load(orgId)

    if (typeof org === 'undefined') {
      console.warn(
        `User: ${userKey} attempted to discover subdomains in an organization: ${orgId} that does not exist.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to discover domains for unknown organization.`),
      }
    }

    // Check to see if user has access to domain
    const permission = await checkDomainPermission({ domainId: domain._id })

    if (!permission) {
      console.warn(
        `User: ${userKey} attempted to start a subdomain discovery scan on: ${domain.domain} however they do not have permission to do so.`,
      )
      throw new Error(
        i18n._(t`Permission Denied: Please contact organization user for help with scanning this domain.`),
      )
    }

    await publish({
      channel: `scans.discovery`,
      msg: {
        domain: domain.domain,
        orgId: org._id,
      },
    })

    await logActivity({
      transaction,
      collections,
      query,
      initiatedBy: {
        id: user._key,
        userName: user.userName,
        role: permission,
        ipAddress: ip,
      },
      action: 'discover',
      target: {
        resource: domain.domain,
        organization: {
          id: org._id,
          name: org.name,
        }, // name of resource being acted upon
        resourceType: 'domain', // user, org, domain
      },
    })

    console.info(`User: ${userKey} successfully dispatched a subdomain discovery scan on domain: ${domain.domain}.`)

    return {
      status: i18n._(t`Successfully dispatched subdomain discovery scan.`),
    }
  },
})
