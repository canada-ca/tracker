import { aql } from 'arangojs'
import { fromGlobalId, toGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

export const loadVerifiedDomainConnectionsByOrgId = ({
  query,
  cleanseInput,
  i18n,
}) => async ({ orgId, after, before, first, last, orderBy }) => {
  let afterTemplate = aql``
  let beforeTemplate = aql``

  if (typeof after !== 'undefined') {
    const { id: afterId } = fromGlobalId(cleanseInput(after))
    if (typeof orderBy === 'undefined') {
      afterTemplate = aql`FILTER TO_NUMBER(domain._key) > TO_NUMBER(${afterId})`
    } else {
      let afterTemplateDirection = aql``
      if (orderBy.direction === 'ASC') {
        afterTemplateDirection = aql`>`
      } else {
        afterTemplateDirection = aql`<`
      }

      let documentField = aql``
      let domainField = aql``
      /* istanbul ignore else */
      if (orderBy.field === 'domain') {
        documentField = aql`DOCUMENT(domains, ${afterId}).domain`
        domainField = aql`domain.domain`
      } else if (orderBy.field === 'last-ran') {
        documentField = aql`DOCUMENT(domains, ${afterId}).lastRan`
        domainField = aql`domain.lastRan`
      } else if (orderBy.field === 'dkim-status') {
        documentField = aql`DOCUMENT(domains, ${afterId}).status.dkim`
        domainField = aql`domain.status.dkim`
      } else if (orderBy.field === 'dmarc-status') {
        documentField = aql`DOCUMENT(domains, ${afterId}).status.dmarc`
        domainField = aql`domain.status.dmarc`
      } else if (orderBy.field === 'https-status') {
        documentField = aql`DOCUMENT(domains, ${afterId}).status.https`
        domainField = aql`domain.status.https`
      } else if (orderBy.field === 'spf-status') {
        documentField = aql`DOCUMENT(domains, ${afterId}).status.spf`
        domainField = aql`domain.status.spf`
      } else if (orderBy.field === 'ssl-status') {
        documentField = aql`DOCUMENT(domains, ${afterId}).status.ssl`
        domainField = aql`domain.status.ssl`
      }

      afterTemplate = aql`
        FILTER ${domainField} ${afterTemplateDirection} ${documentField}
        OR (${domainField} == ${documentField}
        AND TO_NUMBER(domain._key) > TO_NUMBER(${afterId}))
      `
    }
  }

  if (typeof before !== 'undefined') {
    const { id: beforeId } = fromGlobalId(cleanseInput(before))
    if (typeof orderBy === 'undefined') {
      beforeTemplate = aql`FILTER TO_NUMBER(domain._key) < TO_NUMBER(${beforeId})`
    } else {
      let beforeTemplateDirection = aql``
      if (orderBy.direction === 'ASC') {
        beforeTemplateDirection = aql`<`
      } else {
        beforeTemplateDirection = aql`>`
      }

      let documentField = aql``
      let domainField = aql``
      /* istanbul ignore else */
      if (orderBy.field === 'domain') {
        documentField = aql`DOCUMENT(domains, ${beforeId}).domain`
        domainField = aql`domain.domain`
      } else if (orderBy.field === 'last-ran') {
        documentField = aql`DOCUMENT(domains, ${beforeId}).lastRan`
        domainField = aql`domain.lastRan`
      } else if (orderBy.field === 'dkim-status') {
        documentField = aql`DOCUMENT(domains, ${beforeId}).status.dkim`
        domainField = aql`domain.status.dkim`
      } else if (orderBy.field === 'dmarc-status') {
        documentField = aql`DOCUMENT(domains, ${beforeId}).status.dmarc`
        domainField = aql`domain.status.dmarc`
      } else if (orderBy.field === 'https-status') {
        documentField = aql`DOCUMENT(domains, ${beforeId}).status.https`
        domainField = aql`domain.status.https`
      } else if (orderBy.field === 'spf-status') {
        documentField = aql`DOCUMENT(domains, ${beforeId}).status.spf`
        domainField = aql`domain.status.spf`
      } else if (orderBy.field === 'ssl-status') {
        documentField = aql`DOCUMENT(domains, ${beforeId}).status.ssl`
        domainField = aql`domain.status.ssl`
      }

      beforeTemplate = aql`
        FILTER ${domainField} ${beforeTemplateDirection} ${documentField}
        OR (${domainField} == ${documentField}
        AND TO_NUMBER(domain._key) < TO_NUMBER(${beforeId}))
      `
    }
  }

  let limitTemplate = aql``
  if (typeof first === 'undefined' && typeof last === 'undefined') {
    console.warn(
      `User did not have either \`first\` or \`last\` arguments set for: loadVerifiedDomainConnectionsByOrgId.`,
    )
    throw new Error(
      i18n._(
        t`You must provide a \`first\` or \`last\` value to properly paginate the \`VerifiedDomain\` connection.`,
      ),
    )
  } else if (typeof first !== 'undefined' && typeof last !== 'undefined') {
    console.warn(
      `User attempted to have \`first\` and \`last\` arguments set for: loadVerifiedDomainConnectionsByOrgId.`,
    )
    throw new Error(
      i18n._(
        t`Passing both \`first\` and \`last\` to paginate the \`VerifiedDomain\` connection is not supported.`,
      ),
    )
  } else if (typeof first === 'number' || typeof last === 'number') {
    /* istanbul ignore else */
    if (first < 0 || last < 0) {
      const argSet = typeof first !== 'undefined' ? 'first' : 'last'
      console.warn(
        `User attempted to have \`${argSet}\` set below zero for: loadVerifiedDomainConnectionsByOrgId.`,
      )
      throw new Error(
        i18n._(
          t`\`${argSet}\` on the \`VerifiedDomain\` connection cannot be less than zero.`,
        ),
      )
    } else if (first > 100 || last > 100) {
      const argSet = typeof first !== 'undefined' ? 'first' : 'last'
      const amount = typeof first !== 'undefined' ? first : last
      console.warn(
        `User attempted to have \`${argSet}\` to ${amount} for: loadVerifiedDomainConnectionsByOrgId.`,
      )
      throw new Error(
        i18n._(
          t`Requesting \`${amount}\` records on the \`VerifiedDomain\` connection exceeds the \`${argSet}\` limit of 100 records.`,
        ),
      )
    } else if (typeof first !== 'undefined' && typeof last === 'undefined') {
      limitTemplate = aql`domain._key ASC LIMIT TO_NUMBER(${first})`
    } else if (typeof first === 'undefined' && typeof last !== 'undefined') {
      limitTemplate = aql`domain._key DESC LIMIT TO_NUMBER(${last})`
    }
  } else {
    const argSet = typeof first !== 'undefined' ? 'first' : 'last'
    const typeSet = typeof first !== 'undefined' ? typeof first : typeof last
    console.warn(
      `User attempted to have \`${argSet}\` set as a ${typeSet} for: loadVerifiedDomainConnectionsByOrgId.`,
    )
    throw new Error(
      i18n._(t`\`${argSet}\` must be of type \`number\` not \`${typeSet}\`.`),
    )
  }

  let hasNextPageFilter = aql`FILTER TO_NUMBER(domain._key) > TO_NUMBER(LAST(retrievedDomains)._key)`
  let hasPreviousPageFilter = aql`FILTER TO_NUMBER(domain._key) < TO_NUMBER(FIRST(retrievedDomains)._key)`
  if (typeof orderBy !== 'undefined') {
    let hasNextPageDirection = aql``
    let hasPreviousPageDirection = aql``
    if (orderBy.direction === 'ASC') {
      hasNextPageDirection = aql`>`
      hasPreviousPageDirection = aql`<`
    } else {
      hasNextPageDirection = aql`<`
      hasPreviousPageDirection = aql`>`
    }

    let domainField = aql``
    let hasNextPageDocumentField = aql``
    let hasPreviousPageDocumentField = aql``
    /* istanbul ignore else */
    if (orderBy.field === 'domain') {
      domainField = aql`domain.domain`
      hasNextPageDocumentField = aql`DOCUMENT(domains, LAST(retrievedDomains)._key).domain`
      hasPreviousPageDocumentField = aql`DOCUMENT(domains, FIRST(retrievedDomains)._key).domain`
    } else if (orderBy.field === 'last-ran') {
      domainField = aql`domain.lastRan`
      hasNextPageDocumentField = aql`DOCUMENT(domains, LAST(retrievedDomains)._key).lastRan`
      hasPreviousPageDocumentField = aql`DOCUMENT(domains, FIRST(retrievedDomains)._key).lastRan`
    } else if (orderBy.field === 'dkim-status') {
      domainField = aql`domain.status.dkim`
      hasNextPageDocumentField = aql`DOCUMENT(domains, LAST(retrievedDomains)._key).status.dkim`
      hasPreviousPageDocumentField = aql`DOCUMENT(domains, FIRST(retrievedDomains)._key).status.dkim`
    } else if (orderBy.field === 'dmarc-status') {
      domainField = aql`domain.status.dmarc`
      hasNextPageDocumentField = aql`DOCUMENT(domains, LAST(retrievedDomains)._key).status.dmarc`
      hasPreviousPageDocumentField = aql`DOCUMENT(domains, FIRST(retrievedDomains)._key).status.dmarc`
    } else if (orderBy.field === 'https-status') {
      domainField = aql`domain.status.https`
      hasNextPageDocumentField = aql`DOCUMENT(domains, LAST(retrievedDomains)._key).status.https`
      hasPreviousPageDocumentField = aql`DOCUMENT(domains, FIRST(retrievedDomains)._key).status.https`
    } else if (orderBy.field === 'spf-status') {
      domainField = aql`domain.status.spf`
      hasNextPageDocumentField = aql`DOCUMENT(domains, LAST(retrievedDomains)._key).status.spf`
      hasPreviousPageDocumentField = aql`DOCUMENT(domains, FIRST(retrievedDomains)._key).status.spf`
    } else if (orderBy.field === 'ssl-status') {
      domainField = aql`domain.status.ssl`
      hasNextPageDocumentField = aql`DOCUMENT(domains, LAST(retrievedDomains)._key).status.ssl`
      hasPreviousPageDocumentField = aql`DOCUMENT(domains, FIRST(retrievedDomains)._key).status.ssl`
    }

    hasNextPageFilter = aql`
      FILTER ${domainField} ${hasNextPageDirection} ${hasNextPageDocumentField}
      OR (${domainField} == ${hasNextPageDocumentField}
      AND TO_NUMBER(domain._key) > TO_NUMBER(LAST(retrievedDomains)._key))
    `
    hasPreviousPageFilter = aql`
      FILTER ${domainField} ${hasPreviousPageDirection} ${hasPreviousPageDocumentField}
      OR (${domainField} == ${hasPreviousPageDocumentField}
      AND TO_NUMBER(domain._key) < TO_NUMBER(FIRST(retrievedDomains)._key))
    `
  }

  let sortByField = aql``
  if (typeof orderBy !== 'undefined') {
    /* istanbul ignore else */
    if (orderBy.field === 'domain') {
      sortByField = aql`domain.domain ${orderBy.direction},`
    } else if (orderBy.field === 'last-ran') {
      sortByField = aql`domain.lastRan ${orderBy.direction},`
    } else if (orderBy.field === 'dkim-status') {
      sortByField = aql`domain.status.dkim ${orderBy.direction},`
    } else if (orderBy.field === 'dmarc-status') {
      sortByField = aql`domain.status.dmarc ${orderBy.direction},`
    } else if (orderBy.field === 'https-status') {
      sortByField = aql`domain.status.https ${orderBy.direction},`
    } else if (orderBy.field === 'spf-status') {
      sortByField = aql`domain.status.spf ${orderBy.direction},`
    } else if (orderBy.field === 'ssl-status') {
      sortByField = aql`domain.status.ssl ${orderBy.direction},`
    }
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
    WITH claims, domains, organizations
    LET domainIds = UNIQUE(FLATTEN(
      FOR v, e IN 1..1 OUTBOUND ${orgId} claims RETURN v._key
    ))
    
    LET retrievedDomains = (
      FOR domain IN domains
        FILTER domain._key IN domainIds
        ${afterTemplate}
        ${beforeTemplate}
        SORT
        ${sortByField}
        ${limitTemplate}
        RETURN MERGE(domain, { id: domain._key, _type: "verifiedDomain" })
    )
    
    LET hasNextPage = (LENGTH(
      FOR domain IN domains
        FILTER domain._key IN domainIds
        ${hasNextPageFilter}
        SORT ${sortByField} domain._key ${sortString} LIMIT 1
        RETURN domain
    ) > 0 ? true : false)
    
    LET hasPreviousPage = (LENGTH(
      FOR domain IN domains
        FILTER domain._key IN domainIds
        ${hasPreviousPageFilter}
        SORT ${sortByField} domain._key ${sortString} LIMIT 1
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
      `Database error occurred while user was trying to gather domains in loadVerifiedDomainConnectionsByOrgId, error: ${err}`,
    )
    throw new Error(
      i18n._(t`Unable to load verified domain(s). Please try again.`),
    )
  }

  let domainsInfo
  try {
    domainsInfo = await requestedDomainInfo.next()
  } catch (err) {
    console.error(
      `Cursor error occurred while user was trying to gather domains in loadVerifiedDomainConnectionsByOrgId, error: ${err}`,
    )
    throw new Error(
      i18n._(t`Unable to load verified domain(s). Please try again.`),
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
