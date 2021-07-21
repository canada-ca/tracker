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
      description:
        '`LeaveOrganizationUnion` resolving to either a `LeaveOrganizationResult` or `AffiliationError`.',
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
      console.warn(
        `User ${user._key} attempted to leave undefined organization: ${orgKey}`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to leave undefined organization.`),
      }
    }

    // check to see if org owner
    const owner = await checkOrgOwner({ orgId: org._id })

    // Generate list of collections names
    const collectionStrings = []
    for (const property in collections) {
      collectionStrings.push(property.toString())
    }

    // Setup Trans action
    const trx = await transaction(collectionStrings)

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
          `Cursor error occurred when getting ownership info for org: ${org._key}, when user: ${user._key} attempted to leave: ${err}`,
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
          throw new Error(
            i18n._(t`Unable leave organization. Please try again.`),
          )
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
          throw new Error(
            i18n._(t`Unable leave organization. Please try again.`),
          )
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
            await trx.step(
              () =>
                query`
                  WITH claims, dkim, domains, domainsDKIM, organizations, dkimToDkimResults, dkimResults
                  LET dkimEdges = (
                    FOR v, e IN 1..1 OUTBOUND ${domain._id} domainsDKIM 
                      RETURN { edgeKey: e._key, dkimId: e._to }
                  )
                  FOR dkimEdge IN dkimEdges
                    LET dkimResultEdges = (
                      FOR v, e IN 1..1 OUTBOUND dkimEdge.dkimId dkimToDkimResults
                        RETURN { edgeKey: e._key, dkimResultId: e._to }
                    )
                    LET removeDkimResultEdges = (
                      FOR dkimResultEdge IN dkimResultEdges 
                        REMOVE dkimResultEdge.edgeKey IN dkimToDkimResults
                        OPTIONS { waitForSync: true }
                    )
                    LET removeDkimResult = (
                      FOR dkimResultEdge IN dkimResultEdges 
                        LET key = PARSE_IDENTIFIER(dkimResultEdge.dkimResultId).key 
                        REMOVE key IN dkimResults
                        OPTIONS { waitForSync: true }
                    )
                  RETURN true
                `,
            )
          } catch (err) {
            console.error(
              `Trx step error occurred while attempting to remove dkim results for org: ${org._key}, when user: ${user._key} attempted to leave: ${err}`,
            )
            throw new Error(
              i18n._(t`Unable leave organization. Please try again.`),
            )
          }

          try {
            await Promise.all([
              trx.step(
                () =>
                  query`
                  WITH claims, dkim, domains, domainsDKIM, organizations
                  LET dkimEdges = (
                    FOR v, e IN 1..1 OUTBOUND ${domain._id} domainsDKIM 
                      RETURN { edgeKey: e._key, dkimId: e._to }
                  )
                  LET removeDkimEdges = (
                    FOR dkimEdge IN dkimEdges 
                      REMOVE dkimEdge.edgeKey IN domainsDKIM
                      OPTIONS { waitForSync: true }
                  )
                  LET removeDkim = (
                    FOR dkimEdge IN dkimEdges 
                      LET key = PARSE_IDENTIFIER(dkimEdge.dkimId).key 
                      REMOVE key IN dkim
                      OPTIONS { waitForSync: true }
                  )
                  RETURN true
                `,
              ),
              trx.step(
                () =>
                  query`
                  WITH claims, dmarc, domains, domainsDMARC, organizations
                  LET dmarcEdges = (
                    FOR v, e IN 1..1 OUTBOUND ${domain._id} domainsDMARC 
                      RETURN { edgeKey: e._key, dmarcId: e._to }
                  )
                  LET removeDmarcEdges = (
                    FOR dmarcEdge IN dmarcEdges 
                      REMOVE dmarcEdge.edgeKey IN domainsDMARC
                      OPTIONS { waitForSync: true }
                  )
                  LET removeDmarc = (
                    FOR dmarcEdge IN dmarcEdges 
                      LET key = PARSE_IDENTIFIER(dmarcEdge.dmarcId).key 
                      REMOVE key IN dmarc
                      OPTIONS { waitForSync: true }
                  )
                  RETURN true
                `,
              ),
              trx.step(
                () =>
                  query`
                  WITH claims, domains, domainsSPF, organizations, spf
                  LET spfEdges = (
                    FOR v, e IN 1..1 OUTBOUND ${domain._id} domainsSPF 
                      RETURN { edgeKey: e._key, spfId: e._to }
                  )
                  LET removeSpfEdges = (
                    FOR spfEdge IN spfEdges 
                      REMOVE spfEdge.edgeKey IN domainsSPF
                      OPTIONS { waitForSync: true }
                  )
                  LET removeSpf = (
                    FOR spfEdge IN spfEdges 
                      LET key = PARSE_IDENTIFIER(spfEdge.spfId).key 
                      REMOVE key IN spf
                      OPTIONS { waitForSync: true }
                  )
                  RETURN true
                `,
              ),
              trx.step(
                () =>
                  query`
                  WITH claims, domains, domainsHTTPS, https, organizations
                  LET httpsEdges = (
                    FOR v, e IN 1..1 OUTBOUND ${domain._id} domainsHTTPS 
                      RETURN { edgeKey: e._key, httpsId: e._to }
                  )
                  LET removeHttpsEdges = (
                    FOR httpsEdge IN httpsEdges 
                      REMOVE httpsEdge.edgeKey IN domainsHTTPS
                      OPTIONS { waitForSync: true }
                  )
                  LET removeHttps = (
                    FOR httpsEdge IN httpsEdges 
                      LET key = PARSE_IDENTIFIER(httpsEdge.httpsId).key 
                      REMOVE key IN https
                      OPTIONS { waitForSync: true }
                  )
                  RETURN true
                `,
              ),
              trx.step(
                () =>
                  query`
                  WITH claims, domains, domainsSSL, organizations, ssl
                  LET sslEdges = (
                    FOR v, e IN 1..1 OUTBOUND ${domain._id} domainsSSL 
                      RETURN { edgeKey: e._key, sslId: e._to}
                  )
                  LET removeSslEdges = (
                    FOR sslEdge IN sslEdges 
                      REMOVE sslEdge.edgeKey IN domainsSSL
                      OPTIONS { waitForSync: true }
                  )
                  LET removeSsl = (
                    FOR sslEdge IN sslEdges 
                      LET key = PARSE_IDENTIFIER(sslEdge.sslId).key 
                      REMOVE key IN ssl
                      OPTIONS { waitForSync: true }
                  )
                  RETURN true
                `,
              ),
            ])
          } catch (err) {
            console.error(
              `Trx step error occurred while attempting to remove scan results for org: ${org._key}, when user: ${user._key} attempted to leave: ${err}`,
            )
            throw new Error(
              i18n._(t`Unable leave organization. Please try again.`),
            )
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
              `Trx step error occurred while attempting to remove domains for org: ${org._key}, when user: ${user._key} attempted to leave. error: ${err}`,
            )
            throw new Error(
              i18n._(t`Unable leave organization. Please try again.`),
            )
          }
        }
      }

      try {
        await Promise.all([
          trx.step(
            () =>
              query`
                WITH affiliations, organizations, users
                LET userEdges = (FOR v, e IN 1..1 OUTBOUND ${org._id} affiliations RETURN { edgeKey: e._key, userKey: e._to })
                LET removeUserEdges = (
                  FOR userEdge IN userEdges 
                    REMOVE userEdge.edgeKey IN affiliations
                    OPTIONS { waitForSync: true }
                )
                RETURN true
              `,
          ),
          trx.step(
            () =>
              query`
                WITH organizations
                REMOVE ${org._key} IN organizations
                OPTIONS { waitForSync: true }
              `,
          ),
        ])
      } catch (err) {
        console.error(
          `Trx step error occurred while attempting to remove affiliations, and the org for org: ${org._key}, when user: ${user._key} attempted to leave: ${err}`,
        )
        throw new Error(i18n._(t`Unable leave organization. Please try again.`))
      }
    }

    if (!owner) {
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
      console.error(
        `Trx commit error occurred when user: ${user._key} attempted to leave org: ${org._key}: ${err}`,
      )
      throw new Error(i18n._(t`Unable leave organization. Please try again.`))
    }

    console.info(`User: ${user._key} successfully left org: ${org.slug}.`)

    return {
      _type: 'regular',
      status: i18n._(t`Successfully left organization: ${org.slug}`),
    }
  },
})
