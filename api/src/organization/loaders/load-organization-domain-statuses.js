import { t } from '@lingui/macro'
import { aql } from 'arangojs'

export const loadOrganizationDomainStatuses =
  ({ query, userKey, i18n }) =>
  async ({ orgId, filters }) => {
    let domains
    let domainFilters = aql``
    let archivedFilter = aql`FILTER v.archived != true`
    if (typeof filters !== 'undefined') {
      filters.forEach(({ filterCategory, comparison, filterValue }) => {
        if (comparison === '==') {
          comparison = aql`==`
        } else {
          comparison = aql`!=`
        }
        if (filterCategory === 'dmarc-status') {
          domainFilters = aql`
          ${domainFilters}
          FILTER v.status.dmarc ${comparison} ${filterValue}
        `
        } else if (filterCategory === 'dkim-status') {
          domainFilters = aql`
          ${domainFilters}
          FILTER v.status.dkim ${comparison} ${filterValue}
        `
        } else if (filterCategory === 'https-status') {
          domainFilters = aql`
          ${domainFilters}
          FILTER v.status.https ${comparison} ${filterValue}
        `
        } else if (filterCategory === 'spf-status') {
          domainFilters = aql`
          ${domainFilters}
          FILTER v.status.spf ${comparison} ${filterValue}
        `
        } else if (filterCategory === 'ciphers-status') {
          domainFilters = aql`
          ${domainFilters}
          FILTER v.status.ciphers ${comparison} ${filterValue}
        `
        } else if (filterCategory === 'curves-status') {
          domainFilters = aql`
          ${domainFilters}
          FILTER v.status.curves ${comparison} ${filterValue}
        `
        } else if (filterCategory === 'hsts-status') {
          domainFilters = aql`
          ${domainFilters}
          FILTER v.status.hsts ${comparison} ${filterValue}
        `
        } else if (filterCategory === 'protocols-status') {
          domainFilters = aql`
          ${domainFilters}
          FILTER v.status.protocols ${comparison} ${filterValue}
        `
        } else if (filterCategory === 'certificates-status') {
          domainFilters = aql`
          ${domainFilters}
          FILTER v.status.certificates ${comparison} ${filterValue}
        `
        } else if (filterCategory === 'tags') {
          if (filterValue === 'nxdomain') {
            domainFilters = aql`
            ${domainFilters}
            FILTER v.rcode ${comparison} "NXDOMAIN"
          `
          } else if (filterValue === 'blocked') {
            domainFilters = aql`
            ${domainFilters}
            FILTER v.blocked ${comparison} true
          `
          } else if (filterValue === 'wildcard-sibling') {
            domainFilters = aql`
            ${domainFilters}
            FILTER v.wildcardSibling ${comparison} true
          `
          } else if (filterValue === 'wildcard-entry') {
            domainFilters = aql`
            ${domainFilters}
            FILTER v.wildcardEntry ${comparison} true
          `
          } else if (filterValue === 'has-entrust-certificate') {
            domainFilters = aql`
            ${domainFilters}
            FILTER v.hasEntrustCertificate ${comparison} true
          `
          } else if (filterValue === 'cve-detected') {
            domainFilters = aql`
            ${domainFilters}
            FILTER v.cveDetected ${comparison} true
          `
          } else if (filterValue === 'scan-pending') {
            domainFilters = aql`${domainFilters}`
          } else if (filterValue === 'archived') {
            archivedFilter = aql`FILTER v.archived ${comparison} true`
          } else {
            domainFilters = aql`
            ${domainFilters}
            FILTER POSITION(e.tags, ${filterValue}) ${comparison} true
          `
          }
        } else if (filterCategory === 'asset-state') {
          domainFilters = aql`
            ${domainFilters}
            FILTER e.assetState ${comparison} ${filterValue}
          `
        } else if (filterCategory === 'guidance-tag') {
          domainFilters = aql`
          ${domainFilters}
          FILTER POSITION(negativeTags, ${filterValue}) ${comparison} true
        `
        } else if (filterCategory === 'dmarc-phase') {
          domainFilters = aql`
          ${domainFilters}
          FILTER v.phase ${comparison} ${filterValue}
        `
        }
      })
    }

    try {
      domains = (
        await query`
          WITH claims, domains, organizations
          FOR v, e IN 1..1 OUTBOUND ${orgId} claims
            ${archivedFilter}
            LET negativeTags = APPEND(v.negativeTags.dns, v.negativeTags.web) 
            ${domainFilters}
            LET ipAddresses = FIRST(
              FILTER v.latestDnsScan
              LET latestDnsScan = DOCUMENT(v.latestDnsScan)
              FILTER latestDnsScan.resolveIps
              RETURN latestDnsScan.resolveIps
            )
            LET vulnerabilities = (
              FOR finding IN additionalFindings
                FILTER finding.domain == v._id
                LIMIT 1
                RETURN UNIQUE(
                  FOR wc IN finding.webComponents
                    FILTER LENGTH(wc.WebComponentCves) > 0
                    FOR vuln IN wc.WebComponentCves
                      FILTER vuln.Cve NOT IN (v.ignoredCves || [])
                      RETURN vuln.Cve
                )
            )[0]
            RETURN {
              domain: v.domain,
              ipAddresses: ipAddresses,
              status: v.status,
              phase: v.phase,
              tags: e.tags,
              assetState: e.assetState,
              rcode: v.rcode,
              blocked: v.blocked,
              wildcardSibling: v.wildcardSibling,
              wildcardEntry: v.wildcardEntry,
              hasEntrustCertificate: v.hasEntrustCertificate,
              top25Vulnerabilities: vulnerabilities
            }
          `
      ).all()
    } catch (err) {
      console.error(`Database error occurred when user: ${userKey} running loadOrganizationDomainStatuses: ${err}`)
      throw new Error(i18n._(t`Unable to load organization domain statuses. Please try again.`))
    }

    return domains
  }
