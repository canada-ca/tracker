const { buildCvdEnrollmentChangesPayload } = require('../core/new-cvd-enrollments')

const enrollmentLog = ({
  domain = 'example.gc.ca',
  orgName = 'Test Org',
  timestamp = '2026-01-01T00:00:00.000Z',
  userName = 'user@example.gc.ca',
  newValue = 'enrolled',
} = {}) => ({
  timestamp,
  action: 'update',
  initiatedBy: { id: '1', userName, role: 'admin', ipAddress: '127.0.0.1' },
  target: {
    resource: domain,
    organization: { id: 'org1', name: orgName },
    resourceType: 'domain',
    updatedProperties: [{ name: 'cvdEnrollment', oldValue: 'not-enrolled', newValue }],
  },
})

const unrelatedLog = () => ({
  timestamp: '2026-01-02T00:00:00.000Z',
  action: 'update',
  initiatedBy: { id: '2', userName: 'other@example.gc.ca', role: 'admin', ipAddress: '127.0.0.2' },
  target: {
    resource: 'other.gc.ca',
    organization: { id: 'org1', name: 'Test Org' },
    resourceType: 'domain',
    updatedProperties: [{ name: 'tags', oldValue: [], newValue: ['new'] }],
  },
})

const block = ({
  domain = 'example.gc.ca',
  org = 'Test Org',
  status = 'enrolled',
  user = 'user@example.gc.ca',
  time = '2026-01-01, 00:00 UTC',
} = {}) => `# ${domain}\n* Organization: ${org}\n* Status: ${status}\n* Initiated by: ${user}\n* Time: ${time}`

const SEPARATOR = '\n\n---\n\n'

describe('buildCvdEnrollmentChangesPayload', () => {
  it.each([
    ['empty logs', []],
    ['logs without a cvdEnrollment property', [unrelatedLog(), unrelatedLog()]],
  ])('returns null for %s', (_name, logs) => {
    expect(buildCvdEnrollmentChangesPayload(logs)).toBeNull()
  })

  it.each([
    ['no updatedProperties array', (log) => ({ ...log, target: { ...log.target, updatedProperties: undefined } })],
    ['a non-array updatedProperties', (log) => ({ ...log, target: { ...log.target, updatedProperties: {} } })],
    ['no organization', (log) => ({ ...log, target: { ...log.target, organization: undefined } })],
  ])('skips a malformed log with %s and keeps well-formed logs', (_name, malform) => {
    const payload = buildCvdEnrollmentChangesPayload([malform(enrollmentLog({ domain: 'bad.gc.ca' })), enrollmentLog()])

    expect(payload).toEqual({ enrollments_list: block(), enrollments_count: 1 })
  })

  it('returns null when every log is malformed', () => {
    const malformed = { ...enrollmentLog(), target: { resource: 'x.gc.ca' } }

    expect(buildCvdEnrollmentChangesPayload([malformed])).toBeNull()
  })

  it('builds a block and count for a single enrollment log', () => {
    expect(buildCvdEnrollmentChangesPayload([enrollmentLog()])).toEqual({
      enrollments_list: block(),
      enrollments_count: 1,
    })
  })

  it('joins blocks with a blank-line rule and no trailing rule', () => {
    const payload = buildCvdEnrollmentChangesPayload([
      enrollmentLog({ domain: 'a.gc.ca' }),
      enrollmentLog({ domain: 'b.gc.ca', newValue: 'pending' }),
    ])

    expect(payload.enrollments_count).toBe(2)
    expect(payload.enrollments_list).toBe(
      `${block({ domain: 'a.gc.ca' })}${SEPARATOR}${block({ domain: 'b.gc.ca', status: 'pending' })}`,
    )
  })

  it('includes only enrollment logs when mixed with unrelated logs', () => {
    const payload = buildCvdEnrollmentChangesPayload([unrelatedLog(), enrollmentLog(), unrelatedLog()])

    expect(payload).toEqual({ enrollments_list: block(), enrollments_count: 1 })
  })

  it('shows the new value when a domain is un-enrolled', () => {
    const payload = buildCvdEnrollmentChangesPayload([enrollmentLog({ newValue: 'not-enrolled' })])

    expect(payload.enrollments_list).toContain('* Status: not-enrolled')
  })

  it.each([
    ['newlines collapsed', 'Test\r\n\nOrg', 'Test Org'],
    ['surrounding whitespace trimmed', '  Test Org  ', 'Test Org'],
    ['leading #', '#Org', '\\#Org'],
    ['leading *', '*Org', '\\*Org'],
    ['leading -', '-Org', '\\-Org'],
    ['leading +', '+Org', '\\+Org'],
    ['leading >', '>Org', '\\>Org'],
    ['inner markdown characters kept', 'Org - #1', 'Org - #1'],
    ['pipe not escaped', 'Org | Name', 'Org | Name'],
    ['null becomes empty', null, ''],
    ['undefined becomes empty', undefined, ''],
  ])('escapes the organization name: %s', (_name, orgName, expected) => {
    const log = enrollmentLog()
    log.target.organization.name = orgName
    const payload = buildCvdEnrollmentChangesPayload([log])

    expect(payload.enrollments_list).toContain(`\n* Organization: ${expected}\n`)
  })

  it.each([
    ['a normal ISO timestamp', '2026-11-12T00:00:00.000Z', '2026-11-12, 00:00 UTC'],
    ['an afternoon time on a 24-hour clock', '2026-11-12T15:45:30.000Z', '2026-11-12, 15:45 UTC'],
    ['the last minute of a UTC day', '2026-11-12T23:59:59.999Z', '2026-11-12, 23:59 UTC'],
    ['previous day in Toronto, shown in UTC', '2026-01-01T02:00:00.000Z', '2026-01-01, 02:00 UTC'],
    ['an offset timestamp converted to UTC', '2026-11-12T00:00:00.000-05:00', '2026-11-12, 05:00 UTC'],
    ['a missing timestamp', undefined, ''],
    ['a null timestamp', null, ''],
    ['an empty timestamp', '', ''],
    ['an unparseable timestamp', 'not-a-date', 'not-a-date'],
  ])('formats the time for %s', (_name, timestamp, expected) => {
    const payload = buildCvdEnrollmentChangesPayload([enrollmentLog({ timestamp })])

    expect(payload.enrollments_list).toContain(`\n* Time: ${expected}`)
    expect(payload.enrollments_list).not.toContain('Invalid Date')
  })

  it('keeps markdown escaping on an unparseable timestamp', () => {
    const payload = buildCvdEnrollmentChangesPayload([enrollmentLog({ timestamp: '#bad\nvalue' })])

    expect(payload.enrollments_list).toContain('\n* Time: \\#bad value')
  })

  it('applies the same escape to the domain heading', () => {
    const payload = buildCvdEnrollmentChangesPayload([enrollmentLog({ domain: '#a.gc.ca' })])

    expect(payload.enrollments_list.startsWith('# \\#a.gc.ca\n')).toBe(true)
  })
})
