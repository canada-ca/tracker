import { t } from '@lingui/macro'
import { GraphQLID, GraphQLNonNull } from 'graphql'
import { fromGlobalId, mutationWithClientMutationId } from 'graphql-relay'

import { transferOrgOwnershipUnion } from '../unions'

export const transferOrgOwnership = new mutationWithClientMutationId({
  name: 'TransferOrgOwnership',
  description: 'This mutation allows a user to transfer org ownership to another user in the given org.',
  inputFields: () => ({
    orgId: {
      type: GraphQLNonNull(GraphQLID),
      description: '',
    },
    userId: {
      type: GraphQLNonNull(GraphQLID),
      description: '',
    },
  }),
	outputFields: () => ({
		result: {
			type: transferOrgOwnershipUnion,
			description: 
				'`TransferOrgOwnershipUnion` resolving to either a `TransferOrgOwnershipResult` or `AffilitionError`.',
			resolve: (payload) => payload,
		}
	}),
	mutateAndGetPayload: async (
		args,
		{
			i18n,
			query,
			collections,
			transaction,
			auth: { 
				checkOrgOwner,
				checkUserBelongsToOrg,
				userRequired,
				verifiedRequired
			},
			loaders: { loadOrgByKey, loadUserByKey },
			validators: { cleanseInput },
		},
	) => {
		const { id: orgKey } = fromGlobalId(cleanseInput(args.orgId))
		const { id: userTransferKey } = fromGlobalId(cleanseInput(args.userId))

		const requestingUser = await userRequired()

		verifiedRequired({ user: requestingUser })

		const org = await loadOrgByKey.load(orgKey)

		if (typeof org === 'undefined') {
			console.warn(`User: ${requestingUser._key} attempted to transfer org ownership of an undefined org.`)
			return {
				_type: 'error',
				code: 400,
				description: i18n._(t`Unable to transfer ownership of undefined organization.`)
			}
		}

		if (org.verified) {
			console.warn(`User: ${requestingUser._key} attempted to transfer ownership of a verified org: ${org._key}.`)
			return {
				_type: 'error',
				code: 400,
				description: i18n._(t`Unable to transfer ownership of a verified organization.`))
			}
		}

		const requestedUser = await loadUserByKey.load(userTransferKey)

		if (typeof requestedUser === 'undefined') {
			console.warn(`User: ${requestingUser._key} attempted to transfer org: ${org._key} ownership to an undefined user.`)
			return {
				_type: 'error',
				code: 400,
				description i18n._(t`Unable to transfer ownership of an org to an undefined user.`)
			}
		}
		
		const owner = await checkOrgOwner({ orgId: org._id })

		// check to see if requested user belongs to org
		let affiliationCursor
		try {
			affiliationCursor = await query`
				WITH affiliations, organizations, users
				FOR v, e IN 1..1 OUTBOUND ${org._id} affiliations
					FILTER e._to == ${requestedUser._id}
					RETURN e
			`
		} catch (err) {
			console.error(`Database error occurred for user: ${requestingUser._key} when they were attmepting to `)
			throw new Error(i18n._(t`Unable to transfer organization ownership. Please try again.`))
		}
	
		if (affiliationCursor.count < 1) {
			console.warn(`User: ${requestingUser._key} attempted to transfer org: ${org._key} ownership to user: ${requestedUser} but they are not affiliated with the org.`)
			return {
				_type: 'error',
				code: 400,
				description: i18n._(t`Unable to transfer ownership to a user outside the org. Please invite the user and try again.`),
			}
		}

		// remove current org owners role
		try {
			await trx.step(
				() =>
				  query`
						WITH affiliations, organizations, users
						FOR aff IN affilitions
							FILTER aff._from == ${org._id}
							AND aff._to == ${requestingUser._id}
							UPDATE aff WITH {
								owner: false,
							} IN affiliations
							RETURN aff
					`
			)
		} catch (err) {
			console.error(`Trx step error occurred while removing org: ${org._key} for user: ${requestingUser._key}.`)
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
							AND aff._to == ${requestedUser._id}
							UPDATE aff WITH {
								owner: true,
							} IN affiliations
							RETURN aff
					`
			)
		} catch (err) {
			console.error(`Trx step error occurred while setting org: ${org._key} new owner to user: ${requestedUser._key}.`)
			throw new Error(i18n._(t`Unable to transfer organization ownership. Please try again.`))
		}

		try {
			await trx.commit()
		} catch (err) {
			console.error(``)
			throw new Error(i18n._(t`Unable to transfer organization ownership. Please try again.`))
		}

		console.info(
						`User: ${requestingUser._key} successfully transfer org: ${org._key} ownership to user: ${requestedUser._key}.`
		)
		return {
			_type: 'regular'
			status: i18n._(t``)
		}
	}
})
