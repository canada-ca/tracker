// import { aql } from 'arangojs'
import { toGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

export const loadAuditLogs =
  ({ query, userKey, i18n }) =>
  async ({ _after, _before, _first, _last, _orderBy, _search }) => {
    let requestedLogInfo
    try {
      requestedLogInfo = await query`
        WITH auditLogs
        LET retrievedLogs = (
            FOR log IN auditLogs
                RETURN log
        )

        RETURN {
            "auditLogs": retrievedLogs,
            "totalCount": LENGTH(retrievedLogs),
            "hasNextPage": false,
            "hasPreviousPage": false,
            "startKey": "",
            "endKey": "",
        }
        `
    } catch (err) {
      console.error(
        `Database error occurred while user: ${userKey} was trying to query domains in loadDomainsByUser, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to query domain(s). Please try again.`))
    }

    let logsInfo
    try {
      logsInfo = await requestedLogInfo.next()
    } catch (err) {
      console.error(
        `Cursor error occurred while user: ${userKey} was trying to gather domains in loadDomainsByUser, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to load domain(s). Please try again.`))
    }

    if (logsInfo.auditLogs.length === 0) {
      return {
        edges: [],
        totalCount: 0,
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: '',
          endCursor: '',
        },
      }
    }

    const edges = logsInfo.auditLogs.map((log) => {
      return {
        cursor: toGlobalId('auditLog', log._key),
        node: log,
      }
    })

    return {
      edges,
      totalCount: logsInfo.totalCount,
      pageInfo: {
        hasNextPage: logsInfo.hasNextPage,
        hasPreviousPage: logsInfo.hasPreviousPage,
        startCursor: toGlobalId('auditLog', logsInfo.startKey),
        endCursor: toGlobalId('auditLog', logsInfo.endKey),
      },
    }
  }
