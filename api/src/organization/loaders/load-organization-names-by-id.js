import DataLoader from 'dataloader'
import { t } from '@lingui/macro'

/**
 * Loader to fetch organization names (EN/FR) by org _id.
 * Usage: loadOrganizationNamesById({ query, userKey, i18n }).load(orgId)
 */
export const loadOrganizationNamesById = ({ query, userKey, i18n }) =>
  new DataLoader(async (ids) => {
    let cursor
    try {
      cursor = await query`
        FOR orgId IN ${ids}
          LET org = DOCUMENT(organizations, orgId)
          RETURN {
            orgId,
            orgNameEN: org.orgDetails.en.name,
            orgNameFR: org.orgDetails.fr.name,
          }
      `
    } catch (err) {
      console.error(`Database error occurred when user: ${userKey} running loadOrganizationNamesById: ${err}`)
      throw new Error(i18n._(t`Unable to load organization names. Please try again.`))
    }

    const orgMap = {}
    try {
      await cursor.forEach((org) => {
        orgMap[org.orgId] = org
      })
    } catch (err) {
      console.error(`Cursor error occurred when user: ${userKey} during loadOrganizationNamesById: ${err}`)
      throw new Error(i18n._(t`Unable to load organization names. Please try again.`))
    }

    return ids.map((id) => orgMap[id])
  })
