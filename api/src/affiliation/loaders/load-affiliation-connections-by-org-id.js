import { aql } from 'arangojs'
import { fromGlobalId, toGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

export const loadAffiliationConnectionsByOrgId =
  ({ query, userKey, cleanseInput, i18n }) =>
  async ({ orgId, after, before, first, last, orderBy, search }) => {
    let afterTemplate = aql``
    if (typeof after !== 'undefined') {
      const { id: afterId } = fromGlobalId(cleanseInput(after))
      if (typeof orderBy === 'undefined') {
        afterTemplate = aql`FILTER TO_NUMBER(affiliation._key) > TO_NUMBER(${afterId})`
      } else {
        let afterTemplateDirection
        if (orderBy.direction === 'ASC') {
          afterTemplateDirection = aql`>`
        } else {
          afterTemplateDirection = aql`<`
        }

        let affiliationField, documentField
        /* istanbul ignore else */
        if (orderBy.field === 'user-username') {
          affiliationField = aql`DOCUMENT(users, PARSE_IDENTIFIER(affiliation._to).key).userName`
          documentField = aql`DOCUMENT(users, PARSE_IDENTIFIER(DOCUMENT(affiliations, ${afterId})._to).key).userName`
        }

        afterTemplate = aql`
        FILTER ${affiliationField} ${afterTemplateDirection} ${documentField}
        OR (${affiliationField} == ${documentField}
        AND TO_NUMBER(affiliation._key) > TO_NUMBER(${afterId}))
      `
      }
    }

    let beforeTemplate = aql``
    if (typeof before !== 'undefined') {
      const { id: beforeId } = fromGlobalId(cleanseInput(before))
      if (typeof orderBy === 'undefined') {
        beforeTemplate = aql`FILTER TO_NUMBER(affiliation._key) < TO_NUMBER(${beforeId})`
      } else {
        let beforeTemplateDirection = aql``
        if (orderBy.direction === 'ASC') {
          beforeTemplateDirection = aql`<`
        } else {
          beforeTemplateDirection = aql`>`
        }

        let affiliationField, documentField
        /* istanbul ignore else */
        if (orderBy.field === 'user-username') {
          affiliationField = aql`DOCUMENT(users, PARSE_IDENTIFIER(affiliation._to).key).userName`
          documentField = aql`DOCUMENT(users, PARSE_IDENTIFIER(DOCUMENT(affiliations, ${beforeId})._to).key).userName`
        }

        beforeTemplate = aql`
        FILTER ${affiliationField} ${beforeTemplateDirection} ${documentField}
        OR (${affiliationField} == ${documentField}
        AND TO_NUMBER(affiliation._key) < TO_NUMBER(${beforeId}))
      `
      }
    }

    let limitTemplate = aql``
    if (typeof first === 'undefined' && typeof last === 'undefined') {
      console.warn(
        `User: ${userKey} did not have either \`first\` or \`last\` arguments set for: loadAffiliationConnectionsByOrgId.`,
      )
      throw new Error(
        i18n._(
          t`You must provide a \`first\` or \`last\` value to properly paginate the \`Affiliation\` connection.`,
        ),
      )
    } else if (typeof first !== 'undefined' && typeof last !== 'undefined') {
      console.warn(
        `User: ${userKey} attempted to have \`first\` and \`last\` arguments set for: loadAffiliationConnectionsByOrgId.`,
      )
      throw new Error(
        i18n._(
          t`Passing both \`first\` and \`last\` to paginate the \`Affiliation\` connection is not supported.`,
        ),
      )
    } else if (typeof first === 'number' || typeof last === 'number') {
      /* istanbul ignore else */
      if (first < 0 || last < 0) {
        const argSet = typeof first !== 'undefined' ? 'first' : 'last'
        console.warn(
          `User: ${userKey} attempted to have \`${argSet}\` set below zero for: loadAffiliationConnectionsByOrgId.`,
        )
        throw new Error(
          i18n._(
            t`\`${argSet}\` on the \`Affiliation\` connection cannot be less than zero.`,
          ),
        )
      } else if (first > 100 || last > 100) {
        const argSet = typeof first !== 'undefined' ? 'first' : 'last'
        const amount = typeof first !== 'undefined' ? first : last
        console.warn(
          `User: ${userKey} attempted to have \`${argSet}\` set to ${amount} for: loadAffiliationConnectionsByOrgId.`,
        )
        throw new Error(
          i18n._(
            t`Requesting \`${amount}\` records on the \`Affiliation\` connection exceeds the \`${argSet}\` limit of 100 records.`,
          ),
        )
      } else if (typeof first !== 'undefined' && typeof last === 'undefined') {
        limitTemplate = aql`TO_NUMBER(affiliation._key) ASC LIMIT TO_NUMBER(${first})`
      } else if (typeof first === 'undefined' && typeof last !== 'undefined') {
        limitTemplate = aql`TO_NUMBER(affiliation._key) DESC LIMIT TO_NUMBER(${last})`
      }
    } else {
      const argSet = typeof first !== 'undefined' ? 'first' : 'last'
      const typeSet = typeof first !== 'undefined' ? typeof first : typeof last
      console.warn(
        `User: ${userKey} attempted to have \`${argSet}\` set as a ${typeSet} for: loadAffiliationConnectionsByOrgId.`,
      )
      throw new Error(
        i18n._(t`\`${argSet}\` must be of type \`number\` not \`${typeSet}\`.`),
      )
    }

    let hasNextPageFilter = aql`FILTER TO_NUMBER(affiliation._key) > TO_NUMBER(LAST(retrievedAffiliations)._key)`
    let hasPreviousPageFilter = aql`FILTER TO_NUMBER(affiliation._key) < TO_NUMBER(FIRST(retrievedAffiliations)._key)`
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

      let affField, hasNextPageDocument, hasPreviousPageDocument
      /* istanbul ignore else */
      if (orderBy.field === 'user-username') {
        affField = aql`DOCUMENT(users, PARSE_IDENTIFIER(affiliation._to).key).userName`
        hasNextPageDocument = aql`DOCUMENT(users, PARSE_IDENTIFIER(LAST(retrievedAffiliations)._to).key).userName`
        hasPreviousPageDocument = aql`DOCUMENT(users, PARSE_IDENTIFIER(FIRST(retrievedAffiliations)._to).key).userName`
      }

      hasNextPageFilter = aql`
      FILTER ${affField} ${hasNextPageDirection} ${hasNextPageDocument}
      OR (${affField} == ${hasNextPageDocument}
      AND TO_NUMBER(affiliation._key) > TO_NUMBER(LAST(retrievedAffiliations)._key))
    `

      hasPreviousPageFilter = aql`
      FILTER ${affField} ${hasPreviousPageDirection} ${hasPreviousPageDocument}
      OR (${affField} == ${hasPreviousPageDocument}
      AND TO_NUMBER(affiliation._key) < TO_NUMBER(FIRST(retrievedAffiliations)._key))
    `
    }

    let sortByField = aql``
    if (typeof orderBy !== 'undefined') {
      /* istanbul ignore else */
      if (orderBy.field === 'user-username') {
        sortByField = aql`DOCUMENT(users, PARSE_IDENTIFIER(affiliation._to).key).userName ${orderBy.direction},`
      }
    }

    let sortString
    if (typeof last !== 'undefined') {
      sortString = aql`DESC`
    } else {
      sortString = aql`ASC`
    }

    let userSearchQuery = aql``
    let userIdFilter = aql``
    if (typeof search !== 'undefined' && search !== '') {
      search = cleanseInput(search)
      userSearchQuery = aql`
      LET tokenArr = TOKENS(${search}, "text_en")
      LET userIds = UNIQUE(
        FOR token IN tokenArr
          FOR user IN userSearch
            SEARCH ANALYZER(
              user.displayName LIKE CONCAT("%", token, "%")
              OR user.userName LIKE CONCAT("%", token, "%")
            , "text_en")
            RETURN user._id
      )
    `
      userIdFilter = aql`FILTER e._to IN userIds`
    }

    let filteredAffiliationCursor
    try {
      filteredAffiliationCursor = await query`
      WITH affiliations, organizations, users, userSearch

      ${userSearchQuery}

      LET affiliationKeys = (
        FOR v, e IN 1..1 OUTBOUND ${orgId} affiliations 
          ${userIdFilter}
          RETURN e._key
      )
      
      LET retrievedAffiliations = (
        FOR affiliation IN affiliations
          FILTER affiliation._key IN affiliationKeys
          LET orgKey = PARSE_IDENTIFIER(affiliation._from).key
          LET userKey = PARSE_IDENTIFIER(affiliation._to).key
          ${afterTemplate}
          ${beforeTemplate}
          SORT
          ${sortByField}
          ${limitTemplate}
          RETURN MERGE(
            {
              id: affiliation._key,
              orgKey: orgKey,
              userKey: userKey,
              _type: "affiliation"
            },
            affiliation
          )
      )

      LET hasNextPage = (LENGTH(
        FOR affiliation IN affiliations
          FILTER affiliation._key IN affiliationKeys
          ${hasNextPageFilter}
          SORT ${sortByField} TO_NUMBER(affiliation._key) ${sortString} LIMIT 1
          RETURN affiliation
      ) > 0 ? true : false)

      LET hasPreviousPage = (LENGTH(
        FOR affiliation IN affiliations
          FILTER affiliation._key IN affiliationKeys
          ${hasPreviousPageFilter}
          SORT ${sortByField} TO_NUMBER(affiliation._key) ${sortString} LIMIT 1
          RETURN affiliation
      ) > 0 ? true : false)

      RETURN {
        "affiliations": retrievedAffiliations,
        "totalCount": LENGTH(affiliationKeys),
        "hasNextPage": hasNextPage,
        "hasPreviousPage": hasPreviousPage,
        "startKey": FIRST(retrievedAffiliations)._key,
        "endKey": LAST(retrievedAffiliations)._key
      }
    `
    } catch (err) {
      console.error(
        `Database error occurred while user: ${userKey} was trying to query affiliations in loadAffiliationConnectionsByOrgId, error: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to query affiliation(s). Please try again.`),
      )
    }

    let filteredAffiliations
    try {
      filteredAffiliations = await filteredAffiliationCursor.next()
    } catch (err) {
      console.error(
        `Cursor error occurred while user: ${userKey} was trying to gather affiliations in loadAffiliationConnectionsByOrgId, error: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to load affiliation(s). Please try again.`),
      )
    }

    if (filteredAffiliations.affiliations.length === 0) {
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

    const edges = filteredAffiliations.affiliations.map((affiliation) => {
      return {
        cursor: toGlobalId('affiliation', affiliation._key),
        node: affiliation,
      }
    })

    return {
      edges,
      totalCount: filteredAffiliations.totalCount,
      pageInfo: {
        hasNextPage: filteredAffiliations.hasNextPage,
        hasPreviousPage: filteredAffiliations.hasPreviousPage,
        startCursor: toGlobalId('affiliation', filteredAffiliations.startKey),
        endCursor: toGlobalId('affiliation', filteredAffiliations.endKey),
      },
    }
  }
