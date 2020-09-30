const { GraphQLNonNull } = require('graphql')
const { Domain } = require('../../scalars')
const { domainType } = require('../../types')

const findDomainByDomain = {
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
      userId: userKey,
      query,
      auth: { checkDomainPermission, userRequired },
      loaders: { domainLoaderByDomain, userLoaderByKey },
      validators: { cleanseInput },
    },
  ) => {
    // Cleanse input
    const domainInput = cleanseInput(args.domain)

    // Get User
    const user = await userRequired(userKey, userLoaderByKey)

    // Retrieve domain by domain
    const domain = await domainLoaderByDomain.load(domainInput)

    if (typeof domain === 'undefined') {
      console.warn(`User ${user._key} could not retrieve domain.`)
      throw new Error(`No domain with the provided domain could be found.`)
    }

    // Check user permission for domain access
    const permitted = await checkDomainPermission(user._id, domain._id, query)

    if (!permitted) {
      console.warn(`User ${user._key} could not retrieve domain.`)
      throw new Error(`Could not retrieve specified domain.`)
    }

    console.info(
      `User ${user._key} successfully retrieved domain ${domain._key}.`,
    )
    domain.id = domain._key
    return domain
  },
}

module.exports = {
  findDomainByDomain,
}
