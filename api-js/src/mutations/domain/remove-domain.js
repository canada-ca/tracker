const { GraphQLNonNull, GraphQLID, GraphQLString } = require('graphql')
const { mutationWithClientMutationId, fromGlobalId } = require('graphql-relay')

const removeDomain = new mutationWithClientMutationId({
  name: 'RemoveDomain',
  description: 'This mutation allows the removal of unused domains.',
  inputFields: () => ({
    domainId: {
      type: GraphQLNonNull(GraphQLID),
      description: 'The global id of the domain you wish to remove.',
    },
  }),
  outputFields: () => ({
    status: {
      type: GraphQLNonNull(GraphQLString),
      description:
        'Status string to inform the user if the domain was successfully removed.',
      resolve: async (payload) => {
        return payload.status
      },
    },
  }),
  mutateAndGetPayload: async (
    args,
    {
      query,
      collections,
      transaction,
      userId,
      auth: { checkPermission, userRequired },
      validators: { cleanseInput },
      loaders: {
        domainLoaderById,
        orgLoaderByDomainId,
        userLoaderById,
      },
    },
  ) => {
    // Cleanse Input
    const { type: _domainType, id: domainId } = fromGlobalId(
      cleanseInput(args.domainId),
    )

    // Get User
    const user = await userRequired(userId, userLoaderById)

    // Get domain from db
    const domain = await domainLoaderById.load(domainId)

    // Check to see if domain exists
    if (typeof domain === 'undefined') {
      console.warn(``)
      throw new Error('Unable to remove domain. Please try again.')
    }

    // Get Org from db
    const org = await orgLoaderByDomainId.load(domain._id)

    // Check to see if org exists
    if (typeof org === 'undefined') {
      console.warn(``)
      throw new Error('Unable to remove domain. Please try again.')
    }

    // Get permission
    const permission = await checkPermission(user._id, org._id, query)

    // Check to see if domain belongs to blue check org
    if (org.blueCheck && permission !== 'super_admin') {
      console.warn(``)
      throw new Error('Unable to remove domain. Please try again.')
    }

    if (permission !== 'super_admin' && permission !== 'admin') {
      console.warn(``)
      throw new Error('Unable to remove domain. Please try again.')
    }

    // Generate list of collections names
    const collectionStrings = []
    for (const property in collections) {
      collectionStrings.push(property.toString())
    }

    // Setup Trans action
    const trx = await transaction(collectionStrings)

    // Remove scan data
    try {
      await 
    } catch (err) {

    }
  },
})

module.exports = {
  removeDomain,
}
