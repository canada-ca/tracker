import { aql } from 'arangojs'
import { fromGlobalId, toGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

export const loadAffiliationConnectionsByUserId =
  ({ query, language, userKey, cleanseInput, i18n }) =>
  async ({ userId, after, before, first, last, orderBy, search }) => {
    let afterTemplate = aql``
    if (typeof after !== 'undefined') {
      const { id: afterId } = fromGlobalId(cleanseInput(after))
      if (typeof orderBy === 'undefined') {
        afterTemplate = aql`FILTER TO_NUMBER(affiliation._key) > TO_NUMBER(${afterId})`
      } else {
        let afterTemplateDirection
        if (orderBy.direction === 'ASC') {
          afterTemplateDirection = aql`>`
        } else {
          afterTemplateDirection = aql`<`
        }

        let affiliationField, documentField
        /* istanbul ignore else */
        if (orderBy.field === 'org-acronym') {
          affiliationField = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).orgDetails).acronym`
          documentField = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(DOCUMENT(affiliations, ${afterId})._from).key).orgDetails).acronym`
        } else if (orderBy.field === 'org-name') {
          affiliationField = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).orgDetails).name`
          documentField = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(DOCUMENT(affiliations, ${afterId})._from).key).orgDetails).name`
        } else if (orderBy.field === 'org-slug') {
          affiliationField = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).orgDetails).slug`
          documentField = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(DOCUMENT(affiliations, ${afterId})._from).key).orgDetails).slug`
        } else if (orderBy.field === 'org-zone') {
          affiliationField = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).orgDetails).zone`
          documentField = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(DOCUMENT(affiliations, ${afterId})._from).key).orgDetails).zone`
        } else if (orderBy.field === 'org-sector') {
          affiliationField = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).orgDetails).sector`
          documentField = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(DOCUMENT(affiliations, ${afterId})._from).key).orgDetails).sector`
        } else if (orderBy.field === 'org-country') {
          affiliationField = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).orgDetails).country`
          documentField = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(DOCUMENT(affiliations, ${afterId})._from).key).orgDetails).country`
        } else if (orderBy.field === 'org-province') {
          affiliationField = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).orgDetails).province`
          documentField = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(DOCUMENT(affiliations, ${afterId})._from).key).orgDetails).province`
        } else if (orderBy.field === 'org-city') {
          affiliationField = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).orgDetails).city`
          documentField = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(DOCUMENT(affiliations, ${afterId})._from).key).orgDetails).city`
        } else if (orderBy.field === 'org-verified') {
          affiliationField = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).verified`
          documentField = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(DOCUMENT(affiliations, ${afterId})._from).key).verified`
        } else if (orderBy.field === 'org-summary-mail-pass') {
          affiliationField = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).summaries.mail.pass`
          documentField = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(DOCUMENT(affiliations, ${afterId})._from).key).summaries.mail.pass`
        } else if (orderBy.field === 'org-summary-mail-fail') {
          affiliationField = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).summaries.mail.fail`
          documentField = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(DOCUMENT(affiliations, ${afterId})._from).key).summaries.mail.fail`
        } else if (orderBy.field === 'org-summary-mail-total') {
          affiliationField = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).summaries.mail.total`
          documentField = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(DOCUMENT(affiliations, ${afterId})._from).key).summaries.mail.total`
        } else if (orderBy.field === 'org-summary-web-pass') {
          affiliationField = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).summaries.web.pass`
          documentField = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(DOCUMENT(affiliations, ${afterId})._from).key).summaries.web.pass`
        } else if (orderBy.field === 'org-summary-web-fail') {
          affiliationField = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).summaries.web.fail`
          documentField = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(DOCUMENT(affiliations, ${afterId})._from).key).summaries.web.fail`
        } else if (orderBy.field === 'org-summary-web-total') {
          affiliationField = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).summaries.web.total`
          documentField = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(DOCUMENT(affiliations, ${afterId})._from).key).summaries.web.total`
        } else if (orderBy.field === 'org-domain-count') {
          affiliationField = aql`COUNT(FOR v, e IN 1..1 ANY DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key)._id claims RETURN e._to)`
          documentField = aql`COUNT(FOR v, e IN 1..1 ANY DOCUMENT(organizations, PARSE_IDENTIFIER(DOCUMENT(affiliations, ${afterId})._from).key)._id claims RETURN e._to)`
        }

        afterTemplate = aql`
        FILTER ${affiliationField} ${afterTemplateDirection} ${documentField}
        OR (${affiliationField} == ${documentField}
        AND TO_NUMBER(affiliation._key) > TO_NUMBER(${afterId}))
      `
      }
    }

    let beforeTemplate = aql``
    if (typeof before !== 'undefined') {
      const { id: beforeId } = fromGlobalId(cleanseInput(before))
      if (typeof orderBy === 'undefined') {
        beforeTemplate = aql`FILTER TO_NUMBER(affiliation._key) < TO_NUMBER(${beforeId})`
      } else {
        let beforeTemplateDirection = aql``
        if (orderBy.direction === 'ASC') {
          beforeTemplateDirection = aql`<`
        } else {
          beforeTemplateDirection = aql`>`
        }

        let affiliationField, documentField
        /* istanbul ignore else */
        if (orderBy.field === 'org-acronym') {
          affiliationField = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).orgDetails).acronym`
          documentField = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(DOCUMENT(affiliations, ${beforeId})._from).key).orgDetails).acronym`
        } else if (orderBy.field === 'org-name') {
          affiliationField = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).orgDetails).name`
          documentField = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(DOCUMENT(affiliations, ${beforeId})._from).key).orgDetails).name`
        } else if (orderBy.field === 'org-slug') {
          affiliationField = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).orgDetails).slug`
          documentField = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(DOCUMENT(affiliations, ${beforeId})._from).key).orgDetails).slug`
        } else if (orderBy.field === 'org-zone') {
          affiliationField = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).orgDetails).zone`
          documentField = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(DOCUMENT(affiliations, ${beforeId})._from).key).orgDetails).zone`
        } else if (orderBy.field === 'org-sector') {
          affiliationField = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).orgDetails).sector`
          documentField = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(DOCUMENT(affiliations, ${beforeId})._from).key).orgDetails).sector`
        } else if (orderBy.field === 'org-country') {
          affiliationField = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).orgDetails).country`
          documentField = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(DOCUMENT(affiliations, ${beforeId})._from).key).orgDetails).country`
        } else if (orderBy.field === 'org-province') {
          affiliationField = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).orgDetails).province`
          documentField = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(DOCUMENT(affiliations, ${beforeId})._from).key).orgDetails).province`
        } else if (orderBy.field === 'org-city') {
          affiliationField = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).orgDetails).city`
          documentField = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(DOCUMENT(affiliations, ${beforeId})._from).key).orgDetails).city`
        } else if (orderBy.field === 'org-verified') {
          affiliationField = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).verified`
          documentField = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(DOCUMENT(affiliations, ${beforeId})._from).key).verified`
        } else if (orderBy.field === 'org-summary-mail-pass') {
          affiliationField = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).summaries.mail.pass`
          documentField = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(DOCUMENT(affiliations, ${beforeId})._from).key).summaries.mail.pass`
        } else if (orderBy.field === 'org-summary-mail-fail') {
          affiliationField = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).summaries.mail.fail`
          documentField = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(DOCUMENT(affiliations, ${beforeId})._from).key).summaries.mail.fail`
        } else if (orderBy.field === 'org-summary-mail-total') {
          affiliationField = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).summaries.mail.total`
          documentField = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(DOCUMENT(affiliations, ${beforeId})._from).key).summaries.mail.total`
        } else if (orderBy.field === 'org-summary-web-pass') {
          affiliationField = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).summaries.web.pass`
          documentField = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(DOCUMENT(affiliations, ${beforeId})._from).key).summaries.web.pass`
        } else if (orderBy.field === 'org-summary-web-fail') {
          affiliationField = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).summaries.web.fail`
          documentField = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(DOCUMENT(affiliations, ${beforeId})._from).key).summaries.web.fail`
        } else if (orderBy.field === 'org-summary-web-total') {
          affiliationField = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).summaries.web.total`
          documentField = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(DOCUMENT(affiliations, ${beforeId})._from).key).summaries.web.total`
        } else if (orderBy.field === 'org-domain-count') {
          affiliationField = aql`COUNT(FOR v, e IN 1..1 ANY DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key)._id claims RETURN e._to)`
          documentField = aql`COUNT(FOR v, e IN 1..1 ANY DOCUMENT(organizations, PARSE_IDENTIFIER(DOCUMENT(affiliations, ${beforeId})._from).key)._id claims RETURN e._to)`
        }

        beforeTemplate = aql`
        FILTER ${affiliationField} ${beforeTemplateDirection} ${documentField}
        OR (${affiliationField} == ${documentField}
        AND TO_NUMBER(affiliation._key) < TO_NUMBER(${beforeId}))
      `
      }
    }

    let limitTemplate = aql``
    if (typeof first === 'undefined' && typeof last === 'undefined') {
      console.warn(
        `User: ${userKey} did not have either \`first\` or \`last\` arguments set for: loadAffiliationConnectionsByUserId.`,
      )
      throw new Error(
        i18n._(
          t`You must provide a \`first\` or \`last\` value to properly paginate the \`affiliation\`.`,
        ),
      )
    } else if (typeof first !== 'undefined' && typeof last !== 'undefined') {
      console.warn(
        `User: ${userKey} attempted to have \`first\` and \`last\` arguments set for: loadAffiliationConnectionsByUserId.`,
      )
      throw new Error(
        i18n._(
          t`Passing both \`first\` and \`last\` to paginate the \`affiliation\` is not supported.`,
        ),
      )
    } else if (typeof first === 'number' || typeof last === 'number') {
      /* istanbul ignore else */
      if (first < 0 || last < 0) {
        const argSet = typeof first !== 'undefined' ? 'first' : 'last'
        console.warn(
          `User: ${userKey} attempted to have \`${argSet}\` set below zero for: loadAffiliationConnectionsByUserId.`,
        )
        throw new Error(
          i18n._(
            t`\`${argSet}\` on the \`affiliations\` cannot be less than zero.`,
          ),
        )
      } else if (first > 100 || last > 100) {
        const argSet = typeof first !== 'undefined' ? 'first' : 'last'
        const amount = typeof first !== 'undefined' ? first : last
        console.warn(
          `User: ${userKey} attempted to have \`${argSet}\` set to ${amount} for: loadAffiliationConnectionsByUserId.`,
        )
        throw new Error(
          i18n._(
            t`Requesting \`${amount}\` records on the \`affiliations\` exceeds the \`${argSet}\` limit of 100 records.`,
          ),
        )
      } else if (typeof first !== 'undefined' && typeof last === 'undefined') {
        limitTemplate = aql`affiliation._key ASC LIMIT TO_NUMBER(${first})`
      } else if (typeof first === 'undefined' && typeof last !== 'undefined') {
        limitTemplate = aql`affiliation._key DESC LIMIT TO_NUMBER(${last})`
      }
    } else {
      const argSet = typeof first !== 'undefined' ? 'first' : 'last'
      const typeSet = typeof first !== 'undefined' ? typeof first : typeof last
      console.warn(
        `User: ${userKey} attempted to have \`${argSet}\` set as a ${typeSet} for: loadAffiliationConnectionsByUserId.`,
      )
      throw new Error(
        i18n._(t`\`${argSet}\` must be of type \`number\` not \`${typeSet}\`.`),
      )
    }

    let hasNextPageFilter = aql`FILTER TO_NUMBER(affiliation._key) > TO_NUMBER(LAST(retrievedAffiliations)._key)`
    let hasPreviousPageFilter = aql`FILTER TO_NUMBER(affiliation._key) < TO_NUMBER(FIRST(retrievedAffiliations)._key)`
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

      let affField, hasNextPageDocument, hasPreviousPageDocument
      /* istanbul ignore else */
      if (orderBy.field === 'org-acronym') {
        affField = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).orgDetails).acronym`
        hasNextPageDocument = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(LAST(retrievedAffiliations)._from).key).orgDetails).acronym`
        hasPreviousPageDocument = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(FIRST(retrievedAffiliations)._from).key).orgDetails).acronym`
      } else if (orderBy.field === 'org-name') {
        affField = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).orgDetails).name`
        hasNextPageDocument = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(LAST(retrievedAffiliations)._from).key).orgDetails).name`
        hasPreviousPageDocument = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(FIRST(retrievedAffiliations)._from).key).orgDetails).name`
      } else if (orderBy.field === 'org-slug') {
        affField = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).orgDetails).slug`
        hasNextPageDocument = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(LAST(retrievedAffiliations)._from).key).orgDetails).slug`
        hasPreviousPageDocument = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(FIRST(retrievedAffiliations)._from).key).orgDetails).slug`
      } else if (orderBy.field === 'org-zone') {
        affField = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).orgDetails).zone`
        hasNextPageDocument = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(LAST(retrievedAffiliations)._from).key).orgDetails).zone`
        hasPreviousPageDocument = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(FIRST(retrievedAffiliations)._from).key).orgDetails).zone`
      } else if (orderBy.field === 'org-sector') {
        affField = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).orgDetails).sector`
        hasNextPageDocument = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(LAST(retrievedAffiliations)._from).key).orgDetails).sector`
        hasPreviousPageDocument = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(FIRST(retrievedAffiliations)._from).key).orgDetails).sector`
      } else if (orderBy.field === 'org-country') {
        affField = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).orgDetails).country`
        hasNextPageDocument = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(LAST(retrievedAffiliations)._from).key).orgDetails).country`
        hasPreviousPageDocument = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(FIRST(retrievedAffiliations)._from).key).orgDetails).country`
      } else if (orderBy.field === 'org-province') {
        affField = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).orgDetails).province`
        hasNextPageDocument = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(LAST(retrievedAffiliations)._from).key).orgDetails).province`
        hasPreviousPageDocument = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(FIRST(retrievedAffiliations)._from).key).orgDetails).province`
      } else if (orderBy.field === 'org-city') {
        affField = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).orgDetails).city`
        hasNextPageDocument = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(LAST(retrievedAffiliations)._from).key).orgDetails).city`
        hasPreviousPageDocument = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(FIRST(retrievedAffiliations)._from).key).orgDetails).city`
      } else if (orderBy.field === 'org-verified') {
        affField = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).verified`
        hasNextPageDocument = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(LAST(retrievedAffiliations)._from).key).verified`
        hasPreviousPageDocument = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(FIRST(retrievedAffiliations)._from).key).verified`
      } else if (orderBy.field === 'org-summary-mail-pass') {
        affField = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).summaries.mail.pass`
        hasNextPageDocument = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(LAST(retrievedAffiliations)._from).key).summaries.mail.pass`
        hasPreviousPageDocument = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(FIRST(retrievedAffiliations)._from).key).summaries.mail.pass`
      } else if (orderBy.field === 'org-summary-mail-fail') {
        affField = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).summaries.mail.fail`
        hasNextPageDocument = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(LAST(retrievedAffiliations)._from).key).summaries.mail.fail`
        hasPreviousPageDocument = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(FIRST(retrievedAffiliations)._from).key).summaries.mail.fail`
      } else if (orderBy.field === 'org-summary-mail-total') {
        affField = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).summaries.mail.total`
        hasNextPageDocument = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(LAST(retrievedAffiliations)._from).key).summaries.mail.total`
        hasPreviousPageDocument = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(FIRST(retrievedAffiliations)._from).key).summaries.mail.total`
      } else if (orderBy.field === 'org-summary-web-pass') {
        affField = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).summaries.web.pass`
        hasNextPageDocument = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(LAST(retrievedAffiliations)._from).key).summaries.web.pass`
        hasPreviousPageDocument = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(FIRST(retrievedAffiliations)._from).key).summaries.web.pass`
      } else if (orderBy.field === 'org-summary-web-fail') {
        affField = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).summaries.web.fail`
        hasNextPageDocument = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(LAST(retrievedAffiliations)._from).key).summaries.web.fail`
        hasPreviousPageDocument = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(FIRST(retrievedAffiliations)._from).key).summaries.web.fail`
      } else if (orderBy.field === 'org-summary-web-total') {
        affField = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).summaries.web.total`
        hasNextPageDocument = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(LAST(retrievedAffiliations)._from).key).summaries.web.total`
        hasPreviousPageDocument = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(FIRST(retrievedAffiliations)._from).key).summaries.web.total`
      } else if (orderBy.field === 'org-domain-count') {
        affField = aql`COUNT(FOR v, e IN 1..1 ANY DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key)._id claims RETURN e._to)`
        hasNextPageDocument = aql`COUNT(FOR v, e IN 1..1 ANY DOCUMENT(organizations, PARSE_IDENTIFIER(LAST(retrievedAffiliations)._from).key)._id claims RETURN e._to)`
        hasPreviousPageDocument = aql`COUNT(FOR v, e IN 1..1 ANY DOCUMENT(organizations, PARSE_IDENTIFIER(FIRST(retrievedAffiliations)._from).key)._id claims RETURN e._to)`
      }

      hasNextPageFilter = aql`
      FILTER ${affField} ${hasNextPageDirection} ${hasNextPageDocument}
      OR (${affField} == ${hasNextPageDocument}
      AND TO_NUMBER(affiliation._key) > TO_NUMBER(LAST(retrievedAffiliations)._key))
    `

      hasPreviousPageFilter = aql`
      FILTER ${affField} ${hasPreviousPageDirection} ${hasPreviousPageDocument}
      OR (${affField} == ${hasPreviousPageDocument}
      AND TO_NUMBER(affiliation._key) < TO_NUMBER(FIRST(retrievedAffiliations)._key))
    `
    }

    let sortByField = aql``
    if (typeof orderBy !== 'undefined') {
      /* istanbul ignore else */
      if (orderBy.field === 'org-acronym') {
        sortByField = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).orgDetails).acronym ${orderBy.direction},`
      } else if (orderBy.field === 'org-name') {
        sortByField = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).orgDetails).name ${orderBy.direction},`
      } else if (orderBy.field === 'org-slug') {
        sortByField = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).orgDetails).slug ${orderBy.direction},`
      } else if (orderBy.field === 'org-zone') {
        sortByField = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).orgDetails).zone ${orderBy.direction},`
      } else if (orderBy.field === 'org-sector') {
        sortByField = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).orgDetails).sector ${orderBy.direction},`
      } else if (orderBy.field === 'org-country') {
        sortByField = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).orgDetails).country ${orderBy.direction},`
      } else if (orderBy.field === 'org-province') {
        sortByField = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).orgDetails).province ${orderBy.direction},`
      } else if (orderBy.field === 'org-city') {
        sortByField = aql`TRANSLATE(${language}, DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).orgDetails).city ${orderBy.direction},`
      } else if (orderBy.field === 'org-verified') {
        sortByField = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).verified ${orderBy.direction},`
      } else if (orderBy.field === 'org-summary-mail-pass') {
        sortByField = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).summaries.mail.pass ${orderBy.direction},`
      } else if (orderBy.field === 'org-summary-mail-fail') {
        sortByField = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).summaries.mail.fail ${orderBy.direction},`
      } else if (orderBy.field === 'org-summary-mail-total') {
        sortByField = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).summaries.mail.total ${orderBy.direction},`
      } else if (orderBy.field === 'org-summary-web-pass') {
        sortByField = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).summaries.web.pass ${orderBy.direction},`
      } else if (orderBy.field === 'org-summary-web-fail') {
        sortByField = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).summaries.web.fail ${orderBy.direction},`
      } else if (orderBy.field === 'org-summary-web-total') {
        sortByField = aql`DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key).summaries.web.total ${orderBy.direction},`
      } else if (orderBy.field === 'org-domain-count') {
        sortByField = aql`COUNT(FOR v, e IN 1..1 ANY DOCUMENT(organizations, PARSE_IDENTIFIER(affiliation._from).key)._id claims RETURN e._to) ${orderBy.direction},`
      }
    }

    let sortString
    if (typeof last !== 'undefined') {
      sortString = aql`DESC`
    } else {
      sortString = aql`ASC`
    }

    let orgSearchQuery = aql``
    let orgIdFilter = aql``
    if (typeof search !== 'undefined' && search !== '') {
      search = cleanseInput(search)
      orgSearchQuery = aql`
      LET tokenArrEN = TOKENS(${search}, "text_en")
      LET searchOrgsEN = UNIQUE(
        FOR token IN tokenArrEN
          FOR org IN organizationSearch
            SEARCH ANALYZER(
              org.orgDetails.en.acronym LIKE CONCAT("%", token, "%")
              OR org.orgDetails.en.name LIKE CONCAT("%", token, "%")
          , "text_en")
          RETURN org._id
      )
      LET tokenArrFR = TOKENS(${search}, "text_fr")
      LET searchedOrgsFR = UNIQUE(
        FOR token IN tokenArrFR
        FOR org IN organizationSearch
          SEARCH ANALYZER(
              org.orgDetails.fr.acronym LIKE CONCAT("%", token, "%")
              OR org.orgDetails.fr.name LIKE CONCAT("%", token, "%")
          , "text_fr")
          RETURN org._id
      )
      LET orgIds = UNION_DISTINCT(searchOrgsEN, searchedOrgsFR)
    `
      orgIdFilter = aql`FILTER e._from IN orgIds`
    }

    let filteredAffiliationCursor
    try {
      filteredAffiliationCursor = await query`
      WITH affiliations, organizations, organizationSearch users

      ${orgSearchQuery}
      
      LET affiliationKeys = (
        FOR v, e IN 1..1 INBOUND ${userId} affiliations 
          ${orgIdFilter}
          RETURN e._key
      )

      LET retrievedAffiliations = (
        FOR affiliation IN affiliations
            FILTER affiliation._key IN affiliationKeys
            LET orgKey = PARSE_IDENTIFIER(affiliation._from).key
            LET userKey = PARSE_IDENTIFIER(affiliation._to).key
            ${afterTemplate}
            ${beforeTemplate}
            SORT
            ${sortByField}
            ${limitTemplate}
            RETURN MERGE(affiliation, { id: affiliation._key, orgKey: orgKey, userKey: userKey, _type: "affiliation" })
      )

      LET hasNextPage = (LENGTH(
        FOR affiliation IN affiliations
          FILTER affiliation._key IN affiliationKeys
          ${hasNextPageFilter}
          SORT ${sortByField} affiliation._key ${sortString} LIMIT 1
          RETURN affiliation
      ) > 0 ? true : false)

      LET hasPreviousPage = (LENGTH(
        FOR affiliation IN affiliations
          FILTER affiliation._key IN affiliationKeys
          ${hasPreviousPageFilter}
          SORT ${sortByField} affiliation._key ${sortString} LIMIT 1
          RETURN affiliation
      ) > 0 ? true : false)

      RETURN {
        "affiliations": retrievedAffiliations,
        "totalCount": LENGTH(affiliationKeys),
        "hasNextPage": hasNextPage,
        "hasPreviousPage": hasPreviousPage,
        "startKey": FIRST(retrievedAffiliations)._key,
        "endKey": LAST(retrievedAffiliations)._key
      }
    `
    } catch (err) {
      console.error(
        `Database error occurred while user: ${userKey} was trying to query affiliations in loadAffiliationConnectionsByUserId, error: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to query affiliation(s). Please try again.`),
      )
    }

    let filteredAffiliations
    try {
      filteredAffiliations = await filteredAffiliationCursor.next()
    } catch (err) {
      console.error(
        `Cursor error occurred while user: ${userKey} was trying to gather affiliations in loadAffiliationConnectionsByUserId, error: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to load affiliation(s). Please try again.`),
      )
    }

    if (filteredAffiliations.affiliations.length === 0) {
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

    const edges = filteredAffiliations.affiliations.map((affiliation) => {
      return {
        cursor: toGlobalId('affiliations', affiliation._key),
        node: affiliation,
      }
    })

    return {
      edges,
      totalCount: filteredAffiliations.totalCount,
      pageInfo: {
        hasNextPage: filteredAffiliations.hasNextPage,
        hasPreviousPage: filteredAffiliations.hasPreviousPage,
        startCursor: toGlobalId('affiliations', filteredAffiliations.startKey),
        endCursor: toGlobalId('affiliations', filteredAffiliations.endKey),
      },
    }
  }
