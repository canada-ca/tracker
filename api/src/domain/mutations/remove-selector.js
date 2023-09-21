import { GraphQLNonNull } from 'graphql'
import { mutationWithClientMutationId } from 'graphql-relay'
import { t } from '@lingui/macro'

import { updateDomainResultUnion } from '../unions'
import { Domain, Selectors } from '../../scalars'

export const removeSelector = new mutationWithClientMutationId({
  name: 'RemoveSelector',
  description: 'This mutation allows the user to remove a selector from a domain.',
  inputFields: () => ({
    domain: {
      type: new GraphQLNonNull(Domain),
      description: 'The domain string to remove the selector from.',
    },
    selector: {
      type: new GraphQLNonNull(Selectors),
      description: 'The selector string to remove from the domain.',
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
      console.warn(`User: ${userKey} did not give a domain string when attempting to remove a selector.`)
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Domain string is required when remove a selector.`),
      }
    }

    if (!selectorString) {
      console.warn(`User: ${userKey} did not give a selector string when attempting to remove a selector.`)
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Selector string is required when removing a selector.`),
      }
    }

    // Get Domain
    const domain = await loadDomainByDomain.load(domainString)

    // Check to see if domain exists
    if (typeof domain === 'undefined') {
      console.warn(
        `User: ${userKey} attempted to remove selector to ${domainString} however that domain does not exist.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to remove selector to unknown domain.`),
      }
    }

    // Check to see if user has permission to remove selector from domain
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
        `User: ${userKey} attempted to remove selector to ${domainString} however they do not have permission to do so.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`You do not have permission to remove a selector to this domain.`),
      }
    }

    // Ensure selector exists in database
    let selectorCursor
    try {
      selectorCursor = await query`
          FOR selector IN selectors
            FILTER selector.selector == ${selectorString}
            RETURN selector
        `
    } catch (err) {
      console.error(
        `Database error occurred while user: ${userKey} was removing selector "${selectorString}" from domain "${domainString}" while retrieving selector: ${err}`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to remove selector from domain. Please try again.`),
      }
    }

    let selector
    try {
      selector = await selectorCursor.next()
    } catch (err) {
      console.error(
        `Cursor error occurred while user: ${userKey} was removing selector "${selectorString}" from domain "${domainString}" while retrieving selector: ${err}`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to remove selector from domain. Please try again.`),
      }
    }

    if (!selector) {
      console.warn(
        `User: ${userKey} attempted to remove selector ${selectorString} from domain ${domainString} however that selector does not exist.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to remove selector from domain. Please try again.`),
      }
    }

    // Check to see if domain has selector
    let checkSelectorCursor
    try {
      checkSelectorCursor = await query`
        WITH domains, domainsToSelectors, selectors
        FOR v, e IN 1..1 OUTBOUND ${domain._id} domainsToSelectors
          FILTER v._id == ${selector._id}
          RETURN v
      `
    } catch (err) {
      console.error(`Database error occurred while user: ${userKey} was checking selector: ${err}`)
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to remove selector from domain. Please try again.`),
      }
    }

    const checkSelector = await checkSelectorCursor.next()
    if (!checkSelector) {
      console.warn(
        `User: ${userKey} attempted to remove selector ${selectorString} from domain ${domainString} however that selector is not associated with that domain.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Selector is not associated with domain.`),
      }
    }

    // Remove selector from domain
    try {
      await query`
        FOR e IN domainsToSelectors
          FILTER e._from == ${domain._id}
          FILTER e._to == ${selector._id}
          REMOVE e IN domainsToSelectors
      `
    } catch (err) {
      console.error(
        `Database error occurred while user: ${userKey} was removing selector "${selectorString}" from domain "${domainString}" while removing selector from domain: ${err}`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to remove selector from domain. Please try again.`),
      }
    }

    console.info(`User: ${userKey} successfully removed selector ${selectorString} from domain ${domainString}.`)

    return {
      _type: 'result',
      domain: domain,
      status: i18n._(t`Successfully removed selector ${selectorString} from domain ${domainString}.`),
    }
  },
})
