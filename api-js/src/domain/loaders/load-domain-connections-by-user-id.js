import { aql } from 'arangojs'
import { fromGlobalId, toGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

export const domainLoaderConnectionsByUserId = (
  query,
  userKey,
  cleanseInput,
  i18n,
) => async ({ after, before, first, last, ownership }) => {
  let afterTemplate = aql``
  let beforeTemplate = aql``

  const userDBId = `users/${userKey}`

  let ownershipOrgsOnly = aql`LET claimDomainKeys = (FOR v, e IN 1..1 OUTBOUND orgId claims RETURN v._key)`
  if (typeof ownership !== 'undefined') {
    if (ownership) {
      ownershipOrgsOnly = aql`LET claimDomainKeys = (FOR v, e IN 1..1 OUTBOUND orgId ownership RETURN v._key)`
    }
  }

  if (typeof after !== 'undefined') {
    const { id: afterId } = fromGlobalId(cleanseInput(after))
    afterTemplate = aql`FILTER TO_NUMBER(domain._key) > TO_NUMBER(${afterId})`
  }

  if (typeof before !== 'undefined') {
    const { id: beforeId } = fromGlobalId(cleanseInput(before))
    beforeTemplate = aql`FILTER TO_NUMBER(domain._key) < TO_NUMBER(${beforeId})`
  }

  let limitTemplate = aql``
  if (typeof first === 'undefined' && typeof last === 'undefined') {
    console.warn(
      `User: ${userKey} did not have either \`first\` or \`last\` arguments set for: domainLoaderConnectionsByUserId.`,
    )
    throw new Error(
      i18n._(
        t`You must provide a \`first\` or \`last\` value to properly paginate the \`domain\` connection.`,
      ),
    )
  } else if (typeof first !== 'undefined' && typeof last !== 'undefined') {
    console.warn(
      `User: ${userKey} attempted to have \`first\` and \`last\` arguments set for: domainLoaderConnectionsByUserId.`,
    )
    throw new Error(
      i18n._(
        t`Passing both \`first\` and \`last\` to paginate the \`domain\` connection is not supported.`,
      ),
    )
  } else if (typeof first === 'number' || typeof last === 'number') {
    /* istanbul ignore else */
    if (first < 0 || last < 0) {
      const argSet = typeof first !== 'undefined' ? 'first' : 'last'
      console.warn(
        `User: ${userKey} attempted to have \`${argSet}\` set below zero for: domainLoaderConnectionsByUserId.`,
      )
      throw new Error(
        i18n._(
          t`\`${argSet}\` on the \`domain\` connection cannot be less than zero.`,
        ),
      )
    } else if (first > 100 || last > 100) {
      const argSet = typeof first !== 'undefined' ? 'first' : 'last'
      const amount = typeof first !== 'undefined' ? first : last
      console.warn(
        `User: ${userKey} attempted to have \`${argSet}\` set to ${amount} for: domainLoaderConnectionsByUserId.`,
      )
      throw new Error(
        i18n._(
          t`Requesting \`${amount}\` records on the \`domain\` connection exceeds the \`${argSet}\` limit of 100 records.`,
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
      `User: ${userKey} attempted to have \`${argSet}\` set as a ${typeSet} for: domainLoaderConnectionsByUserId.`,
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

  let requestedDomainInfo
  try {
    requestedDomainInfo = await query`
    LET domainKeys = UNIQUE(FLATTEN(
      LET keys = []
      LET orgIds = (FOR v, e IN 1..1 ANY ${userDBId} affiliations RETURN e._from)
      FOR orgId IN orgIds 
          ${ownershipOrgsOnly}
          RETURN APPEND(keys, claimDomainKeys)
    ))
    
    LET retrievedDomains = (
      FOR domain IN domains
        FILTER domain._key IN domainKeys
        ${afterTemplate}
        ${beforeTemplate}
        ${limitTemplate}
        RETURN MERGE({ id: domain._key}, domain)
    )
    
    LET hasNextPage = (LENGTH(
      FOR domain IN domains
        FILTER domain._key IN domainKeys
        FILTER TO_NUMBER(domain._key) > TO_NUMBER(LAST(retrievedDomains)._key)
        SORT domain._key ${sortString} LIMIT 1
        RETURN domain
    ) > 0 ? true : false)
    
    LET hasPreviousPage = (LENGTH(
      FOR domain IN domains
        FILTER domain._key IN domainKeys
        FILTER TO_NUMBER(domain._key) < TO_NUMBER(FIRST(retrievedDomains)._key)
        SORT domain._key ${sortString} LIMIT 1
        RETURN domain
    ) > 0 ? true : false)
    
    RETURN { 
      "domains": retrievedDomains,
      "totalCount": LENGTH(domainKeys),
      "hasNextPage": hasNextPage, 
      "hasPreviousPage": hasPreviousPage, 
      "startKey": FIRST(retrievedDomains)._key, 
      "endKey": LAST(retrievedDomains)._key 
    }
    `
  } catch (err) {
    console.error(
      `Database error occurred while user: ${userKey} was trying to query domains in loadDomainsByUser, error: ${err}`,
    )
    throw new Error(i18n._(t`Unable to query domains. Please try again.`))
  }

  let domainsInfo
  try {
    domainsInfo = await requestedDomainInfo.next()
  } catch (err) {
    console.error(
      `Cursor error occurred while user: ${userKey} was trying to gather domains in loadDomainsByUser, error: ${err}`,
    )
    throw new Error(i18n._(t`Unable to load domains. Please try again.`))
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
      cursor: toGlobalId('domains', domain._key),
      node: domain,
    }
  })

  return {
    edges,
    totalCount: domainsInfo.totalCount,
    pageInfo: {
      hasNextPage: domainsInfo.hasNextPage,
      hasPreviousPage: domainsInfo.hasPreviousPage,
      startCursor: toGlobalId('domains', domainsInfo.startKey),
      endCursor: toGlobalId('domains', domainsInfo.endKey),
    },
  }
}
