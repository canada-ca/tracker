const { aql } = require('arangojs')
const { fromGlobalId, toGlobalId } = require('graphql-relay')
const { t } = require('@lingui/macro')

const domainLoaderConnectionsByOrgId = (
  query,
  userId,
  cleanseInput,
  i18n,
) => async ({ orgId, after, before, first = 20, last }) => {
  let afterTemplate = aql``
  let beforeTemplate = aql``

  const userDBId = `users/${userId}`

  let afterId
  if (typeof after !== 'undefined') {
    afterId = fromGlobalId(cleanseInput(after)).id
    afterTemplate = aql`FILTER TO_NUMBER(domain._key) > TO_NUMBER(${afterId})`
  }

  let beforeId
  if (typeof before !== 'undefined') {
    beforeId = fromGlobalId(cleanseInput(before)).id
    beforeTemplate = aql`FILTER TO_NUMBER(domain._key) < TO_NUMBER(${beforeId})`
  }

  if (typeof last !== 'undefined') {
    first = undefined
  }

  let limitTemplate = aql``
  if (first < 0 || last < 0) {
    console.warn(`User: ${userId} tried to have first or last set below 0`)
    throw new Error(
      i18n._(
        t`Error, minimum record request for first, and last arguments is 0.`,
      ),
    )
  } else if (first > 100 || last > 100) {
    console.warn(`User: ${userId} tried to have first or last set above 100`)
    throw new Error(
      i18n._(
        t`Error, maximum record request for first, and last arguments is 100.`,
      ),
    )
  } else if (typeof last !== 'undefined') {
    limitTemplate = aql`SORT domain._key DESC LIMIT TO_NUMBER(${last})`
  } else {
    limitTemplate = aql`SORT domain._key ASC LIMIT TO_NUMBER(${first})`
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
      `Database error occurred while user: ${userId} was trying to gather affiliated domains in loadDomainConnectionsByOrgId: ${err}`,
    )
    throw new Error(i18n._(t`Unable to load domains. Please try again.`))
  }

  let acceptedDomains
  try {
    acceptedDomains = await acceptedDomainsCursor.next()
  } catch (err) {
    console.error(
      `Cursor error occurred while user: ${userId} was trying to gather affiliated domains in loadDomainConnectionsByOrgId: ${err}`,
    )
    throw new Error(i18n._(t`Unable to load domains. Please try again.`))
  }

  let domainCursor
  try {
    domainCursor = await query`
    FOR domain IN domains
      FILTER domain._key IN ${acceptedDomains}
      ${limitTemplate}
      ${afterTemplate} 
      ${beforeTemplate} 
      RETURN domain
    `
  } catch (err) {
    console.error(
      `Database error occurred while user: ${userId} was trying to gather domains in loadDomainConnectionsByOrgId: ${err}`,
    )
    throw new Error(i18n._(t`Unable to load domains. Please try again.`))
  }

  let domains
  try {
    domains = await domainCursor.all()
  } catch (err) {
    console.error(
      `Cursor error occurred while user: ${userId} was trying to gather domains in loadDomainConnectionsByOrgId: ${err}`,
    )
    throw new Error(i18n._(t`Unable to load domains. Please try again.`))
  }

  if (domains.length === 0) {
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

  let sortString
  if (typeof last !== 'undefined') {
    sortString = aql`DESC`
  } else {
    sortString = aql`ASC`
  }

  let hasNextPage = false
  try {
    const counterCursor = await query`
      FOR domain IN domains
        FILTER domain._key IN ${acceptedDomains}
        FILTER TO_NUMBER(domain._key) > TO_NUMBER(${
          domains[domains.length - 1]._key
        })
        SORT domain._key ${sortString} LIMIT 1
        RETURN domain
    `
    hasNextPage = counterCursor.count > 0
  } catch (err) {
    console.error(
      `Database error occurred while user: ${userId} was trying to see if there is a next page in loadDomainConnectionsByOrgId: ${err}`,
    )
    throw new Error(i18n._(t`Unable to load domains. Please try again.`))
  }

  let hasPreviousPage = false
  try {
    const counterCursor = await query`
      FOR domain IN domains
        FILTER domain._key IN ${acceptedDomains}
        FILTER TO_NUMBER(domain._key) < TO_NUMBER(${domains[0]._key})
        SORT domain._key ${sortString} LIMIT 1
        RETURN domain
    `
    hasPreviousPage = counterCursor.count > 0
  } catch (err) {
    console.error(
      `Database error occurred while user: ${userId} was trying to see if there is a previous page in loadDomainConnectionsByOrgId: ${err}`,
    )
    throw new Error(i18n._(t`Unable to load domains. Please try again.`))
  }

  const edges = []
  domains.forEach(async (domains) => {
    domains.id = domains._key
    edges.push({
      cursor: toGlobalId('domains', domains._key),
      node: domains,
    })
  })

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
