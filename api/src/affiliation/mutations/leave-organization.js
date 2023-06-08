import { t } from '@lingui/macro'
import { GraphQLID, GraphQLNonNull } from 'graphql'
import { fromGlobalId, mutationWithClientMutationId } from 'graphql-relay'

import { leaveOrganizationUnion } from '../unions'

export const leaveOrganization = new mutationWithClientMutationId({
  name: 'LeaveOrganization',
  description: 'This mutation allows users to leave a given organization.',
  inputFields: () => ({
    orgId: {
      type: GraphQLNonNull(GraphQLID),
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
      auth: { checkOrgOwner, userRequired, verifiedRequired },
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

    // check to see if org owner
    const owner = await checkOrgOwner({ orgId: org._id })

    // Setup Trans action
    const trx = await transaction(collections)

    if (owner) {
      // check to see if org has any dmarc summaries
      let dmarcSummaryCheckCursor
      try {
        dmarcSummaryCheckCursor = await query`
        WITH domains, ownership, dmarcSummaries, organizations
        FOR v, e IN 1..1 OUTBOUND ${org._id} ownership
          RETURN e
      `
      } catch (err) {
        console.error(
          `Database error occurred while checking for dmarc summaries for org: ${org._key}, when user: ${user._key} attempted to leave: ${err}`,
        )
        throw new Error(i18n._(t`Unable leave organization. Please try again.`))
      }

      let dmarcSummaryCheckList
      try {
        dmarcSummaryCheckList = await dmarcSummaryCheckCursor.all()
      } catch (err) {
        console.error(
          `Cursor error occurred when getting dmarc summary info for org: ${org._key}, when user: ${user._key} attempted to leave: ${err}`,
        )
        throw new Error(i18n._(t`Unable leave organization. Please try again.`))
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
            `Trx step error occurred while attempting to remove dmarc summaries for org: ${org._key}, when user: ${user._key} attempted to leave: ${err}`,
          )
          throw new Error(i18n._(t`Unable leave organization. Please try again.`))
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
            `Trx step error occurred while attempting to remove ownership for org: ${org._key}, when user: ${user._key} attempted to leave: ${err}`,
          )
          throw new Error(i18n._(t`Unable leave organization. Please try again.`))
        }
      }

      // check to see if any other orgs are using this domain
      let countCursor
      try {
        countCursor = await query`
          WITH claims, domains, organizations
          LET domainIds = (
            FOR v, e IN 1..1 OUTBOUND ${org._id} claims
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
              count
            }
        `
      } catch (err) {
        console.error(
          `Database error occurred while while gathering domainInfo org: ${org._key}, when user: ${user._key} attempted to leave: ${err}`,
        )
        throw new Error(i18n._(t`Unable leave organization. Please try again.`))
      }

      let domainInfo
      try {
        domainInfo = await countCursor.all()
      } catch (err) {
        console.error(
          `Cursor error occurred while while gathering domainInfo org: ${org._key}, when user: ${user._key} attempted to leave: ${err}`,
        )
        throw new Error(i18n._(t`Unable leave organization. Please try again.`))
      }

      for (const domain of domainInfo) {
        if (domain.count === 1) {
          try {
            // Remove web data
            await trx.step(async () => {
              await query`
                WITH web, webScan, domains
                FOR webV, domainsWebEdge IN 1..1 OUTBOUND ${domain._id} domainsWeb
                  FOR webScanV, webToWebScansV In 1..1 ANY webV._id webToWebScans
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
              `Trx step error occurred while user: ${user._key} attempted to remove web data for ${domain.domain} in org: ${org.slug}, ${err}`,
            )
            throw new Error(i18n._(t`Unable to leave organization. Please try again.`))
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
              `Trx step error occurred while user: ${user._key} attempted to remove DNS data for ${domain.domain} in org: ${org.slug}, error: ${err}`,
            )
            throw new Error(i18n._(t`Unable to leave organization. Please try again.`))
          }

          try {
            await trx.step(
              () =>
                query`
                  WITH claims, domains, organizations
                  LET domainEdges = (
                    FOR v, e IN 1..1 OUTBOUND ${org._id} claims
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
              `Trx step error occurred while attempting to remove domains for org: ${org._key}, when user: ${user._key} attempted to leave: ${err}`,
            )
            throw new Error(i18n._(t`Unable leave organization. Please try again.`))
          }
        }
      }

      try {
        await trx.step(
          () =>
            query`
                WITH affiliations, organizations, users
                LET userEdges = (
                  FOR v, e IN 1..1 OUTBOUND ${org._id} affiliations
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
                WITH organizations
                REMOVE ${org._key} IN organizations
                OPTIONS { waitForSync: true }
              `,
        )
      } catch (err) {
        console.error(
          `Trx step error occurred while attempting to remove affiliations, and the org for org: ${org._key}, when user: ${user._key} attempted to leave: ${err}`,
        )
        throw new Error(i18n._(t`Unable leave organization. Please try again.`))
      }
    } else {
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
        throw new Error(i18n._(t`Unable leave organization. Please try again.`))
      }
    }

    try {
      await trx.commit()
    } catch (err) {
      console.error(`Trx commit error occurred when user: ${user._key} attempted to leave org: ${org._key}: ${err}`)
      throw new Error(i18n._(t`Unable leave organization. Please try again.`))
    }

    console.info(`User: ${user._key} successfully left org: ${org.slug}.`)

    return {
      _type: 'regular',
      status: i18n._(t`Successfully left organization: ${org.slug}`),
    }
  },
})
