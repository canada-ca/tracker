const { DB_PASS: rootPass, DB_URL: url } = process.env

const { dbNameFromFile } = require('arango-tools')
const { ensureDatabase: ensure } = require('../testUtilities')
const { databaseOptions } = require('../../database-options')

const { getNewDomainUpdateLogs } = require('../database')

const HOUR = 1000 * 60 * 60
const DAY = 24 * HOUR

const buildLog = ({ ageInHours, action = 'update', resourceType = 'domain' }) => ({
  timestamp: new Date(Date.now() - ageInHours * HOUR).toISOString(),
  action,
  initiatedBy: { id: '123', userName: 'user@test.ca', role: 'admin', ipAddress: '127.0.0.1' },
  target: {
    resource: 'example.gc.ca',
    organization: { id: '456', name: 'test org' },
    resourceType,
    updatedProperties: [{ name: 'cvdEnrollment', oldValue: 'not-enrolled', newValue: 'enrolled' }],
  },
})

describe('given the getNewDomainUpdateLogs function', () => {
  let query, drop, truncate, collections

  beforeAll(async () => {
    ;({ query, drop, truncate, collections } = await ensure({
      type: 'database',
      name: dbNameFromFile(__filename),
      url,
      rootPassword: rootPass,
      options: databaseOptions({ rootPass }),
    }))
  })

  beforeEach(async () => {
    await truncate()
  })

  afterAll(async () => {
    await drop()
  })

  describe('given a successful query', () => {
    const cases = [
      { name: 'returns an update log inside the 24 hour window', log: buildLog({ ageInHours: 1 }), isReturned: true },
      { name: 'skips an update log older than 24 hours', log: buildLog({ ageInHours: 25 }), isReturned: false },
      {
        name: 'skips an update log for a non-domain resource type',
        log: buildLog({ ageInHours: 1, resourceType: 'user' }),
        isReturned: false,
      },
      {
        name: 'skips a domain log with a non-update action',
        log: buildLog({ ageInHours: 1, action: 'add' }),
        isReturned: false,
      },
    ]

    it.each(cases)('$name', async ({ log, isReturned }) => {
      const saved = await collections.auditLogs.save(log)

      const logs = await getNewDomainUpdateLogs({ query, window: DAY })

      expect(logs).toEqual(isReturned ? [{ ...log, _id: saved._id, _key: saved._key, _rev: saved._rev }] : [])
    })
  })

  describe('given an unsuccessful query', () => {
    const failures = [
      {
        name: 'the query fails',
        buildQuery: (cause) => jest.fn().mockRejectedValue(cause),
        cause: new Error('Database error occurred.'),
      },
      {
        name: 'the cursor fails',
        buildQuery: (cause) => jest.fn().mockResolvedValue({ all: () => Promise.reject(cause) }),
        cause: new Error('Cursor error occurred.'),
      },
    ]

    it.each(failures)('throws with the original error as cause when $name', async ({ buildQuery, cause }) => {
      const failure = getNewDomainUpdateLogs({ query: buildQuery(cause), window: DAY })

      await expect(failure).rejects.toThrow('Error occured while trying to find new domain update logs')
      await expect(failure).rejects.toHaveProperty('cause', cause)
    })
  })
})
