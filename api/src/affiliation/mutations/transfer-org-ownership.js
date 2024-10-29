import { t } from '@lingui/macro'
import { GraphQLID, GraphQLNonNull } from 'graphql'
import { fromGlobalId, mutationWithClientMutationId } from 'graphql-relay'

import { transferOrgOwnershipUnion } from '../unions'

export const transferOrgOwnership = new mutationWithClientMutationId({
  name: 'TransferOrgOwnership',
  description: 'This mutation allows a user to transfer org ownership to another user in the given org.',
  inputFields: () => ({
    orgId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'Id of the organization the user is looking to transfer ownership of.',
    },
    userId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'Id of the user that the org ownership is being transferred to.',
    },
  }),
  outputFields: () => ({
    result: {
      type: transferOrgOwnershipUnion,
      description:
        '`TransferOrgOwnershipUnion` resolving to either a `TransferOrgOwnershipResult` or `AffiliationError`.',
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
      auth: { checkOrgOwner, userRequired, verifiedRequired },
      loaders: { loadOrgByKey, loadUserByKey },
      validators: { cleanseInput },
    },
  ) => {
    // cleanse inputs
    const { id: orgKey } = fromGlobalId(cleanseInput(args.orgId))
    const { id: userTransferKey } = fromGlobalId(cleanseInput(args.userId))

    // protect mutation from un-authed users
    const requestingUser = await userRequired()

    // ensure that user has email verified their account
    verifiedRequired({ user: requestingUser })

    // load the requested org
    const org = await loadOrgByKey.load(orgKey)

    // ensure requested org is not undefined
    if (typeof org === 'undefined') {
      console.warn(`User: ${requestingUser._key} attempted to transfer org ownership of an undefined org.`)
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to transfer ownership of undefined organization.`),
      }
    }

    // get org owner bool value
    const owner = await checkOrgOwner({ orgId: org._id })

    // check to see if requesting user is the org owner
    if (!owner) {
      console.warn(
        `User: ${requestingUser._key} attempted to transfer org: ${org.slug} ownership but does not have current ownership.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Permission Denied: Please contact org owner to transfer ownership.`),
      }
    }

    // get the user that is org ownership is being transferred to
    const requestedUser = await loadUserByKey.load(userTransferKey)

    // check to ensure requested user is not undefined
    if (typeof requestedUser === 'undefined') {
      console.warn(
        `User: ${requestingUser._key} attempted to transfer org: ${org.slug} ownership to an undefined user.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to transfer ownership of an org to an undefined user.`),
      }
    }

    // query db for requested user affiliation to org
    let affiliationCursor
    try {
      affiliationCursor = await query`
				WITH affiliations, organizations, users
				FOR v, e IN 1..1 OUTBOUND ${org._id} affiliations
					FILTER e._to == ${requestedUser._id}
					RETURN e
			`
    } catch (err) {
      console.error(
        `Database error occurred for user: ${requestingUser._key} when they were attempting to transfer org: ${org.slug} ownership to user: ${requestedUser._key}: ${err}`,
      )
      throw new Error(i18n._(t`Unable to transfer organization ownership. Please try again.`))
    }

    // check to see if requested user belongs to org
    if (affiliationCursor.count < 1) {
      console.warn(
        `User: ${requestingUser._key} attempted to transfer org: ${org.slug} ownership to user: ${requestedUser._key} but they are not affiliated with the org.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(
          t`Unable to transfer ownership to a user outside the org. Please invite the user and try again.`,
        ),
      }
    }

    // Setup Trans action
    const trx = await transaction(collections)

    // remove current org owners role
    try {
      await trx.step(
        () =>
          query`
						WITH affiliations, organizations, users
						FOR aff IN affiliations
							FILTER aff._from == ${org._id}
							FILTER aff._to == ${requestingUser._id}
							UPDATE { _key: aff._key } WITH {
								permission: "admin",
							} IN affiliations
							RETURN aff
					`,
      )
    } catch (err) {
      console.error(
        `Trx step error occurred for user: ${requestingUser._key} when they were attempting to transfer org: ${org.slug} ownership to user: ${requestedUser._key}: ${err}`,
      )
      await trx.abort()
      throw new Error(i18n._(t`Unable to transfer organization ownership. Please try again.`))
    }

    // set new org owner
    try {
      await trx.step(
        () =>
          query`
						WITH affiliations, organizations, users
						FOR aff IN affiliations
							FILTER aff._from == ${org._id}
							FILTER aff._to == ${requestedUser._id}
							UPDATE { _key: aff._key } WITH {
								permission: "owner",
							} IN affiliations
							RETURN aff
					`,
      )
    } catch (err) {
      console.error(
        `Trx step error occurred for user: ${requestingUser._key} when they were attempting to transfer org: ${org.slug} ownership to user: ${requestedUser._key}: ${err}`,
      )
      await trx.abort()
      throw new Error(i18n._(t`Unable to transfer organization ownership. Please try again.`))
    }

    // commit changes to the db
    try {
      await trx.commit()
    } catch (err) {
      console.error(
        `Trx commit error occurred for user: ${requestingUser._key} when they were attempting to transfer org: ${org.slug} ownership to user: ${requestedUser._key}: ${err}`,
      )
      await trx.abort()
      throw new Error(i18n._(t`Unable to transfer organization ownership. Please try again.`))
    }

    console.info(
      `User: ${requestingUser._key} successfully transfer org: ${org.slug} ownership to user: ${requestedUser._key}.`,
    )
    return {
      _type: 'regular',
      status: i18n._(t`Successfully transferred org: ${org.slug} ownership to user: ${requestedUser.userName}`),
    }
  },
})
