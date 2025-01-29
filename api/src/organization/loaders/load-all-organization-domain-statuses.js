import { t } from '@lingui/macro'
import { aql } from 'arangojs'

export const loadAllOrganizationDomainStatuses =
  ({ query, userKey, i18n, language }) =>
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
          } else if (filterValue === 'wildcard-entry') {
            domainFilters = aql`
            ${domainFilters}
            FILTER d.wildcardEntry ${comparison} true
          `
          } else if (filterValue === 'scan-pending') {
            domainFilters = aql`${domainFilters}`
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
            LET ipAddresses = FIRST(
              FILTER d.latestDnsScan
              LET latestDnsScan = DOCUMENT(d.latestDnsScan)
              FILTER latestDnsScan.resolveIps
              RETURN latestDnsScan.resolveIps
            )
            LET vulnerabilities = (
              FOR finding IN additionalFindings
                FILTER finding.domain == d._id
                LIMIT 1
                RETURN UNIQUE(
                  FOR wc IN finding.webComponents
                    FILTER LENGTH(wc.WebComponentCves) > 0
                    FOR vuln IN wc.WebComponentCves
                      FILTER vuln.Cve NOT IN (d.ignoredCves || [])
                      RETURN vuln.Cve
                )
            )[0]
            LET verifiedOrg = (
              FOR v,e IN 1..1 INBOUND d._id claims
                FILTER v.verified == true
                LIMIT 1
                RETURN TRANSLATE(${language}, v.orgDetails)
            )[0]
            RETURN {
              "domain": d.domain,
              "orgName": verifiedOrg.name,
              "orgAcronym": verifiedOrg.acronym,
              "orgExternalID": verifiedOrg.externalId,
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
              "wildcardEntry": d.wildcardEntry,
              "hasEntrustCertificate": d.hasEntrustCertificate,
              "top25Vulnerabilities": vulnerabilities
            }
          `
      ).all()
    } catch (err) {
      console.error(`Database error occurred when user: ${userKey} running loadOrganizationDomainStatuses: ${err}`)
      throw new Error(i18n._(t`Unable to load organization domain statuses. Please try again.`))
    }

    return domains
  }
