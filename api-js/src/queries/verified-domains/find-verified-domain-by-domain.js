const { GraphQLNonNull } = require('graphql')
const { t } = require('@lingui/macro')
const { Domain } = require('../../scalars')
const { verifiedDomainType } = require('../../types')

const findVerifiedDomainByDomain = {
  type: verifiedDomainType,
  description: 'Retrieve a specific verified domain by providing a domain.',
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
      loaders: { verifiedDomainLoaderByDomain },
      validators: { cleanseInput },
    },
  ) => {
    // Cleanse input
    const domainInput = cleanseInput(args.domain)

    // Retrieve domain by domain
    const domain = await verifiedDomainLoaderByDomain.load(domainInput)

    if (typeof domain === 'undefined') {
      console.warn(`User could not retrieve verified domain.`)
      throw new Error(
        i18n._(t`No verified domain with the provided domain could be found.`),
      )
    }

    domain.id = domain._key
    return domain
  },
}

module.exports = {
  findVerifiedDomainByDomain,
}
