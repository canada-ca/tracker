import { buildDomainFilters } from '../build-domain-filters'

// Helper to extract the query string and bind vars from an aql result,
// stripping the accumulated prefix so assertions stay readable.
function parse(result) {
  return {
    query: result.query,
    bindVars: result.bindVars,
  }
}

// ─── Empty / no-op cases ────────────────────────────────────────────────────

describe('buildDomainFilters – empty / no-op', () => {
  it('returns an empty aql fragment when filters is undefined', () => {
    const result = buildDomainFilters({})
    expect(result.query).toBe('')
    expect(result.bindVars).toEqual({})
  })

  it('returns an empty aql fragment when filters is null', () => {
    const result = buildDomainFilters({ filters: null })
    expect(result.query).toBe('')
    expect(result.bindVars).toEqual({})
  })

  it('returns an empty aql fragment when filters is an empty array', () => {
    const result = buildDomainFilters({ filters: [] })
    expect(result.query).toBe('')
    expect(result.bindVars).toEqual({})
  })
})

// ─── Status filters ─────────────────────────────────────────────────────────

describe('buildDomainFilters – status filters (==)', () => {
  const STATUS_CASES = [
    ['dmarc-status', 'v.status.dmarc'],
    ['dkim-status', 'v.status.dkim'],
    ['https-status', 'v.status.https'],
    ['spf-status', 'v.status.spf'],
    ['ciphers-status', 'v.status.ciphers'],
    ['curves-status', 'v.status.curves'],
    ['hsts-status', 'v.status.hsts'],
    ['policy-status', 'v.status.policy'],
    ['protocols-status', 'v.status.protocols'],
    ['certificates-status', 'v.status.certificates'],
  ]

  test.each(STATUS_CASES)('%s maps to %s with == comparison', (filterCategory, aqlField) => {
    const { query, bindVars } = parse(
      buildDomainFilters({
        filters: [{ filterCategory, comparison: '==', filterValue: 'pass' }],
      }),
    )
    expect(query).toContain(`FILTER ${aqlField} ==`)
    expect(Object.values(bindVars)).toContain('pass')
  })
})

describe('buildDomainFilters – status filters (!=)', () => {
  it('uses != comparison operator for dmarc-status', () => {
    const { query, bindVars } = parse(
      buildDomainFilters({
        filters: [{ filterCategory: 'dmarc-status', comparison: '!=', filterValue: 'fail' }],
      }),
    )
    expect(query).toContain('FILTER v.status.dmarc !=')
    expect(Object.values(bindVars)).toContain('fail')
  })

  it('uses != comparison operator for https-status', () => {
    const { query } = parse(
      buildDomainFilters({
        filters: [{ filterCategory: 'https-status', comparison: '!=', filterValue: 'info' }],
      }),
    )
    expect(query).toContain('FILTER v.status.https !=')
  })
})

// ─── Tag filters – mapped fields ─────────────────────────────────────────────

describe('buildDomainFilters – tags filter (mapped fields)', () => {
  const TAG_CASES = [
    ['archived', 'v.archived', true],
    ['nxdomain', 'v.rcode', 'NXDOMAIN'],
    ['blocked', 'v.blocked', true],
    ['wildcard-sibling', 'v.wildcardSibling', true],
    ['wildcard-entry', 'v.wildcardEntry', true],
    ['scan-pending', 'v.webScanPending', true],
    ['has-entrust-certificate', 'v.hasEntrustCertificate', true],
    ['cve-detected', 'v.cveDetected', true],
    ['cvd-enrolled', 'v.cvdEnrollment.status', 'enrolled'],
    ['cvd-pending', 'v.cvdEnrollment.status', 'pending'],
  ]

  test.each(TAG_CASES)('tag value "%s" filters on field %s', (filterValue, aqlField) => {
    const { query } = parse(
      buildDomainFilters({
        filters: [{ filterCategory: 'tags', comparison: '==', filterValue }],
      }),
    )
    expect(query).toContain(`FILTER ${aqlField}`)
  })

  it('applies != comparison for a mapped tag (archived)', () => {
    const { query } = parse(
      buildDomainFilters({
        filters: [{ filterCategory: 'tags', comparison: '!=', filterValue: 'archived' }],
      }),
    )
    expect(query).toContain('FILTER v.archived !=')
  })
})

describe('buildDomainFilters – tags filter (unmapped / free-form)', () => {
  it('falls back to POSITION(e.tags, ...) for an unknown tag value', () => {
    const { query, bindVars } = parse(
      buildDomainFilters({
        filters: [{ filterCategory: 'tags', comparison: '==', filterValue: 'some-custom-tag' }],
      }),
    )
    expect(query).toContain('FILTER POSITION(e.tags,')
    expect(query).toContain('== true')
    expect(Object.values(bindVars)).toContain('some-custom-tag')
  })

  it('uses != with POSITION for an unknown tag with != comparison', () => {
    const { query } = parse(
      buildDomainFilters({
        filters: [{ filterCategory: 'tags', comparison: '!=', filterValue: 'another-tag' }],
      }),
    )
    expect(query).toContain('POSITION(e.tags,')
    expect(query).toContain('!= true')
  })
})

// ─── Other filter categories ─────────────────────────────────────────────────

describe('buildDomainFilters – asset-state filter', () => {
  it('filters on e.assetState with == comparison', () => {
    const { query, bindVars } = parse(
      buildDomainFilters({
        filters: [{ filterCategory: 'asset-state', comparison: '==', filterValue: 'approved' }],
      }),
    )
    expect(query).toContain('FILTER e.assetState ==')
    expect(Object.values(bindVars)).toContain('approved')
  })

  it('filters on e.assetState with != comparison', () => {
    const { query } = parse(
      buildDomainFilters({
        filters: [{ filterCategory: 'asset-state', comparison: '!=', filterValue: 'hidden' }],
      }),
    )
    expect(query).toContain('FILTER e.assetState !=')
  })
})

describe('buildDomainFilters – guidance-tag filter', () => {
  it('filters using POSITION(negativeTags, ...) with == comparison', () => {
    const { query, bindVars } = parse(
      buildDomainFilters({
        filters: [{ filterCategory: 'guidance-tag', comparison: '==', filterValue: 'weak-cipher' }],
      }),
    )
    expect(query).toContain('FILTER POSITION(negativeTags,')
    expect(query).toContain('== true')
    expect(Object.values(bindVars)).toContain('weak-cipher')
  })

  it('filters using POSITION(negativeTags, ...) with != comparison', () => {
    const { query } = parse(
      buildDomainFilters({
        filters: [{ filterCategory: 'guidance-tag', comparison: '!=', filterValue: 'weak-cipher' }],
      }),
    )
    expect(query).toContain('FILTER POSITION(negativeTags,')
    expect(query).toContain('!= true')
  })
})

describe('buildDomainFilters – dmarc-phase filter', () => {
  it('filters on v.phase with == comparison', () => {
    const { query, bindVars } = parse(
      buildDomainFilters({
        filters: [{ filterCategory: 'dmarc-phase', comparison: '==', filterValue: 'assess' }],
      }),
    )
    expect(query).toContain('FILTER v.phase ==')
    expect(Object.values(bindVars)).toContain('assess')
  })

  it('filters on v.phase with != comparison', () => {
    const { query } = parse(
      buildDomainFilters({
        filters: [{ filterCategory: 'dmarc-phase', comparison: '!=', filterValue: 'deploy' }],
      }),
    )
    expect(query).toContain('FILTER v.phase !=')
  })
})

describe('buildDomainFilters – unknown filterCategory', () => {
  it('silently skips an unrecognised filter category', () => {
    const { query, bindVars } = parse(
      buildDomainFilters({
        filters: [{ filterCategory: 'totally-unknown', comparison: '==', filterValue: 'x' }],
      }),
    )
    // The accumulated fragment should be empty — nothing appended
    expect(query).toBe('')
    expect(bindVars).toEqual({})
  })
})

// ─── Multiple filters combined ───────────────────────────────────────────────

describe('buildDomainFilters – multiple filters', () => {
  it('accumulates all filters into a single AQL fragment', () => {
    const { query, bindVars } = parse(
      buildDomainFilters({
        filters: [
          { filterCategory: 'dmarc-status', comparison: '==', filterValue: 'pass' },
          { filterCategory: 'https-status', comparison: '!=', filterValue: 'fail' },
          { filterCategory: 'asset-state', comparison: '==', filterValue: 'approved' },
        ],
      }),
    )
    expect(query).toContain('FILTER v.status.dmarc ==')
    expect(query).toContain('FILTER v.status.https !=')
    expect(query).toContain('FILTER e.assetState ==')
    expect(Object.values(bindVars)).toContain('pass')
    expect(Object.values(bindVars)).toContain('fail')
    expect(Object.values(bindVars)).toContain('approved')
  })

  it('combines a mapped tag filter with a status filter', () => {
    const { query } = parse(
      buildDomainFilters({
        filters: [
          { filterCategory: 'tags', comparison: '==', filterValue: 'blocked' },
          { filterCategory: 'spf-status', comparison: '==', filterValue: 'pass' },
        ],
      }),
    )
    expect(query).toContain('FILTER v.blocked')
    expect(query).toContain('FILTER v.status.spf')
  })

  it('handles an unknown filter mixed with a valid one without losing the valid one', () => {
    const { query } = parse(
      buildDomainFilters({
        filters: [
          { filterCategory: 'dmarc-phase', comparison: '==', filterValue: 'assess' },
          { filterCategory: 'not-a-real-category', comparison: '==', filterValue: 'nope' },
        ],
      }),
    )
    expect(query).toContain('FILTER v.phase ==')
    // The unknown category should not add anything extra
    expect(query).not.toContain('nope')
  })
})
