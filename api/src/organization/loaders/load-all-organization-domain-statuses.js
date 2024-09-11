import { t } from '@lingui/macro'
import { aql } from 'arangojs'

export const loadAllOrganizationDomainStatuses =
  ({ query, userKey, i18n }) =>
  async ({ filters }) => {
    let domains
    let domainFilters = aql`FILTER d.archived != true`
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
          FILTER d.status.dmarc ${comparison} ${filterValue}
        `
        } else if (filterCategory === 'dkim-status') {
          domainFilters = aql`
          ${domainFilters}
          FILTER d.status.dkim ${comparison} ${filterValue}
        `
        } else if (filterCategory === 'https-status') {
          domainFilters = aql`
          ${domainFilters}
          FILTER d.status.https ${comparison} ${filterValue}
        `
        } else if (filterCategory === 'spf-status') {
          domainFilters = aql`
          ${domainFilters}
          FILTER d.status.spf ${comparison} ${filterValue}
        `
        } else if (filterCategory === 'ciphers-status') {
          domainFilters = aql`
          ${domainFilters}
          FILTER d.status.ciphers ${comparison} ${filterValue}
        `
        } else if (filterCategory === 'curves-status') {
          domainFilters = aql`
          ${domainFilters}
          FILTER d.status.curves ${comparison} ${filterValue}
        `
        } else if (filterCategory === 'hsts-status') {
          domainFilters = aql`
          ${domainFilters}
          FILTER d.status.hsts ${comparison} ${filterValue}
        `
        } else if (filterCategory === 'protocols-status') {
          domainFilters = aql`
          ${domainFilters}
          FILTER d.status.protocols ${comparison} ${filterValue}
        `
        } else if (filterCategory === 'certificates-status') {
          domainFilters = aql`
          ${domainFilters}
          FILTER d.status.certificates ${comparison} ${filterValue}
        `
        } else if (filterCategory === 'tags') {
          if (filterValue === 'nxdomain') {
            domainFilters = aql`
            ${domainFilters}
            FILTER d.rcode ${comparison} "NXDOMAIN"
          `
          } else if (filterValue === 'blocked') {
            domainFilters = aql`
            ${domainFilters}
            FILTER d.blocked ${comparison} true
          `
          } else if (filterValue === 'wildcard-sibling') {
            domainFilters = aql`
            ${domainFilters}
            FILTER d.wildcardSibling ${comparison} true
          `
          } else if (filterValue === 'has-entrust-certificate') {
            domainFilters = aql`
            ${domainFilters}
            FILTER d.hasEntrustCertificate ${comparison} true
          `
          } else if (filterValue === 'cve-detected') {
            domainFilters = aql`
            ${domainFilters}
            FILTER d.cveDetected ${comparison} true
          `
          }
        }
      })
    }

    try {
      domains = (
        await query`
          WITH domains
          FOR d IN domains
            ${domainFilters}
            LET ipAddresses = (
              FOR web, webE IN 1 OUTBOUND d._id domainsWeb
                SORT web.timestamp DESC
                LIMIT 1
                FOR webScan, webScanE IN 1 OUTBOUND web._id webToWebScans
                    RETURN webScan.ipAddress
            )
            RETURN {
              "domain": d.domain,
              "ipAddresses": ipAddresses,
              "https": d.status.https,
              "hsts": d.status.hsts,
              "certificates": d.status.certificates,
              "ciphers": d.status.ciphers,
              "curves": d.status.curves,
              "protocols": d.status.protocols,
              "spf": d.status.spf,
              "dkim": d.status.dkim,
              "dmarc": d.status.dmarc,
              "rcode": d.rcode,
              "blocked": d.blocked,
              "wildcardSibling": d.wildcardSibling,
              "hasEntrustCertificate": d.hasEntrustCertificate,
              "hasTop25Vulnerability": d.cveDetected
            }
          `
      ).all()
    } catch (err) {
      console.error(`Database error occurred when user: ${userKey} running loadOrganizationDomainStatuses: ${err}`)
      throw new Error(i18n._(t`Unable to load organization domain statuses. Please try again.`))
    }

    return domains
  }
