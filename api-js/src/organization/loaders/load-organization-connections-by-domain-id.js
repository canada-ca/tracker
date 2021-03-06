import { aql } from 'arangojs'
import { fromGlobalId, toGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

export const orgLoaderConnectionArgsByDomainId = (
  query,
  language,
  userKey,
  cleanseInput,
  i18n,
) => async ({ domainId, after, before, first, last }) => {
  let afterTemplate = aql``
  let beforeTemplate = aql``

  const userDBId = `users/${userKey}`

  if (typeof after !== 'undefined') {
    const { id: afterId } = fromGlobalId(cleanseInput(after))
    afterTemplate = aql`FILTER TO_NUMBER(org._key) > TO_NUMBER(${afterId})`
  }

  if (typeof before !== 'undefined') {
    const { id: beforeId } = fromGlobalId(cleanseInput(before))
    beforeTemplate = aql`FILTER TO_NUMBER(org._key) < TO_NUMBER(${beforeId})`
  }

  let limitTemplate = aql``
  if (typeof first === 'undefined' && typeof last === 'undefined') {
    console.warn(
      `User: ${userKey} did not have either \`first\` or \`last\` arguments set for: orgLoaderConnectionArgsByDomainId.`,
    )
    throw new Error(
      i18n._(
        t`You must provide a \`first\` or \`last\` value to properly paginate the \`organization\` connection.`,
      ),
    )
  } else if (typeof first !== 'undefined' && typeof last !== 'undefined') {
    console.warn(
      `User: ${userKey} attempted to have \`first\` and \`last\` arguments set for: orgLoaderConnectionArgsByDomainId.`,
    )
    throw new Error(
      i18n._(
        t`Passing both \`first\` and \`last\` to paginate the \`organization\` connection is not supported.`,
      ),
    )
  } else if (typeof first === 'number' || typeof last === 'number') {
    /* istanbul ignore else */
    if (first < 0 || last < 0) {
      const argSet = typeof first !== 'undefined' ? 'first' : 'last'
      console.warn(
        `User: ${userKey} attempted to have \`${argSet}\` set below zero for: orgLoaderConnectionArgsByDomainId.`,
      )
      throw new Error(
        i18n._(
          t`\`${argSet}\` on the \`organization\` connection cannot be less than zero.`,
        ),
      )
    } else if (first > 100 || last > 100) {
      const argSet = typeof first !== 'undefined' ? 'first' : 'last'
      const amount = typeof first !== 'undefined' ? first : last
      console.warn(
        `User: ${userKey} attempted to have \`${argSet}\` to ${amount} for: orgLoaderConnectionArgsByDomainId.`,
      )
      throw new Error(
        i18n._(
          t`Requesting \`${amount}\` records on the \`organization\` connection exceeds the \`${argSet}\` limit of 100 records.`,
        ),
      )
    } else if (typeof first !== 'undefined' && typeof last === 'undefined') {
      limitTemplate = aql`SORT org._key ASC LIMIT TO_NUMBER(${first})`
    } else if (typeof first === 'undefined' && typeof last !== 'undefined') {
      limitTemplate = aql`SORT org._key DESC LIMIT TO_NUMBER(${last})`
    }
  } else {
    const argSet = typeof first !== 'undefined' ? 'first' : 'last'
    const typeSet = typeof first !== 'undefined' ? typeof first : typeof last
    console.warn(
      `User: ${userKey} attempted to have \`${argSet}\` set as a ${typeSet} for: orgLoaderConnectionArgsByDomainId.`,
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

  let organizationInfoCursor
  try {
    organizationInfoCursor = await query`
    LET superAdmin = (FOR v, e IN 1 INBOUND ${userDBId} affiliations FILTER e.permission == "super_admin" RETURN e.permission)
    LET affiliationKeys = (FOR v, e IN 1..1 INBOUND ${userDBId} affiliations RETURN v._key)
    LET superAdminOrgs = (FOR org IN organizations RETURN org._key)
    LET keys = ('super_admin' IN superAdmin ? superAdminOrgs : affiliationKeys)
    LET claimKeys = (FOR v, e IN 1..1 INBOUND ${domainId} claims RETURN v._key)
    LET orgKeys = INTERSECTION(keys, claimKeys)

    LET retrievedOrgs = (
      FOR org IN organizations
        FILTER org._key IN orgKeys
        ${afterTemplate} 
        ${beforeTemplate} 
        ${limitTemplate}
        LET domains = (FOR v, e IN 1..1 OUTBOUND org._id claims RETURN e._to)
        RETURN MERGE({ _id: org._id, _key: org._key, _rev: org._rev, _type: "organization", id: org._key, verified: org.verified, domainCount: COUNT(domains), summaries: org.summaries }, TRANSLATE(${language}, org.orgDetails))
    )

    LET hasNextPage = (LENGTH(
      FOR org IN organizations
        FILTER org._key IN orgKeys
        FILTER TO_NUMBER(org._key) > TO_NUMBER(LAST(retrievedOrgs)._key)
        SORT org._key ${sortString} LIMIT 1
        RETURN org
    ) > 0 ? true : false)
    
    LET hasPreviousPage = (LENGTH(
      FOR org IN organizations
        FILTER org._key IN orgKeys
        FILTER TO_NUMBER(org._key) < TO_NUMBER(FIRST(retrievedOrgs)._key)
        SORT org._key ${sortString} LIMIT 1
        RETURN org
    ) > 0 ? true : false)
    
    RETURN { 
      "organizations": retrievedOrgs,
      "totalCount": LENGTH(orgKeys),
      "hasNextPage": hasNextPage, 
      "hasPreviousPage": hasPreviousPage, 
      "startKey": FIRST(retrievedOrgs)._key, 
      "endKey": LAST(retrievedOrgs)._key 
    }
    `
  } catch (err) {
    console.error(
      `Database error occurred while user: ${userKey} was trying to gather orgs in orgLoaderConnectionArgsByDomainId, error: ${err}`,
    )
    throw new Error(i18n._(t`Unable to load organizations. Please try again.`))
  }

  let organizationInfo
  try {
    organizationInfo = await organizationInfoCursor.next()
  } catch (err) {
    console.error(
      `Cursor error occurred while user: ${userKey} was trying to gather orgs in orgLoaderConnectionArgsByDomainId, error: ${err}`,
    )
    throw new Error(i18n._(t`Unable to load organizations. Please try again.`))
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
      cursor: toGlobalId('organizations', organization._key),
      node: organization,
    }
  })

  return {
    edges,
    totalCount: organizationInfo.totalCount,
    pageInfo: {
      hasNextPage: organizationInfo.hasNextPage,
      hasPreviousPage: organizationInfo.hasPreviousPage,
      startCursor: toGlobalId('organizations', organizationInfo.startKey),
      endCursor: toGlobalId('organizations', organizationInfo.endKey),
    },
  }
}
