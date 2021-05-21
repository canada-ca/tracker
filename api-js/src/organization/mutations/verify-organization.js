import { t } from '@lingui/macro'
import { GraphQLNonNull, GraphQLID } from 'graphql'
import { mutationWithClientMutationId, fromGlobalId } from 'graphql-relay'

import { verifyOrganizationUnion } from '../unions'

export const verifyOrganization = new mutationWithClientMutationId({
  name: 'VerifyOrganization',
  description: 'Mutation allows the verification of an organization.',
  inputFields: () => ({
    orgId: {
      type: GraphQLNonNull(GraphQLID),
      description: 'The global id of the organization to be verified.',
    },
  }),
  outputFields: () => ({
    result: {
      type: verifyOrganizationUnion,
      description:
        '`VerifyOrganizationUnion` returning either an `OrganizationResult`, or `OrganizationError` object.',
      resolve: (payload) => payload,
    },
  }),
  mutateAndGetPayload: async (
    args,
    {
      i18n,
      query,
      collections,
      transaction,
      userKey,
      auth: { checkPermission, userRequired },
      loaders: { loadOrgByKey },
      validators: { cleanseInput },
    },
  ) => {
    const { id: orgKey } = fromGlobalId(cleanseInput(args.orgId))

    // Ensure that user is required
    await userRequired()

    // Check to see if org exists
    const currentOrg = await loadOrgByKey.load(orgKey)

    if (typeof currentOrg === 'undefined') {
      console.warn(
        `User: ${userKey} attempted to verify organization: ${orgKey}, however no organizations is associated with that id.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to verify unknown organization.`),
      }
    }

    // Check to see if use has permission
    const permission = await checkPermission({ orgId: currentOrg._id })

    if (permission !== 'super_admin') {
      console.warn(
        `User: ${userKey} attempted to verify organization: ${orgKey}, however they do not have the correct permission level. Permission: ${permission}`,
      )
      return {
        _type: 'error',
        code: 403,
        description: i18n._(
          t`Permission Denied: Please contact super admin for help with verifying this organization.`,
        ),
      }
    }

    // Check to see if org is already verified
    if (currentOrg.verified) {
      console.warn(
        `User: ${userKey} attempted to verify organization: ${orgKey}, however the organization has already been verified.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Organization has already been verified.`),
      }
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
      await trx.step(
        async () =>
          await query`
            WITH organizations
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

    console.info(`User: ${userKey}, successfully verified org: ${orgKey}.`)

    return {
      _type: 'result',
      status: i18n._(
        t`Successfully verified organization: ${currentOrg.slug}.`,
      ),
      organization: currentOrg,
    }
  },
})
