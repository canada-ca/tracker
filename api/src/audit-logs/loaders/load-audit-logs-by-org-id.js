import { aql } from 'arangojs'
import { fromGlobalId, toGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

export const loadAuditLogsByOrgId =
  ({ query, userKey, i18n, cleanseInput }) =>
  async ({
    orgId,
    permission,
    after,
    _before,
    first,
    last,
    orderBy,
    search,
  }) => {
    let afterTemplate = aql``
    let afterVar = aql``
    if (typeof after !== 'undefined') {
      const { id: afterId } = fromGlobalId(cleanseInput(after))
      if (typeof orderBy === 'undefined') {
        afterTemplate = aql`FILTER TO_NUMBER(log._key) > TO_NUMBER(${afterId})`
      } else {
        let afterTemplateDirection = aql``
        if (orderBy.direction === 'ASC') {
          afterTemplateDirection = aql`>`
        } else {
          afterTemplateDirection = aql`<`
        }

        afterVar = aql`LET afterVar = DOCUMENT(auditLogs, ${afterId})`

        let documentField = aql``
        let logField = aql``
        /* istanbul ignore else */
        if (orderBy.field === 'timestamp') {
          documentField = aql`afterVar.timestamp`
          logField = aql`log.timestamp`
        }

        afterTemplate = aql`
        FILTER ${logField} ${afterTemplateDirection} ${documentField}
        OR (${logField} == ${documentField}
        AND TO_NUMBER(log._key) > TO_NUMBER(${afterId}))
      `
      }
    }

    let limitTemplate = aql``
    if (typeof first === 'undefined' && typeof last === 'undefined') {
      console.warn(
        `User: ${userKey} did not have either \`first\` or \`last\` arguments set for: loadAuditLogsByOrgId.`,
      )
      throw new Error(
        i18n._(
          t`You must provide a \`first\` or \`last\` value to properly paginate the \`Log\` connection.`,
        ),
      )
    } else if (typeof first !== 'undefined' && typeof last !== 'undefined') {
      console.warn(
        `User: ${userKey} attempted to have \`first\` and \`last\` arguments set for: loadAuditLogsByOrgId.`,
      )
      throw new Error(
        i18n._(
          t`Passing both \`first\` and \`last\` to paginate the \`Log\` connection is not supported.`,
        ),
      )
    } else if (typeof first === 'number' || typeof last === 'number') {
      /* istanbul ignore else */
      if (first < 0 || last < 0) {
        const argSet = typeof first !== 'undefined' ? 'first' : 'last'
        console.warn(
          `User: ${userKey} attempted to have \`${argSet}\` set below zero for: loadAuditLogsByOrgId.`,
        )
        throw new Error(
          i18n._(
            t`\`${argSet}\` on the \`Log\` connection cannot be less than zero.`,
          ),
        )
      } else if (first > 100 || last > 100) {
        const argSet = typeof first !== 'undefined' ? 'first' : 'last'
        const amount = typeof first !== 'undefined' ? first : last
        console.warn(
          `User: ${userKey} attempted to have \`${argSet}\` set to ${amount} for: loadAuditLogsByOrgId.`,
        )
        throw new Error(
          i18n._(
            t`Requesting \`${amount}\` records on the \`Log\` connection exceeds the \`${argSet}\` limit of 100 records.`,
          ),
        )
      } else if (typeof first !== 'undefined' && typeof last === 'undefined') {
        limitTemplate = aql`TO_NUMBER(log._key) ASC LIMIT TO_NUMBER(${first})`
      } else if (typeof first === 'undefined' && typeof last !== 'undefined') {
        limitTemplate = aql`TO_NUMBER(log._key) DESC LIMIT TO_NUMBER(${last})`
      }
    } else {
      const argSet = typeof first !== 'undefined' ? 'first' : 'last'
      const typeSet = typeof first !== 'undefined' ? typeof first : typeof last
      console.warn(
        `User: ${userKey} attempted to have \`${argSet}\` set as a ${typeSet} for: loadAuditLogsByOrgId.`,
      )
      throw new Error(
        i18n._(t`\`${argSet}\` must be of type \`number\` not \`${typeSet}\`.`),
      )
    }

    let hasNextPageFilter = aql`FILTER TO_NUMBER(log._key) > TO_NUMBER(LAST(retrievedLogs)._key)`
    let hasPreviousPageFilter = aql`FILTER TO_NUMBER(log._key) < TO_NUMBER(FIRST(retrievedLogs)._key)`
    if (typeof orderBy !== 'undefined') {
      let hasNextPageDirection = aql``
      let hasPreviousPageDirection = aql``
      if (orderBy.direction === 'ASC') {
        hasNextPageDirection = aql`>`
        hasPreviousPageDirection = aql`<`
      } else {
        hasNextPageDirection = aql`<`
        hasPreviousPageDirection = aql`>`
      }

      let domainField = aql``
      let hasNextPageDocumentField = aql``
      let hasPreviousPageDocumentField = aql``
      /* istanbul ignore else */
      if (orderBy.field === 'timestamp') {
        domainField = aql`log.timestamp`
        hasNextPageDocumentField = aql`LAST(retrievedLogs).log`
        hasPreviousPageDocumentField = aql`FIRST(retrievedLogs).log`
      }

      hasNextPageFilter = aql`
      FILTER ${domainField} ${hasNextPageDirection} ${hasNextPageDocumentField}
      OR (${domainField} == ${hasNextPageDocumentField}
      AND TO_NUMBER(log._key) > TO_NUMBER(LAST(retrievedLogs)._key))
    `
      hasPreviousPageFilter = aql`
      FILTER ${domainField} ${hasPreviousPageDirection} ${hasPreviousPageDocumentField}
      OR (${domainField} == ${hasPreviousPageDocumentField}
      AND TO_NUMBER(log._key) < TO_NUMBER(FIRST(retrievedLogs)._key))
    `
    }

    let sortByField = aql``
    if (typeof orderBy !== 'undefined') {
      /* istanbul ignore else */
      if (orderBy.field === 'timestamp') {
        sortByField = aql`log.timestamp ${orderBy.direction},`
      }
    }

    let sortString
    if (typeof last !== 'undefined') {
      sortString = aql`DESC`
    } else {
      sortString = aql`ASC`
    }

    console.log('orgId:', orgId)

    let logKeysQuery
    if (typeof orgId !== 'undefined' && orgId !== null) {
      console.log('org audit logs')
      logKeysQuery = aql`
      WITH auditLogs
        LET logKeys = (
          FOR log IN auditLogs
            FILTER log.target.organization.id == ${orgId}
            RETURN log._key
        )
      `
    } else if (permission === 'super_admin') {
      console.log('super admin audit logs')
      logKeysQuery = aql`
      WITH auditLogs
        LET logKeys = (
          FOR log IN auditLogs
            RETURN log._key
        )
      `
    } else {
      throw new Error(
        i18n._(
          t`Cannot query audit logs on organization without admin permission or higher.`,
        ),
      )
    }

    let logQuery = aql``
    let loopString = aql`FOR log IN auditLogs`
    let totalCount = aql`LENGTH(logKeys)`
    if (typeof search !== 'undefined' && search !== '') {
      search = cleanseInput(search)
      logQuery = aql`
      LET tokenArr = TOKENS(${search}, "space-delimiter-analyzer")
      LET searchedLogs = (
        FOR tokenItem in tokenArr
          LET token = LOWER(tokenItem)
          FOR log IN auditLogSearch
            SEARCH ANALYZER(log.TODO LIKE CONCAT("%", token, "%"))
            FILTER log._key IN logKeys
            RETURN log
      )
    `
      loopString = aql`FOR log IN searchedLogs`
      totalCount = aql`LENGTH(searchedLogs)`
    }

    let requestedLogInfo
    try {
      requestedLogInfo = await query`
      ${logKeysQuery}
      ${logQuery}

      ${afterVar}

      LET retrievedLogs = (
        ${loopString}
          FILTER log._key IN logKeys
          ${afterTemplate}
          SORT
          ${sortByField}
          ${limitTemplate}
          RETURN MERGE({ id: log._key, _type: "auditLog" }, log)
      )

      LET hasNextPage = (LENGTH(
      ${loopString}
        FILTER log._key IN logKeys
        ${hasNextPageFilter}
        SORT ${sortByField} TO_NUMBER(log._key) ${sortString} LIMIT 1
        RETURN log
    ) > 0 ? true : false)

    LET hasPreviousPage = (LENGTH(
      ${loopString}
        FILTER log._key IN logKeys
        ${hasPreviousPageFilter}
        SORT ${sortByField} TO_NUMBER(log._key) ${sortString} LIMIT 1
        RETURN log
    ) > 0 ? true : false)

      RETURN {
          "auditLogs": retrievedLogs,
          "totalCount": ${totalCount},
          "hasNextPage": hasNextPage,
          "hasPreviousPage": hasPreviousPage,
          "startKey": FIRST(retrievedLogs)._key,
          "endKey": LAST(retrievedLogs)._key
      }
      `
    } catch (err) {
      console.error(
        `Database error occurred while user: ${userKey} was trying to query logs in loadAuditLogsByOrgId, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to query log(s). Please try again.`))
    }

    let logsInfo
    try {
      logsInfo = await requestedLogInfo.next()
    } catch (err) {
      console.error(
        `Cursor error occurred while user: ${userKey} was trying to gather logs in loadAuditLogsByOrgId, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to load log(s). Please try again.`))
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
