import { t } from '@lingui/macro'
import { aql } from 'arangojs'

export const loadOrganizationDomainStatuses =
  ({ query, userKey, i18n, language }) =>
  async ({ orgId, filters }) => {
    let domains
    let domainFilters = aql`FILTER v.archived != true`
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
          } else {
            domainFilters = aql`
            ${domainFilters}
            FILTER POSITION(claimTags, ${filterValue}) ${comparison} true
          `
          }
        } else if (filterCategory === 'asset-state') {
          domainFilters = aql`
            ${domainFilters}
            FILTER e.assetState ${comparison} ${filterValue}
          `
        }
      })
    }

    try {
      domains = (
        await query`
          WITH claims, domains, organizations
          FOR v, e IN 1..1 OUTBOUND ${orgId} claims
            LET claimTags = (
                LET translatedTags = (
                  FOR tag IN e.tags || []
                    RETURN TRANSLATE(${language}, tag)
                )
                RETURN translatedTags
            )[0]
            ${domainFilters}
            LET ipAddresses = (
              FOR web, webE IN 1 OUTBOUND v._id domainsWeb
                SORT web.timestamp DESC
                LIMIT 1
                FOR webScan, webScanE IN 1 OUTBOUND web._id webToWebScans
                    RETURN webScan.ipAddress
            )
            RETURN {
              domain: v.domain,
              ipAddresses: ipAddresses,
              status: v.status,
              tags: claimTags,
              assetState: e.assetState,
              rcode: v.rcode,
              blocked: v.blocked,
              wildcardSibling: v.wildcardSibling,
              hasEntrustCertificate: v.hasEntrustCertificate,
              cveDetected: v.cveDetected
            }
          `
      ).all()
    } catch (err) {
      console.error(`Database error occurred when user: ${userKey} running loadOrganizationDomainStatuses: ${err}`)
      throw new Error(i18n._(t`Unable to load organization domain statuses. Please try again.`))
    }

    return domains
  }
