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
    const { id: orgId } = fromGlobalId(cleanseInput(args.orgId))

    const user = await userRequired()

    verifiedRequired({ user })

    const org = await loadOrgByKey.load(orgId)

    if (typeof org === 'undefined') {
      console.warn(`org undefined`)
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable leave organization.`),
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
      try {
        await Promise.all([
          trx.step(async () => {
            await query`
              WITH claims, dkim, domains, domainsDKIM, organizations
              LET domainEdges = (FOR v, e IN 1..1 ANY ${org._id} claims RETURN { edgeKey: e._key, domainId: e._to })
              FOR domainEdge in domainEdges
                LET dkimEdges = (FOR v, e IN 1..1 ANY domainEdge.domainId domainsDKIM RETURN { edgeKey: e._key, dkimId: e._to })
                FOR dkimEdge IN dkimEdges
                  LET dkimResultEdges = (FOR v, e IN 1..1 ANY dkimEdge.dkimId dkimToDkimResults RETURN { edgeKey: e._key, dkimResultId: e._to})
                  LET removeDkimResultEdges = (FOR dkimResultEdge IN dkimResultEdges REMOVE dkimResultEdge.edgeKey IN dkimToDkimResults)
                  LET removeDkimResult = (FOR dkimResultEdge IN dkimResultEdges LET key = PARSE_IDENTIFIER(dkimResultEdge.dkimResultId).key REMOVE key IN dkimResults)
              RETURN true
            `
          }),
          trx.step(async () => {
            await query`
              WITH claims, dkim, domains, domainsDKIM, organizations
              LET domainEdges = (FOR v, e IN 1..1 ANY ${org._id} claims RETURN { edgeKey: e._key, domainId: e._to })
              FOR domainEdge in domainEdges
                LET dkimEdges = (FOR v, e IN 1..1 ANY domainEdge.domainId domainsDKIM RETURN { edgeKey: e._key, dkimId: e._to })
                LET removeDkimEdges = (FOR dkimEdge IN dkimEdges REMOVE dkimEdge.edgeKey IN domainsDKIM)
                LET removeDkim = (FOR dkimEdge IN dkimEdges LET key = PARSE_IDENTIFIER(dkimEdge.dkimId).key REMOVE key IN dkim)
              RETURN true
            `
          }),
          trx.step(async () => {
            await query`
              WITH claims, dmarc, domains, domainsDMARC, organizations
              LET domainEdges = (FOR v, e IN 1..1 ANY ${org._id} claims RETURN { edgeKey: e._key, domainId: e._to })
              FOR domainEdge in domainEdges
                LET dmarcEdges = (FOR v, e IN 1..1 ANY domainEdge.domainId domainsDMARC RETURN { edgeKey: e._key, dmarcId: e._to })
                LET removeDmarcEdges = (FOR dmarcEdge IN dmarcEdges REMOVE dmarcEdge.edgeKey IN domainsDMARC)
                LET removeDmarc = (FOR dmarcEdge IN dmarcEdges LET key = PARSE_IDENTIFIER(dmarcEdge.dmarcId).key REMOVE key IN dmarc)
              RETURN true
            `
          }),
          trx.step(async () => {
            await query`
              WITH claims, domains, domainsSPF, organizations, spf
              LET domainEdges = (FOR v, e IN 1..1 ANY ${org._id} claims RETURN { edgeKey: e._key, domainId: e._to })
              FOR domainEdge in domainEdges
                LET spfEdges = (FOR v, e IN 1..1 ANY domainEdge.domainId domainsSPF RETURN { edgeKey: e._key, spfId: e._to })
                LET removeSpfEdges = (FOR spfEdge IN spfEdges REMOVE spfEdge.edgeKey IN domainsSPF)
                LET removeSpf = (FOR spfEdge IN spfEdges LET key = PARSE_IDENTIFIER(spfEdge.spfId).key REMOVE key IN spf)
              RETURN true
            `
          }),
          trx.step(async () => {
            await query`
              WITH claims, domains, domainsHTTPS, https, organizations
              LET domainEdges = (FOR v, e IN 1..1 ANY ${org._id} claims RETURN { edgeKey: e._key, domainId: e._to })
              FOR domainEdge in domainEdges
                LET httpsEdges = (FOR v, e IN 1..1 ANY domainEdge.domainId domainsHTTPS RETURN { edgeKey: e._key, httpsId: e._to })
                LET removeHttpsEdges = (FOR httpsEdge IN httpsEdges REMOVE httpsEdge.edgeKey IN domainsHTTPS)
                LET removeHttps = (FOR httpsEdge IN httpsEdges LET key = PARSE_IDENTIFIER(httpsEdge.httpsId).key REMOVE key IN https)
              RETURN true
            `
          }),
          trx.step(async () => {
            await query`
              WITH claims, domains, domainsSSL, organizations, ssl
              LET domainEdges = (FOR v, e IN 1..1 ANY ${org._id} claims RETURN { edgeKey: e._key, domainId: e._to })
              FOR domainEdge in domainEdges
                LET sslEdges = (FOR v, e IN 1..1 ANY domainEdge.domainId domainsSSL RETURN { edgeKey: e._key, sslId: e._to})
                LET removeSslEdges = (FOR sslEdge IN sslEdges REMOVE sslEdge.edgeKey IN domainsSSL)
                LET removeSsl = (FOR sslEdge IN sslEdges LET key = PARSE_IDENTIFIER(sslEdge.sslId).key REMOVE key IN ssl)
              RETURN true
            `
          }),
        ])
      } catch (err) {
        console.error(
          `Trx step error occurred while attempting to remove scan results for org: ${org._key}, when user: ${user._key} attempted to leave. error: ${err}`,
        )
        throw new Error(i18n._(t`Unable leave organization. Please try again.`))
      }

      try {
        await Promise.all([
          trx.step(async () => {
            await query`
              WITH claims, domains, organizations
              LET domainEdges = (FOR v, e IN 1..1 ANY ${org._id} claims RETURN { edgeKey: e._key, domainId: e._to })
              LET removeDomainEdges = (FOR domainEdge in domainEdges REMOVE domainEdge.edgeKey IN claims)
              LET removeDomain = (FOR domainEdge in domainEdges LET key = PARSE_IDENTIFIER(domainEdge.domainId).key REMOVE key IN domains)
              RETURN true
            `
          }),
          trx.step(async () => {
            await query`
              WITH affiliations, organizations, users
              LET userEdges = (FOR v, e IN 1..1 ANY ${org._id} affiliations RETURN { edgeKey: e._key, userKey: e._to })
              LET removeUserEdges = (FOR userEdge IN userEdges REMOVE userEdge.edgeKey IN affiliations)
              RETURN true
            `
          }),
          trx.step(async () => {
            await query`
              WITH organizations
              REMOVE ${org._key} IN organizations
            `
          }),
        ])
      } catch (err) {
        console.error(
          `Trx step error occurred while attempting to remove domain, affiliations, and the org for org: ${org._key}, when user: ${user._key} attempted to leave. error: ${err}`,
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
            `,
        )
      } catch (err) {
        console.error(
          `Trx step error occurred when removing user: ${user._key} affiliation with org: ${org._key} err: ${err}`,
        )
        throw new Error(i18n._(t`Unable leave organization. Please try again.`))
      }
    }

    try {
      await trx.commit()
    } catch (err) {
      console.error(
        `Trx commit error occurred when user: ${user._key} attempted to leave org: ${org._key}. error: ${err}`,
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
