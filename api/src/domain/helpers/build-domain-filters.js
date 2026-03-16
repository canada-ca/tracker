import { aql } from 'arangojs'

// Maps filter categories to their AQL field paths
const STATUS_FILTER_MAP = {
  'dmarc-status': 'v.status.dmarc',
  'dkim-status': 'v.status.dkim',
  'https-status': 'v.status.https',
  'spf-status': 'v.status.spf',
  'ciphers-status': 'v.status.ciphers',
  'curves-status': 'v.status.curves',
  'hsts-status': 'v.status.hsts',
  'policy-status': 'v.status.policy',
  'protocols-status': 'v.status.protocols',
  'certificates-status': 'v.status.certificates',
}

// Maps tag filter values to { field, value } pairs for direct field comparisons
const TAG_FIELD_MAP = {
  archived: { field: 'v.archived', value: true },
  nxdomain: { field: 'v.rcode', value: 'NXDOMAIN' },
  blocked: { field: 'v.blocked', value: true },
  'wildcard-sibling': { field: 'v.wildcardSibling', value: true },
  'wildcard-entry': { field: 'v.wildcardEntry', value: true },
  'scan-pending': { field: 'v.webScanPending', value: true },
  'has-entrust-certificate': { field: 'v.hasEntrustCertificate', value: true },
  'cve-detected': { field: 'v.cveDetected', value: true },
  'cvd-enrolled': { field: 'v.cvdEnrollment.status', value: 'enrolled' },
  'cvd-pending': { field: 'v.cvdEnrollment.status', value: 'pending' },
}

function buildComparison(comparison) {
  return comparison === '==' ? aql`==` : aql`!=`
}

function buildStatusFilter(accumulated, field, comparison, filterValue) {
  // AQL doesn't support dynamic field access, so we need a switch here.
  // The field string is only ever sourced from STATUS_FILTER_MAP above, never user input.
  switch (field) {
    case 'v.status.dmarc':
      return aql`${accumulated} FILTER v.status.dmarc ${comparison} ${filterValue}`
    case 'v.status.dkim':
      return aql`${accumulated} FILTER v.status.dkim ${comparison} ${filterValue}`
    case 'v.status.https':
      return aql`${accumulated} FILTER v.status.https ${comparison} ${filterValue}`
    case 'v.status.spf':
      return aql`${accumulated} FILTER v.status.spf ${comparison} ${filterValue}`
    case 'v.status.ciphers':
      return aql`${accumulated} FILTER v.status.ciphers ${comparison} ${filterValue}`
    case 'v.status.curves':
      return aql`${accumulated} FILTER v.status.curves ${comparison} ${filterValue}`
    case 'v.status.hsts':
      return aql`${accumulated} FILTER v.status.hsts ${comparison} ${filterValue}`
    case 'v.status.policy':
      return aql`${accumulated} FILTER v.status.policy ${comparison} ${filterValue}`
    case 'v.status.protocols':
      return aql`${accumulated} FILTER v.status.protocols ${comparison} ${filterValue}`
    case 'v.status.certificates':
      return aql`${accumulated} FILTER v.status.certificates ${comparison} ${filterValue}`
    default:
      return accumulated
  }
}

function buildTagFilter(accumulated, comparison, filterValue) {
  const mapped = TAG_FIELD_MAP[filterValue]

  if (!mapped) {
    return aql`${accumulated} FILTER POSITION(e.tags, ${filterValue}) ${comparison} true`
  }

  // Same dynamic field problem — switch on the known field paths from TAG_FIELD_MAP
  switch (mapped.field) {
    case 'v.archived':
      return aql`${accumulated} FILTER v.archived ${comparison} ${mapped.value}`
    case 'v.rcode':
      return aql`${accumulated} FILTER v.rcode ${comparison} ${mapped.value}`
    case 'v.blocked':
      return aql`${accumulated} FILTER v.blocked ${comparison} ${mapped.value}`
    case 'v.wildcardSibling':
      return aql`${accumulated} FILTER v.wildcardSibling ${comparison} ${mapped.value}`
    case 'v.wildcardEntry':
      return aql`${accumulated} FILTER v.wildcardEntry ${comparison} ${mapped.value}`
    case 'v.webScanPending':
      return aql`${accumulated} FILTER v.webScanPending ${comparison} ${mapped.value}`
    case 'v.hasEntrustCertificate':
      return aql`${accumulated} FILTER v.hasEntrustCertificate ${comparison} ${mapped.value}`
    case 'v.cveDetected':
      return aql`${accumulated} FILTER v.cveDetected ${comparison} ${mapped.value}`
    case 'v.cvdEnrollment.status':
      return aql`${accumulated} FILTER v.cvdEnrollment.status ${comparison} ${mapped.value}`
    default:
      return accumulated
  }
}

function buildSingleFilter(accumulated, { filterCategory, comparison, filterValue }) {
  const cmp = buildComparison(comparison)

  if (filterCategory in STATUS_FILTER_MAP) {
    return buildStatusFilter(accumulated, STATUS_FILTER_MAP[filterCategory], cmp, filterValue)
  }

  switch (filterCategory) {
    case 'tags':
      return buildTagFilter(accumulated, cmp, filterValue)
    case 'asset-state':
      return aql`${accumulated} FILTER e.assetState ${cmp} ${filterValue}`
    case 'guidance-tag':
      return aql`${accumulated} FILTER POSITION(negativeTags, ${filterValue}) ${cmp} true`
    case 'dmarc-phase':
      return aql`${accumulated} FILTER v.phase ${cmp} ${filterValue}`
    default:
      return accumulated
  }
}

export function buildDomainFilters({ filters }) {
  if (!filters?.length) return aql``
  return filters.reduce(buildSingleFilter, aql``)
}
