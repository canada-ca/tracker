const { aql } = require('arangojs')
const { fromGlobalId, toGlobalId } = require('graphql-relay')
const { t } = require('@lingui/macro')

const affiliationLoaderByUserId = (
  query,
  userId,
  cleanseInput,
  i18n,
) => async ({ after, before, first, last }) => {
  let afterTemplate = aql``
  let beforeTemplate = aql``

  const userDBId = `users/${userId}`

  if (typeof after !== 'undefined') {
    const { id: afterId } = fromGlobalId(cleanseInput(after))
    afterTemplate = aql`FILTER TO_NUMBER(affiliation._key) > TO_NUMBER(${afterId})`
  }

  if (typeof before !== 'undefined') {
    const { id: beforeId } = fromGlobalId(cleanseInput(before))
    beforeTemplate = aql`FILTER TO_NUMBER(affiliation._key) < TO_NUMBER(${beforeId})`
  }

  let limitTemplate = aql``
  if (typeof first !== 'undefined' && typeof last === 'undefined') {
    limitTemplate = aql`SORT affiliation._key ASC LIMIT TO_NUMBER(${first + 1})`
  } else if (typeof first === 'undefined' && typeof last !== 'undefined') {
    limitTemplate = aql`SORT affiliation._key DESC LIMIT TO_NUMBER(${last + 1})`
  } else if (typeof first !== 'undefined' && typeof last !== 'undefined') {
    console.warn(
      `User: ${userId} tried to have first and last set in user affiliation query`,
    )
    throw new Error(
      i18n._(t`Error, unable to have first, and last set at the same time.`),
    )
  }

  let filteredAffiliationCursor
  try {
    filteredAffiliationCursor = await query`
    LET affiliationIds = (FOR v, e IN 1..1 ANY ${userDBId} affiliations RETURN e._id)
    FOR affiliation IN affiliations
        FILTER affiliation._id IN affiliationIds
        ${afterTemplate}
        ${beforeTemplate}
        ${limitTemplate}
        RETURN affiliation
    `
  } catch (err) {
    console.error(
      `Database error occurred while user: ${userId} was trying to query affiliations in affiliationLoaderByUserId.`,
    )
    throw new Error(i18n._(t`Unable to query affiliations. Please try again.`))
  }

  let filteredAffiliations
  try {
    filteredAffiliations = await filteredAffiliationCursor.all()
  } catch (err) {
    console.error(
      `Cursor error occurred while user: ${userId} was trying to gather affiliations in affiliationLoaderByUserId.`,
    )
    throw new Error(i18n._(t`Unable to load affiliations. Please try again.`))
  }

  const hasNextPage = !!(
    typeof first !== 'undefined' && filteredAffiliations.length > first
  )
  const hasPreviousPage = !!(
    typeof last !== 'undefined' && filteredAffiliations.length > last
  )

  if (
    filteredAffiliations.length > last ||
    filteredAffiliations.length > first
  ) {
    filteredAffiliations.pop()
  }

  const edges = filteredAffiliations.map((affiliation) => {
    affiliation.id = affiliation._key
    return {
      cursor: toGlobalId('affiliations', affiliation._key),
      node: affiliation,
    }
  })

  if (edges.length === 0) {
    return {
      edges: [],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: '',
        endCursor: '',
      },
    }
  }

  const startCursor = toGlobalId('affiliations', filteredAffiliations[0]._key)
  const endCursor = toGlobalId(
    'affiliations',
    filteredAffiliations[filteredAffiliations.length - 1]._key,
  )

  return {
    edges,
    pageInfo: {
      hasNextPage,
      hasPreviousPage,
      startCursor,
      endCursor,
    },
  }
}

module.exports = {
  affiliationLoaderByUserId,
}
