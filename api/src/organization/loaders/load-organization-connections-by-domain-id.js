import { aql } from 'arangojs'
import { fromGlobalId, toGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

export const loadOrgConnectionsByDomainId =
  ({ query, language, userKey, cleanseInput, i18n, auth: { loginRequiredBool } }) =>
  async ({ domainId, after, before, first, last, orderBy, search, isSuperAdmin, isAdmin, includeSuperAdminOrg }) => {
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

        afterVar = aql`LET afterVar = DOCUMENT(organizations, ${afterId})`

        let documentField = aql``
        let orgField = aql``
        /* istanbul ignore else */
        if (orderBy.field === 'acronym') {
          documentField = aql`TRANSLATE(${language}, afterVar.orgDetails).acronym`
          orgField = aql`TRANSLATE(${language}, org.orgDetails).acronym`
        } else if (orderBy.field === 'name') {
          documentField = aql`TRANSLATE(${language}, afterVar.orgDetails).name`
          orgField = aql`TRANSLATE(${language}, org.orgDetails).name`
        } else if (orderBy.field === 'slug') {
          documentField = aql`TRANSLATE(${language}, afterVar.orgDetails).slug`
          orgField = aql`TRANSLATE(${language}, org.orgDetails).slug`
        } else if (orderBy.field === 'zone') {
          documentField = aql`TRANSLATE(${language}, afterVar.orgDetails).zone`
          orgField = aql`TRANSLATE(${language}, org.orgDetails).zone`
        } else if (orderBy.field === 'sector') {
          documentField = aql`TRANSLATE(${language}, afterVar.orgDetails).sector`
          orgField = aql`TRANSLATE(${language}, org.orgDetails).sector`
        } else if (orderBy.field === 'country') {
          documentField = aql`TRANSLATE(${language}, afterVar.orgDetails).country`
          orgField = aql`TRANSLATE(${language}, org.orgDetails).country`
        } else if (orderBy.field === 'province') {
          documentField = aql`TRANSLATE(${language}, afterVar.orgDetails).province`
          orgField = aql`TRANSLATE(${language}, org.orgDetails).province`
        } else if (orderBy.field === 'city') {
          documentField = aql`TRANSLATE(${language}, afterVar.orgDetails).city`
          orgField = aql`TRANSLATE(${language}, org.orgDetails).city`
        } else if (orderBy.field === 'verified') {
          documentField = aql`afterVar.verified`
          orgField = aql`org.verified`
        } else if (orderBy.field === 'summary-mail-pass') {
          documentField = aql`afterVar.summaries.mail.pass`
          orgField = aql`org.summaries.mail.pass`
        } else if (orderBy.field === 'summary-mail-fail') {
          documentField = aql`afterVar.summaries.mail.fail`
          orgField = aql`org.summaries.mail.fail`
        } else if (orderBy.field === 'summary-mail-total') {
          documentField = aql`afterVar.summaries.mail.total`
          orgField = aql`org.summaries.mail.total`
        } else if (orderBy.field === 'summary-web-pass') {
          documentField = aql`afterVar.summaries.web.pass`
          orgField = aql`org.summaries.web.pass`
        } else if (orderBy.field === 'summary-web-fail') {
          documentField = aql`afterVar.summaries.web.fail`
          orgField = aql`org.summaries.web.fail`
        } else if (orderBy.field === 'summary-web-total') {
          documentField = aql`afterVar.summaries.web.total`
          orgField = aql`org.summaries.web.total`
        } else if (orderBy.field === 'domain-count') {
          documentField = aql`COUNT(FOR v, e IN 1..1 OUTBOUND afterVar._id claims RETURN e._to)`
          orgField = aql`COUNT(orgDomains)`
        }

        afterTemplate = aql`
          FILTER ${orgField} ${afterTemplateDirection} ${documentField}
          OR (${orgField} == ${documentField}
          AND TO_NUMBER(org._key) > TO_NUMBER(${afterId}))
        `
      }
    }

    let beforeVar = aql``
    let beforeTemplate = aql``
    if (typeof before !== 'undefined') {
      const { id: beforeId } = fromGlobalId(cleanseInput(before))
      if (typeof orderBy === 'undefined') {
        beforeTemplate = aql`FILTER TO_NUMBER(org._key) < TO_NUMBER(${beforeId})`
      } else {
        let beforeTemplateDirection = aql`>`
        if (orderBy.direction === 'ASC') {
          beforeTemplateDirection = aql`<`
        }

        beforeVar = aql`LET beforeVar = DOCUMENT(organizations, ${beforeId})`

        let documentField = aql``
        let orgField = aql``
        /* istanbul ignore else */
        if (orderBy.field === 'acronym') {
          documentField = aql`TRANSLATE(${language}, beforeVar.orgDetails).acronym`
          orgField = aql`TRANSLATE(${language}, org.orgDetails).acronym`
        } else if (orderBy.field === 'name') {
          documentField = aql`TRANSLATE(${language}, beforeVar.orgDetails).name`
          orgField = aql`TRANSLATE(${language}, org.orgDetails).name`
        } else if (orderBy.field === 'slug') {
          documentField = aql`TRANSLATE(${language}, beforeVar.orgDetails).slug`
          orgField = aql`TRANSLATE(${language}, org.orgDetails).slug`
        } else if (orderBy.field === 'zone') {
          documentField = aql`TRANSLATE(${language}, beforeVar.orgDetails).zone`
          orgField = aql`TRANSLATE(${language}, org.orgDetails).zone`
        } else if (orderBy.field === 'sector') {
          documentField = aql`TRANSLATE(${language}, beforeVar.orgDetails).sector`
          orgField = aql`TRANSLATE(${language}, org.orgDetails).sector`
        } else if (orderBy.field === 'country') {
          documentField = aql`TRANSLATE(${language}, beforeVar.orgDetails).country`
          orgField = aql`TRANSLATE(${language}, org.orgDetails).country`
        } else if (orderBy.field === 'province') {
          documentField = aql`TRANSLATE(${language}, beforeVar.orgDetails).province`
          orgField = aql`TRANSLATE(${language}, org.orgDetails).province`
        } else if (orderBy.field === 'city') {
          documentField = aql`TRANSLATE(${language}, beforeVar.orgDetails).city`
          orgField = aql`TRANSLATE(${language}, org.orgDetails).city`
        } else if (orderBy.field === 'verified') {
          documentField = aql`beforeVar.verified`
          orgField = aql`org.verified`
        } else if (orderBy.field === 'summary-mail-pass') {
          documentField = aql`beforeVar.summaries.mail.pass`
          orgField = aql`org.summaries.mail.pass`
        } else if (orderBy.field === 'summary-mail-fail') {
          documentField = aql`beforeVar.summaries.mail.fail`
          orgField = aql`org.summaries.mail.fail`
        } else if (orderBy.field === 'summary-mail-total') {
          documentField = aql`beforeVar.summaries.mail.total`
          orgField = aql`org.summaries.mail.total`
        } else if (orderBy.field === 'summary-web-pass') {
          documentField = aql`beforeVar.summaries.web.pass`
          orgField = aql`org.summaries.web.pass`
        } else if (orderBy.field === 'summary-web-fail') {
          documentField = aql`beforeVar.summaries.web.fail`
          orgField = aql`org.summaries.web.fail`
        } else if (orderBy.field === 'summary-web-total') {
          documentField = aql`beforeVar.summaries.web.total`
          orgField = aql`org.summaries.web.total`
        } else if (orderBy.field === 'domain-count') {
          documentField = aql`COUNT(FOR v, e IN 1..1 OUTBOUND beforeVar._id claims RETURN e._to)`
          orgField = aql`COUNT(orgDomains)`
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
        `User: ${userKey} did not have either \`first\` or \`last\` arguments set for: loadOrgConnectionsByDomainId.`,
      )
      throw new Error(
        i18n._(t`You must provide a \`first\` or \`last\` value to properly paginate the \`Organization\` connection.`),
      )
    } else if (typeof first !== 'undefined' && typeof last !== 'undefined') {
      console.warn(
        `User: ${userKey} attempted to have \`first\` and \`last\` arguments set for: loadOrgConnectionsByDomainId.`,
      )
      throw new Error(
        i18n._(t`Passing both \`first\` and \`last\` to paginate the \`Organization\` connection is not supported.`),
      )
    } else if (typeof first === 'number' || typeof last === 'number') {
      /* istanbul ignore else */
      if (first < 0 || last < 0) {
        const argSet = typeof first !== 'undefined' ? 'first' : 'last'
        console.warn(
          `User: ${userKey} attempted to have \`${argSet}\` set below zero for: loadOrgConnectionsByDomainId.`,
        )
        throw new Error(i18n._(t`\`${argSet}\` on the \`Organization\` connection cannot be less than zero.`))
      } else if (first > 100 || last > 100) {
        const argSet = typeof first !== 'undefined' ? 'first' : 'last'
        const amount = typeof first !== 'undefined' ? first : last
        console.warn(`User: ${userKey} attempted to have \`${argSet}\` to ${amount} for: loadOrgConnectionsByDomainId.`)
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
        `User: ${userKey} attempted to have \`${argSet}\` set as a ${typeSet} for: loadOrgConnectionsByDomainId.`,
      )
      throw new Error(i18n._(t`\`${argSet}\` must be of type \`number\` not \`${typeSet}\`.`))
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
        orgField = aql`TRANSLATE(${language}, org.orgDetails).acronym`
        hasNextPageDocumentField = aql`LAST(retrievedOrgs).acronym`
        hasPreviousPageDocumentField = aql`FIRST(retrievedOrgs).acronym`
      } else if (orderBy.field === 'name') {
        orgField = aql`TRANSLATE(${language}, org.orgDetails).name`
        hasNextPageDocumentField = aql`LAST(retrievedOrgs).name`
        hasPreviousPageDocumentField = aql`FIRST(retrievedOrgs).name`
      } else if (orderBy.field === 'slug') {
        orgField = aql`TRANSLATE(${language}, org.orgDetails).slug`
        hasNextPageDocumentField = aql`LAST(retrievedOrgs).slug`
        hasPreviousPageDocumentField = aql`FIRST(retrievedOrgs).slug`
      } else if (orderBy.field === 'zone') {
        orgField = aql`TRANSLATE(${language}, org.orgDetails).zone`
        hasNextPageDocumentField = aql`LAST(retrievedOrgs).zone`
        hasPreviousPageDocumentField = aql`FIRST(retrievedOrgs).zone`
      } else if (orderBy.field === 'sector') {
        orgField = aql`TRANSLATE(${language}, org.orgDetails).sector`
        hasNextPageDocumentField = aql`LAST(retrievedOrgs).sector`
        hasPreviousPageDocumentField = aql`FIRST(retrievedOrgs).sector`
      } else if (orderBy.field === 'country') {
        orgField = aql`TRANSLATE(${language}, org.orgDetails).country`
        hasNextPageDocumentField = aql`LAST(retrievedOrgs).country`
        hasPreviousPageDocumentField = aql`FIRST(retrievedOrgs).country`
      } else if (orderBy.field === 'province') {
        orgField = aql`TRANSLATE(${language}, org.orgDetails).province`
        hasNextPageDocumentField = aql`LAST(retrievedOrgs).province`
        hasPreviousPageDocumentField = aql`FIRST(retrievedOrgs).province`
      } else if (orderBy.field === 'city') {
        orgField = aql`TRANSLATE(${language}, org.orgDetails).city`
        hasNextPageDocumentField = aql`LAST(retrievedOrgs).city`
        hasPreviousPageDocumentField = aql`FIRST(retrievedOrgs).city`
      } else if (orderBy.field === 'verified') {
        orgField = aql`org.verified`
        hasNextPageDocumentField = aql`LAST(retrievedOrgs).verified`
        hasPreviousPageDocumentField = aql`FIRST(retrievedOrgs).verified`
      } else if (orderBy.field === 'summary-mail-pass') {
        orgField = aql`org.summaries.mail.pass`
        hasNextPageDocumentField = aql`LAST(retrievedOrgs).summaries.mail.pass`
        hasPreviousPageDocumentField = aql`FIRST(retrievedOrgs).summaries.mail.pass`
      } else if (orderBy.field === 'summary-mail-fail') {
        orgField = aql`org.summaries.mail.fail`
        hasNextPageDocumentField = aql`LAST(retrievedOrgs).summaries.mail.fail`
        hasPreviousPageDocumentField = aql`FIRST(retrievedOrgs).summaries.mail.fail`
      } else if (orderBy.field === 'summary-mail-total') {
        orgField = aql`org.summaries.mail.total`
        hasNextPageDocumentField = aql`LAST(retrievedOrgs).summaries.mail.total`
        hasPreviousPageDocumentField = aql`FIRST(retrievedOrgs).summaries.mail.total`
      } else if (orderBy.field === 'summary-web-pass') {
        orgField = aql`org.summaries.web.pass`
        hasNextPageDocumentField = aql`LAST(retrievedOrgs).summaries.web.pass`
        hasPreviousPageDocumentField = aql`FIRST(retrievedOrgs).summaries.web.pass`
      } else if (orderBy.field === 'summary-web-fail') {
        orgField = aql`org.summaries.web.fail`
        hasNextPageDocumentField = aql`LAST(retrievedOrgs).summaries.web.fail`
        hasPreviousPageDocumentField = aql`FIRST(retrievedOrgs).summaries.web.fail`
      } else if (orderBy.field === 'summary-web-total') {
        orgField = aql`org.summaries.web.total`
        hasNextPageDocumentField = aql`LAST(retrievedOrgs).summaries.web.total`
        hasPreviousPageDocumentField = aql`FIRST(retrievedOrgs).summaries.web.total`
      } else if (orderBy.field === 'domain-count') {
        orgField = aql`COUNT(orgDomains)`
        hasNextPageDocumentField = aql`COUNT(FOR v, e IN 1..1 OUTBOUND LAST(retrievedOrgs)._id claims RETURN e._to)`
        hasPreviousPageDocumentField = aql`COUNT(FOR v, e IN 1..1 OUTBOUND FIRST(retrievedOrgs)._id claims RETURN e._to)`
      }

      hasNextPageFilter = aql`
        FILTER ${orgField} ${hasNextPageDirection} ${hasNextPageDocumentField}
        OR (${orgField} == ${hasNextPageDocumentField}
        AND TO_NUMBER(org._key) > TO_NUMBER(FIRST(retrievedOrgs)._key))
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
        sortByField = aql`TRANSLATE(${language}, org.orgDetails).acronym ${orderBy.direction},`
      } else if (orderBy.field === 'name') {
        sortByField = aql`TRANSLATE(${language}, org.orgDetails).name ${orderBy.direction},`
      } else if (orderBy.field === 'slug') {
        sortByField = aql`TRANSLATE(${language}, org.orgDetails).slug ${orderBy.direction},`
      } else if (orderBy.field === 'zone') {
        sortByField = aql`TRANSLATE(${language}, org.orgDetails).zone ${orderBy.direction},`
      } else if (orderBy.field === 'sector') {
        sortByField = aql`TRANSLATE(${language}, org.orgDetails).sector ${orderBy.direction},`
      } else if (orderBy.field === 'country') {
        sortByField = aql`TRANSLATE(${language}, org.orgDetails).country ${orderBy.direction},`
      } else if (orderBy.field === 'province') {
        sortByField = aql`TRANSLATE(${language}, org.orgDetails).province ${orderBy.direction},`
      } else if (orderBy.field === 'city') {
        sortByField = aql`TRANSLATE(${language}, org.orgDetails).city ${orderBy.direction},`
      } else if (orderBy.field === 'verified') {
        sortByField = aql`org.verified ${orderBy.direction},`
      } else if (orderBy.field === 'summary-mail-pass') {
        sortByField = aql`org.summaries.mail.pass ${orderBy.direction},`
      } else if (orderBy.field === 'summary-mail-fail') {
        sortByField = aql`org.summaries.mail.fail ${orderBy.direction},`
      } else if (orderBy.field === 'summary-mail-total') {
        sortByField = aql`org.summaries.mail.total ${orderBy.direction},`
      } else if (orderBy.field === 'summary-web-pass') {
        sortByField = aql`org.summaries.web.pass ${orderBy.direction},`
      } else if (orderBy.field === 'summary-web-fail') {
        sortByField = aql`org.summaries.web.fail ${orderBy.direction},`
      } else if (orderBy.field === 'summary-web-total') {
        sortByField = aql`org.summaries.web.total ${orderBy.direction},`
      } else if (orderBy.field === 'domain-count') {
        sortByField = aql`COUNT(orgDomains) ${orderBy.direction},`
      }
    }

    let sortString
    if (typeof last !== 'undefined') {
      sortString = aql`DESC`
    } else {
      sortString = aql`ASC`
    }

    let includeSuperAdminOrgQuery = aql``
    if (!includeSuperAdminOrg) {
      includeSuperAdminOrgQuery = aql`FILTER org.orgDetails.en.slug != "super-admin" OR org.orgDetails.fr.slug != "super-admin"`
    }

    let orgKeysQuery
    if (!loginRequiredBool) {
      orgKeysQuery = aql`
        WITH affiliations, claims, domains, organizations, organizationSearch, users
        LET keys = (
          FOR org IN organizations
            ${includeSuperAdminOrg && isSuperAdmin ? aql`` : includeSuperAdminOrgQuery}
            RETURN org._key
        )
        LET claimKeys = (FOR v, e IN 1..1 INBOUND ${domainId} claims RETURN v._key)
        LET orgKeys = INTERSECTION(keys, claimKeys)
      `
    } else if (isSuperAdmin) {
      orgKeysQuery = aql`
        WITH affiliations, claims, domains, organizations, organizationSearch, users
        LET keys = (
          FOR org IN organizations
          ${includeSuperAdminOrgQuery}
          RETURN org._key
        )
        LET claimKeys = (FOR v, e IN 1..1 INBOUND ${domainId} claims RETURN v._key)
        LET orgKeys = INTERSECTION(keys, claimKeys)
      `
    } else if (isAdmin) {
      orgKeysQuery = aql`
        WITH affiliations, claims, domains, organizations, organizationSearch, users
        LET keys = (
          FOR org, e IN 1..1
          INBOUND ${userDBId} affiliations
          FILTER e.permission IN ["admin", "owner", "super_admin"]
          ${includeSuperAdminOrgQuery}
          RETURN org._key
        )
        LET claimKeys = (FOR v, e IN 1..1 INBOUND ${domainId} claims RETURN v._key)
        LET orgKeys = INTERSECTION(keys, claimKeys)
      `
    } else {
      orgKeysQuery = aql`
        WITH affiliations, claims, domains, organizations, organizationSearch, users
        LET keys = (
          FOR org, e IN 1..1
          INBOUND ${userDBId} affiliations
          ${includeSuperAdminOrgQuery}
          RETURN org._key
        )
        LET claimKeys = (FOR v, e IN 1..1 INBOUND ${domainId} claims RETURN v._key)
        LET orgKeys = INTERSECTION(keys, claimKeys)
      `
    }

    let orgQuery = aql``
    let filterString = aql`FILTER org._key IN orgKeys`
    let totalCount = aql`LENGTH(orgKeys)`
    if (typeof search !== 'undefined' && search !== '') {
      search = cleanseInput(search)
      orgQuery = aql`
        LET tokenArrEN = TOKENS(${search}, "text_en")
        LET searchedOrgsKeysCountEN = FLATTEN(
          FOR token IN tokenArrEN
            FOR org IN organizationSearch
              SEARCH ANALYZER(
                  org.orgDetails.en.acronym LIKE CONCAT("%", token, "%")
                  OR org.orgDetails.en.name LIKE CONCAT("%", token, "%")
              , "text_en")
              FILTER org._key IN orgKeys
              COLLECT orgKey = org._key WITH COUNT INTO orgCount
              RETURN {
                'orgKey': orgKey,
                'orgCount': orgCount
              }
        )
        LET searchedOrgsEN = searchedOrgsKeysCountEN[* FILTER CURRENT.orgCount == LENGTH(tokenArrEN)].orgKey
        LET tokenArrFR = TOKENS(${search}, "text_fr")
        LET searchedOrgsKeysCountFR = FLATTEN(
          FOR token IN tokenArrFR
          FOR org IN organizationSearch
            SEARCH ANALYZER(
                org.orgDetails.fr.acronym LIKE CONCAT("%", token, "%")
                OR org.orgDetails.fr.name LIKE CONCAT("%", token, "%")
            , "text_fr")
            FILTER org._key IN orgKeys
            COLLECT orgKey = org._key WITH COUNT INTO orgCount
            RETURN {
              'orgKey': orgKey,
              'orgCount': orgCount
            }
        )
        LET searchedOrgsFR = searchedOrgsKeysCountFR[* FILTER CURRENT.orgCount == LENGTH(tokenArrFR)].orgKey
        LET searchedOrgs = UNION_DISTINCT(searchedOrgsEN, searchedOrgsFR)
      `
      filterString = aql`FILTER org._key IN searchedOrgs`
      totalCount = aql`LENGTH(searchedOrgs)`
    }

    let organizationInfoCursor
    try {
      organizationInfoCursor = await query`
        ${orgKeysQuery}

        ${orgQuery}

        ${afterVar}
        ${beforeVar}

        LET retrievedOrgs = (
          FOR org IN organizations
            ${filterString}
            LET orgDomains = (FOR v, e IN 1..1 OUTBOUND org._id claims RETURN e._to)
            ${afterTemplate}
            ${beforeTemplate}
            SORT
            ${sortByField}
            ${limitTemplate}
            RETURN MERGE(
              {
                _id: org._id,
                _key: org._key,
                _rev: org._rev,
                _type: "organization",
                id: org._key,
                verified: org.verified,
                externalId: org.externalId,
                domainCount: COUNT(orgDomains),
                summaries: org.summaries
              },
              TRANSLATE(${language}, org.orgDetails)
            )
        )

        LET hasNextPage = (LENGTH(
          FOR org IN organizations
            ${filterString}
            LET orgDomains = (FOR v, e IN 1..1 OUTBOUND org._id claims RETURN e._to)
            ${hasNextPageFilter}
            SORT ${sortByField} TO_NUMBER(org._key) ${sortString} LIMIT 1
            RETURN org
        ) > 0 ? true : false)

        LET hasPreviousPage = (LENGTH(
          FOR org IN organizations
            ${filterString}
            LET orgDomains = (FOR v, e IN 1..1 OUTBOUND org._id claims RETURN e._to)
            ${hasPreviousPageFilter}
            SORT ${sortByField} TO_NUMBER(org._key) ${sortString} LIMIT 1
            RETURN org
        ) > 0 ? true : false)

        RETURN {
          "organizations": retrievedOrgs,
          "totalCount": ${totalCount},
          "hasNextPage": hasNextPage,
          "hasPreviousPage": hasPreviousPage,
          "startKey": FIRST(retrievedOrgs)._key,
          "endKey": LAST(retrievedOrgs)._key
        }
      `
    } catch (err) {
      console.error(
        `Database error occurred while user: ${userKey} was trying to gather orgs in loadOrgConnectionsByDomainId, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to load organization(s). Please try again.`))
    }

    let organizationInfo
    try {
      organizationInfo = await organizationInfoCursor.next()
    } catch (err) {
      console.error(
        `Cursor error occurred while user: ${userKey} was trying to gather orgs in loadOrgConnectionsByDomainId, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to load organization(s). Please try again.`))
    }

    if (organizationInfo.organizations.length === 0) {
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

    const edges = organizationInfo.organizations.map((organization) => {
      return {
        cursor: toGlobalId('organization', organization._key),
        node: organization,
      }
    })

    return {
      edges,
      totalCount: organizationInfo.totalCount,
      pageInfo: {
        hasNextPage: organizationInfo.hasNextPage,
        hasPreviousPage: organizationInfo.hasPreviousPage,
        startCursor: toGlobalId('organization', organizationInfo.startKey),
        endCursor: toGlobalId('organization', organizationInfo.endKey),
      },
    }
  }
