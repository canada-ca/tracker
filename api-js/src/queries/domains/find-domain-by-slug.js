const { GraphQLNonNull } = require('graphql')
const { Slug } = require('../../scalars')
const { domainType } = require('../../types')

const findDomainBySlug = {
  type: domainType,
  description: 'Retrieve information relating to a specific domain by providing a slug.',
  args: {
    urlSlug: {
      type: GraphQLNonNull(Slug),
      description: 'The slugified domain for which you wish to retrieve data.',
    },
  },
  resolve: async (
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

    // Check user permission for domain access
    const permitted = await checkDomainPermission(user._id, domain._id, query)

    if ( !permitted ) {
      console.warn(`User ${user._id} not permitted to access domain.`)
      throw new Error(`User ${user._id} is not permitted to access specified domain.`)
    }

    if (domain == null) {
      console.warn(`Could not retrieve domain.`)
      throw new Error(`No domain with the provided slug could be found.`)
    }

    if (typeof domain === 'undefined') {
      console.warn('Undefined domain.')
      throw new Error("Query returned domain with type 'undefined'.")
    }
    console.info(`User ${user._id} successfully retrieved domain ${domain._id}.`)
    return domain
  },
}

module.exports = {
  findDomainBySlug,
}
