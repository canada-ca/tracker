import { GraphQLNonNull } from 'graphql'
import { mutationWithClientMutationId } from 'graphql-relay'
import { t } from '@lingui/macro'

import { updateDomainResultUnion } from '../unions'
import { Domain, Selectors } from '../../scalars'

export const addSelector = new mutationWithClientMutationId({
  name: 'AddSelector',
  description: 'This mutation allows the user to add a selector to a domain.',
  inputFields: () => ({
    domain: {
      type: new GraphQLNonNull(Domain),
      description: 'The domain string to add the selector to.',
    },
    selector: {
      type: new GraphQLNonNull(Selectors),
      description: 'The selector string to add to the domain.',
    },
  }),
  outputFields: () => ({
    result: {
      type: updateDomainResultUnion,
      description: '`UpdateDomainResultUnion` returning either a `DomainResult`, or `DomainError` object.',
      resolve: (payload) => payload,
    },
  }),
  mutateAndGetPayload: async (
    args,
    {
      i18n,
      query,
      userKey,
      auth: { userRequired, verifiedRequired },
      loaders: { loadDomainByDomain },
      validators: { cleanseInput },
    },
  ) => {
    // Get User
    const user = await userRequired()
    verifiedRequired({ user })

    // Cleanse input
    const domainString = cleanseInput(args.domain)
    const selectorString = cleanseInput(args.selector)

    if (!domainString) {
      console.warn(`User: ${userKey} did not give a domain string when attempting to add a selector.`)
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Domain string is required when adding a selector.`),
      }
    }

    if (!selectorString) {
      console.warn(`User: ${userKey} did not give a selector string when attempting to add a selector.`)
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Selector string is required when adding a selector.`),
      }
    }

    // Get Domain
    const domain = await loadDomainByDomain.load(domainString)

    // Check to see if domain exists
    if (typeof domain === 'undefined') {
      console.warn(`User: ${userKey} attempted to add selector to ${domainString} however that domain does not exist.`)
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to add selector to unknown domain.`),
      }
    }

    // Check to see if user has permission to add selector to domain
    const hasPermission = await query`
      WITH affiliations, domains, organizations
      LET isSuperAdmin = FIRST(
        FOR v, e IN 1..1 INBOUND ${user._id} affiliations
          FILTER e.permission == "super_admin"
          RETURN true
      )
      LET isAdmin = FIRST(
        FOR v, e IN 1..1 INBOUND ${user._id} affiliations
          FILTER e._from == ${domain._id}
          FILTER e.permission == "admin"
          RETURN true
      )
      RETURN isSuperAdmin || isAdmin
    `

    if (!hasPermission) {
      console.warn(
        `User: ${userKey} attempted to add selector to ${domainString} however they do not have permission to do so.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`You do not have permission to add a selector to this domain.`),
      }
    }

    // Ensure selector exists in database
    let selectorCursor
    try {
      selectorCursor = await query`
        WITH selectors
        UPSERT { selector: ${selectorString} }
          INSERT { selector: ${selectorString} }
          UPDATE { }
          IN selectors
        RETURN NEW
        `
    } catch (err) {
      console.error(
        `Database error occurred while user: ${userKey} was adding selector "${selectorString}" to domain "${domainString}" while ensuring selector exists: ${err}`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to add selector to domain. Please try again.`),
      }
    }

    let selector
    try {
      selector = await selectorCursor.next()
    } catch (err) {
      console.error(
        `Cursor error occurred while user: ${userKey} was adding selector "${selectorString}" to domain "${domainString}" while ensuring selector exists: ${err}`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to add selector to domain. Please try again.`),
      }
    }

    // Check to see if domain already has selector
    let checkSelectorCursor
    try {
      checkSelectorCursor = await query`
        WITH domains, domainsToSelectors, selectors
        FOR v, e IN 1..1 OUTBOUND ${domain._id} domainsToSelectors
          FILTER v.selector == ${selectorString}
          FILTER e.status == "active"
          RETURN v
      `
    } catch (err) {
      console.error(`Database error occurred while user: ${userKey} was checking selector: ${err}`)
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to add selector to domain. Please try again.`),
      }
    }

    const checkSelector = await checkSelectorCursor.next()
    if (checkSelector) {
      console.warn(
        `User: ${userKey} attempted to add selector ${selectorString} to domain ${domainString} however that selector is already associated with that domain.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Selector is already associated with domain.`),
      }
    }

    // Add selector to domain
    try {
      await query`
        WITH domains, domainsToSelectors, selectors
        UPSERT { _from: ${domain._id}, _to: ${selector._id} }
          INSERT { _from: ${domain._id}, _to: ${selector._id}, status: "active" }
          UPDATE { status: "active" }
          IN domainsToSelectors
      `
    } catch (err) {
      console.error(
        `Database error occurred while user: ${userKey} was adding selector "${selectorString}" to domain "${domainString}": ${err}`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to add selector to domain. Please try again.`),
      }
    }

    console.info(`User: ${userKey} successfully added selector ${selectorString} to domain ${domainString}.`)

    return {
      _type: 'result',
      domain: domain,
      status: i18n._(t`Successfully added selector ${selectorString} to domain ${domainString}.`),
    }
  },
})
