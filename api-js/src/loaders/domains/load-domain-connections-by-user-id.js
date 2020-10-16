const { aql } = require('arangojs')
const { fromGlobalId, toGlobalId } = require('graphql-relay')
const { t } = require('@lingui/macro')

const domainLoaderConnectionsByUserId = (
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
    afterTemplate = aql`FILTER TO_NUMBER(domain._key) > TO_NUMBER(${afterId})`
  }

  if (typeof before !== 'undefined') {
    const { id: beforeId } = fromGlobalId(cleanseInput(before))
    beforeTemplate = aql`FILTER TO_NUMBER(domain._key) < TO_NUMBER(${beforeId})`
  }

  let limitTemplate = aql``
  if (typeof first !== 'undefined' && typeof last === 'undefined') {
    limitTemplate = aql`SORT domain._key ASC LIMIT TO_NUMBER(${first + 1})`
  } else if (typeof first === 'undefined' && typeof last !== 'undefined') {
    limitTemplate = aql`SORT domain._key DESC LIMIT TO_NUMBER(${last + 1})`
  } else if (typeof first !== 'undefined' && typeof last !== 'undefined') {
    console.warn(
      `User: ${userId} tried to have first and last set in domain connection query`,
    )
    throw new Error(
      i18n._(t`Error, unable to have first, and last set at the same time.`),
    )
  }

  let filteredDomainCursor
  try {
    filteredDomainCursor = await query`
    FOR userAffiliation IN (FOR v, e IN 1..1 ANY ${userDBId} affiliations RETURN e._from)
      LET orgClaims = (FOR v, e IN 1..1 ANY userAffiliation claims RETURN e._to)
      FOR domain IN domains
        FILTER orgClaims[** FILTER CURRENT == domain._id]
        ${afterTemplate}
        ${beforeTemplate}
        ${limitTemplate}
        RETURN domain
    `
  } catch (err) {
    console.error(
      `Database error occurred while user: ${userId} was trying to query domains in loadDomainsByUser.`,
    )
    throw new Error(i18n._(t`Unable to query domains. Please try again.`))
  }

  let filteredDomains
  const domains = []

  try {
    filteredDomains = await filteredDomainCursor.all()
    filteredDomains.forEach((domain) => domains.push(domain))
  } catch (err) {
    console.error(
      `Cursor error occurred while user: ${userId} was trying to gather domains in loadDomainsByUser.`,
    )
    throw new Error(i18n._(t`Unable to load domains. Please try again.`))
  }

  const hasNextPage = !!(typeof first !== 'undefined' && domains.length > first)
  const hasPreviousPage = !!(
    typeof last !== 'undefined' && domains.length > last
  )

  if (domains.length > last || domains.length > first) {
    domains.pop()
  }

  const edges = []
  domains.forEach(async (domains) => {
    domains.id = domains._key
    edges.push({
      cursor: toGlobalId('domains', domains._key),
      node: domains,
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

  const startCursor = toGlobalId('domains', domains[0]._key)
  const endCursor = toGlobalId('domains', domains[domains.length - 1]._key)

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
  domainLoaderConnectionsByUserId,
}
