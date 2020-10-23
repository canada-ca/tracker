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
    limitTemplate = aql`SORT domain._key ASC LIMIT TO_NUMBER(${first})`
  } else if (typeof first === 'undefined' && typeof last !== 'undefined') {
    limitTemplate = aql`SORT domain._key DESC LIMIT TO_NUMBER(${last})`
  } else if (typeof first !== 'undefined' && typeof last !== 'undefined') {
    console.warn(
      `User: ${userId} tried to have first and last set in domain connection query`,
    )
    throw new Error(
      i18n._(t`Error, unable to have first, and last set at the same time.`),
    )
  }

  let sortString
  if (typeof last !== 'undefined') {
    sortString = aql`DESC`
  } else {
    sortString = aql`ASC`
  }

  let requestedDomainInfo
  try {
    requestedDomainInfo = await query`
    LET domainIds = UNIQUE(FLATTEN(
      LET ids = []
      FOR userAffiliation IN (FOR v, e IN 1..1 ANY ${userDBId} affiliations RETURN e._from)
          LET orgClaims = (FOR v, e IN 1..1 ANY userAffiliation claims RETURN e._to)
          RETURN APPEND(ids, orgClaims)
    ))
    
    LET retrievedDomains = (
      FOR domain IN domains
        FILTER domain._id IN domainIds
        ${afterTemplate}
        ${beforeTemplate}
        ${limitTemplate}
        RETURN domain
    )
    
    LET hasNextPage = (LENGTH(
      FOR domain IN domains
        FILTER domain._key IN domainIds
        FILTER TO_NUMBER(domain._key) > TO_NUMBER(LAST(retrievedDomains)._key)
        SORT domain._key ${sortString} LIMIT 1
        RETURN domain
    ) > 0 ? true : false)
    
    LET hasPreviousPage = (LENGTH(
      FOR domain IN domains
        FILTER domain._key IN domainIds
        FILTER TO_NUMBER(domain._key) < TO_NUMBER(FIRST(retrievedDomains)._key)
        SORT domain._key ${sortString} LIMIT 1
        RETURN domain
    ) > 0 ? true : false)
    
    RETURN { 
      "domains": domains, 
      "hasNextPage": hasNextPage, 
      "hasPreviousPage": hasPreviousPage, 
      "startKey": FIRST(retrievedDomains)._key, 
      "endKey": LAST(retrievedDomains)._key 
    }
    `
  } catch (err) {
    console.error(
      `Database error occurred while user: ${userId} was trying to query domains in loadDomainsByUser.`,
    )
    throw new Error(i18n._(t`Unable to query domains. Please try again.`))
  }

  let domainsInfo
  try {
    domainsInfo = await requestedDomainInfo.next()
  } catch (err) {
    console.error(
      `Cursor error occurred while user: ${userId} was trying to gather domains in loadDomainsByUser.`,
    )
    throw new Error(i18n._(t`Unable to load domains. Please try again.`))
  }

  console.debug(domainsInfo)

  if (domainsInfo.domains.length === 0) {
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

  const edges = domainsInfo.domains.map((domain) => {
    domain.id = domain._key
    return {
      cursor: toGlobalId('domains', domain._key),
      node: domain,
    }
  })

  return {
    edges,
    pageInfo: {
      hasNextPage: domainsInfo.hasNextPage,
      hasPreviousPage: domainsInfo.hasPreviousPage,
      startCursor: toGlobalId('domains', domainsInfo.startKey),
      endCursor: toGlobalId('domains', domainsInfo.endKey),
    },
  }
}

module.exports = {
  domainLoaderConnectionsByUserId,
}
