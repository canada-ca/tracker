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
    },
  }),
  outputFields: () => ({
    result: {
      type: closeAccountUnion,
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
      auth: { userRequired },
      validators: { cleanseInput },
    },
  ) => {
    // const { id: userId } = cleanseInput(fromGlobalId(args.userId))

    const user = await userRequired()

    // check to see if user owns any orgs
    let orgOwnerAffiliationCursor
    try {
      orgOwnerAffiliationCursor = await query`
        WITH users, affiliations, organizations
        FOR v, e IN 1..1 INBOUND ${user._id} affiliations
          FILTER e.owner == true
          RETURN e
      `
    } catch (err) {
      console.error(``)
      throw new Error(i18n._(t``))
    }

    let orgOwnerAffiliationCheck
    try {
      orgOwnerAffiliationCheck = await orgOwnerAffiliationCursor.all()
    } catch (err) {
      console.error(``)
      throw new Error(i18n._(t``))
    }

    // Generate list of collections names
    const collectionStrings = []
    for (const property in collections) {
      collectionStrings.push(property.toString())
    }

    // Setup Trans action
    const trx = await transaction(collectionStrings)

    // loop through each found org
    for (const affiliation of orgOwnerAffiliationCheck) {
      let dmarcSummaryCheckCursor
      try {
        dmarcSummaryCheckCursor = await query`
          WITH domains, ownership, organizations
          FOR v, e IN 1..1 OUTBOUND ${affiliation._from} ownership
            RETURN e
        `
      } catch (err) {
        console.error(``)
        throw new Error(i18n._(t``))
      }

      let dmarcSummaryCheckList
      try {
        dmarcSummaryCheckList = await dmarcSummaryCheckCursor.all()
      } catch (err) {
        console.error(``)
        throw new Error(i18n._(t``))
      }

      // remove dmarc summary related things
      // for (const ownership of dmarcSummaryCheckList) {
      //   try {
      //     await trx.step(
      //       () => query`
      //         WITH ownership, organizations, domains, dmarcSummaries, domainsToDmarcSummaries
      //         LET dmarcSummaryEdges = (
      //           FOR v, e IN 1..1 OUTBOUND ${ownership._to} domainsToDmarcSummaries
      //             RETURN { edgeKey: e._key, dmarcSummaryId: e._to }
      //         )
      //         LET removeDmarcSummaryEdges = (
      //           FOR dmarcSummaryEdge IN dmarcSummaryEdges
      //             REMOVE dmarcSummaryEdge.edgeKey IN domainsToDmarcSummaries
      //             OPTIONS { waitForSync: true }
      //         )
      //         LET removeDmarcSummary = (
      //           FOR dmarcSummaryEdge IN dmarcSummaryEdges
      //             LET key = PARSE_IDENTIFIER(dmarcSummaryEdge.dmarcSummaryId).key
      //             REMOVE key IN dmarcSummaries
      //             OPTIONS { waitForSync: true }
      //         )
      //         RETURN true
      //       `,
      //     )
      //   } catch (err) {
      //     console.error(``)
      //     throw new Error(i18n._(t``))
      //   }

      //   try {
      //     await trx.step(
      //       () => query`
      //         WITH ownership, organizations, domains
      //         REMOVE ${ownership._key} IN ownership
      //         OPTIONS { waitForSync: true }
      //       `,
      //     )
      //   } catch (err) {
      //     console.error(``)
      //     throw new Error(i18n._(t``))
      //   }
      // }

      let domainCountCursor
      try {
        domainCountCursor = await query`
        WITH claims, domains, organizations
        LET domainIds = (
          FOR v, e IN 1..1 OUTBOUND ${affiliation._from} claims
            RETURN e._to
        )
        FOR domain IN domains
          FILTER domain._id IN domainIds
          LET count = LENGTH(
            FOR v, e IN 1..1 INBOUND domain._id claims
              RETURN 1
          )
          RETURN { _id: domain._id domain: domain.domain, count }
      `
      } catch (err) {
        console.error(``)
        throw new Error(i18n._(t``))
      }

      let domainCountList
      try {
        domainCountList = await domainCountCursor.all()
      } catch (err) {
        console.error(``)
        throw new Error(i18n._(t``))
      }

      for (const domainObj of domainCountList) {
        if (domainObj.count === 1) {
          try {
            await trx.step(
              () => query`
                WITH dkim, domains, domainsDKIM, dkimToDkimResults, dkimResults
                LET dkimEdges = (
                  FOR v, e IN 1..1 OUTBOUND ${domainObj._id} domainsDKIM
                    RETURN { edgeKey: e._key, dkimId: e._to }
                )
                FOR dkimEdge IN dkimEdges
                  LET dkimResultEdges = (
                    FOR v, e IN 1..1 OUTBOUND dkimEdge.dkimId dkimToDkimResults
                      RETURN { edgeKey: e._key dkimResultId: e._to }
                  )
                  LET removeDkimResultEdges = (
                    FOR dkimResultEdge IN dkimResultEdges
                      REMOVE dkimResultEdge.edgeKey IN dkimToDkimResults
                      OPTIONS { waitForSync: true }
                  )
                  LET removeDkimResult = (
                    FOR dkimResultEdge IN dkimResultEdges
                      REMOVE PARSE_IDENTIFIER(dkimResultEdge.dkimResultId).key 
                      IN dkimResults OPTIONS { waitForSync: true }
                  )
                RETURN true
              `,
            )
          } catch (err) {
            console.error(``)
            throw new Error(i18n._(t``))
          }
          try {
            await Promise.all([
              trx.step(
                () => query`
                  WITH dkim, domains, domainsDKIM
                  LET dkimEdges = (
                    FOR v, e IN 1..1 OUTBOUND ${domainObj._id} domainsDKIM
                      RETURN { edgeKey: e._key, dkimId: e._to }
                  )
                  LET removeDkimEdges = (
                    FOR dkimEdge IN dkimEdges
                      REMOVE dkimEdge.edgeKey IN domainsDKIM
                      OPTIONS { waitForSync: true }
                  )
                  LET removeDkim = (
                    FOR dkimEdge IN dkimEdges
                      REMOVE PARSE_IDENTIFIER(dkimEdge.dkimId).key
                      IN dkim OPTIONS { waitForSync: true }
                  )
                  RETURN true
                `,
              ),
              trx.step(
                () => query`
                  WITH dmarc, domains, domainsDMARC
                  LET dmarcEdges = (
                    FOR v, e IN 1..1 OUTBOUND ${domainObj._id} domainsDMARC
                      RETURN { edgeKey: e._key, dmarcId: e._to }
                  )
                  LET removeDmarcEdges = (
                    FOR dmarcEdge IN dmarcEdges
                      REMOVE dmarcEdge.edgeKey IN domainsDMARC
                      OPTIONS { waitForSync: true }
                  )
                  LET removeDmarc = (
                    FOR dmarcEdge IN dmarcEdges
                      REMOVE PARSE_IDENTIFIER(dmarcEdge.dmarcId).key
                      IN dmarc OPTIONS { waitForSync: true }
                  )
                  RETURN true
                `,
              ),
              trx.step(
                () => query`
                  WITH spf, domains, domainsSPF
                  LET spfEdges = (
                    FOR v, e IN 1..1 OUTBOUND ${domainObj._id} domainsSPF
                      RETURN { edgeKey: e._key, spfId: e._to }
                  )
                  LET removeSpfEdges = (
                    FOR spfEdge IN spfEdges
                      REMOVE spfEdge.edgeKey IN domainsSPF
                      OPTIONS { waitForSync: true }
                  )
                  LET removeSpf = (
                    FOR spfEdge IN spfEdges
                      REMOVE PARSE_IDENTIFIER(spfEdge.spfId).key
                      IN spf OPTIONS { waitForSync: true }
                  )
                  RETURN true
                `,
              ),
            ])
          } catch (err) {
            console.error(``)
            throw new Error(i18n._(t``))
          }
        }
      }
    }
  },
})
