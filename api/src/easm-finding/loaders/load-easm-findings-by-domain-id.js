import { t } from '@lingui/macro'

export const loadEasmFindingsByDomainId =
  ({ query, userKey, i18n }) =>
  async ({ domainId }) => {
    if (domainId === undefined) {
      console.warn(`User: ${userKey} did not set \`domainId\` argument for: loadEasmFindingsByDomainId.`)
      throw new Error(i18n._(t`You must provide a \`domainId\` to retrieve a domain's EASM findings.`))
    }

    let cursor
    try {
      cursor = await query`
        WITH easmFindings, domains
        FOR finding IN easmFindings
            FILTER finding.domain == ${domainId}
            RETURN finding
    `
    } catch (err) {
      console.error(
        `Database error occurred while user: ${userKey} was trying to gather EASM findings for domain: ${domainId}. Error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to load EASM findings. Please try again.`))
    }

    let finding
    try {
      finding = await cursor.next()
    } catch (err) {
      console.error(
        `Cursor error occurred while user: ${userKey} was trying to gather EASM findings for domain: ${domainId}. Error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to load EASM findings. Please try again.`))
    }

    return finding
  }
