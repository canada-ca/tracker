import { fromGlobalId, mutationWithClientMutationId } from 'graphql-relay'
import { bulkModifyDomainsUnion } from '../unions'
import { GraphQLID, GraphQLList, GraphQLNonNull, GraphQLString } from 'graphql'
import { t } from '@lingui/macro'
import { domainFilter } from '../inputs'
import ac from '../../access-control'

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
      userKey,
      request: { ip },
      auth: { checkPermission, userRequired, verifiedRequired, tfaRequired },
      dataSources: { domain: domainDS, auditLogs, tags: tagsDS, organization: orgDS },
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
    let tags = (await tagsDS.byTagId.loadMany(args.tags.map((tag) => cleanseInput(tag)))) ?? []
    tags = tags
      .filter(
        ({ visible, ownership, organizations }) =>
          visible && (ownership === 'global' || organizations.some((org) => org === orgId)),
      )
      .map((tag) => tag.tagId)
    const filters = args.filters

    // Check to see if org exists
    const org = await orgDS.byKey.load(orgId)
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
    if (!ac.can(permission).updateOwn('domain').granted) {
      console.warn(
        `User: ${userKey} attempted to update domains in: ${org.slug}, however they do not have permission to do so.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Permission Denied: Please contact organization admin for help with updating domains.`),
      }
    }

    const checkClaims = await domainDS.loadClaimsForOrgByFilters({
      orgId: org._id,
      filters,
      search,
    })

    let domainCount = 0
    for (const checkClaim of checkClaims) {
      const { claim, domain } = checkClaim
      const claimToInsert = {
        tags: [...new Set([...claim.tags, ...tags])],
      }

      try {
        await domainDS.updateClaim({ claim, claimToInsert })
      } catch (err) {
        continue
      }

      await auditLogs.logActivity({
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
