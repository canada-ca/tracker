const { aql } = require('arangojs')
const { fromGlobalId, toGlobalId } = require('graphql-relay')
const { t } = require('@lingui/macro')

const domainLoaderConnectionsByOrgId = (query, userId, cleanseInput, i18n) => async ({
  orgId,
  after,
  before,
  first,
  last,
}) => {
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

  let acceptedDomainsCursor
  try {
    acceptedDomainsCursor = await query`
    LET superAdmin = (FOR v, e IN 1 INBOUND ${userDBId} affiliations FILTER e.permission == "super_admin" RETURN e.permission)
    LET affiliationKeys = (FOR v, e IN 1..1 INBOUND ${userDBId} affiliations RETURN v._key)
    LET superAdminOrgs = (FOR org IN organizations RETURN org._key)
    LET keys = ('super_admin' IN superAdmin ? superAdminOrgs : affiliationKeys)
    LET claimKeys = (FOR v, e IN 1..1 OUTBOUND ${orgId} claims RETURN v._key)
    LET orgKeys = INTERSECTION(keys, claimKeys)
      RETURN claimKeys
    `
  } catch (err) {
    console.error(
      `Database error occurred while user: ${userId} was trying to gather affiliated domains in loadDomainConnectionsByOrgId.`,
    )
    throw new Error(i18n._(t`Unable to load domains. Please try again.`))
  }

  let acceptedDomains
  try {
    acceptedDomains = await acceptedDomainsCursor.next()
  } catch (err) {
    console.error(
      `Cursor error occurred while user: ${userId} was trying to gather affiliated domains in loadDomainConnectionsByOrgId.`,
    )
    throw new Error(i18n._(t`Unable to load domains. Please try again.`))
  }

  let domainCursor
  try {
    domainCursor = await query`
    FOR domain IN domains
      FILTER domain._key IN ${acceptedDomains}
      ${afterTemplate} 
      ${beforeTemplate} 
      ${limitTemplate}
      RETURN domain
    `
  } catch (err) {
    console.error(
      `Database error occurred while user: ${userId} was trying to gather domains in loadDomainConnectionsByOrgId.`,
    )
    throw new Error(i18n._(t`Unable to load domains. Please try again.`))
  }

  let domains
  try {
    domains = await domainCursor.all()
  } catch (err) {
    console.error(
      `Cursor error occurred while user: ${userId} was trying to gather domains in loadDomainConnectionsByOrgId.`,
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
  domainLoaderConnectionsByOrgId,
}
