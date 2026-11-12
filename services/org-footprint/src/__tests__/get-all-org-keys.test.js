const { DB_PASS: rootPass, DB_URL: url } = process.env

const { dbNameFromFile } = require('arango-tools')
const { ensureDatabase: ensure } = require('../testUtilities')
const { databaseOptions } = require('../../database-options')

const { getAllOrgKeys } = require('../database')

describe('given the getAllOrgKeys function', () => {
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
    let org, org2
    beforeEach(async () => {
      org = await collections.organizations.save({
        orgDetails: {
          en: {
            name: 'test org',
          },
          fr: {
            name: 'test org',
          },
        },
      })
      org2 = await collections.organizations.save({
        orgDetails: {
          en: {
            name: 'test org 2',
          },
          fr: {
            name: 'test org 2',
          },
        },
      })
    })
    it('returns the org keys', async () => {
      const orgKeys = await getAllOrgKeys({ query })

      const expectedOrgKeys = [org._key, org2._key]

      expect(orgKeys).toEqual(expectedOrgKeys)
    })
  })
  describe('given an unsuccessful query', () => {
    const failures = [
      {
        name: 'the query fails',
        buildQuery: (cause) => jest.fn().mockRejectedValue(cause),
        cause: new Error('Database error occurred.'),
        message: 'Database error occurred while trying to find org keys',
      },
      {
        name: 'the cursor fails',
        buildQuery: (cause) => jest.fn().mockResolvedValue({ all: () => Promise.reject(cause) }),
        cause: new Error('Cursor error occurred.'),
        message: 'Cursor error occurred while trying to find org keys',
      },
    ]

    it.each(failures)('throws with the original error as cause when $name', async ({ buildQuery, cause, message }) => {
      const failure = getAllOrgKeys({ query: buildQuery(cause) })

      await expect(failure).rejects.toThrow(message)
      await expect(failure).rejects.toHaveProperty('cause', cause)
    })
  })
})
