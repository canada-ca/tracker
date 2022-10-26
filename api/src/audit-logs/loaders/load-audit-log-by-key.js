import DataLoader from 'dataloader'
import { t } from '@lingui/macro'

export const loadAuditLogByKey = ({ query, userKey, i18n }) =>
  new DataLoader(async (ids) => {
    let cursor

    try {
      cursor = await query`
        WITH auditLogs
        FOR log IN auditLogs
          FILTER log._key IN ${ids}
          RETURN MERGE({ id: log._key, _type: "auditLog" }, log)
      `
    } catch (err) {
      console.error(
        `Database error occurred when user: ${userKey} running loadAuditLogByKey: ${err}`,
      )
      throw new Error(i18n._(t`Unable to load log. Please try again.`))
    }

    const logMap = {}
    try {
      await cursor.forEach((log) => {
        logMap[log._key] = log
      })
    } catch (err) {
      console.error(
        `Cursor error occurred when user: ${userKey} running loadAuditLogByKey: ${err}`,
      )
      throw new Error(i18n._(t`Unable to load log. Please try again.`))
    }

    return ids.map((id) => logMap[id])
  })
