import { fromGlobalId, mutationWithClientMutationId } from 'graphql-relay'
import { bulkModifyDomainsUnion } from '../unions'
import { GraphQLID, GraphQLList, GraphQLNonNull, GraphQLString } from 'graphql'
import { t } from '@lingui/macro'
import { logActivity } from '../../audit-logs'
import { domainFilter } from '../inputs'
import { aql } from 'arangojs'

export const updateDomainsByFilters = new mutationWithClientMutationId({
  name: 'UpdateDomainsByFilters',
  description: '',
  inputFields: () => ({
    orgId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The global id of the organization you wish to assign this domain to.',
    },
    tags: {
      type: new GraphQLNonNull(new GraphQLList(GraphQLString)),
      description: 'List of labelled tags users have applied to the domain.',
    },
    filters: {
      type: new GraphQLList(domainFilter),
      description: '',
    },
    search: {
      type: GraphQLString,
      description: '',
    },
  }),
  outputFields: () => ({
    result: {
      type: bulkModifyDomainsUnion,
      description: '`BulkModifyDomainsUnion` returning either a `DomainBulkResult`, or `DomainErrorType` object.',
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
      loaders: { loadTagByTagId, loadOrgByKey },
      validators: { cleanseInput },
    },
  ) => {
    // Get User
    const user = await userRequired()
    verifiedRequired({ user })
    tfaRequired({ user })

    // Cleanse input
    const { id: orgId } = fromGlobalId(cleanseInput(args.orgId))
    const search = cleanseInput(args.search)
    let tags = (await loadTagByTagId.loadMany(args.tags.map((tag) => cleanseInput(tag)))) ?? []
    tags = tags
      .filter(
        ({ visible, ownership, organizations }) =>
          visible && (ownership === 'global' || organizations.some((org) => org === orgId)),
      )
      .map((tag) => tag.tagId)
    const filters = args.filters

    // Check to see if org exists
    const org = await loadOrgByKey.load(orgId)
    if (typeof org === 'undefined') {
      console.warn(`User: ${userKey} attempted to update domains to an organization: ${orgId} that does not exist.`)
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to update domains in unknown organization.`),
      }
    }

    // Check to see if user belongs to org
    const permission = await checkPermission({ orgId: org._id })
    if (!['super_admin', 'owner', 'admin'].includes(permission)) {
      console.warn(
        `User: ${userKey} attempted to update domains in: ${org.slug}, however they do not have permission to do so.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Permission Denied: Please contact organization admin for help with updating domains.`),
      }
    }

    const orgKeyString = `organizations/${orgId}`
    let domainFilters = aql``
    if (typeof filters !== 'undefined') {
      filters.forEach(({ filterCategory, comparison, filterValue }) => {
        if (comparison === '==') {
          comparison = aql`==`
        } else {
          comparison = aql`!=`
        }
        if (filterCategory === 'dmarc-status') {
          domainFilters = aql`
              ${domainFilters}
              FILTER v.status.dmarc ${comparison} ${filterValue}
            `
        } else if (filterCategory === 'dkim-status') {
          domainFilters = aql`
              ${domainFilters}
              FILTER v.status.dkim ${comparison} ${filterValue}
            `
        } else if (filterCategory === 'https-status') {
          domainFilters = aql`
              ${domainFilters}
              FILTER v.status.https ${comparison} ${filterValue}
            `
        } else if (filterCategory === 'spf-status') {
          domainFilters = aql`
              ${domainFilters}
              FILTER v.status.spf ${comparison} ${filterValue}
            `
        } else if (filterCategory === 'ciphers-status') {
          domainFilters = aql`
              ${domainFilters}
              FILTER v.status.ciphers ${comparison} ${filterValue}
            `
        } else if (filterCategory === 'curves-status') {
          domainFilters = aql`
              ${domainFilters}
              FILTER v.status.curves ${comparison} ${filterValue}
            `
        } else if (filterCategory === 'hsts-status') {
          domainFilters = aql`
              ${domainFilters}
              FILTER v.status.hsts ${comparison} ${filterValue}
            `
        } else if (filterCategory === 'policy-status') {
          domainFilters = aql`
              ${domainFilters}
              FILTER v.status.policy ${comparison} ${filterValue}
            `
        } else if (filterCategory === 'protocols-status') {
          domainFilters = aql`
              ${domainFilters}
              FILTER v.status.protocols ${comparison} ${filterValue}
            `
        } else if (filterCategory === 'certificates-status') {
          domainFilters = aql`
              ${domainFilters}
              FILTER v.status.certificates ${comparison} ${filterValue}
            `
        } else if (filterCategory === 'tags') {
          if (filterValue === 'archived') {
            domainFilters = aql`
                ${domainFilters}
                FILTER v.archived ${comparison} true
              `
          } else if (filterValue === 'nxdomain') {
            domainFilters = aql`
                ${domainFilters}
                FILTER v.rcode ${comparison} "NXDOMAIN"
              `
          } else if (filterValue === 'blocked') {
            domainFilters = aql`
                ${domainFilters}
                FILTER v.blocked ${comparison} true
              `
          } else if (filterValue === 'wildcard-sibling') {
            domainFilters = aql`
                ${domainFilters}
                FILTER v.wildcardSibling ${comparison} true
              `
          } else if (filterValue === 'wildcard-entry') {
            domainFilters = aql`
                ${domainFilters}
                FILTER v.wildcardEntry ${comparison} true
              `
          } else if (filterValue === 'scan-pending') {
            domainFilters = aql`
                ${domainFilters}
                FILTER v.webScanPending ${comparison} true
              `
          } else if (filterValue === 'has-entrust-certificate') {
            domainFilters = aql`
                ${domainFilters}
                FILTER v.hasEntrustCertificate ${comparison} true
              `
          } else if (filterValue === 'cve-detected') {
            domainFilters = aql`
                ${domainFilters}
                FILTER v.cveDetected ${comparison} true
              `
          } else {
            domainFilters = aql`
                ${domainFilters}
                FILTER POSITION( e.tags, ${filterValue}) ${comparison} true
              `
          }
        } else if (filterCategory === 'asset-state') {
          domainFilters = aql`
              ${domainFilters}
              FILTER e.assetState ${comparison} ${filterValue}
            `
        } else if (filterCategory === 'guidance-tag') {
          domainFilters = aql`
              ${domainFilters}
              FILTER POSITION(negativeTags, ${filterValue}) ${comparison} true
            `
        }
      })
    }

    let searchString = aql``
    if (typeof search !== 'undefined' && search !== '') {
      searchString = aql`FILTER LOWER(v.domain) LIKE LOWER(${search})`
    }

    let checkClaimsCursor
    try {
      checkClaimsCursor = await query`
        WITH claims, domains, organizations
        FOR v, e IN 1..1 ANY ${orgKeyString} claims
          ${domainFilters}
          ${searchString}
          RETURN { claim: e, domain: v.domain }
      `
    } catch (err) {
      console.error(`Database error occurred while running check to see if domain already exists in an org: ${err}`)
      throw new Error(i18n._(t`Unable to update domains. Please try again.`))
    }

    let checkClaims
    try {
      checkClaims = await checkClaimsCursor.all()
    } catch (err) {
      console.error(`Cursor error occurred while running check to see if domain already exists in an org: ${err}`)
      throw new Error(i18n._(t`Unable to update domains. Please try again.`))
    }

    if (typeof checkClaims === 'undefined') {
      console.warn(
        `User: ${userKey} attempted to update a domain for: ${org.slug}, however that org does not have that domain claimed.`,
      )
      throw new Error(i18n._(t`Unable to update domains. Please try again.`))
    }

    let domainCount = 0
    for (const checkClaim of checkClaims) {
      // Setup Transaction
      const trx = await transaction(collections)
      const { claim, domain } = checkClaim
      const claimToInsert = {
        tags: [...new Set([...claim.tags, ...tags])],
      }

      try {
        await trx.step(
          async () =>
            await query`
              WITH claims
              UPSERT { _key: ${claim._key} }
                INSERT ${claimToInsert}
                UPDATE ${claimToInsert}
                IN claims
            `,
        )
      } catch (err) {
        console.error(
          `Transaction step error occurred when user: ${userKey} attempted to update domain edge, error: ${err}`,
        )
        await trx.abort()
        continue
      }

      // commit and log
      try {
        await trx.commit()
      } catch (err) {
        console.error(`Transaction commit error occurred while user: ${userKey} was creating domains: ${err}`)
        await trx.abort()
        continue
      }

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
        action: 'update',
        target: {
          resource: domain,
          updatedProperties: [{ name: 'tags', oldValue: claim.tags, newValue: claimToInsert.tags }],
          organization: {
            id: org._key,
            name: org.name,
          },
          resourceType: 'domain',
        },
      })
      domainCount++
    }

    return {
      _type: 'result',
      status: i18n._(t`Successfully updated ${domainCount} domain(s) in ${org.slug} with ${tags.join(', ')}.`),
    }
  },
})
