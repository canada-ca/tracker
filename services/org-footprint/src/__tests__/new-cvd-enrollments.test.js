const { buildNewEnrollmentEmailPayload } = require('../core/new-cvd-enrollments')

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

const HEADER =
  '| Domain | Organization | Timestamp | Initiated by | Enrollment status |\n| --- | --- | --- | --- | --- |'

describe('buildNewEnrollmentEmailPayload', () => {
  it.each([
    ['empty logs', []],
    ['logs without a cvdEnrollment property', [unrelatedLog(), unrelatedLog()]],
  ])('returns null for %s', (_name, logs) => {
    expect(buildNewEnrollmentEmailPayload(logs)).toBeNull()
  })

  it('builds a table and count for a single enrollment log', () => {
    expect(buildNewEnrollmentEmailPayload([enrollmentLog()])).toEqual({
      enrollments_table: `${HEADER}\n| example.gc.ca | Test Org | 2026-01-01T00:00:00.000Z | user@example.gc.ca | enrolled |`,
      enrollments_count: 1,
    })
  })

  it('builds one row per enrollment log, in order', () => {
    const payload = buildNewEnrollmentEmailPayload([
      enrollmentLog({ domain: 'a.gc.ca' }),
      enrollmentLog({ domain: 'b.gc.ca', newValue: 'pending' }),
    ])

    expect(payload.enrollments_count).toBe(2)
    expect(payload.enrollments_table.split('\n').slice(2)).toEqual([
      '| a.gc.ca | Test Org | 2026-01-01T00:00:00.000Z | user@example.gc.ca | enrolled |',
      '| b.gc.ca | Test Org | 2026-01-01T00:00:00.000Z | user@example.gc.ca | pending |',
    ])
  })

  it('includes only enrollment logs when mixed with unrelated logs', () => {
    const payload = buildNewEnrollmentEmailPayload([unrelatedLog(), enrollmentLog(), unrelatedLog()])

    expect(payload).toEqual({
      enrollments_table: `${HEADER}\n| example.gc.ca | Test Org | 2026-01-01T00:00:00.000Z | user@example.gc.ca | enrolled |`,
      enrollments_count: 1,
    })
  })

  it('escapes pipe characters in table cells', () => {
    const payload = buildNewEnrollmentEmailPayload([enrollmentLog({ orgName: 'Org | Name' })])

    expect(payload.enrollments_table).toContain('| Org \\| Name |')
  })
})
