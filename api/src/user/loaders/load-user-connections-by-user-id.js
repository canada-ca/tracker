import { aql } from 'arangojs'
import { fromGlobalId, toGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

export const loadUserConnectionsByUserId =
  ({ query, userKey, cleanseInput, i18n }) =>
  async ({ after, before, first, last, orderBy, isSuperAdmin, search }) => {
    const userDBId = `users/${userKey}`

    let afterTemplate = aql``
    let afterVar = aql``

    if (typeof after !== 'undefined') {
      const { id: afterId } = fromGlobalId(cleanseInput(after))
      if (typeof orderBy === 'undefined') {
        afterTemplate = aql`FILTER TO_NUMBER(user._key) > TO_NUMBER(${afterId})`
      } else {
        let afterTemplateDirection = aql``
        if (orderBy.direction === 'ASC') {
          afterTemplateDirection = aql`>`
        } else {
          afterTemplateDirection = aql`<`
        }

        afterVar = aql`LET afterVar = DOCUMENT(users, ${afterId})`

        let documentField = aql``
        let userField = aql``
        /* istanbul ignore else */
        if (orderBy.field === 'user-username') {
          documentField = aql`afterVar.userName`
          userField = aql`user.userName`
        } else if (orderBy.field === 'user-displayName') {
          documentField = aql`afterVar.displayName`
          userField = aql`user.displayName`
        } else if (orderBy.field === 'user-emailValidated') {
          documentField = aql`afterVar.emailValidated`
          userField = aql`user.emailValidated`
        } else if (orderBy.field === 'user-affiliations-totalCount') {
          documentField = aql`afterVar.affiliations.totalCount`
          userField = aql`user.affiliations.totalCount`
        }

        afterTemplate = aql`
        FILTER ${userField} ${afterTemplateDirection} ${documentField}
        OR (${userField} == ${documentField}
        AND TO_NUMBER(user._key) > TO_NUMBER(${afterId}))
      `
      }
    }

    let beforeTemplate = aql``
    let beforeVar = aql``

    if (typeof before !== 'undefined') {
      const { id: beforeId } = fromGlobalId(cleanseInput(before))
      if (typeof orderBy === 'undefined') {
        beforeTemplate = aql`FILTER TO_NUMBER(user._key) < TO_NUMBER(${beforeId})`
      } else {
        let beforeTemplateDirection = aql``
        if (orderBy.direction === 'ASC') {
          beforeTemplateDirection = aql`<`
        } else {
          beforeTemplateDirection = aql`>`
        }

        beforeVar = aql`LET beforeVar = DOCUMENT(users, ${beforeId})`

        let documentField = aql``
        let userField = aql``
        /* istanbul ignore else */
        if (orderBy.field === 'user-username') {
          documentField = aql`beforeVar.userName`
          userField = aql`user.userName`
        } else if (orderBy.field === 'user-displayName') {
          documentField = aql`beforeVar.displayName`
          userField = aql`user.displayName`
        } else if (orderBy.field === 'user-emailValidated') {
          documentField = aql`beforeVar.emailValidated`
          userField = aql`user.emailValidated`
        } else if (orderBy.field === 'user-affiliations-totalCount') {
          documentField = aql`beforeVar.affiliations.totalCount`
          userField = aql`user.affiliations.totalCount`
        }

        beforeTemplate = aql`
        FILTER ${userField} ${beforeTemplateDirection} ${documentField}
        OR (${userField} == ${documentField}
        AND TO_NUMBER(user._key) < TO_NUMBER(${beforeId}))
      `
      }
    }

    let limitTemplate = aql``
    if (typeof first === 'undefined' && typeof last === 'undefined') {
      console.warn(
        `User: ${userKey} did not have either \`first\` or \`last\` arguments set for: loadUserConnectionsByUserId.`,
      )
      throw new Error(
        i18n._(
          t`You must provide a \`first\` or \`last\` value to properly paginate the \`User\` connection.`,
        ),
      )
    } else if (typeof first !== 'undefined' && typeof last !== 'undefined') {
      console.warn(
        `User: ${userKey} attempted to have \`first\` and \`last\` arguments set for: loadUserConnectionsByUserId.`,
      )
      throw new Error(
        i18n._(
          t`Passing both \`first\` and \`last\` to paginate the \`User\` connection is not supported.`,
        ),
      )
    } else if (typeof first === 'number' || typeof last === 'number') {
      /* istanbul ignore else */
      if (first < 0 || last < 0) {
        const argSet = typeof first !== 'undefined' ? 'first' : 'last'
        console.warn(
          `User: ${userKey} attempted to have \`${argSet}\` set below zero for: loadUserConnectionsByUserId.`,
        )
        throw new Error(
          i18n._(
            t`\`${argSet}\` on the \`User\` connection cannot be less than zero.`,
          ),
        )
      } else if (first > 100 || last > 100) {
        const argSet = typeof first !== 'undefined' ? 'first' : 'last'
        const amount = typeof first !== 'undefined' ? first : last
        console.warn(
          `User: ${userKey} attempted to have \`${argSet}\` set to ${amount} for: loadUserConnectionsByUserId.`,
        )
        throw new Error(
          i18n._(
            t`Requesting \`${amount}\` records on the \`User\` connection exceeds the \`${argSet}\` limit of 100 records.`,
          ),
        )
      } else if (typeof first !== 'undefined' && typeof last === 'undefined') {
        limitTemplate = aql`TO_NUMBER(user._key) ASC LIMIT TO_NUMBER(${first})`
      } else if (typeof first === 'undefined' && typeof last !== 'undefined') {
        limitTemplate = aql`TO_NUMBER(user._key) DESC LIMIT TO_NUMBER(${last})`
      }
    } else {
      const argSet = typeof first !== 'undefined' ? 'first' : 'last'
      const typeSet = typeof first !== 'undefined' ? typeof first : typeof last
      console.warn(
        `User: ${userKey} attempted to have \`${argSet}\` set as a ${typeSet} for: loadUserConnectionsByUserId.`,
      )
      throw new Error(
        i18n._(t`\`${argSet}\` must be of type \`number\` not \`${typeSet}\`.`),
      )
    }

    let hasNextPageFilter = aql`FILTER TO_NUMBER(user._key) > TO_NUMBER(LAST(retrievedUsers)._key)`
    let hasPreviousPageFilter = aql`FILTER TO_NUMBER(user._key) < TO_NUMBER(FIRST(retrievedUsers)._key)`
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

      let userField = aql``
      let hasNextPageDocumentField = aql``
      let hasPreviousPageDocumentField = aql``
      /* istanbul ignore else */
      if (orderBy.field === 'user-username') {
        userField = aql`user.userName`
        hasNextPageDocumentField = aql`LAST(retrievedUsers).userName`
        hasPreviousPageDocumentField = aql`FIRST(retrievedUsers).userName`
      } else if (orderBy.field === 'user-displayName') {
        userField = aql`user.displayName`
        hasNextPageDocumentField = aql`LAST(retrievedUsers).displayName`
        hasPreviousPageDocumentField = aql`FIRST(retrievedUsers).displayName`
      } else if (orderBy.field === 'user-emailValidated') {
        userField = aql`user.emailValidated`
        hasNextPageDocumentField = aql`LAST(retrievedUsers).emailValidated`
        hasPreviousPageDocumentField = aql`FIRST(retrievedUsers).emailValidated`
      } else if (orderBy.field === 'user-affiliations-totalCount') {
        userField = aql`user.affiliations.totalCount`
        hasNextPageDocumentField = aql`LAST(retrievedUsers).affiliations.totalCount`
        hasPreviousPageDocumentField = aql`FIRST(retrievedUsers).affiliations.totalCount`
      }

      hasNextPageFilter = aql`
      FILTER ${userField} ${hasNextPageDirection} ${hasNextPageDocumentField}
      OR (${userField} == ${hasNextPageDocumentField}
      AND TO_NUMBER(user._key) > TO_NUMBER(LAST(retrievedUsers)._key))
    `
      hasPreviousPageFilter = aql`
      FILTER ${userField} ${hasPreviousPageDirection} ${hasPreviousPageDocumentField}
      OR (${userField} == ${hasPreviousPageDocumentField}
      AND TO_NUMBER(user._key) < TO_NUMBER(FIRST(retrievedUsers)._key))
    `
    }

    let sortByField = aql``
    if (typeof orderBy !== 'undefined') {
      /* istanbul ignore else */
      if (orderBy.field === 'user-username') {
        sortByField = aql`user.userName ${orderBy.direction},`
      } else if (orderBy.field === 'user-displayName') {
        sortByField = aql`user.displayName ${orderBy.direction},`
      } else if (orderBy.field === 'user-emailValidated') {
        sortByField = aql`user.emailValidated ${orderBy.direction},`
      } else if (orderBy.field === 'user-affiliations-totalCount') {
        sortByField = aql`user.affiliations.totalCount ${orderBy.direction},`
      }
    }

    let sortString
    if (typeof last !== 'undefined') {
      sortString = aql`DESC`
    } else {
      sortString = aql`ASC`
    }

    let userKeysQuery
    if (isSuperAdmin) {
      userKeysQuery = aql`
        WITH users, userSearch, claims, organizations
        LET userKeys = (
          FOR user IN users
            RETURN user._key
        )
      `
    } else {
      userKeysQuery = aql`
      WITH affiliations, organizations, users, userSearch, claims
      LET userKeys = UNIQUE(FLATTEN(
        LET keys = []
        LET orgIds = (
          FOR v, e IN 1..1 ANY ${userDBId} affiliations
            OPTIONS {bfs: true}
            RETURN e._from
        )
        FOR orgId IN orgIds
          LET affiliationUserKeys = (
            FOR v, e IN 1..1 OUTBOUND orgId affiliations
              OPTIONS {bfs: true}
              return v._key
          )
          RETURN APPEND(keys, affiliationUserKeys)
      ))
    `
    }

    let userQuery = aql``
    let loopString = aql`FOR user IN users`
    let totalCount = aql`LENGTH(userKeys)`
    if (typeof search !== 'undefined' && search !== '') {
      search = cleanseInput(search)
      userQuery = aql`
      LET tokenArr = TOKENS(${search}, "space-delimiter-analyzer")
      LET searchedUsers = (
        FOR tokenItem in tokenArr
          LET token = LOWER(tokenItem)
          FOR user IN userSearch
            SEARCH ANALYZER(user.userName LIKE CONCAT("%", token, "%"), "space-delimiter-analyzer")
            FILTER user._key IN userKeys
            RETURN user
      )
    `
      loopString = aql`FOR user IN searchedUsers`
      totalCount = aql`LENGTH(searchedUsers)`
    }

    let requestedUserInfo
    try {
      requestedUserInfo = await query`
      ${userKeysQuery}

      ${userQuery}

      ${afterVar}
      ${beforeVar}

      LET retrievedUsers = (
        ${loopString}
          FILTER user._key IN userKeys
          ${afterTemplate}
          ${beforeTemplate}
          SORT
          ${sortByField}
          ${limitTemplate}
          RETURN MERGE({ id: user._key, _type: "user" }, user)
      )

      LET hasNextPage = (LENGTH(
        ${loopString}
          FILTER user._key IN userKeys
          ${hasNextPageFilter}
          SORT ${sortByField} TO_NUMBER(user._key) ${sortString} LIMIT 1
          RETURN user
      ) > 0 ? true : false)

      LET hasPreviousPage = (LENGTH(
        ${loopString}
          FILTER user._key IN userKeys
          ${hasPreviousPageFilter}
          SORT ${sortByField} TO_NUMBER(user._key) ${sortString} LIMIT 1
          RETURN user
      ) > 0 ? true : false)

      RETURN {
        "users": retrievedUsers,
        "totalCount": ${totalCount},
        "hasNextPage": hasNextPage,
        "hasPreviousPage": hasPreviousPage,
        "startKey": FIRST(retrievedUsers)._key,
        "endKey": LAST(retrievedUsers)._key
      }
    `
    } catch (err) {
      console.error(
        `Database error occurred while user: ${userKey} was trying to query users in loadUserConnectionsByUserId, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to query user(s). Please try again.`))
    }

    let usersInfo
    try {
      usersInfo = await requestedUserInfo.next()
    } catch (err) {
      console.error(
        `Cursor error occurred while user: ${userKey} was trying to gather users in loadUserConnectionsByUserId, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to load user(s). Please try again.`))
    }

    if (usersInfo.users.length === 0) {
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

    const edges = usersInfo.users.map((user) => {
      return {
        cursor: toGlobalId('user', user._key),
        node: user,
      }
    })

    return {
      edges,
      totalCount: usersInfo.totalCount,
      pageInfo: {
        hasNextPage: usersInfo.hasNextPage,
        hasPreviousPage: usersInfo.hasPreviousPage,
        startCursor: toGlobalId('user', usersInfo.startKey),
        endCursor: toGlobalId('user', usersInfo.endKey),
      },
    }
  }
