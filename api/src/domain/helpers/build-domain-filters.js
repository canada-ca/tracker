import { aql } from 'arangojs'

export function buildDomainFilters({ filters }) {
  let domainFilters = aql``
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
      } else if (filterCategory === 'policy-status') {
        domainFilters = aql`
          ${domainFilters}
          FILTER v.status.policy ${comparison} ${filterValue}
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
        if (filterValue === 'archived') {
          domainFilters = aql`
            ${domainFilters}
            FILTER v.archived ${comparison} true
          `
        } else if (filterValue === 'nxdomain') {
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
        } else if (filterValue === 'scan-pending') {
          domainFilters = aql`
            ${domainFilters}
            FILTER v.webScanPending ${comparison} true
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
        } else if (filterValue === 'cvd-enrolled') {
          domainFilters = aql`
            ${domainFilters}
            FILTER v.cvdEnrollment.status ${comparison} "enrolled"
          `
        } else if (filterValue === 'cvd-pending') {
          domainFilters = aql`
            ${domainFilters}
            FILTER v.cvdEnrollment.status ${comparison} "pending"
          `
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

  return domainFilters
}
