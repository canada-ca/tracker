import { t } from '@lingui/macro'
import { GraphQLID, GraphQLNonNull } from 'graphql'
import { fromGlobalId, mutationWithClientMutationId } from 'graphql-relay'

import { leaveOrganizationUnion } from '../unions'

export const leaveOrganization = new mutationWithClientMutationId({
  name: 'LeaveOrganization',
  description: 'This mutation allows users to leave a given organization.',
  inputFields: () => ({
    orgId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'Id of the organization the user is looking to leave.',
    },
  }),
  outputFields: () => ({
    result: {
      type: leaveOrganizationUnion,
      description: '`LeaveOrganizationUnion` resolving to either a `LeaveOrganizationResult` or `AffiliationError`.',
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
      auth: { userRequired, verifiedRequired },
      loaders: { loadOrgByKey },
      validators: { cleanseInput },
    },
  ) => {
    const { id: orgKey } = fromGlobalId(cleanseInput(args.orgId))

    const user = await userRequired()

    verifiedRequired({ user })

    const org = await loadOrgByKey.load(orgKey)

    if (typeof org === 'undefined') {
      console.warn(`User ${user._key} attempted to leave undefined organization: ${orgKey}`)
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to leave undefined organization.`),
      }
    }

    // Setup Trans action
    const trx = await transaction(collections)

    try {
      await trx.step(
        () =>
          query`
              WITH affiliations, organizations, users
              FOR v, e IN 1..1 OUTBOUND ${org._id} affiliations
                FILTER e._to == ${user._id}
                REMOVE { _key: e._key } IN affiliations
                OPTIONS { waitForSync: true }
            `,
      )
    } catch (err) {
      console.error(
        `Trx step error occurred when removing user: ${user._key} affiliation with org: ${org._key}: ${err}`,
      )
      await trx.abort()
      throw new Error(i18n._(t`Unable leave organization. Please try again.`))
    }

    try {
      await trx.commit()
    } catch (err) {
      console.error(`Trx commit error occurred when user: ${user._key} attempted to leave org: ${org._key}: ${err}`)
      await trx.abort()
      throw new Error(i18n._(t`Unable leave organization. Please try again.`))
    }

    console.info(`User: ${user._key} successfully left org: ${org.slug}.`)

    return {
      _type: 'regular',
      status: i18n._(t`Successfully left organization: ${org.slug}`),
    }
  },
})
