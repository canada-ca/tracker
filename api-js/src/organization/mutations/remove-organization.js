import { GraphQLNonNull, GraphQLID } from 'graphql'
import { mutationWithClientMutationId, fromGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

import { removeOrganizationUnion } from '../unions'

export const removeOrganization = new mutationWithClientMutationId({
  name: 'RemoveOrganization',
  description: 'This mutation allows the removal of unused organizations.',
  inputFields: () => ({
    orgId: {
      type: GraphQLNonNull(GraphQLID),
      description: 'The global id of the organization you wish you remove.',
    },
  }),
  outputFields: () => ({
    result: {
      type: GraphQLNonNull(removeOrganizationUnion),
      description:
        '`RemoveOrganizationUnion` returning either an `OrganizationResult`, or `OrganizationError` object.',
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
      console.warn(
        `User: ${userKey} attempted to remove org: ${orgId}, but there is no org associated with that id.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to remove unknown organization.`),
      }
    }

    // Get users permission
    const permission = await checkPermission({ orgId: organization._id })

    if (permission !== 'super_admin' && permission !== 'admin') {
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
        description: i18n._(
          t`Permission Denied: Please contact super admin for help with removing organization.`,
        ),
      }
    }

    // check to see if any other orgs are using this domain
    let countCursor
    try {
      countCursor = await query`
        WITH claims, domains, organizations
        LET domainIds = (
          FOR v, e IN 1..1 ANY ${organization._id} claims
          RETURN e._to
        )
        FOR domain IN domains
          FILTER domain._id IN domainIds
          LET count = LENGTH(
            FOR v, e 
            IN 1..1 ANY domain._id claims
            RETURN 1
          )
        RETURN { count: count }
      `
    } catch (err) {
      console.error(
        `Database error occurred for user: ${userKey} while attempting to gather domain count while removing org: ${organization._key}, ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to remove organization. Please try again.`),
      )
    }

    let domainInfo
    try {
      domainInfo = await countCursor.next()
    } catch (err) {
      console.error(
        `Cursor error occurred for user: ${userKey} while attempting to gather domain count while removing org: ${organization._key}, ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to remove organization. Please try again.`),
      )
    }

    // check to see if org has any dmarc summaries
    let dmarcSummaryCheckCursor
    try {
      dmarcSummaryCheckCursor = await query`
        WITH domains, ownership, dmarcSummaries, organizations
        LET domainIds = (
          FOR v, e IN 1..1 ANY ${organization._id} ownership
          RETURN e._to
        )
        FOR domain IN domains
          FILTER domain._id IN domainIds
          RETURN domain
      `
    } catch (err) {
      console.error(
        `Database error occurred for user: ${userKey} while attempting to get dmarcSummaryInfo while removing org: ${organization._key}, ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to remove organization. Please try again.`),
      )
    }

    // Generate list of collections names
    const collectionStrings = []
    for (const property in collections) {
      collectionStrings.push(property.toString())
    }

    // Setup Trans action
    const trx = await transaction(collectionStrings)

    if (dmarcSummaryCheckCursor.count >= 1) {
      try {
        await trx.step(
          () => query`
            WITH ownership, organizations, domains, dmarcSummaries, domainsToDmarcSummaries
            LET domainEdges = (
              FOR v, e IN 1..1 OUTBOUND ${organization._id} ownership 
                RETURN { edgeKey: e._key, domainId: e._to }
            )
            FOR domainEdge IN domainEdges
              LET dmarcSummaryEdges = (
                FOR v, e IN 1..1 OUTBOUND domainEdge.domainId domainsToDmarcSummaries 
                  RETURN { edgeKey: e._key, dmarcSummaryId: e._to }
              )
              LET removeDmarcSummaryEdges = (
                FOR dmarcSummaryEdge IN dmarcSummaryEdges 
                  REMOVE dmarcSummaryEdge.edgeKey IN domainsToDmarcSummaries
              )
              LET removeDmarcSummary = (
                FOR dmarcSummaryEdge IN dmarcSummaryEdges 
                  LET key = PARSE_IDENTIFIER(dmarcSummaryEdge.dmarcSummaryId).key 
                  REMOVE key IN dmarcSummaries
              )
              RETURN true
          `,
        )
      } catch (err) {
        console.error(
          `Trx step error occurred for user: ${userKey} while attempting to remove dmarc summaries while removing org: ${organization._key}, ${err}`,
        )
        throw new Error(
          i18n._(t`Unable to remove organization. Please try again.`),
        )
      }

      try {
        await trx.step(
          () => query`
            WITH ownership, organizations, domains
            LET domainEdges = (
              FOR v, e IN 1..1 OUTBOUND ${organization._id} ownership
                REMOVE e._key IN ownership
            )
            RETURN true
          `,
        )
      } catch (err) {
        console.error(
          `Trx step error occurred for user: ${userKey} while attempting to remove ownerships while removing org: ${organization._key}, ${err}`,
        )
        throw new Error(
          i18n._(t`Unable to remove organization. Please try again.`),
        )
      }
    }

    if (domainInfo.count <= 1) {
      try {
        await Promise.all([
          trx.step(
            () =>
              query`
                WITH claims, dkim, domains, domainsDKIM, organizations, dkimToDkimResults, dkimResults
                LET domainEdges = (FOR v, e IN 1..1 OUTBOUND ${organization._id} claims RETURN { edgeKey: e._key, domainId: e._to })
                FOR domainEdge in domainEdges
                  LET dkimEdges = (FOR v, e IN 1..1 OUTBOUND domainEdge.domainId domainsDKIM RETURN { edgeKey: e._key, dkimId: e._to })
                  FOR dkimEdge IN dkimEdges
                    LET dkimResultEdges = (FOR v, e IN 1..1 OUTBOUND dkimEdge.dkimId dkimToDkimResults RETURN { edgeKey: e._key, dkimResultId: e._to })
                    LET removeDkimResultEdges = (FOR dkimResultEdge IN dkimResultEdges REMOVE dkimResultEdge.edgeKey IN dkimToDkimResults)
                    LET removeDkimResult = (FOR dkimResultEdge IN dkimResultEdges LET key = PARSE_IDENTIFIER(dkimResultEdge.dkimResultId).key REMOVE key IN dkimResults)
                RETURN true
              `,
          ),
          trx.step(
            () =>
              query`
                WITH claims, dkim, domains, domainsDKIM, organizations
                LET domainEdges = (FOR v, e IN 1..1 ANY ${organization._id} claims RETURN { edgeKey: e._key, domainId: e._to })
                FOR domainEdge in domainEdges
                  LET dkimEdges = (FOR v, e IN 1..1 ANY domainEdge.domainId domainsDKIM RETURN { edgeKey: e._key, dkimId: e._to })
                  LET removeDkimEdges = (FOR dkimEdge IN dkimEdges REMOVE dkimEdge.edgeKey IN domainsDKIM)
                  LET removeDkim = (FOR dkimEdge IN dkimEdges LET key = PARSE_IDENTIFIER(dkimEdge.dkimId).key REMOVE key IN dkim)
                RETURN true
              `,
          ),
          trx.step(
            () =>
              query`
                WITH claims, dmarc, domains, domainsDMARC, organizations
                LET domainEdges = (FOR v, e IN 1..1 ANY ${organization._id} claims RETURN { edgeKey: e._key, domainId: e._to })
                FOR domainEdge in domainEdges
                  LET dmarcEdges = (FOR v, e IN 1..1 ANY domainEdge.domainId domainsDMARC RETURN { edgeKey: e._key, dmarcId: e._to })
                  LET removeDmarcEdges = (FOR dmarcEdge IN dmarcEdges REMOVE dmarcEdge.edgeKey IN domainsDMARC)
                  LET removeDmarc = (FOR dmarcEdge IN dmarcEdges LET key = PARSE_IDENTIFIER(dmarcEdge.dmarcId).key REMOVE key IN dmarc)
                RETURN true
              `,
          ),
          trx.step(
            () =>
              query`
                WITH claims, domains, domainsSPF, organizations, spf
                LET domainEdges = (FOR v, e IN 1..1 ANY ${organization._id} claims RETURN { edgeKey: e._key, domainId: e._to })
                FOR domainEdge in domainEdges
                  LET spfEdges = (FOR v, e IN 1..1 ANY domainEdge.domainId domainsSPF RETURN { edgeKey: e._key, spfId: e._to })
                  LET removeSpfEdges = (FOR spfEdge IN spfEdges REMOVE spfEdge.edgeKey IN domainsSPF)
                  LET removeSpf = (FOR spfEdge IN spfEdges LET key = PARSE_IDENTIFIER(spfEdge.spfId).key REMOVE key IN spf)
                RETURN true
              `,
          ),
          trx.step(
            () =>
              query`
                WITH claims, domains, domainsHTTPS, https, organizations
                LET domainEdges = (FOR v, e IN 1..1 ANY ${organization._id} claims RETURN { edgeKey: e._key, domainId: e._to })
                FOR domainEdge in domainEdges
                  LET httpsEdges = (FOR v, e IN 1..1 ANY domainEdge.domainId domainsHTTPS RETURN { edgeKey: e._key, httpsId: e._to })
                  LET removeHttpsEdges = (FOR httpsEdge IN httpsEdges REMOVE httpsEdge.edgeKey IN domainsHTTPS)
                  LET removeHttps = (FOR httpsEdge IN httpsEdges LET key = PARSE_IDENTIFIER(httpsEdge.httpsId).key REMOVE key IN https)
                RETURN true
              `,
          ),
          trx.step(
            () =>
              query`
                WITH claims, domains, domainsSSL, organizations, ssl
                LET domainEdges = (FOR v, e IN 1..1 ANY ${organization._id} claims RETURN { edgeKey: e._key, domainId: e._to })
                FOR domainEdge in domainEdges
                  LET sslEdges = (FOR v, e IN 1..1 ANY domainEdge.domainId domainsSSL RETURN { edgeKey: e._key, sslId: e._to})
                  LET removeSslEdges = (FOR sslEdge IN sslEdges REMOVE sslEdge.edgeKey IN domainsSSL)
                  LET removeSsl = (FOR sslEdge IN sslEdges LET key = PARSE_IDENTIFIER(sslEdge.sslId).key REMOVE key IN ssl)
                RETURN true
              `,
          ),
        ])
      } catch (err) {
        console.error(
          `Trx step error occurred for user: ${userKey} while attempting to remove scan results while removing org: ${organization._key}, ${err}`,
        )
        throw new Error(
          i18n._(t`Unable to remove organization. Please try again.`),
        )
      }

      try {
        await trx.step(
          () =>
            query`
              WITH claims, domains, organizations
              LET domainEdges = (FOR v, e IN 1..1 ANY ${organization._id} claims RETURN { edgeKey: e._key, domainId: e._to })
              LET removeDomainEdges = (FOR domainEdge in domainEdges REMOVE domainEdge.edgeKey IN claims)
              LET removeDomain = (FOR domainEdge in domainEdges LET key = PARSE_IDENTIFIER(domainEdge.domainId).key REMOVE key IN domains)
              RETURN true
            `,
        )
      } catch (err) {
        console.error(
          `Trx step error occurred for user: ${userKey} while attempting to remove domains while removing org: ${organization._key}, ${err}`,
        )
        throw new Error(
          i18n._(t`Unable to remove organization. Please try again.`),
        )
      }
    }

    try {
      await Promise.all([
        trx.step(
          () =>
            query`
              WITH affiliations, organizations, users
              LET userEdges = (FOR v, e IN 1..1 ANY ${organization._id} affiliations RETURN { edgeKey: e._key, userKey: e._to })
              LET removeUserEdges = (FOR userEdge IN userEdges REMOVE userEdge.edgeKey IN affiliations)
              RETURN true
            `,
        ),
        trx.step(
          () =>
            query`
              WITH organizations
              REMOVE ${organization._key} IN organizations
            `,
        ),
      ])
    } catch (err) {
      console.error(
        `Trx step error occurred for user: ${userKey} while attempting to remove affiliations, and the org while removing org: ${organization._key}, ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to remove organization. Please try again.`),
      )
    }

    try {
      await trx.commit()
    } catch (err) {
      console.error(
        `Trx commit error occurred for user: ${userKey} while attempting remove of org: ${organization._key}, ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to remove organization. Please try again.`),
      )
    }

    console.info(
      `User: ${userKey} successfully removed org: ${organization._key}.`,
    )

    return {
      _type: 'result',
      status: i18n._(
        t`Successfully removed organization: ${organization.slug}.`,
      ),
      organization,
    }
  },
})
