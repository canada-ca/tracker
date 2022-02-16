import { t } from '@lingui/macro'
import { GraphQLString } from 'graphql'
import { mutationWithClientMutationId } from 'graphql-relay'
import { v4 as uuidv4 } from 'uuid'

import { Domain } from '../../scalars'

const {
  DNS_SCANNER_ENDPOINT,
  HTTPS_SCANNER_ENDPOINT,
  SSL_SCANNER_ENDPOINT,
} = process.env

export const requestScan = new mutationWithClientMutationId({
  name: 'RequestScan',
  description:
    'This mutation is used to step a manual scan on a requested domain.',
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
      fetch,
      userKey,
      auth: { checkDomainPermission, userRequired, verifiedRequired },
      loaders: { loadDomainByDomain },
      validators: { cleanseInput },
    },
  ) => {
    // User is required
    const user = await userRequired()

    verifiedRequired({ user })

    const requestedDomain = cleanseInput(args.domain)

    // Check to see if domain exists
    const domain = await loadDomainByDomain.load(requestedDomain)

    if (typeof domain === 'undefined') {
      console.warn(
        `User: ${userKey} attempted to step a one time scan on: ${requestedDomain} however domain cannot be found.`,
      )
      throw new Error(
        i18n._(t`Unable to request a one time scan on an unknown domain.`),
      )
    }

    // Check to see if user has access to domain
    const permission = await checkDomainPermission({ domainId: domain._id })

    if (!permission) {
      console.warn(
        `User: ${userKey} attempted to step a one time scan on: ${domain.domain} however they do not have permission to do so.`,
      )
      throw new Error(
        i18n._(
          t`Permission Denied: Please contact organization user for help with scanning this domain.`,
        ),
      )
    }

    const sharedId = uuidv4()

    const parameters = {
      domain_key: domain._key,
      domain: domain.domain,
      selectors: domain.selectors,
      user_key: userKey,
      shared_id: sharedId,
    }

    try {
      await fetch(DNS_SCANNER_ENDPOINT, {
        method: 'POST',
        body: JSON.stringify(parameters),
      })
    } catch (err) {
      console.error(
        `Fetch error when dispatching dns scan for user: ${userKey}, on domain: ${domain.domain}, error: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to dispatch one time scan. Please try again.`),
      )
    }

    try {
      await fetch(HTTPS_SCANNER_ENDPOINT, {
        method: 'POST',
        body: JSON.stringify(parameters),
      })
    } catch (err) {
      console.error(
        `Fetch error when dispatching https scan for user: ${userKey}, on domain: ${domain.domain}, error: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to dispatch one time scan. Please try again.`),
      )
    }

    try {
      await fetch(SSL_SCANNER_ENDPOINT, {
        method: 'POST',
        body: JSON.stringify(parameters),
      })
    } catch (err) {
      console.error(
        `Fetch error when dispatching ssl scan for user: ${userKey}, on domain: ${domain.domain}, error: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to dispatch one time scan. Please try again.`),
      )
    }

    console.info(
      `User: ${userKey} successfully dispatched a one time scan on domain: ${domain.domain}.`,
    )
    return {
      status: i18n._(t`Successfully dispatched one time scan.`),
    }
  },
})
