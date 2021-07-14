import { GraphQLNonNull, GraphQLID } from 'graphql'
import { mutationWithClientMutationId, fromGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

import { removeDomainUnion } from '../unions'

export const removeDomain = new mutationWithClientMutationId({
  name: 'RemoveDomain',
  description: 'This mutation allows the removal of unused domains.',
  inputFields: () => ({
    domainId: {
      type: GraphQLNonNull(GraphQLID),
      description: 'The global id of the domain you wish to remove.',
    },
    orgId: {
      type: GraphQLNonNull(GraphQLID),
      description: 'The organization you wish to remove the domain from.',
    },
  }),
  outputFields: () => ({
    result: {
      type: GraphQLNonNull(removeDomainUnion),
      description:
        '`RemoveDomainUnion` returning either a `DomainResultType`, or `DomainErrorType` object.',
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
      loaders: { loadDomainByKey, loadOrgByKey },
    },
  ) => {
    // Get User
    const user = await userRequired()

    verifiedRequired({ user })

    // Cleanse Input
    const { type: _domainType, id: domainId } = fromGlobalId(
      cleanseInput(args.domainId),
    )
    const { type: _orgType, id: orgId } = fromGlobalId(cleanseInput(args.orgId))

    // Get domain from db
    const domain = await loadDomainByKey.load(domainId)

    // Check to see if domain exists
    if (typeof domain === 'undefined') {
      console.warn(
        `User: ${userKey} attempted to remove ${domainId} however no domain is associated with that id.`,
      )
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
        `User: ${userKey} attempted to remove ${domain.slug} in org: ${orgId} however there is no organization associated with that id.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(
          t`Unable to remove domain from unknown organization.`,
        ),
      }
    }

    // Get permission
    const permission = await checkPermission({ orgId: org._id })

    // Check to see if domain belongs to verified check org
    if (org.verified && permission !== 'super_admin') {
      console.warn(
        `User: ${userKey} attempted to remove ${domain.slug} in ${org.slug} but does not have permission to remove a domain from a verified check org.`,
      )
      return {
        _type: 'error',
        code: 403,
        description: i18n._(
          t`Permission Denied: Please contact super admin for help with removing domain.`,
        ),
      }
    }

    if (permission !== 'super_admin' && permission !== 'admin') {
      console.warn(
        `User: ${userKey} attempted to remove ${domain.slug} in ${org.slug} however they do not have permission in that org.`,
      )
      return {
        _type: 'error',
        code: 403,
        description: i18n._(
          t`Permission Denied: Please contact organization admin for help with removing domain.`,
        ),
      }
    }

    // Check to see if more than one organization has a claim to this domain
    let countCursor
    try {
      countCursor = await query`
        WITH claims, domains, organizations
        FOR v, e IN 1..1 ANY ${domain._id} claims RETURN true
      `
    } catch (err) {
      console.error(
        `Database error occurred for user: ${userKey}, when counting domain claims for domain: ${domain.slug}, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to remove domain. Please try again.`))
    }

    // check to see if org removing domain has ownership
    let dmarcCountCursor
    try {
      dmarcCountCursor = await query`
        WITH domains, organizations, ownership
        FOR v IN 1..1 OUTBOUND ${org._id} ownership RETURN true
      `
    } catch (err) {
      console.error(
        `Database error occurred for user: ${userKey}, when counting ownership claims for domain: ${domain.slug}, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to remove domain. Please try again.`))
    }

    // Generate list of collections names
    const collectionStrings = []
    for (const property in collections) {
      collectionStrings.push(property.toString())
    }

    // Setup Trans action
    const trx = await transaction(collectionStrings)

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
          `Trx step error occurred when removing dmarc summary data for user: ${userKey} while attempting to remove domain: ${domain.slug}, error: ${err}`,
        )
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
          `Trx step error occurred when removing ownership data for user: ${userKey} while attempting to remove domain: ${domain.slug}, error: ${err}`,
        )
        throw new Error(i18n._(t`Unable to remove domain. Please try again.`))
      }
    }

    if (countCursor.count <= 1) {
      // Remove scan data
      try {
        await Promise.all([
          trx.step(async () => {
            await query`
              WITH claims, dkim, domains, domainsDKIM, organizations, dkimToDkimResults, dkimResults
              LET domainEdges = (FOR v, e IN 1..1 OUTBOUND ${org._id} claims RETURN { edgeKey: e._key, domainId: e._to })
              FOR domainEdge in domainEdges
                LET dkimEdges = (FOR v, e IN 1..1 OUTBOUND domainEdge.domainId domainsDKIM RETURN { edgeKey: e._key, dkimId: e._to })
                FOR dkimEdge IN dkimEdges
                  LET dkimResultEdges = (FOR v, e IN 1..1 OUTBOUND dkimEdge.dkimId dkimToDkimResults RETURN { edgeKey: e._key, dkimResultId: e._to })
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
            `
          }),
          trx.step(async () => {
            await query`
              WITH claims, dkim, domains, domainsDKIM, organizations
              LET domainEdges = (FOR v, e IN 1..1 INBOUND ${domain._id} claims RETURN { edgeKey: e._key, domainId: e._to })
              FOR domainEdge in domainEdges
                LET dkimEdges = (FOR v, e IN 1..1 OUTBOUND domainEdge.domainId domainsDKIM RETURN { edgeKey: e._key, dkimId: e._to })
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
            `
          }),
          trx.step(async () => {
            await query`
              WITH claims, dmarc, domains, domainsDMARC, organizations
              LET domainEdges = (FOR v, e IN 1..1 INBOUND ${domain._id} claims RETURN { edgeKey: e._key, domainId: e._to })
              FOR domainEdge in domainEdges
                LET dmarcEdges = (FOR v, e IN 1..1 OUTBOUND domainEdge.domainId domainsDMARC RETURN { edgeKey: e._key, dmarcId: e._to })
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
            `
          }),
          trx.step(async () => {
            await query`
              WITH claims, domains, domainsSPF, organizations, spf
              LET domainEdges = (FOR v, e IN 1..1 INBOUND ${domain._id} claims RETURN { edgeKey: e._key, domainId: e._to })
              FOR domainEdge in domainEdges
                LET spfEdges = (FOR v, e IN 1..1 OUTBOUND domainEdge.domainId domainsSPF RETURN { edgeKey: e._key, spfId: e._to })
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
            `
          }),
          trx.step(async () => {
            await query`
              WITH claims, domains, domainsHTTPS, https, organizations
              LET domainEdges = (FOR v, e IN 1..1 INBOUND ${domain._id} claims RETURN { edgeKey: e._key, domainId: e._to })
              FOR domainEdge in domainEdges
                LET httpsEdges = (FOR v, e IN 1..1 OUTBOUND domainEdge.domainId domainsHTTPS RETURN { edgeKey: e._key, httpsId: e._to })
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
            `
          }),
          trx.step(async () => {
            await query`
              WITH claims, domains, domainsSSL, organizations, ssl
              LET domainEdges = (FOR v, e IN 1..1 INBOUND ${domain._id} claims RETURN { edgeKey: e._key, domainId: e._to })
              FOR domainEdge in domainEdges
                LET sslEdges = (FOR v, e IN 1..1 OUTBOUND domainEdge.domainId domainsSSL RETURN { edgeKey: e._key, sslId: e._to})
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
            `
          }),
        ])
      } catch (err) {
        console.error(
          `Trx step error occurred while user: ${userKey} attempted to remove scan data for ${domain.slug} in org: ${org.slug}, error: ${err}`,
        )
        throw new Error(i18n._(t`Unable to remove domain. Please try again.`))
      }

      // Remove domain
      try {
        await trx.step(async () => {
          await query`
            WITH claims, domains, organizations
            LET domainEdges = (FOR v, e IN 1..1 INBOUND ${domain._id} claims RETURN { edgeKey: e._key, domainId: e._to })
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
          `
        })
      } catch (err) {
        console.error(
          `Trx step error occurred while user: ${userKey} attempted to remove ${domain.slug} in org: ${org.slug}, error: ${err}`,
        )
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
          `Trx step error occurred while user: ${userKey} attempted to remove claim for ${domain.slug} in org: ${org.slug}, error: ${err}`,
        )
        throw new Error(i18n._(t`Unable to remove domain. Please try again.`))
      }
    }

    // Commit transaction
    try {
      await trx.commit()
    } catch (err) {
      console.error(
        `Trx commit error occurred while user: ${userKey} attempted to remove ${domain.slug} in org: ${org.slug}, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to remove domain. Please try again.`))
    }

    console.info(
      `User: ${userKey} successfully removed domain: ${domain.slug} from org: ${org.slug}.`,
    )
    return {
      _type: 'result',
      status: i18n._(
        t`Successfully removed domain: ${domain.slug} from ${org.slug}.`,
      ),
      domain,
    }
  },
})
