import { aql } from 'arangojs'
import { fromGlobalId, toGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

export const loadVerifiedOrgConnectionsByDomainId =
  ({ query, language, cleanseInput, i18n }) =>
  async ({ domainId, after, before, first, last, orderBy }) => {
    let afterTemplate = aql``
    if (typeof after !== 'undefined') {
      const { id: afterId } = fromGlobalId(cleanseInput(after))
      if (typeof orderBy === 'undefined') {
        afterTemplate = aql`FILTER TO_NUMBER(org._key) > TO_NUMBER(${afterId})`
      } else {
        let afterTemplateDirection = aql``
        if (orderBy.direction === 'ASC') {
          afterTemplateDirection = aql`>`
        } else {
          afterTemplateDirection = aql`<`
        }

        let documentField = aql``
        let orgField = aql``
        /* istanbul ignore else */
        if (orderBy.field === 'acronym') {
          documentField = aql`TRANSLATE(${language}, DOCUMENT(organizations, ${afterId}).orgDetails).acronym`
          orgField = aql`TRANSLATE(${language}, org.orgDetails).acronym`
        } else if (orderBy.field === 'name') {
          documentField = aql`TRANSLATE(${language}, DOCUMENT(organizations, ${afterId}).orgDetails).name`
          orgField = aql`TRANSLATE(${language}, org.orgDetails).name`
        } else if (orderBy.field === 'slug') {
          documentField = aql`TRANSLATE(${language}, DOCUMENT(organizations, ${afterId}).orgDetails).slug`
          orgField = aql`TRANSLATE(${language}, org.orgDetails).slug`
        } else if (orderBy.field === 'zone') {
          documentField = aql`TRANSLATE(${language}, DOCUMENT(organizations, ${afterId}).orgDetails).zone`
          orgField = aql`TRANSLATE(${language}, org.orgDetails).zone`
        } else if (orderBy.field === 'sector') {
          documentField = aql`TRANSLATE(${language}, DOCUMENT(organizations, ${afterId}).orgDetails).sector`
          orgField = aql`TRANSLATE(${language}, org.orgDetails).sector`
        } else if (orderBy.field === 'country') {
          documentField = aql`TRANSLATE(${language}, DOCUMENT(organizations, ${afterId}).orgDetails).country`
          orgField = aql`TRANSLATE(${language}, org.orgDetails).country`
        } else if (orderBy.field === 'province') {
          documentField = aql`TRANSLATE(${language}, DOCUMENT(organizations, ${afterId}).orgDetails).province`
          orgField = aql`TRANSLATE(${language}, org.orgDetails).province`
        } else if (orderBy.field === 'city') {
          documentField = aql`TRANSLATE(${language}, DOCUMENT(organizations, ${afterId}).orgDetails).city`
          orgField = aql`TRANSLATE(${language}, org.orgDetails).city`
        } else if (orderBy.field === 'verified') {
          documentField = aql`DOCUMENT(organizations, ${afterId}).verified`
          orgField = aql`org.verified`
        } else if (orderBy.field === 'summary-mail-pass') {
          documentField = aql`DOCUMENT(organizations, ${afterId}).summaries.mail.pass`
          orgField = aql`org.summaries.mail.pass`
        } else if (orderBy.field === 'summary-mail-fail') {
          documentField = aql`DOCUMENT(organizations, ${afterId}).summaries.mail.fail`
          orgField = aql`org.summaries.mail.fail`
        } else if (orderBy.field === 'summary-mail-total') {
          documentField = aql`DOCUMENT(organizations, ${afterId}).summaries.mail.total`
          orgField = aql`org.summaries.mail.total`
        } else if (orderBy.field === 'summary-web-pass') {
          documentField = aql`DOCUMENT(organizations, ${afterId}).summaries.web.pass`
          orgField = aql`org.summaries.web.pass`
        } else if (orderBy.field === 'summary-web-fail') {
          documentField = aql`DOCUMENT(organizations, ${afterId}).summaries.web.fail`
          orgField = aql`org.summaries.web.fail`
        } else if (orderBy.field === 'summary-web-total') {
          documentField = aql`DOCUMENT(organizations, ${afterId}).summaries.web.total`
          orgField = aql`org.summaries.web.total`
        } else if (orderBy.field === 'domain-count') {
          documentField = aql`COUNT(FOR v, e IN 1..1 OUTBOUND DOCUMENT(organizations, ${afterId})._id claims RETURN e._to)`
          orgField = aql`COUNT(orgDomains)`
        }

        afterTemplate = aql`
        FILTER ${orgField} ${afterTemplateDirection} ${documentField}
        OR (${orgField} == ${documentField}
        AND TO_NUMBER(org._key) > TO_NUMBER(${afterId}))
      `
      }
    }

    let beforeTemplate = aql``
    if (typeof before !== 'undefined') {
      const { id: beforeId } = fromGlobalId(cleanseInput(before))
      if (typeof orderBy === 'undefined') {
        beforeTemplate = aql`FILTER TO_NUMBER(org._key) < TO_NUMBER(${beforeId})`
      } else {
        let beforeTemplateDirection = aql``
        if (orderBy.direction === 'ASC') {
          beforeTemplateDirection = aql`<`
        } else {
          beforeTemplateDirection = aql`>`
        }

        let documentField = aql``
        let orgField = aql``
        /* istanbul ignore else */
        if (orderBy.field === 'acronym') {
          documentField = aql`TRANSLATE(${language}, DOCUMENT(organizations, ${beforeId}).orgDetails).acronym`
          orgField = aql`TRANSLATE(${language}, org.orgDetails).acronym`
        } else if (orderBy.field === 'name') {
          documentField = aql`TRANSLATE(${language}, DOCUMENT(organizations, ${beforeId}).orgDetails).name`
          orgField = aql`TRANSLATE(${language}, org.orgDetails).name`
        } else if (orderBy.field === 'slug') {
          documentField = aql`TRANSLATE(${language}, DOCUMENT(organizations, ${beforeId}).orgDetails).slug`
          orgField = aql`TRANSLATE(${language}, org.orgDetails).slug`
        } else if (orderBy.field === 'zone') {
          documentField = aql`TRANSLATE(${language}, DOCUMENT(organizations, ${beforeId}).orgDetails).zone`
          orgField = aql`TRANSLATE(${language}, org.orgDetails).zone`
        } else if (orderBy.field === 'sector') {
          documentField = aql`TRANSLATE(${language}, DOCUMENT(organizations, ${beforeId}).orgDetails).sector`
          orgField = aql`TRANSLATE(${language}, org.orgDetails).sector`
        } else if (orderBy.field === 'country') {
          documentField = aql`TRANSLATE(${language}, DOCUMENT(organizations, ${beforeId}).orgDetails).country`
          orgField = aql`TRANSLATE(${language}, org.orgDetails).country`
        } else if (orderBy.field === 'province') {
          documentField = aql`TRANSLATE(${language}, DOCUMENT(organizations, ${beforeId}).orgDetails).province`
          orgField = aql`TRANSLATE(${language}, org.orgDetails).province`
        } else if (orderBy.field === 'city') {
          documentField = aql`TRANSLATE(${language}, DOCUMENT(organizations, ${beforeId}).orgDetails).city`
          orgField = aql`TRANSLATE(${language}, org.orgDetails).city`
        } else if (orderBy.field === 'verified') {
          documentField = aql`DOCUMENT(organizations, ${beforeId}).verified`
          orgField = aql`org.verified`
        } else if (orderBy.field === 'summary-mail-pass') {
          documentField = aql`DOCUMENT(organizations, ${beforeId}).summaries.mail.pass`
          orgField = aql`org.summaries.mail.pass`
        } else if (orderBy.field === 'summary-mail-fail') {
          documentField = aql`DOCUMENT(organizations, ${beforeId}).summaries.mail.fail`
          orgField = aql`org.summaries.mail.fail`
        } else if (orderBy.field === 'summary-mail-total') {
          documentField = aql`DOCUMENT(organizations, ${beforeId}).summaries.mail.total`
          orgField = aql`org.summaries.mail.total`
        } else if (orderBy.field === 'summary-web-pass') {
          documentField = aql`DOCUMENT(organizations, ${beforeId}).summaries.web.pass`
          orgField = aql`org.summaries.web.pass`
        } else if (orderBy.field === 'summary-web-fail') {
          documentField = aql`DOCUMENT(organizations, ${beforeId}).summaries.web.fail`
          orgField = aql`org.summaries.web.fail`
        } else if (orderBy.field === 'summary-web-total') {
          documentField = aql`DOCUMENT(organizations, ${beforeId}).summaries.web.total`
          orgField = aql`org.summaries.web.total`
        } else if (orderBy.field === 'domain-count') {
          documentField = aql`COUNT(FOR v, e IN 1..1 OUTBOUND DOCUMENT(organizations, ${beforeId})._id claims RETURN e._to)`
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
        `User did not have either \`first\` or \`last\` arguments set for: loadVerifiedOrgConnectionsByDomainId.`,
      )
      throw new Error(
        i18n._(
          t`You must provide a \`first\` or \`last\` value to properly paginate the \`VerifiedOrganization\` connection.`,
        ),
      )
    } else if (typeof first !== 'undefined' && typeof last !== 'undefined') {
      console.warn(
        `User attempted to have \`first\` and \`last\` arguments set for: loadVerifiedOrgConnectionsByDomainId.`,
      )
      throw new Error(
        i18n._(
          t`Passing both \`first\` and \`last\` to paginate the \`VerifiedOrganization\` connection is not supported.`,
        ),
      )
    } else if (typeof first === 'number' || typeof last === 'number') {
      /* istanbul ignore else */
      if (first < 0 || last < 0) {
        const argSet = typeof first !== 'undefined' ? 'first' : 'last'
        console.warn(
          `User attempted to have \`${argSet}\` set below zero for: loadVerifiedOrgConnectionsByDomainId.`,
        )
        throw new Error(
          i18n._(
            t`\`${argSet}\` on the \`VerifiedOrganization\` connection cannot be less than zero.`,
          ),
        )
      } else if (first > 100 || last > 100) {
        const argSet = typeof first !== 'undefined' ? 'first' : 'last'
        const amount = typeof first !== 'undefined' ? first : last
        console.warn(
          `User attempted to have \`${argSet}\` to ${amount} for: loadVerifiedOrgConnectionsByDomainId.`,
        )
        throw new Error(
          i18n._(
            t`Requesting \`${amount}\` records on the \`VerifiedOrganization\` connection exceeds the \`${argSet}\` limit of 100 records.`,
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
        `User attempted to have \`${argSet}\` set as a ${typeSet} for: loadVerifiedOrgConnectionsByDomainId.`,
      )
      throw new Error(
        i18n._(t`\`${argSet}\` must be of type \`number\` not \`${typeSet}\`.`),
      )
    }

    let hasNextPageFilter = aql`FILTER TO_NUMBER(org._key) > TO_NUMBER(LAST(retrievedOrgs)._key)`
    let hasPreviousPageFilter = aql`FILTER TO_NUMBER(org._key) < TO_NUMBER(FIRST(retrievedOrgs)._key)`
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

      let orgField = aql``
      let hasNextPageDocumentField = aql``
      let hasPreviousPageDocumentField = aql``
      /* istanbul ignore else */
      if (orderBy.field === 'acronym') {
        orgField = aql`TRANSLATE(${language}, org.orgDetails).acronym`
        hasNextPageDocumentField = aql`TRANSLATE(${language}, DOCUMENT(organizations, LAST(retrievedOrgs)._key).orgDetails).acronym`
        hasPreviousPageDocumentField = aql`TRANSLATE(${language}, DOCUMENT(organizations, FIRST(retrievedOrgs)._key).orgDetails).acronym`
      } else if (orderBy.field === 'name') {
        orgField = aql`TRANSLATE(${language}, org.orgDetails).name`
        hasNextPageDocumentField = aql`TRANSLATE(${language}, DOCUMENT(organizations, LAST(retrievedOrgs)._key).orgDetails).name`
        hasPreviousPageDocumentField = aql`TRANSLATE(${language}, DOCUMENT(organizations, FIRST(retrievedOrgs)._key).orgDetails).name`
      } else if (orderBy.field === 'slug') {
        orgField = aql`TRANSLATE(${language}, org.orgDetails).slug`
        hasNextPageDocumentField = aql`TRANSLATE(${language}, DOCUMENT(organizations, LAST(retrievedOrgs)._key).orgDetails).slug`
        hasPreviousPageDocumentField = aql`TRANSLATE(${language}, DOCUMENT(organizations, FIRST(retrievedOrgs)._key).orgDetails).slug`
      } else if (orderBy.field === 'zone') {
        orgField = aql`TRANSLATE(${language}, org.orgDetails).zone`
        hasNextPageDocumentField = aql`TRANSLATE(${language}, DOCUMENT(organizations, LAST(retrievedOrgs)._key).orgDetails).zone`
        hasPreviousPageDocumentField = aql`TRANSLATE(${language}, DOCUMENT(organizations, FIRST(retrievedOrgs)._key).orgDetails).zone`
      } else if (orderBy.field === 'sector') {
        orgField = aql`TRANSLATE(${language}, org.orgDetails).sector`
        hasNextPageDocumentField = aql`TRANSLATE(${language}, DOCUMENT(organizations, LAST(retrievedOrgs)._key).orgDetails).sector`
        hasPreviousPageDocumentField = aql`TRANSLATE(${language}, DOCUMENT(organizations, FIRST(retrievedOrgs)._key).orgDetails).sector`
      } else if (orderBy.field === 'country') {
        orgField = aql`TRANSLATE(${language}, org.orgDetails).country`
        hasNextPageDocumentField = aql`TRANSLATE(${language}, DOCUMENT(organizations, LAST(retrievedOrgs)._key).orgDetails).country`
        hasPreviousPageDocumentField = aql`TRANSLATE(${language}, DOCUMENT(organizations, FIRST(retrievedOrgs)._key).orgDetails).country`
      } else if (orderBy.field === 'province') {
        orgField = aql`TRANSLATE(${language}, org.orgDetails).province`
        hasNextPageDocumentField = aql`TRANSLATE(${language}, DOCUMENT(organizations, LAST(retrievedOrgs)._key).orgDetails).province`
        hasPreviousPageDocumentField = aql`TRANSLATE(${language}, DOCUMENT(organizations, FIRST(retrievedOrgs)._key).orgDetails).province`
      } else if (orderBy.field === 'city') {
        orgField = aql`TRANSLATE(${language}, org.orgDetails).city`
        hasNextPageDocumentField = aql`TRANSLATE(${language}, DOCUMENT(organizations, LAST(retrievedOrgs)._key).orgDetails).city`
        hasPreviousPageDocumentField = aql`TRANSLATE(${language}, DOCUMENT(organizations, FIRST(retrievedOrgs)._key).orgDetails).city`
      } else if (orderBy.field === 'verified') {
        orgField = aql`org.verified`
        hasNextPageDocumentField = aql`DOCUMENT(organizations, LAST(retrievedOrgs)._key).verified`
        hasPreviousPageDocumentField = aql`DOCUMENT(organizations, FIRST(retrievedOrgs)._key).verified`
      } else if (orderBy.field === 'summary-mail-pass') {
        orgField = aql`org.summaries.mail.pass`
        hasNextPageDocumentField = aql`DOCUMENT(organizations, LAST(retrievedOrgs)._key).summaries.mail.pass`
        hasPreviousPageDocumentField = aql`DOCUMENT(organizations, FIRST(retrievedOrgs)._key).summaries.mail.pass`
      } else if (orderBy.field === 'summary-mail-fail') {
        orgField = aql`org.summaries.mail.fail`
        hasNextPageDocumentField = aql`DOCUMENT(organizations, LAST(retrievedOrgs)._key).summaries.mail.fail`
        hasPreviousPageDocumentField = aql`DOCUMENT(organizations, FIRST(retrievedOrgs)._key).summaries.mail.fail`
      } else if (orderBy.field === 'summary-mail-total') {
        orgField = aql`org.summaries.mail.total`
        hasNextPageDocumentField = aql`DOCUMENT(organizations, LAST(retrievedOrgs)._key).summaries.mail.total`
        hasPreviousPageDocumentField = aql`DOCUMENT(organizations, FIRST(retrievedOrgs)._key).summaries.mail.total`
      } else if (orderBy.field === 'summary-web-pass') {
        orgField = aql`org.summaries.web.pass`
        hasNextPageDocumentField = aql`DOCUMENT(organizations, LAST(retrievedOrgs)._key).summaries.web.pass`
        hasPreviousPageDocumentField = aql`DOCUMENT(organizations, FIRST(retrievedOrgs)._key).summaries.web.pass`
      } else if (orderBy.field === 'summary-web-fail') {
        orgField = aql`org.summaries.web.fail`
        hasNextPageDocumentField = aql`DOCUMENT(organizations, LAST(retrievedOrgs)._key).summaries.web.fail`
        hasPreviousPageDocumentField = aql`DOCUMENT(organizations, FIRST(retrievedOrgs)._key).summaries.web.fail`
      } else if (orderBy.field === 'summary-web-total') {
        orgField = aql`org.summaries.web.total`
        hasNextPageDocumentField = aql`DOCUMENT(organizations, LAST(retrievedOrgs)._key).summaries.web.total`
        hasPreviousPageDocumentField = aql`DOCUMENT(organizations, FIRST(retrievedOrgs)._key).summaries.web.total`
      } else if (orderBy.field === 'domain-count') {
        orgField = aql`COUNT(domains)`
        hasNextPageDocumentField = aql`COUNT(FOR v, e IN 1..1 OUTBOUND DOCUMENT(organizations, LAST(retrievedOrgs)._key)._id claims RETURN e._to)`
        hasPreviousPageDocumentField = aql`COUNT(FOR v, e IN 1..1 OUTBOUND DOCUMENT(organizations, FIRST(retrievedOrgs)._key)._id claims RETURN e._to)`
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
        sortByField = aql`COUNT(domains) ${orderBy.direction},`
      }
    }

    let sortString = aql``
    if (typeof last !== 'undefined') {
      sortString = aql`DESC`
    } else {
      sortString = aql`ASC`
    }

    let organizationInfoCursor
    try {
      organizationInfoCursor = await query`
      WITH claims, domains, organizations
      LET verifiedOrgs = FLATTEN(
        FOR v, e IN INBOUND ${domainId} claims FILTER v.verified == true RETURN v._key
      )
    
      LET retrievedOrgs = (
        FOR org IN organizations
          FILTER org._key IN verifiedOrgs
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
              id: org._key,
              _rev: org._rev,
              _type: "verifiedOrganization",
              verified: org.verified,
              domainCount: COUNT(orgDomains),
              summaries: org.summaries 
            },
            TRANSLATE(${language}, org.orgDetails)
          )
      )

      LET hasNextPage = (LENGTH(
        FOR org IN organizations
          FILTER org._key IN verifiedOrgs
          LET domains = (FOR v, e IN 1..1 OUTBOUND org._id claims RETURN e._to)
          ${hasNextPageFilter}
          SORT ${sortByField} TO_NUMBER(org._key) ${sortString} LIMIT 1
          RETURN org
      ) > 0 ? true : false)
      
      LET hasPreviousPage = (LENGTH(
        FOR org IN organizations
          FILTER org._key IN verifiedOrgs
          LET domains = (FOR v, e IN 1..1 OUTBOUND org._id claims RETURN e._to)
          ${hasPreviousPageFilter}
          SORT ${sortByField} TO_NUMBER(org._key) ${sortString} LIMIT 1
          RETURN org
      ) > 0 ? true : false)
      
      RETURN { 
        "verifiedOrgs": verifiedOrgs,
        "organizations": retrievedOrgs,
        "totalCount": LENGTH(verifiedOrgs),
        "hasNextPage": hasNextPage, 
        "hasPreviousPage": hasPreviousPage, 
        "startKey": FIRST(retrievedOrgs)._key, 
        "endKey": LAST(retrievedOrgs)._key 
      }
    `
    } catch (err) {
      console.error(
        `Database error occurred while user was trying to gather orgs in loadVerifiedOrgConnectionsByDomainId, error: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to load verified organization(s). Please try again.`),
      )
    }

    let organizationInfo
    try {
      organizationInfo = await organizationInfoCursor.next()
    } catch (err) {
      console.error(
        `Cursor error occurred while user was trying to gather orgs in loadVerifiedOrgConnectionsByDomainId, error: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to load verified organization(s). Please try again.`),
      )
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
        cursor: toGlobalId('verifiedOrganizations', organization._key),
        node: organization,
      }
    })

    return {
      edges,
      totalCount: organizationInfo.totalCount,
      pageInfo: {
        hasNextPage: organizationInfo.hasNextPage,
        hasPreviousPage: organizationInfo.hasPreviousPage,
        startCursor: toGlobalId(
          'verifiedOrganizations',
          organizationInfo.startKey,
        ),
        endCursor: toGlobalId('verifiedOrganizations', organizationInfo.endKey),
      },
    }
  }
