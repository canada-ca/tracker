import { t } from '@lingui/macro'
import { GraphQLID, GraphQLNonNull } from 'graphql'
import { fromGlobalId, mutationWithClientMutationId } from 'graphql-relay'

import { leaveOrganizationUnion } from '../unions'

export const leaveOrganization = new mutationWithClientMutationId({
  name: 'LeaveOrganization',
  description: '',
  inputFields: () => ({
    orgId: {
      type: GraphQLNonNull(GraphQLID),
      description: '',
    },
  }),
  outputFields: () => ({
    result: {
      type: leaveOrganizationUnion,
      description: '',
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
    const { id: orgId } = fromGlobalId(cleanseInput(args.orgId))

    const user = await userRequired()

    verifiedRequired({ user })

    const org = await loadOrgByKey.load(orgId)

    if (typeof org === 'undefined') {
      console.warn(`org undefined`)
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t``),
      }
    }

    // check to see if user belongs to org
    let affiliatedCursor
    try {
      affiliatedCursor = await query`
        WITH affiliations, organizations, users
        FOR v, e IN 1..1 INBOUND ${user._id} affiliations
          FILTER e._from == ${org._id}
          RETURN e
      `
    } catch (err) {
      console.error(`query error`)
      throw new Error(i18n._(t``))
    }

    if (affiliatedCursor.count === 0) {
      console.warn(`no affiliation`)
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t``),
      }
    }
    console.log('affiliation found')
  },
})
