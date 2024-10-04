import { t } from '@lingui/macro'

export const loadAdditionalFindingsByDomainId =
  ({ query, userKey, i18n }) =>
  async ({ domainId }) => {
    if (domainId === undefined) {
      console.warn(`User: ${userKey} did not set \`domainId\` argument for: loadAdditionalFindingsByDomainId.`)
      throw new Error(i18n._(t`You must provide a \`domainId\` to retrieve a domain's additional findings.`))
    }

    let cursor
    try {
      cursor = await query`
        WITH additionalFindings, domains
        FOR finding IN additionalFindings
            FILTER finding.domain == ${domainId}
            LIMIT 1
            RETURN finding
    `
    } catch (err) {
      console.error(
        `Database error occurred while user: ${userKey} was trying to gather additional findings for domain: ${domainId}. Error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to load additional findings. Please try again.`))
    }

    let finding
    try {
      finding = await cursor.next()
    } catch (err) {
      console.error(
        `Cursor error occurred while user: ${userKey} was trying to gather additional findings for domain: ${domainId}. Error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to load additional findings. Please try again.`))
    }

    return finding
  }
