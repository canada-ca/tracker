const { aql } = require('arangojs')
const { fromGlobalId, toGlobalId } = require('graphql-relay')
const { t } = require('@lingui/macro')

const verifiedDomainLoaderConnectionsByOrgId = (
  query,
  cleanseInput,
  i18n,
) => async ({ orgId, after, before, first, last }) => {
  let afterTemplate = aql``
  let beforeTemplate = aql``

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

  let limitTemplate = aql``
  if (typeof first === 'undefined' && typeof last === 'undefined') {
    console.warn(
      `User did not have either \`first\` or \`last\` arguments set for: verifiedDomainLoaderConnectionsByOrgId.`,
    )
    throw new Error(
      i18n._(
        t`You must provide a \`first\` or \`last\` value to properly paginate the \`verifiedDomain\` connection.`,
      ),
    )
  } else if (typeof first !== 'undefined' && typeof last !== 'undefined') {
    console.warn(
      `User attempted to have \`first\` and \`last\` arguments set for: verifiedDomainLoaderConnectionsByOrgId.`,
    )
    throw new Error(
      i18n._(
        t`Passing both \`first\` and \`last\` to paginate the \`verifiedDomain\` connection is not supported.`,
      ),
    )
  } else if (typeof first === 'number' || typeof last === 'number') {
    /* istanbul ignore else */
    if (first < 0 || last < 0) {
      const argSet = typeof first !== 'undefined' ? 'first' : 'last'
      console.warn(
        `User attempted to have \`${argSet}\` set below zero for: verifiedDomainLoaderConnectionsByOrgId.`,
      )
      throw new Error(
        i18n._(
          t`\`${argSet}\` on the \`verifiedDomain\` connection cannot be less than zero.`,
        ),
      )
    } else if (first > 100 || last > 100) {
      const argSet = typeof first !== 'undefined' ? 'first' : 'last'
      const amount = typeof first !== 'undefined' ? first : last
      console.warn(
        `User attempted to have \`${argSet}\` to ${amount} for: verifiedDomainLoaderConnectionsByOrgId.`,
      )
      throw new Error(
        i18n._(
          t`Requesting \`${amount}\` records on the \`verifiedDomain\` connection exceeds the \`${argSet}\` limit of 100 records.`,
        ),
      )
    } else if (typeof first !== 'undefined' && typeof last === 'undefined') {
      limitTemplate = aql`SORT domain._key ASC LIMIT TO_NUMBER(${first})`
    } else if (typeof first === 'undefined' && typeof last !== 'undefined') {
      limitTemplate = aql`SORT domain._key DESC LIMIT TO_NUMBER(${last})`
    }
  } else {
    const argSet = typeof first !== 'undefined' ? 'first' : 'last'
    const typeSet = typeof first !== 'undefined' ? typeof first : typeof last
    console.warn(
      `User attempted to have \`${argSet}\` set as a ${typeSet} for: verifiedDomainLoaderConnectionsByOrgId.`,
    )
    throw new Error(
      i18n._(t`\`${argSet}\` must be of type \`number\` not \`${typeSet}\`.`),
    )
  }

  let sortString = aql``
  if (typeof last !== 'undefined') {
    sortString = aql`DESC`
  } else {
    sortString = aql`ASC`
  }

  let requestedDomainInfo
  try {
    requestedDomainInfo = await query`
    LET domainIds = UNIQUE(FLATTEN(
      FOR v, e IN 1..1 OUTBOUND ${orgId} claims RETURN v._key
    ))
    
    LET retrievedDomains = (
      FOR domain IN domains
        FILTER domain._key IN domainIds
        ${afterTemplate}
        ${beforeTemplate}
        ${limitTemplate}
        RETURN MERGE(domain, { id: domain._key })
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
      "domains": retrievedDomains,
      "totalCount": LENGTH(domainIds),
      "hasNextPage": hasNextPage, 
      "hasPreviousPage": hasPreviousPage, 
      "startKey": FIRST(retrievedDomains)._key, 
      "endKey": LAST(retrievedDomains)._key 
    }
    `
  } catch (err) {
    console.error(
      `Database error occurred while user was trying to gather domains in verifiedDomainLoaderConnectionsByOrgId, error: ${err}`,
    )
    throw new Error(
      i18n._(t`Unable to load verified domains. Please try again.`),
    )
  }

  let domainsInfo
  try {
    domainsInfo = await requestedDomainInfo.next()
  } catch (err) {
    console.error(
      `Cursor error occurred while user was trying to gather domains in verifiedDomainLoaderConnectionsByOrgId, error: ${err}`,
    )
    throw new Error(
      i18n._(t`Unable to load verified domains. Please try again.`),
    )
  }

  if (domainsInfo.domains.length === 0) {
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

  const edges = domainsInfo.domains.map((domain) => {
    return {
      cursor: toGlobalId('verifiedDomains', domain._key),
      node: domain,
    }
  })

  return {
    edges,
    totalCount: domainsInfo.totalCount,
    pageInfo: {
      hasNextPage: domainsInfo.hasNextPage,
      hasPreviousPage: domainsInfo.hasPreviousPage,
      startCursor: toGlobalId('verifiedDomains', domainsInfo.startKey),
      endCursor: toGlobalId('verifiedDomains', domainsInfo.endKey),
    },
  }
}

module.exports = {
  verifiedDomainLoaderConnectionsByOrgId,
}
