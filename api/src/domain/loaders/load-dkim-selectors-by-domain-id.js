import { t } from '@lingui/macro'

export const loadDkimSelectorsByDomainId =
  ({ query, userKey, i18n }) =>
  async ({ domainId }) => {
    let domainSelectorsCursor
    try {
      domainSelectorsCursor = await query`
      WITH domains, domainsToSelectors
      FOR selector, selectorEdge IN 1..1 OUTBOUND ${domainId} domainsToSelectors
        RETURN selector
    `
    } catch (err) {
      console.error(
        `Database error occurred while user: ${userKey} was trying to gather domainSelectors in loadDomainSelectorsByDomainId, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to load domain selector(s). Please try again.`))
    }

    let domainSelectors
    try {
      domainSelectors = await domainSelectorsCursor.all()
    } catch (err) {
      console.error(
        `Cursor error occurred while user: ${userKey} was trying to gather domainSelectors in loadDomainSelectorsByDomainId, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to load domain selector(s). Please try again.`))
    }

    return domainSelectors.map((selector) => {
      return selector.selector
    })
  }
