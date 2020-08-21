const { fromGlobalId, toGlobalId } = require('graphql-relay')
const { aql } = require('arangojs')

const loadOrganizationsConnections = (
  query,
  language,
  userId,
  cleanseInput,
) => async ({ after, before, first, last }) => {
  let afterTemplate = aql``
  let beforeTemplate = aql``

  const userDBId = `users/${userId}`

  if (typeof after !== 'undefined') {
    const { id: afterId } = fromGlobalId(cleanseInput(after))
    afterTemplate = aql`FILTER TO_NUMBER(org._key) > ${afterId}`
  }

  if (typeof before !== 'undefined') {
    const { id: beforeId } = fromGlobalId(cleanseInput(before))
    beforeTemplate = aql`FILTER TO_NUMBER(org._key) < ${beforeId}`
  }

  let limitTemplate = aql``
  if (typeof first !== 'undefined' && typeof last === 'undefined') {
    limitTemplate = aql`SORT org._key ASC LIMIT ${first + 1}`
  } else if (typeof first === 'undefined' && typeof last !== 'undefined') {
    limitTemplate = aql`SORT org._key DESC LIMIT ${last + 1}`
  } else if (typeof first !== 'undefined' && typeof last !== 'undefined') {
    console.warn(
      `User: ${userId} tried to have first and last set in organizations connection query`,
    )
    throw new Error(
      'Error, unable to have first, and last set at the same time.',
    )
  }

  let acceptedOrgsCursor
  try {
    acceptedOrgsCursor = await query`
    LET orgKeys = (FOR v, e IN 1..1 INBOUND ${userDBId} affiliations RETURN v._key )
      RETURN orgKeys
    `
  } catch (err) {
    console.error(
      `Database error occurred while user: ${userId} was trying to gather org information in loadOrganizationsConnections.`,
    )
    throw new Error('Unable to load organizations. Please try again.')
  }

  const acceptedOrgs = await acceptedOrgsCursor.next()

  let orgCursor
  try {
    orgCursor = await query`
    FOR org IN organizations
      FILTER org._key IN ${acceptedOrgs}
      ${afterTemplate} 
      ${beforeTemplate} 
      ${limitTemplate}
      RETURN MERGE({ _id: org._id, _key: org._key, _rev: org._rev, blueCheck: org.blueCheck }, TRANSLATE(${language}, org.orgDetails))
    `
  } catch (err) {
    console.error(err)
    throw new Error('Unable to retrieve organizations. Please try again.')
  }

  const organizations = await orgCursor.all()

  const hasNextPage = !!(
    typeof first !== 'undefined' && organizations.length > first
  )
  const hasPreviousPage = !!(
    typeof last !== 'undefined' && organizations.length > last
  )

  if (organizations.length > last || organizations.length > first) {
    organizations.pop()
  }

  const startCursor = toGlobalId('organizations', organizations[0]._key)
  const endCursor = toGlobalId(
    'organizations',
    organizations[organizations.length - 1]._key,
  )

  const edges = []
  organizations.forEach(async (organization) => {
    organization.id = organization._key
    edges.push({
      cursor: toGlobalId('organizations', organization._key),
      node: organization,
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
  loadOrganizationsConnections,
}
