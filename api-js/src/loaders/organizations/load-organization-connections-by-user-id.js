const { aql } = require('arangojs')
const { fromGlobalId, toGlobalId } = require('graphql-relay')

const orgLoaderConnectionsByUserId = (
  query,
  userId,
  cleanseInput,
) => async ({ after, before, first, last }) => {
  let afterTemplate = aql``
  let beforeTemplate = aql``

  const userDBId = `users/${userId}`

  if (typeof after !== 'undefined') {
    const { id: afterId } = fromGlobalId(cleanseInput(after))
    afterTemplate = aql`FILTER TO_NUMBER(org._key) > TO_NUMBER(${afterId})`
  }

  if (typeof before !== 'undefined') {
    const { id: beforeId } = fromGlobalId(cleanseInput(before))
    beforeTemplate = aql`FILTER TO_NUMBER(org._key) < TO_NUMBER(${beforeId})`
  }

  let limitTemplate = aql``
  if (typeof first !== 'undefined' && typeof last === 'undefined') {
    limitTemplate = aql`SORT org._key ASC LIMIT TO_NUMBER(${first + 1})`
  } else if (typeof first === 'undefined' && typeof last !== 'undefined') {
    limitTemplate = aql`SORT org._key DESC LIMIT TO_NUMBER(${last + 1})`
  } else if (typeof first !== 'undefined' && typeof last !== 'undefined') {
    console.warn(
      `User: ${userId} tried to have first and last set in organization connection query`,
    )
    throw new Error(
      'Error, unable to have first, and last set at the same time.',
    )
  }

  let filteredOrgCursor
  try {
    filteredOrgCursor = await query`
    FOR org IN (FOR v, e IN 1..1 ANY ${userDBId} affiliations RETURN e._from)
        ${afterTemplate}
        ${beforeTemplate}
        ${limitTemplate}
        RETURN org
    `
  } catch (err) {
    console.error(
      `Database error occurred while user: ${userId} was trying to query organizations in loadOrganizationsByUser.`,
    )
    throw new Error('Unable to query organizations. Please try again.')
  }

  let filteredOrgs
  const orgs = []

  try {
    filteredOrgs = await filteredOrgCursor.all()
    filteredOrgs.forEach((org) => orgs.push(org))
  } catch (err) {
    console.error(
      `Cursor error occurred while user: ${userId} was trying to gather organizations in loadOrganizationsByUser.`,
    )
    throw new Error('Unable to load organizations. Please try again.')
  }

  const hasNextPage = !!(typeof first !== 'undefined' && orgs.length > first)
  const hasPreviousPage = !!(
    typeof last !== 'undefined' && orgs.length > last
  )

  if (orgs.length > last || orgs.length > first) {
    orgs.pop()
  }

  const edges = []
  orgs.forEach(async (org) => {
    org.id = org._key
    edges.push({
      cursor: toGlobalId('organizations', org._key),
      node: org,
    })
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

  const startCursor = toGlobalId('organizations', orgs[0]._key)
  const endCursor = toGlobalId('organizations', orgs[orgs.length - 1]._key)

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
  orgLoaderConnectionsByUserId,
}
