import { fromGlobalId, mutationWithClientMutationId } from 'graphql-relay'
import { bulkModifyDomainsUnion } from '../unions'
import { GraphQLID, GraphQLList, GraphQLNonNull, GraphQLString } from 'graphql'
import { t } from '@lingui/macro'
import { logActivity } from '../../audit-logs'

export const updateDomainsByDomainIds = new mutationWithClientMutationId({
  name: 'UpdateDomainsByDomainIds',
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
    domainIds: {
      type: new GraphQLList(GraphQLID),
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
    let tags = (await loadTagByTagId.loadMany(args.tags.map((tag) => cleanseInput(tag)))) ?? []
    tags = tags
      .filter(
        ({ visible, ownership, organizations }) =>
          visible && (ownership === 'global' || organizations.some((org) => org === orgId)),
      )
      .map((tag) => tag.tagId)

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

    let domainCount = 0
    const orgKeyString = `organizations/${orgId}`
    for (const id of args.domainIds) {
      const { id: domainId } = fromGlobalId(cleanseInput(id))
      // check for valid domain/claim
      let checkClaimCursor
      try {
        checkClaimCursor = await query`
          WITH claims, domains, organizations
          FOR v, e IN 1..1 ANY ${orgKeyString} claims
            FILTER v._key == ${domainId}
            RETURN { claim: e, domain: v.domain }
        `
      } catch (err) {
        console.error(`Database error occurred while running check to see if domain already exists in an org: ${err}`)
        continue
      }

      let checkClaim
      try {
        checkClaim = await checkClaimCursor.next()
      } catch (err) {
        console.error(`Cursor error occurred while running check to see if domain already exists in an org: ${err}`)
        continue
      }

      if (typeof checkClaim === 'undefined') {
        console.warn(
          `User: ${userKey} attempted to update a domain for: ${org.slug}, however that org does not have that domain claimed.`,
        )
        continue
      }

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
