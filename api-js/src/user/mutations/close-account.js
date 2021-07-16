import { t } from '@lingui/macro'
import { GraphQLID } from 'graphql'
import { fromGlobalId, mutationWithClientMutationId } from 'graphql-relay'

import { closeAccountUnion } from '../unions'

export const closeAccount = new mutationWithClientMutationId({
  name: 'CloseAccount',
  description: '',
  inputFields: () => ({
    userId: {
      type: GraphQLID,
      description: '',
    }
  }),
  outputFields: () => ({
    result: {
      type: closeAccountUnion,
      description: '',
      resolve: (payload) => payload,
    },
  }),
  mutateAndGetPayload: async (
    _args,
    {
      i18n,
      query,
      collections,
      transaction,
      auth: { userRequired },
      validators: { cleanseInput }
    },
  ) => {
    const { id: userId } = cleanseInput(fromGlobalId(args.userId))

    const user = await userRequired()

    // check to see if user owns any orgs
    let orgOwnerAffiliationCursor
    try {
      orgOwnerAffiliationCursor = await query`
        WITH users, affiliations, organizations
        FOR v, e IN 1..1 OUTBOUND ${user._id} affiliations
          FILTER e.owner == true
          RETURN e
      `
    } catch (err) {
      console.error(``)
      throw new Error(i18n._(t``))
    }

    let orgOwnerAffiliationCheck
    try {
      orgOwnerAffiliationCheck = await orgOwnerAffiliationCursor.next()
    } catch (err) {
      console.error(``)
      throw new Error(i18n._(t``))
    }

    // loop through each found org
    for (const affiliation in orgOwnerAffiliationCheck) {
      let domainCountCursor
      try {
        domainCountCursor = await query`
          WITH claims, domains, organizations
          LET domainIds = (
            FOR v, e IN 1..1 ANY ${affiliation._from} claims
              RETURN e._to
          )
          FOR domain IN domains
            FILTER domain._id IN domainIds
            LET count = LENGTH(
              FOR v, e IN 1..1 ANY domain._id claims
                RETURN 1
            )
            RETURN 
        `
      } catch (err) {
        console.error(``)
        throw new Error(i18n._(t``))
      }

      let dmarcSummaryCheckCursor
      try {
        dmarcSummaryCheckCursor = await query`
          WITH domains, ownership, dmarcSummaries, organizations
          LET domainIds = (
            FOR v, e IN 1..1 ANY ${affiliation._from} ownership
              RETURN e._to
          )
          FOR domain IN domains
            FILTER domain._id IN domainIds
            RETURN domain
        `
      } catch (err) {
        console.error(``)
        throw new Error(i18n._(t``))
      }

    }
  },
})
