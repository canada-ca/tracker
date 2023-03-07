import { aql } from 'arangojs'
import { fromGlobalId, toGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

export const loadDomainConnectionsByOrgId =
  ({ query, userKey, language, cleanseInput, i18n, auth: { loginRequiredBool } }) =>
  async ({
    orgId,
    permission,
    after,
    before,
    first,
    last,
    ownership,
    orderBy,
    search,
  }) => {
    const userDBId = `users/${userKey}`

    let afterTemplate = aql``
    let afterVar = aql``

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

        afterVar = aql`LET afterVar = DOCUMENT(domains, ${afterId})`

        let documentField = aql``
        let domainField = aql``
        /* istanbul ignore else */
        if (orderBy.field === 'domain') {
          documentField = aql`afterVar.domain`
          domainField = aql`domain.domain`
        } else if (orderBy.field === 'dkim-status') {
          documentField = aql`afterVar.status.dkim`
          domainField = aql`domain.status.dkim`
        } else if (orderBy.field === 'dmarc-status') {
          documentField = aql`afterVar.status.dmarc`
          domainField = aql`domain.status.dmarc`
        } else if (orderBy.field === 'https-status') {
          documentField = aql`afterVar.status.https`
          domainField = aql`domain.status.https`
        } else if (orderBy.field === 'spf-status') {
          documentField = aql`afterVar.status.spf`
          domainField = aql`domain.status.spf`
        } else if (orderBy.field === 'ciphers-status') {
          documentField = aql`afterVar.status.ciphers`
          domainField = aql`domain.status.ciphers`
        } else if (orderBy.field === 'curves-status') {
          documentField = aql`afterVar.status.curves`
          domainField = aql`domain.status.curves`
        } else if (orderBy.field === 'hsts-status') {
          documentField = aql`afterVar.status.hsts`
          domainField = aql`domain.status.hsts`
        } else if (orderBy.field === 'policy-status') {
          documentField = aql`afterVar.status.policy`
          domainField = aql`domain.status.policy`
        } else if (orderBy.field === 'protocols-status') {
          documentField = aql`afterVar.status.protocols`
          domainField = aql`domain.status.protocols`
        }

        afterTemplate = aql`
        FILTER ${domainField} ${afterTemplateDirection} ${documentField}
        OR (${domainField} == ${documentField}
        AND TO_NUMBER(domain._key) > TO_NUMBER(${afterId}))
      `
      }
    }

    let beforeTemplate = aql``
    let beforeVar = aql``

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

        beforeVar = aql`LET beforeVar = DOCUMENT(domains, ${beforeId})`

        let documentField = aql``
        let domainField = aql``
        /* istanbul ignore else */
        if (orderBy.field === 'domain') {
          documentField = aql`beforeVar.domain`
          domainField = aql`domain.domain`
        } else if (orderBy.field === 'dkim-status') {
          documentField = aql`beforeVar.status.dkim`
          domainField = aql`domain.status.dkim`
        } else if (orderBy.field === 'dmarc-status') {
          documentField = aql`beforeVar.status.dmarc`
          domainField = aql`domain.status.dmarc`
        } else if (orderBy.field === 'https-status') {
          documentField = aql`beforeVar.status.https`
          domainField = aql`domain.status.https`
        } else if (orderBy.field === 'spf-status') {
          documentField = aql`beforeVar.status.spf`
          domainField = aql`domain.status.spf`
        } else if (orderBy.field === 'ciphers-status') {
          documentField = aql`beforeVar.status.ciphers`
          domainField = aql`domain.status.ciphers`
        } else if (orderBy.field === 'curves-status') {
          documentField = aql`beforeVar.status.curves`
          domainField = aql`domain.status.curves`
        } else if (orderBy.field === 'hsts-status') {
          documentField = aql`beforeVar.status.hsts`
          domainField = aql`domain.status.hsts`
        } else if (orderBy.field === 'policy-status') {
          documentField = aql`beforeVar.status.policy`
          domainField = aql`domain.status.policy`
        } else if (orderBy.field === 'protocols-status') {
          documentField = aql`beforeVar.status.protocols`
          domainField = aql`domain.status.protocols`
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
        `User: ${userKey} did not have either \`first\` or \`last\` arguments set for: loadDomainConnectionsByOrgId.`,
      )
      throw new Error(
        i18n._(t`You must provide a \`first\` or \`last\` value to properly paginate the \`Domain\` connection.`),
      )
    } else if (typeof first !== 'undefined' && typeof last !== 'undefined') {
      console.warn(
        `User: ${userKey} attempted to have \`first\` and \`last\` arguments set for: loadDomainConnectionsByOrgId.`,
      )
      throw new Error(
        i18n._(t`Passing both \`first\` and \`last\` to paginate the \`Domain\` connection is not supported.`),
      )
    } else if (typeof first === 'number' || typeof last === 'number') {
      /* istanbul ignore else */
      if (first < 0 || last < 0) {
        const argSet = typeof first !== 'undefined' ? 'first' : 'last'
        console.warn(
          `User: ${userKey} attempted to have \`${argSet}\` set below zero for: loadDomainConnectionsByOrgId.`,
        )
        throw new Error(i18n._(t`\`${argSet}\` on the \`Domain\` connection cannot be less than zero.`))
      } else if (first > 100 || last > 100) {
        const argSet = typeof first !== 'undefined' ? 'first' : 'last'
        const amount = typeof first !== 'undefined' ? first : last
        console.warn(`User: ${userKey} attempted to have \`${argSet}\` to ${amount} for: loadDomainConnectionsByOrgId.`)
        throw new Error(
          i18n._(
            t`Requesting \`${amount}\` records on the \`Domain\` connection exceeds the \`${argSet}\` limit of 100 records.`,
          ),
        )
      } else if (typeof first !== 'undefined' && typeof last === 'undefined') {
        limitTemplate = aql`TO_NUMBER(domain._key) ASC LIMIT TO_NUMBER(${first})`
      } else if (typeof first === 'undefined' && typeof last !== 'undefined') {
        limitTemplate = aql`TO_NUMBER(domain._key) DESC LIMIT TO_NUMBER(${last})`
      }
    } else {
      const argSet = typeof first !== 'undefined' ? 'first' : 'last'
      const typeSet = typeof first !== 'undefined' ? typeof first : typeof last
      console.warn(
        `User: ${userKey} attempted to have \`${argSet}\` set as a ${typeSet} for: loadDomainConnectionsByOrgId.`,
      )
      throw new Error(i18n._(t`\`${argSet}\` must be of type \`number\` not \`${typeSet}\`.`))
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
        hasNextPageDocumentField = aql`LAST(retrievedDomains).domain`
        hasPreviousPageDocumentField = aql`FIRST(retrievedDomains).domain`
      } else if (orderBy.field === 'last-ran') {
        domainField = aql`domain.lastRan`
        hasNextPageDocumentField = aql`LAST(retrievedDomains).lastRan`
        hasPreviousPageDocumentField = aql`FIRST(retrievedDomains).lastRan`
      } else if (orderBy.field === 'dkim-status') {
        domainField = aql`domain.status.dkim`
        hasNextPageDocumentField = aql`LAST(retrievedDomains).status.dkim`
        hasPreviousPageDocumentField = aql`FIRST(retrievedDomains).status.dkim`
      } else if (orderBy.field === 'dmarc-status') {
        domainField = aql`domain.status.dmarc`
        hasNextPageDocumentField = aql`LAST(retrievedDomains).status.dmarc`
        hasPreviousPageDocumentField = aql`FIRST(retrievedDomains).status.dmarc`
      } else if (orderBy.field === 'https-status') {
        domainField = aql`domain.status.https`
        hasNextPageDocumentField = aql`LAST(retrievedDomains).status.https`
        hasPreviousPageDocumentField = aql`FIRST(retrievedDomains).status.https`
      } else if (orderBy.field === 'spf-status') {
        domainField = aql`domain.status.spf`
        hasNextPageDocumentField = aql`LAST(retrievedDomains).status.spf`
        hasPreviousPageDocumentField = aql`FIRST(retrievedDomains).status.spf`
      } else if (orderBy.field === 'ssl-status') {
        domainField = aql`domain.status.ssl`
        hasNextPageDocumentField = aql`LAST(retrievedDomains).status.ssl`
        hasPreviousPageDocumentField = aql`FIRST(retrievedDomains).status.ssl`
      } else if (orderBy.field === 'ciphers-status') {
        domainField = aql`domain.status.ciphers`
        hasNextPageDocumentField = aql`LAST(retrievedDomains).status.ciphers`
        hasPreviousPageDocumentField = aql`FIRST(retrievedDomains).status.ciphers`
      } else if (orderBy.field === 'curves-status') {
        domainField = aql`domain.status.curves`
        hasNextPageDocumentField = aql`LAST(retrievedDomains).status.curves`
        hasPreviousPageDocumentField = aql`FIRST(retrievedDomains).status.curves`
      } else if (orderBy.field === 'hsts-status') {
        domainField = aql`domain.status.hsts`
        hasNextPageDocumentField = aql`LAST(retrievedDomains).status.hsts`
        hasPreviousPageDocumentField = aql`FIRST(retrievedDomains).status.hsts`
      } else if (orderBy.field === 'policy-status') {
        domainField = aql`domain.status.policy`
        hasNextPageDocumentField = aql`LAST(retrievedDomains).status.policy`
        hasPreviousPageDocumentField = aql`FIRST(retrievedDomains).status.policy`
      } else if (orderBy.field === 'protocols-status') {
        domainField = aql`domain.status.protocols`
        hasNextPageDocumentField = aql`LAST(retrievedDomains).status.protocols`
        hasPreviousPageDocumentField = aql`FIRST(retrievedDomains).status.protocols`
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
      } else if (orderBy.field === 'dkim-status') {
        sortByField = aql`domain.status.dkim ${orderBy.direction},`
      } else if (orderBy.field === 'dmarc-status') {
        sortByField = aql`domain.status.dmarc ${orderBy.direction},`
      } else if (orderBy.field === 'https-status') {
        sortByField = aql`domain.status.https ${orderBy.direction},`
      } else if (orderBy.field === 'spf-status') {
        sortByField = aql`domain.status.spf ${orderBy.direction},`
      } else if (orderBy.field === 'ciphers-status') {
        sortByField = aql`domain.status.ciphers ${orderBy.direction},`
      } else if (orderBy.field === 'curves-status') {
        sortByField = aql`domain.status.curves ${orderBy.direction},`
      } else if (orderBy.field === 'hsts-status') {
        sortByField = aql`domain.status.hsts ${orderBy.direction},`
      } else if (orderBy.field === 'policy-status') {
        sortByField = aql`domain.status.policy ${orderBy.direction},`
      } else if (orderBy.field === 'protocols-status') {
        sortByField = aql`domain.status.protocols ${orderBy.direction},`
      }
    }

    let sortString
    if (typeof last !== 'undefined') {
      sortString = aql`DESC`
    } else {
      sortString = aql`ASC`
    }

    let domainQuery = aql``
    let loopString = aql`FOR domain IN domains`
    let totalCount = aql`LENGTH(domainKeys)`
    if (typeof search !== 'undefined' && search !== '') {
      search = cleanseInput(search)
      domainQuery = aql`
      LET tokenArr = TOKENS(${search}, "space-delimiter-analyzer")
      LET searchedDomains = (
        FOR tokenItem IN tokenArr
          LET token = LOWER(tokenItem)
          FOR domain IN domainSearch
            SEARCH ANALYZER(domain.domain LIKE CONCAT("%", token, "%"), "space-delimiter-analyzer")
            FILTER domain._key IN domainKeys
            RETURN MERGE({ id: domain._key, _type: "domain" }, domain)
      )
    `
      loopString = aql`FOR domain IN searchedDomains`
      totalCount = aql`LENGTH(searchedDomains)`
    }

    let showArchivedDomains = aql`FILTER domain.archived != true`
    if (permission === 'super_admin') {
      showArchivedDomains = aql``
    }
    let showHiddenDomains = aql`FILTER e.hidden != true`
    if (permission === 'admin' || permission === 'super_admin') {
      showHiddenDomains = aql``
    }

    let ownershipOrgsOnly = aql`
      LET claimKeys = (
        FOR v, e IN 1..1 OUTBOUND ${orgId} claims
          OPTIONS {order: "bfs"}
          ${showHiddenDomains}
          RETURN v._key
      )
    `
    if (typeof ownership !== 'undefined') {
      if (ownership) {
        ownershipOrgsOnly = aql`
          LET claimKeys = (
            FOR v, e IN 1..1 OUTBOUND ${orgId} ownership
              OPTIONS {order: "bfs"}
              ${showHiddenDomains}
              RETURN v._key
          )
        `
      }
    }

    let requestedDomainInfo
    try {
      let domainKeysQuery
      if (!loginRequiredBool) {
        domainKeysQuery = aql`
        LET domainKeys = (
          FOR v, e IN 1..1 OUTBOUND ${orgId} claims
            OPTIONS {order: "bfs"}
            ${showHiddenDomains}
            RETURN v._key
        )`
      } else {
        domainKeysQuery = aql`
        LET domainKeys = UNIQUE(FLATTEN(
          LET superAdmin = (
            FOR v, e IN 1 INBOUND ${userDBId} affiliations
              OPTIONS {order: "bfs"}
              FILTER e.permission == "super_admin"
              RETURN e.permission
          )
          LET affiliationKeys = (
            FOR v, e IN 1..1 INBOUND ${userDBId} affiliations
              OPTIONS {order: "bfs"}
              RETURN v._key
          )
          LET superAdminOrgs = (FOR org IN organizations RETURN org._key)
          LET keys = ('super_admin' IN superAdmin ? superAdminOrgs : affiliationKeys)
          ${ownershipOrgsOnly}

          LET orgKeys = INTERSECTION(keys, claimKeys)
          RETURN claimKeys
        ))`
      }

      requestedDomainInfo = await query`
      WITH affiliations, domains, organizations, users

      ${domainKeysQuery}

      ${domainQuery}

      ${afterVar}
      ${beforeVar}

      LET retrievedDomains = (
        ${loopString}
          FILTER domain._key IN domainKeys
          ${showArchivedDomains}
          LET hidden = (
            FOR v, e IN 1..1 ANY domain._id claims
              FILTER e._from == ${orgId}
              RETURN e.hidden
          )[0]
          LET claimTags = (
            FOR v, e IN 1..1 ANY domain._id claims
              FILTER e._from == ${orgId}
              LET translatedTags = (
                FOR tag IN e.tags || []
                  RETURN TRANSLATE(${language}, tag)
              )
              RETURN translatedTags
          )[0]
          ${afterTemplate}
          ${beforeTemplate}
          SORT
          ${sortByField}
          ${limitTemplate}
          RETURN MERGE({ id: domain._key, _type: "domain", "claimTags": claimTags, "hidden": hidden }, DOCUMENT(domain._id))
      )

      LET hasNextPage = (LENGTH(
        ${loopString}
          FILTER domain._key IN domainKeys
          ${showArchivedDomains}
          ${hasNextPageFilter}
          SORT ${sortByField} TO_NUMBER(domain._key) ${sortString} LIMIT 1
          RETURN domain
      ) > 0 ? true : false)

      LET hasPreviousPage = (LENGTH(
        ${loopString}
          FILTER domain._key IN domainKeys
          ${showArchivedDomains}
          ${hasPreviousPageFilter}
          SORT ${sortByField} TO_NUMBER(domain._key) ${sortString} LIMIT 1
          RETURN domain
      ) > 0 ? true : false)

      RETURN {
        "domains": retrievedDomains,
        "totalCount": ${totalCount},
        "hasNextPage": hasNextPage,
        "hasPreviousPage": hasPreviousPage,
        "startKey": FIRST(retrievedDomains)._key,
        "endKey": LAST(retrievedDomains)._key
      }
      `
    } catch (err) {
      console.error(
        `Database error occurred while user: ${userKey} was trying to gather domains in loadDomainConnectionsByOrgId, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to load domain(s). Please try again.`))
    }

    let domainsInfo
    try {
      domainsInfo = await requestedDomainInfo.next()
    } catch (err) {
      console.error(
        `Cursor error occurred while user: ${userKey} was trying to gather domains in loadDomainConnectionsByOrgId, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to load domain(s). Please try again.`))
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
        cursor: toGlobalId('domain', domain._key),
        node: domain,
      }
    })

    return {
      edges,
      totalCount: domainsInfo.totalCount,
      pageInfo: {
        hasNextPage: domainsInfo.hasNextPage,
        hasPreviousPage: domainsInfo.hasPreviousPage,
        startCursor: toGlobalId('domain', domainsInfo.startKey),
        endCursor: toGlobalId('domain', domainsInfo.endKey),
      },
    }
  }
