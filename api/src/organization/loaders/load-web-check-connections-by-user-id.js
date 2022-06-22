import { t } from '@lingui/macro'

export const loadWebCheckConnectionsByUserId =
  ({ query, userKey, i18n, _auth }) =>
  async () => {
    let requestedOrgsInfo
    try {
      requestedOrgsInfo = await query`
      LET orgs = (
        FOR org in organizations
            LET domainKeys = (
                    FOR v, e IN 1..1 OUTBOUND org._id claims
                      OPTIONS {bfs: true}
                      RETURN v._key
                 )
            LET vulnDomains = (
                FOR d in domains
                    FILTER d._key in domainKeys
                    FILTER LENGTH(d.tags) > 0
                    RETURN d
                )
            RETURN { organization: org, domains: { edges: vulnDomains, totalCount: LENGTH(vulnDomains) } }
    )
    LET vulnOrgs = (
        FOR org in orgs
            FILTER org.domains.totalCount > 0
            RETURN org
    )
    RETURN { organizations: vulnOrgs, totalCount: LENGTH(vulnOrgs) }
    `
    } catch (err) {
      console.error(
        `Database error occurred while user: ${userKey} was trying to gather domains in loadDomainTagsByOrgId, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to load domain(s). Please try again.`))
    }

    let orgsInfo
    try {
      orgsInfo = await requestedOrgsInfo.next()
    } catch (err) {
      console.error(
        `Cursor error occurred while user: ${userKey} was trying to gather domainTags in loadDomainTagsByOrgId, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to load domain(s). Please try again.`))
    }

    if (orgsInfo.organizations.length === 0) {
      return {
        edges: [],
        totalCount: 0,
      }
    }

    const edges = orgsInfo.organizations.map((org) => {
      return org
    })

    return {
      edges,
      totalCount: orgsInfo.totalCount,
    }
  }
