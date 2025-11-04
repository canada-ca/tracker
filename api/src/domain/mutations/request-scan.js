import { t } from '@lingui/macro'
import { GraphQLString } from 'graphql'
import { mutationWithClientMutationId } from 'graphql-relay'

import { Domain } from '../../scalars'
import { logActivity } from '../../audit-logs'
import { headers } from 'nats'

export const requestScan = new mutationWithClientMutationId({
  name: 'RequestScan',
  description: 'This mutation is used to start a manual scan on a requested domain.',
  inputFields: () => ({
    domain: {
      type: Domain,
      description: 'The domain that the scan will be ran on.',
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
      request: { ip },
      publish,
      auth: { checkDomainPermission, userRequired, verifiedRequired },
      loaders: { loadDomainByDomain, loadWebConnectionsByDomainId, loadWebScansByWebId },
      validators: { cleanseInput },
    },
  ) => {
    // Get User
    const user = await userRequired()
    verifiedRequired({ user })

    // Cleanse input
    const domainInput = cleanseInput(args.domain)

    // Check to see if domain exists
    const domain = await loadDomainByDomain.load(domainInput)

    if (typeof domain === 'undefined') {
      console.warn(
        `User: ${userKey} attempted to start a one time scan on: ${domainInput} however domain cannot be found.`,
      )
      throw new Error(i18n._(t`Unable to request a one time scan on an unknown domain.`))
    }

    // Check to see if user has access to domain
    const permission = await checkDomainPermission({ domainId: domain._id })

    if (!permission) {
      console.warn(
        `User: ${userKey} attempted to start a one time scan on: ${domain.domain} however they do not have permission to do so.`,
      )
      throw new Error(
        i18n._(t`Permission Denied: Please contact organization user for help with scanning this domain.`),
      )
    }

    let orgsClaimingDomainQuery
    try {
      orgsClaimingDomainQuery = await query`
        WITH domains, users, organizations
        LET userAffiliations = (
          FOR v, e IN 1..1 ANY ${user._id} affiliations
            FILTER e.permission != "pending"
            RETURN v
        )
        LET domainOrgClaims = (
          FOR v, e IN 1..1 ANY ${domain._id} claims
            RETURN v
        )
        LET orgsClaimingDomain = UNIQUE(domainOrgClaims[* FILTER CURRENT.verified == true || CURRENT IN userAffiliations])
        RETURN orgsClaimingDomain
    `
    } catch (err) {
      console.error(
        `Database error when retrieving organizations claiming domain: ${userKey} and domain: ${domain._id}: ${err}`,
      )
      throw new Error(i18n._(t`Error while requesting scan. Please try again.`))
    }

    let orgsClaimingDomain
    try {
      orgsClaimingDomain = await orgsClaimingDomainQuery.next()
    } catch (err) {
      console.error(
        `Cursor error when retrieving organizations claiming domain: ${userKey} and domain: ${domain._id}: ${err}`,
      )
      throw new Error(i18n._(t`Error while requesting scan. Please try again.`))
    }

    // Check to see if a scan is already pending
    try {
      const webConnections = await loadWebConnectionsByDomainId({
        domainId: domain._id,
        limit: 1,
        orderBy: { field: 'timestamp', direction: 'DESC' },
        excludePending: false,
      })
      if (webConnections.edges.length > 0) {
        const webConnection = webConnections.edges[0].node
        const webScans = await loadWebScansByWebId({ webId: webConnection._id })
        webScans.forEach((result) => {
          const timeDifferenceInMinutes = (Date.now() - new Date(webConnection.timestamp).getTime()) / 1000 / 60
          if (result.status.toUpperCase() === 'PENDING' && timeDifferenceInMinutes < 30) {
            console.warn(
              `User: ${userKey} attempted to start a one time scan on: ${domain.domain} however a scan is already pending.`,
            )
            throw new Error(i18n._(t`Unable to request a one time scan on a domain that already has a pending scan.`))
          }
        })
      }
    } catch (err) {
      console.error(
        `Error occurred when user: ${userKey} attempted to start a one time scan on: ${domain.domain}, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to request a one time scan. Please try again.`))
    }

    const hdrs = headers()
    hdrs.set('priority', 'high')

    await publish({
      channel: 'scans.requests_priority',
      msg: {
        domain: domain.domain,
        domain_key: domain._key,
        hash: domain.hash,
        user_key: null, // only used for One Time Scans
        shared_id: null, // only used for One Time Scans
      },
      options: {
        headers: hdrs,
      },
    })

    // Logs scan request activity for each org claiming domain
    for (const orgClaimingDomain of orgsClaimingDomain) {
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
        action: 'scan',
        target: {
          resource: domain.domain,
          organization: {
            id: orgClaimingDomain._key,
            name: orgClaimingDomain.orgDetails.en.name,
          }, // name of resource being acted upon
          resourceType: 'domain', // user, org, domain
        },
      })
    }

    console.info(`User: ${userKey} successfully dispatched a one time scan on domain: ${domain.domain}.`)

    return {
      status: i18n._(t`Successfully dispatched one time scan.`),
    }
  },
})
