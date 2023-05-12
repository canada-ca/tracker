import { t } from '@lingui/macro'
import { GraphQLID } from 'graphql'
import { fromGlobalId, mutationWithClientMutationId } from 'graphql-relay'
import { logActivity } from '../../audit-logs/mutations/log-activity'

import { closeAccountUnion } from '../unions'

export const closeAccount = new mutationWithClientMutationId({
  name: 'CloseAccount',
  description: `This mutation allows a user to close their account, or a super admin to close another user's account.`,
  inputFields: () => ({
    userId: {
      type: GraphQLID,
      description: 'The user id of a user you want to close the account of.',
    },
  }),
  outputFields: () => ({
    result: {
      type: closeAccountUnion,
      description: '`CloseAccountUnion` returning either a `CloseAccountResult`, or `CloseAccountError` object.',
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
      auth: { checkSuperAdmin, userRequired },
      loaders: { loadUserByKey },
      validators: { cleanseInput },
    },
  ) => {
    let submittedUserId
    if (args?.userId) {
      submittedUserId = fromGlobalId(cleanseInput(args.userId)).id
    }

    const user = await userRequired()

    let userId = ''
    let targetUserName = ''
    if (submittedUserId) {
      const permission = await checkSuperAdmin()
      if (!permission) {
        console.warn(
          `User: ${user._key} attempted to close user: ${submittedUserId} account, but requesting user is not a super admin.`,
        )
        return {
          _type: 'error',
          code: 400,
          description: i18n._(t`Permission error: Unable to close other user's account.`),
        }
      }

      const checkUser = await loadUserByKey.load(submittedUserId)
      if (typeof checkUser === 'undefined') {
        console.warn(
          `User: ${user._key} attempted to close user: ${submittedUserId} account, but requested user is undefined.`,
        )
        return {
          _type: 'error',
          code: 400,
          description: i18n._(t`Unable to close account of an undefined user.`),
        }
      }
      userId = checkUser._id
      targetUserName = checkUser.userName
    } else {
      userId = user._id
      targetUserName = user.userName
    }

    // check to see if user owns any orgs
    let orgOwnerAffiliationCursor
    try {
      orgOwnerAffiliationCursor = await query`
        WITH users, affiliations, organizations
        FOR v, e IN 1..1 INBOUND ${userId} affiliations
          FILTER e.permission == "owner"
          RETURN e
      `
    } catch (err) {
      console.error(
        `Database error occurred when getting affiliations when user: ${user._key} attempted to close account: ${userId}: ${err}`,
      )
      throw new Error(i18n._(t`Unable to close account. Please try again.`))
    }

    let orgOwnerAffiliationCheck
    try {
      orgOwnerAffiliationCheck = await orgOwnerAffiliationCursor.all()
    } catch (err) {
      console.error(
        `Cursor error occurred when getting affiliations when user: ${user._key} attempted to close account: ${userId}: ${err}`,
      )
      throw new Error(i18n._(t`Unable to close account. Please try again.`))
    }

    // Setup Trans action
    const trx = await transaction(collections)

    // loop through each found org
    for (const affiliation of orgOwnerAffiliationCheck) {
      let dmarcSummaryCheckCursor
      try {
        dmarcSummaryCheckCursor = await query`
          WITH domains, ownership, organizations, users
          FOR v, e IN 1..1 OUTBOUND ${affiliation._from} ownership
            RETURN e
        `
      } catch (err) {
        console.error(
          `Database error occurred when getting ownership info when user: ${user._key} attempted to close account: ${userId}: ${err}`,
        )
        throw new Error(i18n._(t`Unable to close account. Please try again.`))
      }

      let dmarcSummaryCheckList
      try {
        dmarcSummaryCheckList = await dmarcSummaryCheckCursor.all()
      } catch (err) {
        console.error(
          `Cursor error occurred when getting ownership info when user: ${user._key} attempted to close account: ${userId}: ${err}`,
        )
        throw new Error(i18n._(t`Unable to close account. Please try again.`))
      }

      // remove dmarc summary related things
      for (const ownership of dmarcSummaryCheckList) {
        try {
          await trx.step(
            () => query`
              WITH ownership, organizations, domains, dmarcSummaries, domainsToDmarcSummaries
              LET dmarcSummaryEdges = (
                FOR v, e IN 1..1 OUTBOUND ${ownership._to} domainsToDmarcSummaries
                  RETURN { edgeKey: e._key, dmarcSummaryId: e._to }
              )
              LET removeDmarcSummaryEdges = (
                FOR dmarcSummaryEdge IN dmarcSummaryEdges
                  REMOVE dmarcSummaryEdge.edgeKey IN domainsToDmarcSummaries
                  OPTIONS { waitForSync: true }
              )
              LET removeDmarcSummary = (
                FOR dmarcSummaryEdge IN dmarcSummaryEdges
                  LET key = PARSE_IDENTIFIER(dmarcSummaryEdge.dmarcSummaryId).key
                  REMOVE key IN dmarcSummaries
                  OPTIONS { waitForSync: true }
              )
              RETURN true
            `,
          )
        } catch (err) {
          console.error(
            `Trx step error occurred when removing dmarc summaries when user: ${user._key} attempted to close account: ${userId}: ${err}`,
          )
          throw new Error(i18n._(t`Unable to close account. Please try again.`))
        }

        try {
          await trx.step(
            () => query`
              WITH ownership, organizations, domains
              REMOVE ${ownership._key} IN ownership
              OPTIONS { waitForSync: true }
            `,
          )
        } catch (err) {
          console.error(
            `Trx step error occurred when removing ownerships when user: ${user._key} attempted to close account: ${userId}: ${err}`,
          )
          throw new Error(i18n._(t`Unable to close account. Please try again.`))
        }
      }

      let domainCountCursor
      try {
        domainCountCursor = await query`
        WITH claims, domains, organizations, users
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
          RETURN {
            _id: domain._id,
            _key: domain._key,
            domain: domain.domain,
            count: count
          }
      `
      } catch (err) {
        console.error(
          `Database error occurred when getting claim info when user: ${user._key} attempted to close account: ${userId}: ${err}`,
        )
        throw new Error(i18n._(t`Unable to close account. Please try again.`))
      }

      let domainCountList
      try {
        domainCountList = await domainCountCursor.all()
      } catch (err) {
        console.error(
          `Cursor error occurred when getting claim info when user: ${user._key} attempted to close account: ${userId}: ${err}`,
        )
        throw new Error(i18n._(t`Unable to close account. Please try again.`))
      }

      for (const domainObj of domainCountList) {
        if (domainObj.count === 1) {
          // Remove scan data

          try {
            // Remove web data
            await trx.step(async () => {
              await query`
            WITH web, webScan, domains
            FOR webV, domainsWebEdge IN 1..1 OUTBOUND ${domainObj._id} domainsWeb
              FOR webScanV, webToWebScansV In 1..1 OUTBOUND webV._id webToWebScans
                REMOVE webScanV IN webScan
                REMOVE webToWebScansV IN webToWebScans
                OPTIONS { waitForSync: true }
              REMOVE webV IN web
              REMOVE domainsWebEdge IN domainsWeb
              OPTIONS { waitForSync: true }
          `
            })
          } catch (err) {
            console.error(
              `Trx step error occurred while user: ${userId} attempted to remove web data for ${domainObj.domain} in org: ${affiliation._from} while closing account, ${err}`,
            )
            throw new Error(i18n._(t`Unable to close account. Please try again.`))
          }

          try {
            // Remove DNS data
            await trx.step(async () => {
              await query`
            WITH dns, domains
            FOR dnsV, domainsDNSEdge IN 1..1 OUTBOUND ${domainObj._id} domainsDNS
              REMOVE dnsV IN dns
              REMOVE domainsDNSEdge IN domainsDNS
              OPTIONS { waitForSync: true }
          `
            })
          } catch (err) {
            console.error(
              `Trx step error occurred while user: ${userId} attempted to remove DNS data for ${domainObj.domain} in org: ${affiliation._from}, ${err}`,
            )
            throw new Error(i18n._(t`Unable to close account. Please try again.`))
          }

          try {
            await trx.step(
              () => query`
                WITH claims, domains, organizations, users
                LET domainEdges = (
                  FOR v, e IN 1..1 OUTBOUND ${affiliation._from} claims
                    FILTER e._to == ${domainObj._id}
                    RETURN { edgeKey: e._key, domainId: e._to }
                )
                LET removeDomainEdges = (
                  FOR domainEdge IN domainEdges
                    REMOVE domainEdge.edgeKey IN claims
                    OPTIONS { waitForSync: true }
                )
                LET removeDomain = (
                  FOR domainEdge IN domainEdges
                    REMOVE PARSE_IDENTIFIER(domainEdge.domainId).key
                    IN domains OPTIONS { waitForSync: true }
                )
                RETURN true
              `,
            )
          } catch (err) {
            console.error(
              `Trx step error occurred when removing domains and claims when user: ${user._key} attempted to close account: ${userId}: ${err}`,
            )
            throw new Error(i18n._(t`Unable to close account. Please try again.`))
          }
        } else {
          try {
            await trx.step(
              () => query`
                WITH claims, domains, organizations, users
                LET domainEdges = (
                  FOR v, e IN 1..1 OUTBOUND ${affiliation._from} claims
                    RETURN { edgeKey: e._key, domainId: e._to }
                )
                LET removeDomainEdges = (
                  FOR domainEdge IN domainEdges
                    REMOVE domainEdge.edgeKey IN claims
                    OPTIONS { waitForSync: true }
                )
                RETURN true
              `,
            )
          } catch (err) {
            console.error(
              `Trx step error occurred when removing domain claims when user: ${user._key} attempted to close account: ${userId}: ${err}`,
            )
            throw new Error(i18n._(t`Unable to close account. Please try again.`))
          }
        }
      }

      // remove users affiliation
      try {
        await Promise.all([
          trx.step(
            () => query`
              WITH affiliations, organizations, users
              LET userEdges = (
                FOR v, e IN 1..1 INBOUND ${affiliation._from} affiliations
                  RETURN { edgeKey: e._key, userKey: e._to }
              )
              LET removeUserEdges = (
                FOR userEdge IN userEdges
                  REMOVE userEdge.userKey IN affiliations
                  OPTIONS { waitForSync: true }
              )
              RETURN true
            `,
          ),
          trx.step(
            () => query`
              WITH organizations
              REMOVE PARSE_IDENTIFIER(${affiliation._from}).key
              IN organizations OPTIONS { waitForSync: true }
            `,
          ),
        ])
      } catch (err) {
        console.error(
          `Trx step error occurred when removing ownership org and users affiliations when user: ${user._key} attempted to close account: ${userId}: ${err}`,
        )
        throw new Error(i18n._(t`Unable to close account. Please try again.`))
      }
    }

    try {
      await trx.step(
        () => query`
          WITH affiliations, organizations, users
          FOR v, e IN 1..1 INBOUND ${userId} affiliations
            REMOVE { _key: e._key } IN affiliations
            OPTIONS { waitForSync: true }
        `,
      )
    } catch (err) {
      console.error(
        `Trx step error occurred when removing users remaining affiliations when user: ${user._key} attempted to close account: ${userId}: ${err}`,
      )
      throw new Error(i18n._(t`Unable to close account. Please try again.`))
    }

    try {
      await trx.step(
        () => query`
          WITH users
          REMOVE PARSE_IDENTIFIER(${userId}).key
          IN users OPTIONS { waitForSync: true }
        `,
      )
    } catch (err) {
      console.error(
        `Trx step error occurred when removing user: ${user._key} attempted to close account: ${userId}: ${err}`,
      )
      throw new Error(i18n._(t`Unable to close account. Please try again.`))
    }

    try {
      await trx.commit()
    } catch (err) {
      console.error(`Trx commit error occurred when user: ${user._key} attempted to close account: ${userId}: ${err}`)
      throw new Error(i18n._(t`Unable to close account. Please try again.`))
    }

    console.info(`User: ${user._key} successfully closed user: ${userId} account.`)
    await logActivity({
      transaction,
      collections,
      query,
      initiatedBy: {
        id: user._key,
        userName: user.userName,
        role: submittedUserId ? 'SUPER_ADMIN' : '',
      },
      action: 'delete',
      target: {
        resource: targetUserName, // name of resource being acted upon
        resourceType: 'user', // user, org, domain
      },
    })

    return {
      _type: 'regular',
      status: i18n._(t`Successfully closed account.`),
    }
  },
})
