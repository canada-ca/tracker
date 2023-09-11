import { GraphQLNonNull } from 'graphql'
import { mutationWithClientMutationId } from 'graphql-relay'
import { t } from '@lingui/macro'

import { updateDomainResultUnion } from '../unions'
import { Domain, Selectors } from '../../scalars'

export const blockSelector = new mutationWithClientMutationId({
  name: 'BlockSelector',
  description: 'This mutation allows the user to block a selector from a domain.',
  inputFields: () => ({
    domain: {
      type: GraphQLNonNull(Domain),
      description: 'The domain string to block the selector from.',
    },
    selector: {
      type: GraphQLNonNull(Selectors),
      description: 'The selector string to block from the domain.',
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
      console.warn(`User: ${userKey} did not give a domain string when attempting to block a selector.`)
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Domain string is required when blocking a selector.`),
      }
    }

    if (!selectorString) {
      console.warn(`User: ${userKey} did not give a selector string when attempting to block a selector.`)
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Selector string is required when blocking a selector.`),
      }
    }

    // Get Domain
    const domain = await loadDomainByDomain.load(domainString)

    // Check to see if domain exists
    if (typeof domain === 'undefined') {
      console.warn(
        `User: ${userKey} attempted to block selector ${selectorString} from ${domainString} however no domain is associated with that id.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to block unknown domain.`),
      }
    }

    // Check to see if user has permission to block selector
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
        `User: ${userKey} attempted to block selector ${selectorString} from ${domainString} however they do not have permission to do so.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`You do not have permission to block a selector from this domain.`),
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
        `Database error occurred while user: ${userKey} was blocking selector "${selectorString}" from domain "${domainString}" while ensuring selector exists: ${err}`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to block selector from domain. Please try again.`),
      }
    }

    let selector
    try {
      selector = await selectorCursor.next()
    } catch (err) {
      console.error(
        `Cursor error occurred while user: ${userKey} was blocking selector "${selectorString}" from domain "${domainString}" while ensuring selector exists: ${err}`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to block selector from domain. Please try again.`),
      }
    }

    // Check to see if selector is already blocked
    let checkSelectorCursor
    try {
      checkSelectorCursor = await query`
        WITH domains, domainsToSelectors, selectors
        FOR v, e IN 1..1 OUTBOUND ${domain._id} domainsToSelectors
          FILTER v.selector == ${selectorString}
          FILTER e.status == "blocked"
          RETURN v
      `
    } catch (err) {
      console.error(
        `Database error occurred while user: ${userKey} was blocking selector ${selectorString} from domain ${domainString}: ${err}`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to block selector from domain. Please try again.`),
      }
    }

    const checkSelector = await checkSelectorCursor.next()
    if (checkSelector) {
      console.warn(
        `User: ${userKey} attempted to block selector ${selectorString} from domain ${domainString} however that selector is already blocked from that domain.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Selector is already blocked from this domain.`),
      }
    }

    // Block selector from domain
    try {
      await query`
        WITH domains, domainsToSelectors, selectors
        UPSERT { _from: ${domain._id}, _to: ${selector._id} }
          INSERT { _from: ${domain._id}, _to: ${selector._id}, status: "blocked" }
          UPDATE { status: "blocked" }
          IN domainsToSelectors
      `
    } catch (err) {
      console.error(
        `Database error occurred while user: ${userKey} was blocking selector "${selectorString}" from domain "${domainString}" while adding selector to domain: ${err}`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to block selector from domain. Please try again.`),
      }
    }

    console.info(`User: ${userKey} successfully blocked selector ${selectorString} from domain ${domainString}.`)

    return {
      _type: 'result',
      domain: domain,
      status: i18n._(t`Successfully blocked selector ${selectorString} from domain ${domainString}.`),
    }
  },
})
