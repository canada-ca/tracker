import { t } from '@lingui/macro'
import { aql } from 'arangojs'
import { fromGlobalId, toGlobalId } from 'graphql-relay'

export const loadWebCheckConnectionsByUserId =
  ({ query, userKey, cleanseInput, language, i18n, _auth }) =>
  async ({
    after,
    before,
    first,
    last,
    orderBy,
    search,
    isAdmin,
    isSuperAdmin,
  }) => {
    const userDBId = `users/${userKey}`
    let afterTemplate = aql``
    let afterVar = aql``
    if (typeof after !== 'undefined') {
      const { id: afterId } = fromGlobalId(cleanseInput(after))
      if (typeof orderBy === 'undefined') {
        afterTemplate = aql`FILTER TO_NUMBER(org._key) > TO_NUMBER(${afterId})`
      } else {
        let afterTemplateDirection = aql`<`
        if (orderBy.direction === 'ASC') {
          afterTemplateDirection = aql`>`
        }
        afterVar = aql`LET afterVar = (
          FOR org IN organizations
              FILTER org._key == ${afterId}
              RETURN org
          )[0]`

        let documentField = aql``
        let orgField = aql``
        /* istanbul ignore else */
        if (orderBy.field === 'acronym') {
          documentField = aql`TRANSLATE(${language}, afterVar.orgDetails).acronym`
          orgField = aql`TRANSLATE(${language}, org.organization.orgDetails).acronym`
        } else if (orderBy.field === 'name') {
          documentField = aql`TRANSLATE(${language}, afterVar.orgDetails).name`
          orgField = aql`TRANSLATE(${language}, org.organization.orgDetails).name`
        }

        afterTemplate = aql`
          FILTER ${orgField} ${afterTemplateDirection} ${documentField}
          OR (${orgField} == ${documentField}
          AND TO_NUMBER(org._key) > TO_NUMBER(${afterId}))
        `
      }
    }

    let beforeTemplate = aql``
    let beforeVar = aql``
    if (typeof before !== 'undefined') {
      const { id: beforeId } = fromGlobalId(cleanseInput(before))
      if (typeof orderBy === 'undefined') {
        beforeTemplate = aql`FILTER TO_NUMBER(org._key) < TO_NUMBER(${beforeId})`
      } else {
        let beforeTemplateDirection = aql`>`
        if (orderBy.direction === 'ASC') {
          beforeTemplateDirection = aql`<`
        }

        beforeVar = aql`LET beforeVar = (
          FOR org in organizations
              FILTER org._key == ${beforeId}
              REturn org
         )[0]`

        let documentField = aql``
        let orgField = aql``
        /* istanbul ignore else */
        if (orderBy.field === 'acronym') {
          documentField = aql`TRANSLATE(${language}, beforeVar.orgDetails).acronym`
          orgField = aql`TRANSLATE(${language}, org.organization.orgDetails).acronym`
        } else if (orderBy.field === 'name') {
          documentField = aql`TRANSLATE(${language}, beforeVar.orgDetails).name`
          orgField = aql`TRANSLATE(${language}, org.organization.orgDetails).name`
        }

        beforeTemplate = aql`
          FILTER ${orgField} ${beforeTemplateDirection} ${documentField}
          OR (${orgField} == ${documentField}
          AND TO_NUMBER(org._key) < TO_NUMBER(${beforeId}))
        `
      }
    }

    let limitTemplate = aql``
    if (typeof first === 'undefined' && typeof last === 'undefined') {
      console.warn(
        `User: ${userKey} did not have either \`first\` or \`last\` arguments set for: loadOrgConnectionsByUserId.`,
      )
      throw new Error(
        i18n._(
          t`You must provide a \`first\` or \`last\` value to properly paginate the \`Organization\` connection.`,
        ),
      )
    } else if (typeof first !== 'undefined' && typeof last !== 'undefined') {
      console.warn(
        `User: ${userKey} attempted to have \`first\` and \`last\` arguments set for: loadOrgConnectionsByUserId.`,
      )
      throw new Error(
        i18n._(
          t`Passing both \`first\` and \`last\` to paginate the \`Organization\` connection is not supported.`,
        ),
      )
    } else if (typeof first === 'number' || typeof last === 'number') {
      /* istanbul ignore else */
      if (first < 0 || last < 0) {
        const argSet = typeof first !== 'undefined' ? 'first' : 'last'
        console.warn(
          `User: ${userKey} attempted to have \`${argSet}\` set below zero for: loadOrgConnectionsByUserId.`,
        )
        throw new Error(
          i18n._(
            t`\`${argSet}\` on the \`Organization\` connection cannot be less than zero.`,
          ),
        )
      } else if (first > 100 || last > 100) {
        const argSet = typeof first !== 'undefined' ? 'first' : 'last'
        const amount = typeof first !== 'undefined' ? first : last
        console.warn(
          `User: ${userKey} attempted to have \`${argSet}\` to ${amount} for: loadOrgConnectionsByUserId.`,
        )
        throw new Error(
          i18n._(
            t`Requesting \`${amount}\` records on the \`Organization\` connection exceeds the \`${argSet}\` limit of 100 records.`,
          ),
        )
      } else if (typeof first !== 'undefined' && typeof last === 'undefined') {
        limitTemplate = aql`TO_NUMBER(org._key) ASC LIMIT TO_NUMBER(${first})`
      } else if (typeof first === 'undefined' && typeof last !== 'undefined') {
        limitTemplate = aql`TO_NUMBER(org._key) DESC LIMIT TO_NUMBER(${last})`
      }
    } else {
      const argSet = typeof first !== 'undefined' ? 'first' : 'last'
      const typeSet = typeof first !== 'undefined' ? typeof first : typeof last
      console.warn(
        `User: ${userKey} attempted to have \`${argSet}\` set as a ${typeSet} for: loadOrgConnectionsByUserId.`,
      )
      throw new Error(
        i18n._(t`\`${argSet}\` must be of type \`number\` not \`${typeSet}\`.`),
      )
    }

    let hasNextPageFilter = aql`FILTER TO_NUMBER(org._key) > TO_NUMBER(LAST(retrievedOrgs)._key)`
    let hasPreviousPageFilter = aql`FILTER TO_NUMBER(org._key) < TO_NUMBER(FIRST(retrievedOrgs)._key)`
    if (typeof orderBy !== 'undefined') {
      let hasNextPageDirection = aql`<`
      let hasPreviousPageDirection = aql`>`
      if (orderBy.direction === 'ASC') {
        hasNextPageDirection = aql`>`
        hasPreviousPageDirection = aql`<`
      }

      let orgField = aql``
      let hasNextPageDocumentField = aql``
      let hasPreviousPageDocumentField = aql``
      /* istanbul ignore else */
      if (orderBy.field === 'acronym') {
        orgField = aql`TRANSLATE(${language}, org.organization.orgDetails).acronym`
        hasNextPageDocumentField = aql`LAST(retrievedOrgs).acronym`
        hasPreviousPageDocumentField = aql`FIRST(retrievedOrgs).acronym`
      } else if (orderBy.field === 'name') {
        orgField = aql`TRANSLATE(${language}, org.organization.orgDetails).name`
        hasNextPageDocumentField = aql`LAST(retrievedOrgs).name`
        hasPreviousPageDocumentField = aql`FIRST(retrievedOrgs).name`
      }

      hasNextPageFilter = aql`
        FILTER ${orgField} ${hasNextPageDirection} ${hasNextPageDocumentField}
        OR (${orgField} == ${hasNextPageDocumentField}
        AND TO_NUMBER(org._key) > TO_NUMBER(LAST(retrievedOrgs)._key))
      `
      hasPreviousPageFilter = aql`
        FILTER ${orgField} ${hasPreviousPageDirection} ${hasPreviousPageDocumentField}
        OR (${orgField} == ${hasPreviousPageDocumentField}
        AND TO_NUMBER(org._key) < TO_NUMBER(FIRST(retrievedOrgs)._key))
      `
    }

    let sortByField = aql``
    if (typeof orderBy !== 'undefined') {
      /* istanbul ignore else */
      if (orderBy.field === 'acronym') {
        sortByField = aql`TRANSLATE(${language}, org.organization.orgDetails).acronym ${orderBy.direction},`
      } else if (orderBy.field === 'name') {
        sortByField = aql`TRANSLATE(${language}, org.organization.orgDetails).name ${orderBy.direction},`
      }
    }

    let sortString
    if (typeof last !== 'undefined') {
      sortString = aql`DESC`
    } else {
      sortString = aql`ASC`
    }

    let orgKeysQuery
    if (isSuperAdmin) {
      orgKeysQuery = aql`
        WITH claims, domains, organizations, organizationSearch
        LET orgKeys = (
          FOR org IN organizations
          RETURN org._key
        )
      `
    } else if (isAdmin) {
      orgKeysQuery = aql`
        WITH affiliations, claims, domains, organizations, organizationSearch, users
        LET orgKeys = (
          FOR org, e IN 1..1
          INBOUND ${userDBId} affiliations
          FILTER e.permission == "admin"
          OR e.permission == "super_admin"
          RETURN org._key
        )
      `
    } else {
      // TODO remove after dev
      orgKeysQuery = aql`
        WITH claims, domains, organizations, organizationSearch
        LET orgKeys = (
          FOR org IN organizations
          RETURN org._key
        )
      `
    }

    let orgQuery = aql``
    let filterString = aql`FILTER org._key IN orgKeys`
    if (typeof search !== 'undefined' && search !== '') {
      search = cleanseInput(search)
      orgQuery = aql`
        LET tokenArrEN = TOKENS(${search}, "text_en")
        LET searchedOrgsEN = FLATTEN(UNIQUE(
          FOR token IN tokenArrEN
            FOR org IN organizationSearch
              SEARCH ANALYZER(
                  org.orgDetails.en.acronym LIKE CONCAT("%", token, "%")
                  OR org.orgDetails.en.name LIKE CONCAT("%", token, "%")
              , "text_en")
              FILTER org._key IN orgKeys
              RETURN org._key
        ))
        LET tokenArrFR = TOKENS(${search}, "text_fr")
        LET searchedOrgsFR = FLATTEN(UNIQUE(
          FOR token IN tokenArrFR
          FOR org IN organizationSearch
            SEARCH ANALYZER(
                org.orgDetails.fr.acronym LIKE CONCAT("%", token, "%")
                OR org.orgDetails.fr.name LIKE CONCAT("%", token, "%")
            , "text_fr")
            FILTER org._key IN orgKeys
            RETURN org._key
        ))
        LET searchedOrgs = UNION_DISTINCT(searchedOrgsEN, searchedOrgsFR)
      `
      filterString = aql`FILTER org._key IN searchedOrgs`
    }

    let requestedOrgsInfo
    try {
      requestedOrgsInfo = await query`
      ${orgKeysQuery}
      ${orgQuery}

      ${afterVar}
      ${beforeVar}

      LET allOrgs = (
        FOR org in organizations
            ${filterString}
            LET domainKeys = (
                    FOR v, e IN 1..1 OUTBOUND org._id claims
                      OPTIONS {bfs: true}
                      RETURN v._key
                 )
            LET vulnDomains = (
                FOR d in domains
                    FILTER d._key in domainKeys
                    FILTER LENGTH(d.tags) > 0
                    RETURN MERGE(
                      { id: d._key },
                      d
                    )
                )
            RETURN { organization: org, domains: { edges: vulnDomains, totalCount: LENGTH(vulnDomains) } }
        )

      LET vulnOrgs = (
        FOR org in allOrgs
          FILTER org.domains.totalCount > 0
          RETURN org
      )

      LET retrievedOrgs = (
          FOR org in vulnOrgs
              ${afterTemplate}
              ${beforeTemplate}
              SORT
              ${sortByField}
              ${limitTemplate}
              RETURN MERGE(
                {
                  _id: org.organization._id,
                  _key: org.organization._key,
                  _rev: org.organization._rev,
                  _type: "organization",
                  id: org.organization._key,
                  verified: org.organization.verified,
                  domains: org.domains
                },
                TRANSLATE(${language}, org.organization.orgDetails)
              )
        )

      LET hasNextPage = (LENGTH(
        FOR org IN vulnOrgs
          ${hasNextPageFilter}
          SORT ${sortByField} TO_NUMBER(org._key) ${sortString} LIMIT 1
          RETURN org
      ) > 0 ? true : false)

      LET hasPreviousPage = (LENGTH(
        FOR org IN vulnOrgs
          ${hasPreviousPageFilter}
          SORT ${sortByField} TO_NUMBER(org._key) ${sortString} LIMIT 1
          RETURN org
      ) > 0 ? true : false)

      RETURN {
        "retrievedOrgs": retrievedOrgs,
        "totalCount": LENGTH(vulnOrgs),
        "hasNextPage": hasNextPage,
        "hasPreviousPage": hasPreviousPage,
        "startKey": FIRST(retrievedOrgs)._key,
        "endKey": LAST(retrievedOrgs)._key
      }
    `
    } catch (err) {
      console.error(
        `Database error occurred while user: ${userKey} was trying to gather tagged organizations in loadWebCheckConnectionsByUserId, error: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to load organizations(s). Please try again.`),
      )
    }

    let orgsInfo
    try {
      orgsInfo = await requestedOrgsInfo.next()
    } catch (err) {
      console.error(
        `Cursor error occurred while user: ${userKey} was trying to gather tagged organizations in loadWebCheckConnectionsByUserId, error: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to load organizations(s). Please try again.`),
      )
    }

    if (orgsInfo.retrievedOrgs.length === 0) {
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

    const edges = orgsInfo.retrievedOrgs.map((org) => {
      return {
        cursor: toGlobalId('organization', org._key),
        node: org,
      }
    })

    return {
      edges,
      totalCount: orgsInfo.totalCount,
      pageInfo: {
        hasNextPage: orgsInfo.hasNextPage,
        hasPreviousPage: orgsInfo.hasPreviousPage,
        startCursor: toGlobalId('organization', orgsInfo.startKey),
        endCursor: toGlobalId('organization', orgsInfo.endKey),
      },
    }
  }
