const { GraphQLNonNull, GraphQLID, GraphQLString } = require('graphql')
const { mutationWithClientMutationId, fromGlobalId } = require('graphql-relay')

const removeOrganization = new mutationWithClientMutationId({
  name: 'RemoveOrganization',
  description: 'This mutation allows the removal of unused organizations.',
  inputFields: () => ({
    id: {
      type: GraphQLNonNull(GraphQLID),
      description: 'The global id of the organization you wish you remove.',
    },
  }),
  outputFields: () => ({
    status: {
      type: GraphQLNonNull(GraphQLString),
      description:
        'Status string to inform the user if the organization was successfully removed.',
      resolve: async (payload) => {
        return payload.status
      },
    },
  }),
  mutateAndGetPayload: async (
    args,
    {
      query,
      userId,
      auth: { checkPermission, userRequired },
      validators: { cleanseInput },
      loaders: { orgLoaderById, userLoaderById },
    },
  ) => {
    // Cleanse Input
    const { type: _orgType, id: orgId } = fromGlobalId(cleanseInput(args.id))

    // Get user
    const user = await userRequired(userId, userLoaderById)

    // Get org from db
    const organization = await orgLoaderById.load(orgId)

    // Check to see if org exists
    if (typeof organization === 'undefined') {
      console.error(
        `User: ${userId} attempted to remove org: ${orgId}, but there is no org associated with that id.`,
      )
      throw new Error('Unable to remove organization. Please try again.')
    }

    // Get users permission
    const permission = await checkPermission(user._id, organization._id, query)

    // Check to see if org is blue check, and the user is super admin
    if (organization.blueCheck && permission !== 'super_admin') {
      console.warn(
        `User: ${userId} attempted to remove ${organization._key}, however the user is not a super admin.`,
      )
      throw new Error('Unable to remove organization. Please try again.')
    }

    if (permission !== 'super_admin' && permission !== 'admin') {
      console.warn(
        `User: ${userId} attempted to remove ${organization._key}, however the user does not have permission to this organization.`,
      )
      throw new Error('Unable to remove organization. Please try again.')
    }

    return {
      status: `Successfully remove ${organization.slug}.`,
    }
  },
})

module.exports = {
  removeOrganization,
}
