import { aql } from 'arangojs'
import { t } from '@lingui/macro'

export const loadWebScansByWebId =
  ({ query, userKey, i18n }) =>
  async ({
    webId,
  }) => {
    if (webId === undefined) {
      console.warn(
        `User: ${userKey} - \`webId\` argument not set for: loadWebScansByWebId.`,
      )
      throw new Error(
        i18n._(
          t`Unable to load web scan(s). Please try again.`,
        ),
      )
    }

    const webScanQuery = aql`
      FOR webScan, e IN 1 OUTBOUND ${webId} webToWebScans
        RETURN webScan
    `

    let webScanCursor
    try {
      webScanCursor = await query`${webScanQuery}`
    } catch (err) {
      console.error(
        `Database error occurred while user: ${userKey} was trying to get cursor for web scans for web '${webId}', error: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to load web scan(s). Please try again.`),
      )
    }

    let webScans
    try {
      webScans = await webScanCursor.all()
    } catch (err) {
      console.error(
        `Cursor error occurred while user: ${userKey} was trying to get web scan information for web '${webId}', error: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to load web scan(s). Please try again.`),
      )
    }

    return webScans
  }
