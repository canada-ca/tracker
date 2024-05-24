const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ensure, dbNameFromFile } = require('arango-tools')
const { databaseOptions } = require('../../database-options')

const { getNewAuditLogs } = require('../database')

describe('given the getNewAuditLogs function', () => {
  const consoleErrorOutput = []
  const consoleInfoOutput = []
  const mockedError = (output) => consoleErrorOutput.push(output)
  const mockedInfo = (output) => consoleInfoOutput.push(output)

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
    console.error = mockedError
    console.info = mockedInfo
    consoleErrorOutput.length = 0
    consoleInfoOutput.length = 0

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
      const auditLogs = await getNewAuditLogs({ query, orgKey: '123' })
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
    describe('when the query fails', () => {
      it('throws an error', async () => {
        const mockQuery = jest.fn().mockRejectedValue(new Error('Database error occurred.'))
        try {
          await getNewAuditLogs({ query: mockQuery })
        } catch (err) {
          expect(err).toEqual(
            new Error('Database error occurred while trying to find audit logs: Error: Database error occurred.'),
          )
        }
      })
    })
    describe('when the cursor fails', () => {
      it('throws an error', async () => {
        const cursor = {
          all() {
            throw new Error('Cursor error occurred.')
          },
        }
        const mockQuery = jest.fn().mockReturnValue(cursor)
        try {
          await getNewAuditLogs({ query: mockQuery })
        } catch (err) {
          expect(err).toEqual(
            new Error('Cursor error occurred while trying to find audit logs: Error: Cursor error occurred.'),
          )
        }
      })
    })
  })
})
