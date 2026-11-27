const { DB_PASS: rootPass, DB_URL: url } = process.env

const { dbNameFromFile } = require('arango-tools')
const { ensureDatabase: ensure } = require('../testUtilities')
const { databaseOptions } = require('../../database-options')

const { getNewAuditLogs } = require('../database')

const DAY = 1000 * 60 * 60 * 24

describe('given the getNewAuditLogs function', () => {
  let query, drop, truncate, collections

  beforeAll(async () => {
    // Generate DB Items
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
    const time = new Date()
    let log, log2
    beforeEach(async () => {
      log = await collections.auditLogs.save({
        timestamp: time - 1000,
        initiatedBy: {
          id: '123',
          userName: 'user@test.ca',
          role: 'admin',
        },
        action: 'add',
        target: {
          resource: 'test.domain.gc.ca',
          updatedProperties: [],
          organization: {
            id: '123',
            name: 'test org',
          }, // name of resource being acted upon
          resourceType: 'domain', // user, org, domain
        },
      })
      log2 = await collections.auditLogs.save({
        timestamp: time - 1000,
        initiatedBy: {
          id: '123',
          userName: 'user@test.ca',
          role: 'admin',
        },
        action: 'remove',
        target: {
          resource: 'removed-user@test.ca',
          updatedProperties: [],
          organization: {
            id: '123',
            name: 'test org',
          }, // name of resource being acted upon
          resourceType: 'user', // user, org, domain
        },
      })
    })
    it('returns the org admins', async () => {
      const auditLogs = await getNewAuditLogs({ query, orgKey: '123', window: DAY })
      const expectedAuditLogs = [
        {
          ...log,
          timestamp: time - 1000,
          initiatedBy: {
            id: '123',
            userName: 'user@test.ca',
            role: 'admin',
          },
          action: 'add',
          target: {
            resource: 'test.domain.gc.ca',
            updatedProperties: [],
            organization: {
              id: '123',
              name: 'test org',
            }, // name of resource being acted upon
            resourceType: 'domain', // user, org, domain
          },
        },
        {
          ...log2,
          timestamp: time - 1000,
          initiatedBy: {
            id: '123',
            userName: 'user@test.ca',
            role: 'admin',
          },
          action: 'remove',
          target: {
            resource: 'removed-user@test.ca',
            updatedProperties: [],
            organization: {
              id: '123',
              name: 'test org',
            }, // name of resource being acted upon
            resourceType: 'user', // user, org, domain
          },
        },
      ]
      expect(auditLogs).toEqual(expectedAuditLogs)
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
      const failure = getNewAuditLogs({ query: buildQuery(cause), orgKey: '123', window: DAY })

      await expect(failure).rejects.toThrow('Database error occurred while trying to find audit logs')
      await expect(failure).rejects.toHaveProperty('cause', cause)
    })
  })
})
