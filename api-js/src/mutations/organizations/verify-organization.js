const { GraphQLNonNull, GraphQLID, GraphQLString } = require('graphql')
const { mutationWithClientMutationId, fromGlobalId } = require('graphql-relay')
const { t } = require('@lingui/macro')

const verifyOrganization = new mutationWithClientMutationId({
  name: 'VerifyOrganization',
  description: 'Mutation allows the verification of an organization.',
  inputFields: () => ({
    orgId: {
      type: GraphQLNonNull(GraphQLID),
      description: 'The global id of the organization to be verified.',
    },
  }),
  outputFields: () => ({
    status: {
      type: GraphQLString,
      description: 'Status of organization verification.',
      resolve: async ({ status }) => status,
    },
  }),
  mutateAndGetPayload: async (
    args,
    {
      i18n,
      query,
      collections,
      transaction,
      userId,
      auth: { checkPermission, userRequired },
      loaders: { orgLoaderByKey },
      validators: { cleanseInput },
    },
  ) => {
    const { id: orgKey } = fromGlobalId(cleanseInput(args.orgId))

    // Ensure that user is required
    await userRequired()

    // Check to see if org exists
    const currentOrg = await orgLoaderByKey.load(orgKey)

    if (typeof currentOrg === 'undefined') {
      console.warn(
        `User: ${userId} attempted to verify organization: ${orgKey}, however no organizations is associated with that id.`,
      )
      throw new Error(
        i18n._(t`Unable to verify organization. Please try again.`),
      )
    }

    // Check to see if use has permission
    const permission = await checkPermission({ orgId: currentOrg._id })

    if (permission !== 'super_admin') {
      console.warn(
        `User: ${userId} attempted to verify organization: ${orgKey}, however they do not have the correct permission level. Permission: ${permission}`,
      )
      throw new Error(
        i18n._(t`Unable to verify organization. Please try again.`),
      )
    }

    // Check to see if org is already verified
    if (currentOrg.verified) {
      console.warn(
        `User: ${userId} attempted to verify organization: ${orgKey}, however the organization has already been verified.`,
      )
      throw new Error(i18n._(t`Organization has already been verified.`))
    }

    // Set org to verified
    currentOrg.verified = true

    // Generate list of collections names
    const collectionStrings = []
    for (const property in collections) {
      collectionStrings.push(property.toString())
    }

    // Setup Trans action
    const trx = await transaction(collectionStrings)

    // Upsert new org details
    try {
      await trx.run(
        async () =>
          await query`
            UPSERT { _key: ${orgKey} }
              INSERT ${currentOrg}
              UPDATE ${currentOrg}
              IN organizations
          `,
      )
    } catch (err) {
      console.error(
        `Transaction error occurred while upserting verified org: ${orgKey}, err: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to verify organization. Please try again.`),
      )
    }

    try {
      await trx.commit()
    } catch (err) {
      console.error(
        `Transaction error occurred while committing newly verified org: ${orgKey}, err: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to verify organization. Please try again.`),
      )
    }

    console.info(`User: ${userId}, successfully verified org: ${orgKey}.`)

    return {
      status: i18n._(
        t`Successfully verified organization: ${currentOrg.slug}.`,
      ),
    }
  },
})

module.exports = {
  verifyOrganization,
}
