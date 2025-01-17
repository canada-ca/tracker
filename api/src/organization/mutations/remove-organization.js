import { GraphQLNonNull, GraphQLID } from 'graphql'
import { mutationWithClientMutationId, fromGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

import { removeOrganizationUnion } from '../unions'
import { logActivity } from '../../audit-logs/mutations/log-activity'

export const removeOrganization = new mutationWithClientMutationId({
  name: 'RemoveOrganization',
  description: 'This mutation allows the removal of unused organizations.',
  inputFields: () => ({
    orgId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The global id of the organization you wish you remove.',
    },
  }),
  outputFields: () => ({
    result: {
      type: new GraphQLNonNull(removeOrganizationUnion),
      description: '`RemoveOrganizationUnion` returning either an `OrganizationResult`, or `OrganizationError` object.',
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
      request: { ip },
      auth: { checkPermission, userRequired, verifiedRequired },
      validators: { cleanseInput },
      loaders: { loadOrgByKey },
    },
  ) => {
    // Get user
    const user = await userRequired()

    verifiedRequired({ user })

    // Cleanse Input
    const { type: _orgType, id: orgId } = fromGlobalId(cleanseInput(args.orgId))

    // Get org from db
    const organization = await loadOrgByKey.load(orgId)

    // Check to see if org exists
    if (!organization) {
      console.warn(`User: ${userKey} attempted to remove org: ${orgId}, but there is no org associated with that id.`)
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to remove unknown organization.`),
      }
    }

    // Get users permission
    const permission = await checkPermission({ orgId: organization._id })

    if (['owner', 'super_admin'].includes(permission) === false) {
      console.warn(
        `User: ${userKey} attempted to remove org: ${organization._key}, however the user does not have permission to this organization.`,
      )
      return {
        _type: 'error',
        code: 403,
        description: i18n._(
          t`Permission Denied: Please contact organization admin for help with removing organization.`,
        ),
      }
    }

    // Check to see if org is verified check, and the user is super admin
    if (organization.verified && permission !== 'super_admin') {
      console.warn(
        `User: ${userKey} attempted to remove org: ${organization._key}, however the user is not a super admin.`,
      )
      return {
        _type: 'error',
        code: 403,
        description: i18n._(t`Permission Denied: Please contact super admin for help with removing organization.`),
      }
    }

    // Setup Trans action
    const trx = await transaction(collections)

    // check to see if org has any dmarc summaries
    let dmarcSummaryCheckCursor
    try {
      dmarcSummaryCheckCursor = await query`
        WITH domains, ownership, dmarcSummaries, organizations
        FOR v, e IN 1..1 OUTBOUND ${organization._id} ownership
          RETURN e
      `
    } catch (err) {
      console.error(
        `Database error occurred for user: ${userKey} while attempting to get dmarcSummaryInfo while removing org: ${organization._key}, ${err}`,
      )
      await trx.abort()
      throw new Error(i18n._(t`Unable to remove organization. Please try again.`))
    }

    let dmarcSummaryCheckList
    try {
      dmarcSummaryCheckList = await dmarcSummaryCheckCursor.all()
    } catch (err) {
      console.error(
        `Cursor error occurred for user: ${userKey} while attempting to get dmarcSummaryInfo while removing org: ${organization._key}, ${err}`,
      )
      await trx.abort()
      throw new Error(i18n._(t`Unable to remove organization. Please try again.`))
    }

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
          `Trx step error occurred for user: ${userKey} while attempting to remove dmarc summaries while removing org: ${organization._key}, ${err}`,
        )
        await trx.abort()
        throw new Error(i18n._(t`Unable to remove organization. Please try again.`))
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
          `Trx step error occurred for user: ${userKey} while attempting to remove ownerships while removing org: ${organization._key}, ${err}`,
        )
        await trx.abort()
        throw new Error(i18n._(t`Unable to remove organization. Please try again.`))
      }
    }

    // check to see if any other orgs are using this domain
    let countCursor
    try {
      countCursor = await query`
        WITH claims, domains, organizations
        LET domainIds = (
          FOR v, e IN 1..1 OUTBOUND ${organization._id} claims
            RETURN e._to
        )
        FOR domain IN domains
          FILTER domain._id IN domainIds
          LET count = LENGTH(
            FOR v, e IN 1..1 INBOUND domain._id claims
              RETURN 1
          )
          RETURN {
            "_id": domain._id,
            "_key": domain._key,
            "domain": domain.domain,
            "count": count
          }
      `
    } catch (err) {
      console.error(
        `Database error occurred for user: ${userKey} while attempting to gather domain count while removing org: ${organization._key}, ${err}`,
      )
      await trx.abort()
      throw new Error(i18n._(t`Unable to remove organization. Please try again.`))
    }

    let domainInfo
    try {
      domainInfo = await countCursor.all()
    } catch (err) {
      console.error(
        `Cursor error occurred for user: ${userKey} while attempting to gather domain count while removing org: ${organization._key}, ${err}`,
      )
      await trx.abort()
      throw new Error(i18n._(t`Unable to remove organization. Please try again.`))
    }

    for (const domain of domainInfo) {
      if (domain.count === 1) {
        try {
          // Remove web data
          await trx.step(async () => {
            await query`
              WITH web, webScan
              FOR webV, domainsWebEdge IN 1..1 OUTBOUND ${domain._id} domainsWeb
                LET removeWebScansQuery = (
                  FOR webScanV, webToWebScansV In 1..1 OUTBOUND webV._id webToWebScans
                    REMOVE webScanV IN webScan
                    REMOVE webToWebScansV IN webToWebScans
                    OPTIONS { waitForSync: true }
                )
                REMOVE webV IN web
                REMOVE domainsWebEdge IN domainsWeb
                OPTIONS { waitForSync: true }
            `
          })
        } catch (err) {
          console.error(
            `Trx step error occurred while user: ${userKey} attempted to remove web data for ${domain.domain} in org: ${organization.slug}, ${err}`,
          )
          await trx.abort()
          throw new Error(i18n._(t`Unable to remove organization. Please try again.`))
        }

        try {
          // Remove DNS data
          await trx.step(async () => {
            await query`
            WITH dns
            FOR dnsV, domainsDNSEdge IN 1..1 OUTBOUND ${domain._id} domainsDNS
              REMOVE dnsV IN dns
              REMOVE domainsDNSEdge IN domainsDNS
              OPTIONS { waitForSync: true }
          `
          })
        } catch (err) {
          console.error(
            `Trx step error occurred while user: ${userKey} attempted to remove DNS data for ${domain.domain} in org: ${organization.slug}, error: ${err}`,
          )
          await trx.abort()
          throw new Error(i18n._(t`Unable to remove organization. Please try again.`))
        }

        // remove favourites
        try {
          await trx.step(async () => {
            await query`
            WITH favourites, domains
            FOR fav IN favourites
              FILTER fav._to == ${domain._id}
              REMOVE fav IN favourites
          `
          })
        } catch (err) {
          console.error(
            `Trx step error occurred while user: ${userKey} attempted to remove favourites for ${domain.domain} in org: ${organization.slug}, error: ${err}`,
          )
          await trx.abort()
          throw new Error(i18n._(t`Unable to remove organization. Please try again.`))
        }

        // remove DKIM selectors
        try {
          await trx.step(async () => {
            await query`
            FOR e IN domainsToSelectors
              FILTER e._from == ${domain._id}
              REMOVE e IN domainsToSelectors
          `
          })
        } catch (err) {
          console.error(
            `Trx step error occurred while user: ${userKey} attempted to remove DKIM selectors for ${domain.domain} in org: ${organization.slug}, error: ${err}`,
          )
          await trx.abort()
          throw new Error(i18n._(t`Unable to remove organization. Please try again.`))
        }

        try {
          // Remove domain
          await trx.step(
            () =>
              query`
                WITH claims, domains, organizations
                LET domainEdges = (
                  FOR v, e IN 1..1 OUTBOUND ${organization._id} claims
                    FILTER e._to == ${domain._id}
                    RETURN { edgeKey: e._key, domainId: e._to }
                )
                LET removeDomainEdges = (
                  FOR domainEdge in domainEdges
                    REMOVE domainEdge.edgeKey IN claims
                    OPTIONS { waitForSync: true }
                )
                LET removeDomain = (
                  FOR domainEdge in domainEdges
                    LET key = PARSE_IDENTIFIER(domainEdge.domainId).key
                    REMOVE key IN domains
                    OPTIONS { waitForSync: true }
                )
                RETURN true
              `,
          )
        } catch (err) {
          console.error(
            `Trx step error occurred for user: ${userKey} while attempting to remove domains while removing org: ${organization._key}, ${err}`,
          )
          await trx.abort()
          throw new Error(i18n._(t`Unable to remove organization. Please try again.`))
        }
      }
    }

    let orgCursor
    let compareOrg
    if (typeof organization !== 'undefined') {
      // Get all org details for comparison
      try {
        orgCursor = await query`
        WITH organizations
        FOR org IN organizations
          FILTER org._key == ${organization._key}
          RETURN org
      `
      } catch (err) {}

      try {
        compareOrg = await orgCursor.next()
      } catch (err) {}
    }

    try {
      await trx.step(
        () =>
          query`
              WITH affiliations, organizations, users
              LET userEdges = (
                FOR v, e IN 1..1 OUTBOUND ${organization._id} affiliations
                  RETURN { edgeKey: e._key, userKey: e._to }
              )
              LET removeUserEdges = (
                FOR userEdge IN userEdges
                  REMOVE userEdge.edgeKey IN affiliations
                  OPTIONS { waitForSync: true }
              )
              RETURN true
            `,
      )

      await trx.step(
        () =>
          query`
              WITH organizations, organizationSummaries
              FOR summary in organizationSummaries
                FILTER summary.organization == ${organization._id}
                REMOVE summary._key IN organizationSummaries
                OPTIONS { waitForSync: true }
            `,
      )

      await trx.step(
        () =>
          query`
              WITH organizations
              REMOVE ${organization._key} IN organizations
              OPTIONS { waitForSync: true }
            `,
      )
    } catch (err) {
      console.error(
        `Trx step error occurred for user: ${userKey} while attempting to remove affiliations, and the org while removing org: ${organization._key}, ${err}`,
      )
      await trx.abort()
      throw new Error(i18n._(t`Unable to remove organization. Please try again.`))
    }

    try {
      await trx.commit()
    } catch (err) {
      console.error(
        `Trx commit error occurred for user: ${userKey} while attempting remove of org: ${organization._key}, ${err}`,
      )
      await trx.abort()
      throw new Error(i18n._(t`Unable to remove organization. Please try again.`))
    }

    console.info(`User: ${userKey} successfully removed org: ${organization._key}.`)
    await logActivity({
      transaction,
      collections,
      query,
      initiatedBy: {
        id: user._key,
        userName: user.userName,
        role: permission,
        ipAddress: ip,
      },
      action: 'delete',
      target: {
        resource: {
          en: compareOrg.orgDetails.en.name || organization.name,
          fr: compareOrg.orgDetails.fr.name || organization.name,
        }, // name of resource being acted upon
        resourceType: 'organization', // user, org, domain
      },
    })

    return {
      _type: 'result',
      status: i18n._(t`Successfully removed organization: ${organization.slug}.`),
      organization,
    }
  },
})
