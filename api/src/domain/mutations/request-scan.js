import { t } from '@lingui/macro'
import { GraphQLString } from 'graphql'
import { mutationWithClientMutationId } from 'graphql-relay'

import { Domain } from '../../scalars'

export const requestScan = new mutationWithClientMutationId({
  name: 'RequestScan',
  description: 'This mutation is used to step a manual scan on a requested domain.',
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
      i18n,
      userKey,
      publish,
      auth: { checkDomainPermission, userRequired, verifiedRequired, loginRequiredBool },
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
        `User: ${userKey} attempted to step a one time scan on: ${domainInput} however domain cannot be found.`,
      )
      throw new Error(i18n._(t`Unable to request a one time scan on an unknown domain.`))
    }

    // Check to see if user has access to domain
    const permission = await checkDomainPermission({ domainId: domain._id })

    if (!permission) {
      console.warn(
        `User: ${userKey} attempted to step a one time scan on: ${domain.domain} however they do not have permission to do so.`,
      )
      throw new Error(
        i18n._(t`Permission Denied: Please contact organization user for help with scanning this domain.`),
      )
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
              `User: ${userKey} attempted to step a one time scan on: ${domain.domain} however a scan is already pending.`,
            )
            throw new Error(i18n._(t`Unable to request a one time scan on a domain that already has a pending scan.`))
          }
        })
      }
    } catch (err) {
      console.error(
        `Error occurred when user: ${userKey} attempted to step a one time scan on: ${domain.domain}, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to request a one time scan. Please try again.`))
    }

    await publish({
      channel: `domains.${domain._key}`,
      msg: {
        domain: domain.domain,
        domain_key: domain._key,
        selectors: domain.selectors ? domain.selectors : [],
        hash: domain.hash,
        user_key: null, // only used for One Time Scans
        shared_id: null, // only used for One Time Scans
      },
    })

    console.info(`User: ${userKey} successfully dispatched a one time scan on domain: ${domain.domain}.`)

    return {
      status: i18n._(t`Successfully dispatched one time scan.`),
    }
  },
})
