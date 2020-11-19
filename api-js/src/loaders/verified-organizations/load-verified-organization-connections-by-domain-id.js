const { aql } = require('arangojs')
const { fromGlobalId, toGlobalId } = require('graphql-relay')
const { t } = require('@lingui/macro')

const verifiedOrgLoaderConnectionsByDomainId = (
  query,
  language,
  cleanseInput,
  i18n,
) => async ({ domainId, after, before, first, last }) => {
  let afterTemplate = aql``
  if (typeof after !== 'undefined') {
    const { id: afterId } = fromGlobalId(cleanseInput(after))
    afterTemplate = aql`FILTER TO_NUMBER(org._key) > TO_NUMBER(${afterId})`
  }

  let beforeTemplate = aql``
  if (typeof before !== 'undefined') {
    const { id: beforeId } = fromGlobalId(cleanseInput(before))
    beforeTemplate = aql`FILTER TO_NUMBER(org._key) < TO_NUMBER(${beforeId})`
  }

  let limitTemplate = aql``
  if (typeof first === 'undefined' && typeof last === 'undefined') {
    console.warn(
      `User did not have either \`first\` or \`last\` arguments set for: verifiedOrgLoaderConnectionsByDomainId.`,
    )
    throw new Error(
      i18n._(
        t`You must provide a \`first\` or \`last\` value to properly paginate the \`verifiedOrganization\` connection.`,
      ),
    )
  } else if (typeof first !== 'undefined' && typeof last !== 'undefined') {
    console.warn(
      `User attempted to have \`first\` and \`last\` arguments set for: verifiedOrgLoaderConnectionsByDomainId.`,
    )
    throw new Error(
      i18n._(
        t`Passing both \`first\` and \`last\` to paginate the \`verifiedOrganization\` connection is not supported.`,
      ),
    )
  } else if (typeof first === 'number' || typeof last === 'number') {
    /* istanbul ignore else */
    if (first < 0 || last < 0) {
      const argSet = typeof first !== 'undefined' ? 'first' : 'last'
      console.warn(
        `User attempted to have \`${argSet}\` set below zero for: verifiedOrgLoaderConnectionsByDomainId.`,
      )
      throw new Error(
        i18n._(
          t`\`${argSet}\` on the \`verifiedOrganization\` connection cannot be less than zero.`,
        ),
      )
    } else if (first > 100 || last > 100) {
      const argSet = typeof first !== 'undefined' ? 'first' : 'last'
      const amount = typeof first !== 'undefined' ? first : last
      console.warn(
        `User attempted to have \`${argSet}\` to ${amount} for: verifiedOrgLoaderConnectionsByDomainId.`,
      )
      throw new Error(
        i18n._(
          t`Requesting \`${amount}\` records on the \`verifiedOrganization\` connection exceeds the \`${argSet}\` limit of 100 records.`,
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
      `User attempted to have \`${argSet}\` set as a ${typeSet} for: verifiedOrgLoaderConnectionsByDomainId.`,
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

  let organizationInfoCursor
  try {
    organizationInfoCursor = await query`
    LET verifiedOrgs = FLATTEN(
      FOR v, e IN INBOUND ${domainId} claims FILTER v.verified == true RETURN v._key
    )
  
    LET retrievedOrgs = (
      FOR org IN organizations
        FILTER org._key IN verifiedOrgs
        ${afterTemplate} 
        ${beforeTemplate} 
        ${limitTemplate}
        LET domains = (FOR v, e IN 1..1 OUTBOUND org._id claims RETURN e._to)
        RETURN MERGE({ _id: org._id, _key: org._key, id: org._key, _rev: org._rev, verified: org.verified, domainCount: COUNT(domains), summaries: org.summaries }, TRANSLATE(${language}, org.orgDetails))
    )

    LET hasNextPage = (LENGTH(
      FOR org IN organizations
        FILTER org._key IN verifiedOrgs
        FILTER TO_NUMBER(org._key) > TO_NUMBER(LAST(retrievedOrgs)._key)
        SORT org._key ${sortString} LIMIT 1
        RETURN org
    ) > 0 ? true : false)
    
    LET hasPreviousPage = (LENGTH(
      FOR org IN organizations
        FILTER org._key IN verifiedOrgs
        FILTER TO_NUMBER(org._key) < TO_NUMBER(FIRST(retrievedOrgs)._key)
        SORT org._key ${sortString} LIMIT 1
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
      `Database error occurred while user was trying to gather orgs in verifiedOrgLoaderConnectionsByDomainId, error: ${err}`,
    )
    throw new Error(
      i18n._(t`Unable to load verified organizations. Please try again.`),
    )
  }

  let organizationInfo
  try {
    organizationInfo = await organizationInfoCursor.next()
  } catch (err) {
    console.error(
      `Cursor error occurred while user was trying to gather orgs in verifiedOrgLoaderConnectionsByDomainId, error: ${err}`,
    )
    throw new Error(
      i18n._(t`Unable to load verified organizations. Please try again.`),
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

module.exports = {
  verifiedOrgLoaderConnectionsByDomainId,
}
