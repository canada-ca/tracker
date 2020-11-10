const { aql } = require('arangojs')
const { fromGlobalId, toGlobalId } = require('graphql-relay')
const { t } = require('@lingui/macro')

const affiliationLoaderByUserId = (
  query,
  userId,
  cleanseInput,
  i18n,
) => async ({ uId, after, before, first, last }) => {
  let afterTemplate = aql``
  let beforeTemplate = aql``

  let afterId
  if (typeof after !== 'undefined') {
    afterId = fromGlobalId(cleanseInput(after)).id
    afterTemplate = aql`FILTER TO_NUMBER(affiliation._key) > TO_NUMBER(${afterId})`
  }

  let beforeId
  if (typeof before !== 'undefined') {
    beforeId = fromGlobalId(cleanseInput(before)).id
    beforeTemplate = aql`FILTER TO_NUMBER(affiliation._key) < TO_NUMBER(${beforeId})`
  }

  let limitTemplate = aql``
  if (typeof first === 'undefined' && typeof last === 'undefined') {
    console.warn(
      `User: ${userId} did not have either \`first\` or \`last\` arguments set for: affiliationLoaderByUserId.`,
    )
    throw new Error(
      i18n._(
        t`You must provide a \`first\` or \`last\` value to properly paginate the \`affiliation\`.`,
      ),
    )
  } else if (typeof first !== 'undefined' && typeof last !== 'undefined') {
    console.warn(
      `User: ${userId} attempted to have \`first\` and \`last\` arguments set for: affiliationLoaderByUserId.`,
    )
    throw new Error(
      i18n._(
        t`Passing both \`first\` and \`last\` to paginate the \`affiliation\` is not supported.`,
      ),
    )
  } else if (typeof first === 'number' || typeof last === 'number') {
    /* istanbul ignore else */
    if (first < 0 || last < 0) {
      const argSet = typeof first !== 'undefined' ? 'first' : 'last'
      console.warn(
        `User: ${userId} attempted to have \`${argSet}\` set below zero for: affiliationLoaderByUserId.`,
      )
      throw new Error(
        i18n._(
          t`\`${argSet}\` on the \`affiliations\` cannot be less than zero.`,
        ),
      )
    } else if (first > 100 || last > 100) {
      const argSet = typeof first !== 'undefined' ? 'first' : 'last'
      const amount = typeof first !== 'undefined' ? first : last
      console.warn(
        `User: ${userId} attempted to have \`${argSet}\` set to ${amount} for: affiliationLoaderByUserId.`,
      )
      throw new Error(
        i18n._(
          t`Requesting \`${amount}\` records on the \`affiliations\` exceeds the \`${argSet}\` limit of 100 records.`,
        ),
      )
    } else if (typeof first !== 'undefined' && typeof last === 'undefined') {
      limitTemplate = aql`SORT affiliation._key ASC LIMIT TO_NUMBER(${first})`
    } else if (typeof first === 'undefined' && typeof last !== 'undefined') {
      limitTemplate = aql`SORT affiliation._key DESC LIMIT TO_NUMBER(${last})`
    }
  } else {
    const argSet = typeof first !== 'undefined' ? 'first' : 'last'
    const typeSet = typeof first !== 'undefined' ? typeof first : typeof last
    console.warn(
      `User: ${userId} attempted to have \`${argSet}\` set as a ${typeSet} for: affiliationLoaderByUserId.`,
    )
    throw new Error(
      i18n._(t`\`${argSet}\` must be of type \`number\` not \`${typeSet}\`.`),
    )
  }

  let sortString
  if (typeof last !== 'undefined') {
    sortString = aql`DESC`
  } else {
    sortString = aql`ASC`
  }

  let filteredAffiliationCursor
  try {
    filteredAffiliationCursor = await query`
    LET affiliationKeys = (FOR v, e IN 1..1 ANY ${uId} affiliations RETURN e._key)

    LET retrievedAffiliations = (
      FOR affiliation IN affiliations
          FILTER affiliation._key IN affiliationKeys
          ${afterTemplate}
          ${beforeTemplate}
          ${limitTemplate}
          LET orgKey = PARSE_IDENTIFIER(affiliation._from).key
          LET userKey = PARSE_IDENTIFIER(affiliation._to).key
          RETURN MERGE(affiliation, { orgKey: orgKey, userKey: userKey })
    )

    LET hasNextPage = (LENGTH(
      FOR aff IN affiliations
        FILTER aff._key IN affiliationKeys
        FILTER TO_NUMBER(aff._key) > TO_NUMBER(LAST(retrievedAffiliations)._key)
        SORT aff._key ${sortString} LIMIT 1
        RETURN aff
    ) > 0 ? true : false)

    LET hasPreviousPage = (LENGTH(
      FOR aff IN affiliations
        FILTER aff._key IN affiliationKeys
        FILTER TO_NUMBER(aff._key) < TO_NUMBER(FIRST(retrievedAffiliations)._key)
        SORT aff._key ${sortString} LIMIT 1
        RETURN aff
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
      `Database error occurred while user: ${userId} was trying to query affiliations in affiliationLoaderByUserId, error: ${err}`,
    )
    throw new Error(i18n._(t`Unable to query affiliations. Please try again.`))
  }

  let filteredAffiliations
  try {
    filteredAffiliations = await filteredAffiliationCursor.next()
  } catch (err) {
    console.error(
      `Cursor error occurred while user: ${userId} was trying to gather affiliations in affiliationLoaderByUserId, error: ${err}`,
    )
    throw new Error(i18n._(t`Unable to load affiliations. Please try again.`))
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
    affiliation.id = affiliation._key
    return {
      cursor: toGlobalId('affiliations', affiliation._key),
      node: affiliation,
    }
  })

  return {
    edges,
    totalCount: filteredAffiliations.totalCount,
    pageInfo: {
      hasNextPage: filteredAffiliations.hasNextPage,
      hasPreviousPage: filteredAffiliations.hasPreviousPage,
      startCursor: toGlobalId('affiliations', filteredAffiliations.startKey),
      endCursor: toGlobalId('affiliations', filteredAffiliations.endKey),
    },
  }
}

module.exports = {
  affiliationLoaderByUserId,
}
