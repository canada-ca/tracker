const { GraphQLNonNull } = require('graphql')
const { Slug } = require('../../scalars')
const { organizationType } = require('../../types')

const findOrganizationBySlug = {
  type: organizationType,
  description:
    'Select all information on a selected organization that a user has access to.',
  args: {
    orgSlug: {
      type: GraphQLNonNull(Slug),
      description:
        'The slugified organization name you want to retrieve data for.',
    },
  },
  resolve: async (
    _,
    args,
    {
      userKey,
      query,
      auth: { checkPermission, userRequired },
      loaders: { orgLoaderBySlug, userLoaderByKey },
      validators: { cleanseInput },
    },
  ) => {
    // Cleanse input
    const orgSlug = cleanseInput(args.orgSlug)

    // Get User
    const user = await userRequired(userKey, userLoaderByKey)

    // Retrieve organization by slug
    const org = await orgLoaderBySlug.load(orgSlug)

    if (typeof org === 'undefined') {
      console.warn(`User ${user._key} could not retrieve organization.`)
      throw new Error(`No organization with the provided slug could be found.`)
    }

    // Check user permission for organization access
    const permission = await checkPermission(user._id, org._id, query)

    if (!['super_admin', 'admin', 'user'].includes(permission)) {
      console.warn(`User ${user._key} could not retrieve organization.`)
      throw new Error(`Could not retrieve specified organization.`)
    }

    console.info(
      `User ${user._key} successfully retrieved organization ${org._key}.`,
    )
    org.id = org._key
    return org
  },
}

module.exports = {
  findOrganizationBySlug,
}
