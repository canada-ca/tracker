import { GraphQLNonNull } from 'graphql'
import { t } from '@lingui/macro'
import { Domain } from '../../scalars'

import { domainType } from '../objects'

export const findDomainByDomain = {
  type: domainType,
  description: 'Retrieve a specific domain by providing a domain.',
  args: {
    domain: {
      type: GraphQLNonNull(Domain),
      description: 'The domain you wish to retrieve information for.',
    },
  },
  resolve: async (
    _,
    args,
    {
      i18n,
      auth: { checkDomainPermission, userRequired, verifiedRequired },
      loaders: { loadDomainByDomain },
      validators: { cleanseInput },
    },
  ) => {
    // Get User
    const user = await userRequired()
    verifiedRequired({ user })

    // Cleanse input
    const domainInput = cleanseInput(args.domain)

    // Retrieve domain by domain
    const domain = await loadDomainByDomain.load(domainInput)

    if (typeof domain === 'undefined') {
      console.warn(`User ${user._key} could not retrieve domain.`)
      throw new Error(i18n._(t`Unable to find the requested domain.`))
    }

    // Check user permission for domain access
    const permitted = await checkDomainPermission({ domainId: domain._id })

    if (!permitted) {
      console.warn(`User ${user._key} could not retrieve domain.`)
      throw new Error(
        i18n._(
          t`Permission Denied: Please contact organization user for help with retrieving this domain.`,
        ),
      )
    }

    console.info(
      `User ${user._key} successfully retrieved domain ${domain._key}.`,
    )

    return domain
  },
}
