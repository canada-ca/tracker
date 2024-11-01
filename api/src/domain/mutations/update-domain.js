import { GraphQLID, GraphQLNonNull, GraphQLList, GraphQLBoolean } from 'graphql'
import { mutationWithClientMutationId, fromGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

import { updateDomainUnion } from '../unions'
import { CveID } from '../../scalars'
import { logActivity } from '../../audit-logs/mutations/log-activity'
import { inputTag } from '../inputs/domain-tag'
import { AssetStateEnums } from '../../enums'

export const updateDomain = new mutationWithClientMutationId({
  name: 'UpdateDomain',
  description: 'Mutation allows the modification of domains if domain is updated through out its life-cycle',
  inputFields: () => ({
    domainId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The global id of the domain that is being updated.',
    },
    orgId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The global ID of the organization used for permission checks.',
    },
    tags: {
      description: 'List of labelled tags users have applied to the domain.',
      type: new GraphQLList(inputTag),
    },
    archived: {
      description: 'Value that determines if the domain is excluded from the scanning process.',
      type: GraphQLBoolean,
    },
    ignoreRua: {
      description: 'Boolean value that determines if the domain should ignore rua reports.',
      type: GraphQLBoolean,
    },
    assetState: {
      description: 'Value that determines how the domain relates to the organization.',
      type: AssetStateEnums,
    },
    ignoredCves: {
      description: 'List of CVEs that the user has chosen to ignore.',
      type: new GraphQLList(CveID),
    },
  }),
  outputFields: () => ({
    result: {
      type: updateDomainUnion,
      description: '`UpdateDomainUnion` returning either a `Domain`, or `DomainError` object.',
      resolve: (payload) => payload,
    },
  }),
  mutateAndGetPayload: async (
    args,
    {
      i18n,
      query,
      language,
      collections,
      transaction,
      userKey,
      publish,
      auth: { checkPermission, userRequired, verifiedRequired, tfaRequired },
      validators: { cleanseInput },
      loaders: { loadDomainByKey, loadOrgByKey },
    },
  ) => {
    // Get User
    const user = await userRequired()

    verifiedRequired({ user })
    tfaRequired({ user })

    const { id: domainId } = fromGlobalId(cleanseInput(args.domainId))
    const { id: orgId } = fromGlobalId(cleanseInput(args.orgId))

    let tags
    if (typeof args.tags !== 'undefined') {
      tags = args.tags
    } else {
      tags = null
    }

    let archived
    if (typeof args.archived !== 'undefined') {
      archived = args.archived
    } else {
      archived = null
    }

    let assetState
    if (typeof args.assetState !== 'undefined') {
      assetState = cleanseInput(args.assetState)
    } else {
      assetState = ''
    }

    let ignoredCves
    if (typeof args.ignoredCves !== 'undefined') {
      ignoredCves = args.ignoredCves
    } else {
      ignoredCves = null
    }

    // Check to see if domain exists
    const domain = await loadDomainByKey.load(domainId)

    if (typeof domain === 'undefined') {
      console.warn(
        `User: ${userKey} attempted to update domain: ${domainId}, however there is no domain associated with that id.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to update unknown domain.`),
      }
    }

    // Check to see if org exists
    const org = await loadOrgByKey.load(orgId)

    if (typeof org === 'undefined') {
      console.warn(
        `User: ${userKey} attempted to update domain: ${domainId} for org: ${orgId}, however there is no org associated with that id.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to update domain in an unknown org.`),
      }
    }

    // Check permission
    const permission = await checkPermission({ orgId: org._id })

    if (!['admin', 'owner', 'super_admin'].includes(permission)) {
      console.warn(
        `User: ${userKey} attempted to update domain: ${domainId} for org: ${orgId}, however they do not have permission in that org.`,
      )
      return {
        _type: 'error',
        code: 403,
        description: i18n._(t`Permission Denied: Please contact organization user for help with updating this domain.`),
      }
    }

    // Check to see if org has a claim to this domain
    let countCursor
    try {
      countCursor = await query`
        WITH claims, domains, organizations
        FOR v, e IN 1..1 ANY ${domain._id} claims
          FILTER e._from == ${org._id}
          RETURN e
      `
    } catch (err) {
      console.error(
        `Database error occurred while user: ${userKey} attempted to update domain: ${domainId}, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to update domain. Please try again.`))
    }

    if (countCursor.count < 1) {
      console.warn(
        `User: ${userKey} attempted to update domain: ${domainId} for org: ${orgId}, however that org has no claims to that domain.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to update domain that does not belong to the given organization.`),
      }
    }

    // Setup Transaction
    const trx = await transaction(collections)

    // Update domain
    const domainToInsert = {
      archived: typeof archived !== 'undefined' ? archived : domain?.archived,
      ignoreRua: typeof args.ignoreRua !== 'undefined' ? args.ignoreRua : domain?.ignoreRua,
      ignoredCves: ignoredCves || domain?.ignoredCves,
    }

    try {
      await trx.step(
        async () =>
          await query`
          WITH domains
          UPSERT { _key: ${domain._key} }
            INSERT ${domainToInsert}
            UPDATE ${domainToInsert}
            IN domains
      `,
      )
    } catch (err) {
      console.error(
        `Transaction step error occurred when user: ${userKey} attempted to update domain: ${domainId}, error: ${err}`,
      )
      await trx.abort()
      throw new Error(i18n._(t`Unable to update domain. Please try again.`))
    }

    let claimCursor
    try {
      claimCursor = await query`
        WITH claims
        FOR claim IN claims
          FILTER claim._from == ${org._id} && claim._to == ${domain._id}
          RETURN MERGE({ id: claim._key, _type: "claim" }, claim)
      `
    } catch (err) {
      console.error(`Database error occurred when user: ${userKey} running loadDomainByKey: ${err}`)
    }
    let claim
    try {
      claim = await claimCursor.next()
    } catch (err) {
      console.error(`Cursor error occurred when user: ${userKey} running loadDomainByKey: ${err}`)
    }

    const claimToInsert = {
      tags: tags || claim?.tags,
      firstSeen: typeof claim?.firstSeen === 'undefined' ? new Date().toISOString() : claim?.firstSeen,
      assetState: assetState || claim?.assetState,
    }

    try {
      await trx.step(
        async () =>
          await query`
          WITH claims
          UPSERT { _from: ${org._id}, _to: ${domain._id} }
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
      throw new Error(i18n._(t`Unable to update domain edge. Please try again.`))
    }

    // Commit transaction
    try {
      await trx.commit()
    } catch (err) {
      console.error(
        `Transaction commit error occurred when user: ${userKey} attempted to update domain: ${domainId}, error: ${err}`,
      )
      await trx.abort()
      throw new Error(i18n._(t`Unable to update domain. Please try again.`))
    }

    // Clear dataloader and load updated domain
    await loadDomainByKey.clear(domain._key)
    const returnDomain = await loadDomainByKey.load(domain._key)

    console.info(`User: ${userKey} successfully updated domain: ${domainId}.`)

    const updatedProperties = []
    if (typeof assetState !== 'undefined' && assetState !== claim.assetState) {
      updatedProperties.push({
        name: 'assetState',
        oldValue: claim.assetState,
        newValue: assetState,
      })
    }

    if (typeof tags !== 'undefined' && JSON.stringify(claim.tags) !== JSON.stringify(tags)) {
      updatedProperties.push({
        name: 'tags',
        oldValue: claim.tags,
        newValue: tags,
      })
    }

    if (typeof ignoredCves !== 'undefined' && JSON.stringify(domain.ignoredCves) !== JSON.stringify(ignoredCves)) {
      updatedProperties.push({
        name: 'ignoredCves',
        oldValue: domain.ignoredCves,
        newValue: ignoredCves,
      })
    }

    if (updatedProperties.length > 0) {
      await logActivity({
        transaction,
        collections,
        query,
        initiatedBy: {
          id: user._key,
          userName: user.userName,
          role: permission,
        },
        action: 'update',
        target: {
          resource: domain.domain,
          organization: {
            id: org._key,
            name: org.name,
          }, // name of resource being acted upon
          resourceType: 'domain', // user, org, domain
          updatedProperties,
        },
      })
    }

    if (typeof archived !== 'undefined') {
      await logActivity({
        transaction,
        collections,
        query,
        initiatedBy: {
          id: user._key,
          userName: user.userName,
          role: permission,
        },
        action: 'update',
        target: {
          resource: domain.domain,
          resourceType: 'domain', // user, org, domain
          updatedProperties: [{ name: 'archived', oldValue: domain.archived, newValue: archived }],
        },
      })
    }

    if (typeof assetState !== 'undefined' && assetState !== claim.assetState) {
      try {
        await publish({
          channel: 'scans.add_domain_to_easm',
          msg: {
            domain: returnDomain.domain,
            assetState,
            domain_key: returnDomain._key,
            hash: returnDomain.hash,
            user_key: null, // only used for One Time Scans
            shared_id: null, // only used for One Time Scans
          },
        })
      } catch (err) {
        console.error(`Error publishing to NATS for domain ${returnDomain._key}: ${err}`)
      }
    }

    returnDomain.id = returnDomain._key

    return {
      ...returnDomain,
      claimTags: claimToInsert.tags.map((tag) => {
        return tag[language]
      }),
      assetState,
    }
  },
})
