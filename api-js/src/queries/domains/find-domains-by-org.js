const { GraphQLNonNull } = require('graphql')
const { connectionArgs } = require('graphql-relay')
const { Slug } = require('../../scalars')
const { domainConnection } = require('../../types')

const findDomainsByOrg = {
  type: domainConnection.connectionType,
  description: 'Select domains belonging to a given organization.',
  args: {
    orgSlug: {
      type: GraphQLNonNull(Slug),
      description:
        'The slugified name of the organization you wish to retrieve data for.',
    },
    ...connectionArgs,
  },
  resolve: async (
    _,
    args,
    {
      userId: userKey,
      query,
      auth: { checkPermission, userRequired },
      loaders: {
        orgLoaderBySlug,
        userLoaderByKey,
        domainLoaderConnectionsByOrgId,
      },
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
      console.warn(
        `User ${user._key} could not retrieve non-existant organization's domains.`,
      )
      throw new Error(
        `Could not retrieve domains for the provided organization slug.`,
      )
    }

    // Check user permission for organization access
    const permission = await checkPermission(user._id, org._id, query)

    if (!['super_admin', 'admin', 'user'].includes(permission)) {
      console.warn(
        `User ${user._key} could not retrieve domains for specified organization.`,
      )
      throw new Error(`Could not retrieve domains for specified organization.`)
    }

    const domainConnections = await domainLoaderConnectionsByOrgId({
      orgId: org._id,
      ...args,
    })

    console.info(
      `User ${user._key} successfully retrieved domains belonging to organization ${org._key}.`,
    )

    return domainConnections
  },
}

module.exports = {
  findDomainsByOrg,
}
