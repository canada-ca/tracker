import { GraphQLNonNull, GraphQLID } from 'graphql'
import { mutationWithClientMutationId, fromGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

import { removeDomainUnion } from '../unions'
import { logActivity } from '../../audit-logs/mutations/log-activity'
import { DomainRemovalReasonEnum } from '../../enums'

export const removeDomain = new mutationWithClientMutationId({
  name: 'RemoveDomain',
  description: 'This mutation allows the removal of unused domains.',
  inputFields: () => ({
    domainId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The global id of the domain you wish to remove.',
    },
    orgId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The organization you wish to remove the domain from.',
    },
    reason: {
      type: new GraphQLNonNull(DomainRemovalReasonEnum),
      description: 'The reason given for why this domain is being removed from the organization.',
    },
  }),
  outputFields: () => ({
    result: {
      type: new GraphQLNonNull(removeDomainUnion),
      description: '`RemoveDomainUnion` returning either a `DomainResultType`, or `DomainErrorType` object.',
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
      auth: { checkPermission, userRequired, verifiedRequired, tfaRequired },
      validators: { cleanseInput },
      loaders: { loadDomainByKey, loadOrgByKey },
    },
  ) => {
    // Get User
    const user = await userRequired()

    verifiedRequired({ user })
    tfaRequired({ user })

    // Cleanse Input
    const { type: _domainType, id: domainId } = fromGlobalId(cleanseInput(args.domainId))
    const { type: _orgType, id: orgId } = fromGlobalId(cleanseInput(args.orgId))

    // Get domain from db
    const domain = await loadDomainByKey.load(domainId)

    // Check to see if domain exists
    if (typeof domain === 'undefined') {
      console.warn(`User: ${userKey} attempted to remove ${domainId} however no domain is associated with that id.`)
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to remove unknown domain.`),
      }
    }

    // Get Org from db
    const org = await loadOrgByKey.load(orgId)

    // Check to see if org exists
    if (typeof org === 'undefined') {
      console.warn(
        `User: ${userKey} attempted to remove ${domain.domain} in org: ${orgId} however there is no organization associated with that id.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to remove domain from unknown organization.`),
      }
    }

    // Get permission
    const permission = await checkPermission({ orgId: org._id })

    if (['admin', 'owner', 'super_admin'].includes(permission) === false) {
      console.warn(
        `User: ${userKey} attempted to remove ${domain.domain} in ${org.slug} however they do not have permission in that org.`,
      )
      return {
        _type: 'error',
        code: 403,
        description: i18n._(t`Permission Denied: Please contact organization admin for help with removing domain.`),
      }
    }

    // Check to see if domain belongs to verified check org
    // if domain returns NXDOMAIN, allow removal
    if (org.verified && permission !== 'super_admin' && domain.rcode !== 'NXDOMAIN') {
      console.warn(
        `User: ${userKey} attempted to remove ${domain.domain} in ${org.slug} but does not have permission to remove a domain from a verified check org.`,
      )
      return {
        _type: 'error',
        code: 403,
        description: i18n._(t`Permission Denied: Please contact super admin for help with removing domain.`),
      }
    }

    // Check to see if more than one organization has a claim to this domain
    let countCursor
    try {
      countCursor = await query`
        WITH claims, domains, organizations
        FOR v, e IN 1..1 ANY ${domain._id} claims
          RETURN v
      `
    } catch (err) {
      console.error(
        `Database error occurred for user: ${userKey}, when counting domain claims for domain: ${domain.domain}, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to remove domain. Please try again.`))
    }

    // check if org has claim to domain
    const orgsClaimingDomain = await countCursor.all()
    const orgHasDomainClaim = orgsClaimingDomain.some((orgVertex) => {
      return orgVertex._id === org._id
    })

    if (!orgHasDomainClaim) {
      console.error(
        `Error occurred for user: ${userKey}, when attempting to remove domain "${domain.domain}" from organization with slug "${org.slug}". Organization does not have claim for domain.`,
      )
      throw new Error(i18n._(t`Unable to remove domain. Domain is not part of organization.`))
    }

    // check to see if org removing domain has ownership
    let dmarcCountCursor
    try {
      dmarcCountCursor = await query`
        WITH domains, organizations, ownership
          FOR v IN 1..1 OUTBOUND ${org._id} ownership
            FILTER v._id == ${domain._id}
            RETURN true
      `
    } catch (err) {
      console.error(
        `Database error occurred for user: ${userKey}, when counting ownership claims for domain: ${domain.domain}, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to remove domain. Please try again.`))
    }

    // Setup Transaction
    const trx = await transaction(collections)

    if (dmarcCountCursor.count === 1) {
      try {
        await trx.step(
          () => query`
            WITH ownership, organizations, domains, dmarcSummaries, domainsToDmarcSummaries
            LET dmarcSummaryEdges = (
              FOR v, e IN 1..1 OUTBOUND ${domain._id} domainsToDmarcSummaries
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
          `Trx step error occurred when removing dmarc summary data for user: ${userKey} while attempting to remove domain: ${domain.domain}, error: ${err}`,
        )
        await trx.abort()
        throw new Error(i18n._(t`Unable to remove domain. Please try again.`))
      }

      try {
        await trx.step(
          () => query`
            WITH ownership, organizations, domains
            LET domainEdges = (
              FOR v, e IN 1..1 INBOUND ${domain._id} ownership
                REMOVE e._key IN ownership
                OPTIONS { waitForSync: true }
            )
            RETURN true
          `,
        )
      } catch (err) {
        console.error(
          `Trx step error occurred when removing ownership data for user: ${userKey} while attempting to remove domain: ${domain.domain}, error: ${err}`,
        )
        await trx.abort()
        throw new Error(i18n._(t`Unable to remove domain. Please try again.`))
      }
    }

    if (countCursor.count <= 1) {
      // Remove scan data

      try {
        // Remove web data
        await trx.step(async () => {
          await query`
            WITH web, webScan, domains
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
          `Trx step error occurred while user: ${userKey} attempted to remove web data for ${domain.domain} in org: ${org.slug}, error: ${err}`,
        )
        await trx.abort()
        throw new Error(i18n._(t`Unable to remove domain. Please try again.`))
      }

      try {
        // Remove DNS data
        await trx.step(async () => {
          await query`
            WITH dns, domains
            FOR dnsV, domainsDNSEdge IN 1..1 OUTBOUND ${domain._id} domainsDNS
              REMOVE dnsV IN dns
              REMOVE domainsDNSEdge IN domainsDNS
              OPTIONS { waitForSync: true }
          `
        })
      } catch (err) {
        console.error(
          `Trx step error occurred while user: ${userKey} attempted to remove DNS data for ${domain.domain} in org: ${org.slug}, error: ${err}`,
        )
        await trx.abort()
        throw new Error(i18n._(t`Unable to remove domain. Please try again.`))
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
          `Trx step error occurred while user: ${userKey} attempted to remove favourites for ${domain.domain} in org: ${org.slug}, error: ${err}`,
        )
        await trx.abort()
        throw new Error(i18n._(t`Unable to remove domain. Please try again.`))
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
          `Trx step error occurred while user: ${userKey} attempted to remove DKIM selectors for ${domain.domain} in org: ${org.slug}, error: ${err}`,
        )
        await trx.abort()
        throw new Error(i18n._(t`Unable to remove domain. Please try again.`))
      }

      try {
        // Remove domain
        await trx.step(async () => {
          await query`
            FOR claim IN claims
              FILTER claim._to == ${domain._id}
              REMOVE claim IN claims
            REMOVE ${domain} IN domains
          `
        })
      } catch (err) {
        console.error(
          `Trx step error occurred while user: ${userKey} attempted to remove domain ${domain.domain} in org: ${org.slug}, error: ${err}`,
        )
        await trx.abort()
        throw new Error(i18n._(t`Unable to remove domain. Please try again.`))
      }
    } else {
      try {
        await trx.step(async () => {
          await query`
            WITH claims, domains, organizations
            LET domainEdges = (FOR v, e IN 1..1 INBOUND ${domain._id} claims RETURN { _key: e._key, _from: e._from, _to: e._to })
            LET edgeKeys = (
              FOR domainEdge IN domainEdges
                FILTER domainEdge._to ==  ${domain._id}
                FILTER domainEdge._from == ${org._id}
                RETURN domainEdge._key
            )
            FOR edgeKey IN edgeKeys
              REMOVE edgeKey IN claims
              OPTIONS { waitForSync: true }
          `
        })
      } catch (err) {
        console.error(
          `Trx step error occurred while user: ${userKey} attempted to remove claim for ${domain.domain} in org: ${org.slug}, error: ${err}`,
        )
        await trx.abort()
        throw new Error(i18n._(t`Unable to remove domain. Please try again.`))
      }
    }

    // Commit transaction
    try {
      await trx.commit()
    } catch (err) {
      console.error(
        `Trx commit error occurred while user: ${userKey} attempted to remove ${domain.domain} in org: ${org.slug}, error: ${err}`,
      )
      await trx.abort()
      throw new Error(i18n._(t`Unable to remove domain. Please try again.`))
    }

    console.info(`User: ${userKey} successfully removed domain: ${domain.domain} from org: ${org.slug}.`)
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
      action: 'remove',
      target: {
        resource: domain.domain,
        organization: {
          id: org._key,
          name: org.name,
        }, // name of resource being acted upon
        resourceType: 'domain', // user, org, domain
      },
      reason: args.reason,
    })

    return {
      _type: 'result',
      status: i18n._(t`Successfully removed domain: ${domain.domain} from ${org.slug}.`),
      domain,
    }
  },
})
