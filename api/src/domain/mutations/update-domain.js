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
    selectors: {
      type: new GraphQLList(Selectors),
      description: 'The updated DKIM selector strings corresponding to this domain.',
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

    let selectors
    if (typeof args.selectors !== 'undefined') {
      selectors = args.selectors.map((selector) => cleanseInput(selector))
    } else {
      selectors = null
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
      hidden: typeof hidden !== 'undefined' ? hidden : claim?.hidden,
      firstSeen: typeof claim?.firstSeen === 'undefined' ? new Date().toISOString() : claim?.firstSeen,
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

    if (selectors) {
      // Get current selectors
      let selectorCursor
      try {
        selectorCursor = await query`
        FOR v, e IN 1..1 OUTBOUND ${domain._id} domainsToSelectors
          RETURN v
      `
      } catch (err) {
        console.error(`Database error occurred when user: ${userKey} when getting current selectors: ${err}`)
      }

      let oldSelectors
      try {
        oldSelectors = await selectorCursor.all()
      } catch (err) {
        console.error(`Cursor error occurred when user: ${userKey} when getting current selectors: ${err}`)
      }

      // Remove old selector edges if no longer in use
      const oldSelectorStrings = oldSelectors.map((selector) => selector.selector)
      const selectorsToRemove = oldSelectors.filter((selector) => !selectors.includes(selector.selector))

      if (selectorsToRemove.length > 0) {
        try {
          await trx.step(
            () =>
              query`
              FOR selector IN ${selectorsToRemove}
                FOR v, e IN 1..1 ANY ${domain._id} domainsToSelectors
                  FILTER e._to == selector._id
                  REMOVE e IN domainsToSelectors
          `,
          )
        } catch (err) {
          console.error(
            `Transaction step error occurred when user: ${userKey} attempted to remove old selector edges, error: ${err}`,
          )
          throw new Error(i18n._(t`Unable to update domain. Please try again.`))
        }
      }

      // Ensure new selectors are already in database, add new edges
      const newSelectorsToAdd = selectors.filter((selector) => !oldSelectorStrings.includes(selector))

      if (newSelectorsToAdd.length > 0) {
        let newSelectorsCursor
        try {
          newSelectorsCursor = await trx.step(
            () =>
              query`
              FOR sel IN ${newSelectorsToAdd}
                UPSERT { selector: sel }
                  INSERT { selector: sel }
                  UPDATE { }
                  IN selectors
                  RETURN NEW
          `,
          )
        } catch (err) {
          console.error(
            `Transaction step error occurred when user: ${userKey} attempted to insert new selectors, error: ${err}`,
          )
          throw new Error(i18n._(t`Unable to update domain. Please try again.`))
        }

        let newSelectors
        try {
          newSelectors = await newSelectorsCursor.all()
        } catch (err) {
          console.error(`Cursor error occurred when user: ${userKey} when getting new selectors: ${err}`)
        }

        try {
          await trx.step(
            () =>
              query`
              FOR selector IN ${newSelectors}
                INSERT { _from: ${domain._id}, _to: selector._id } IN domainsToSelectors
              `,
          )
        } catch (err) {
          console.error(
            `Transaction step error occurred when user: ${userKey} attempted to insert new selector edges, error: ${err}`,
          )
          throw new Error(i18n._(t`Unable to update domain. Please try again.`))
        }
      }
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
    if (
      typeof selectors !== 'undefined' &&
      JSON.stringify(domainToInsert.selectors) !== JSON.stringify(domain.selectors)
    ) {
      updatedProperties.push({
        name: 'selectors',
        oldValue: domain.selectors,
        newValue: selectors,
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
