const { GraphQLNonNull } = require('graphql')
const { Slug } = require('../../scalars')
const { domainType } = require('../../types')

const findDomainBySlug = {
  type: domainType,
  description: 'Retrieve a specific domain by providing a slug.',
  args: {
    urlSlug: {
      type: GraphQLNonNull(Slug),
      description: 'The slugified name of the domain you wish to retrieve.',
    },
  },
  resolve: async (
    _,
    args,
    {
      userKey,
      query,
      auth: { checkDomainPermission, userRequired },
      loaders: { domainLoaderBySlug, userLoaderByKey },
      validators: { cleanseInput },
    },
  ) => {
    // Cleanse input
    const urlSlug = cleanseInput(args.urlSlug)

    // Get User
    const user = await userRequired(userKey, userLoaderByKey)

    // Retrieve domain by slug
    const domain = await domainLoaderBySlug.load(urlSlug)

    if (typeof domain === 'undefined') {
      console.warn(`Could not retrieve domain.`)
      throw new Error(`No domain with the provided slug could be found.`)
    }

    // Check user permission for domain access
    const permitted = await checkDomainPermission(user._id, domain._id, query)

    if (!permitted) {
      console.warn(`Could not retrieve domain.`)
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
  findDomainBySlug,
}
