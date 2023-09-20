import { GraphQLID, GraphQLNonNull, GraphQLList, GraphQLBoolean } from 'graphql'
import { mutationWithClientMutationId, fromGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

import { updateDomainUnion } from '../unions'
import { Domain, Selectors } from '../../scalars'
import { logActivity } from '../../audit-logs/mutations/log-activity'
import { inputTag } from '../inputs/domain-tag'
import { OutsideDomainCommentEnum } from '../../enums'

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
    domain: {
      type: Domain,
      description: 'The new url of the of the old domain.',
    },
    activeSelectors: {
      type: new GraphQLList(Selectors),
      description: 'The updated active DKIM selector strings corresponding to this domain.',
    },
    blockedSelectors: {
      type: new GraphQLList(Selectors),
      description: 'The updated blocked DKIM selector strings corresponding to this domain.',
    },
    tags: {
      description: 'List of labelled tags users have applied to the domain.',
      type: new GraphQLList(inputTag),
    },
    hidden: {
      description: "Value that determines if the domain is excluded from an organization's score.",
      type: GraphQLBoolean,
    },
    archived: {
      description: 'Value that determines if the domain is excluded from the scanning process.',
      type: GraphQLBoolean,
    },
    outsideComment: {
      description: 'Comment describing reason for adding out-of-scope domain.',
      type: OutsideDomainCommentEnum,
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
    const updatedDomain = cleanseInput(args.domain)

    const checkArrayDuplicates = (array) => {
      return new Set(array).size !== array.length
    }

    let activeSelectors = []
    if (typeof args.activeSelectors !== 'undefined') {
      activeSelectors = args.activeSelectors.map((selector) => cleanseInput(selector))
    }

    if (checkArrayDuplicates(activeSelectors)) {
      console.warn(`User: ${userKey} attempted to add duplicate selectors to ${domainId}.`)
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to add duplicate selectors to domain.`),
      }
    }

    let blockedSelectors = []
    if (typeof args.blockedSelectors !== 'undefined') {
      blockedSelectors = args.blockedSelectors.map((selector) => cleanseInput(selector))
    }

    if (checkArrayDuplicates(blockedSelectors)) {
      console.warn(`User: ${userKey} attempted to block duplicate selectors for ${domainId}.`)
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to block duplicate selectors for domain.`),
      }
    }

    // Check to see if active and blocked selectors are the same
    if (checkArrayDuplicates([...activeSelectors, ...blockedSelectors])) {
      console.warn(`User: ${userKey} attempted to add duplicate selectors to ${domainId}.`)
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to add duplicate selectors to domain.`),
      }
    }

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

    let hidden
    if (typeof args.hidden !== 'undefined') {
      hidden = args.hidden
    } else {
      hidden = null
    }

    let outsideComment
    if (typeof args.outsideComment !== 'undefined') {
      outsideComment = cleanseInput(args.outsideComment)
    } else {
      outsideComment = ''
    }

    if (tags?.find(({ en }) => en === 'OUTSIDE')) {
      if (outsideComment === '') {
        console.warn(`User: ${userKey} attempted to create a domain with the OUTSIDE tag without providing a comment.`)
        return {
          _type: 'error',
          code: 400,
          description: i18n._(t`Please provide a comment when adding an outside domain.`),
        }
      }
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
      domain: updatedDomain.toLowerCase() || domain.domain.toLowerCase(),
      lastRan: domain.lastRan,
      archived: typeof archived !== 'undefined' ? archived : domain?.archived,
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
      throw new Error(i18n._(t`Unable to update domain. Please try again.`))
    }

    // Update selectors
    const updateSelector = async ({ selector, status }) => {
      // Ensure selector exists
      let selectorCursor
      try {
        selectorCursor = await trx.step(
          () =>
            query`
            WITH selectors
            UPSERT { selector: ${selector} }
              INSERT { selector: ${selector} }
              UPDATE { }
              IN selectors
            RETURN NEW
          `,
        )
      } catch (err) {
        console.error(
          `Transaction step error occurred when user: ${userKey} attempted to update domain while ensuring selector ${selector} exists: ${domainId}, error: ${err}`,
        )
        throw new Error(i18n._(t`Unable to update domain. Please try again.`))
      }

      let newSelector
      try {
        newSelector = await selectorCursor.next()
      } catch (err) {
        console.error(
          `Cursor error occurred when user: ${userKey} attempted to update domain while ensuring selector ${selector} exists: ${domainId}, error: ${err}`,
        )
        throw new Error(i18n._(t`Unable to update domain. Please try again.`))
      }

      // Add selector to domain
      try {
        await trx.step(
          () =>
            query`
            UPSERT { _from: ${domain._id}, _to: ${newSelector._id} }
              INSERT { _from: ${domain._id}, _to: ${newSelector._id}, status: ${status} }
              UPDATE { status: ${status} }
              IN domainsToSelectors
          `,
        )
      } catch (err) {
        console.error(
          `Transaction step error occurred when user: ${userKey} attempted to update domain while adding selector ${selector} to domain: ${domainId}, error: ${err}`,
        )
        throw new Error(i18n._(t`Unable to update domain. Please try again.`))
      }
    }

    // Get active selectors
    let currentActiveSelectorsCursor
    try {
      currentActiveSelectorsCursor = await trx.step(
        () =>
          query`
            WITH domains, domainsToSelectors, selectors
            FOR v, e IN 1..1 OUTBOUND ${domain._id} domainsToSelectors
              FILTER e.status == "active"
              RETURN v.selector
          `,
      )
    } catch (err) {
      console.error(
        `Transaction step error occurred when user: ${userKey} attempted to update domain while retrieving active selectors: ${domainId}, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to update domain. Please try again.`))
    }

    let currentActiveSelectors
    try {
      currentActiveSelectors = await currentActiveSelectorsCursor.all()
    } catch (err) {
      console.error(
        `Cursor error occurred when user: ${userKey} attempted to update domain while retrieving active selectors: ${domainId}, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to update domain. Please try again.`))
    }

    // Add new active selectors
    const activeSelectorsToAdd = activeSelectors.filter((selector) => {
      return !currentActiveSelectors.includes(selector)
    })

    for (const selector of activeSelectorsToAdd) {
      await updateSelector({ domain, selector, status: 'active' })
    }

    // Get blocked selectors
    let currentBlockedSelectorsCursor
    try {
      currentBlockedSelectorsCursor = await trx.step(
        () =>
          query`
            WITH domains, domainsToSelectors, selectors
            FOR v, e IN 1..1 OUTBOUND ${domain._id} domainsToSelectors
              FILTER e.status == "blocked"
              RETURN v.selector
          `,
      )
    } catch (err) {
      console.error(
        `Transaction step error occurred when user: ${userKey} attempted to update domain while retrieving blocked selectors: ${domainId}, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to update domain. Please try again.`))
    }

    let currentBlockedSelectors
    try {
      currentBlockedSelectors = await currentBlockedSelectorsCursor.all()
    } catch (err) {
      console.error(
        `Cursor error occurred when user: ${userKey} attempted to update domain while retrieving blocked selectors: ${domainId}, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to update domain. Please try again.`))
    }

    // Add new blocked selectors
    const blockedSelectorsToAdd = blockedSelectors.filter((selector) => {
      return !currentBlockedSelectors.includes(selector)
    })

    for (const selector of blockedSelectorsToAdd) {
      await updateSelector({ selector, status: 'blocked' })
    }

    // Remove old selectors
    const selectorsToRemove = [...currentActiveSelectors, ...currentBlockedSelectors].filter((selector) => {
      return !activeSelectors.includes(selector) && !blockedSelectors.includes(selector)
    })

    for (const selector of selectorsToRemove) {
      try {
        await trx.step(
          () =>
            query`
            WITH domains, domainsToSelectors, selectors
            FOR v, e IN 1..1 OUTBOUND ${domain._id} domainsToSelectors
              FILTER v.selector == ${selector}
              REMOVE e IN domainsToSelectors
          `,
        )
      } catch (err) {
        console.error(
          `Transaction step error occurred when user: ${userKey} attempted to update domain while removing selector ${selector} from domain: ${domainId}, error: ${err}`,
        )
        throw new Error(i18n._(t`Unable to update domain. Please try again.`))
      }
    }

    let claimCursor
    try {
      claimCursor = await trx.step(
        () => query`
        WITH claims
        FOR claim IN claims
          FILTER claim._from == ${org._id} && claim._to == ${domain._id}
          RETURN MERGE({ id: claim._key, _type: "claim" }, claim)
      `,
      )
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
      hidden: typeof hidden !== 'undefined' ? hidden : claim?.hidden,
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
      throw new Error(i18n._(t`Unable to update domain edge. Please try again.`))
    }

    // Commit transaction
    try {
      await trx.commit()
    } catch (err) {
      console.error(
        `Transaction commit error occurred when user: ${userKey} attempted to update domain: ${domainId}, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to update domain. Please try again.`))
    }

    // Clear dataloader and load updated domain
    await loadDomainByKey.clear(domain._key)
    const returnDomain = await loadDomainByKey.load(domain._key)

    console.info(`User: ${userKey} successfully updated domain: ${domainId}.`)

    const updatedProperties = []
    if (domainToInsert.domain.toLowerCase() !== domain.domain.toLowerCase()) {
      updatedProperties.push({
        name: 'domain',
        oldValue: domain.domain,
        newValue: domainToInsert.domain,
      })
    }

    if (typeof tags !== 'undefined' && JSON.stringify(claim.tags) !== JSON.stringify(tags)) {
      updatedProperties.push({
        name: 'tags',
        oldValue: claim.tags,
        newValue: tags,
      })
    }

    if (typeof hidden !== 'undefined') {
      updatedProperties.push({
        name: 'hidden',
        oldValue: claim?.hidden,
        newValue: hidden,
      })
    }

    // Check active selectors were updated
    activeSelectors.sort()
    currentActiveSelectors.sort()
    if (JSON.stringify(activeSelectors) !== JSON.stringify(currentActiveSelectors)) {
      updatedProperties.push({
        name: 'activeSelectors',
        oldValue: currentActiveSelectors,
        newValue: activeSelectors,
      })
    }

    // Check blocked selectors were updated
    blockedSelectors.sort()
    currentBlockedSelectors.sort()
    if (JSON.stringify(blockedSelectors) !== JSON.stringify(currentBlockedSelectors)) {
      updatedProperties.push({
        name: 'blockedSelectors',
        oldValue: currentBlockedSelectors,
        newValue: blockedSelectors,
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
        reason: outsideComment !== '' ? outsideComment : null,
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

    returnDomain.id = returnDomain._key

    return {
      ...returnDomain,
      claimTags: claimToInsert.tags.map((tag) => {
        return tag[language]
      }),
      hidden,
    }
  },
})
