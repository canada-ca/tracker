const { DB_PASS: rootPass, DB_URL: url } = process.env

const { dbNameFromFile } = require('arango-tools')
const { ensureDatabase: ensure } = require('../testUtilities')
const { databaseOptions } = require('../../database-options')

const { getBilingualOrgNames } = require('../database')

describe('given the getBilingualOrgNames function', () => {
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
    let org
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
    })
    it('returns the org names', async () => {
      const orgNames = await getBilingualOrgNames({
        query,
        orgKey: org._key,
      })

      const expectedOrgNames = {
        en: 'test org',
        fr: 'test org',
      }

      expect(orgNames).toEqual(expectedOrgNames)
    })
  })
  describe('given an unsuccessful query', () => {
    const failures = [
      {
        name: 'the query fails',
        buildQuery: (cause) => jest.fn().mockRejectedValue(cause),
        cause: new Error('Database error occurred.'),
        message: 'Database error occurred while trying to find org names',
      },
      {
        name: 'the cursor fails',
        buildQuery: (cause) => jest.fn().mockResolvedValue({ next: () => Promise.reject(cause) }),
        cause: new Error('Cursor error occurred.'),
        message: 'Cursor error occurred while trying to find org names',
      },
    ]

    it.each(failures)('throws with the original error as cause when $name', async ({ buildQuery, cause, message }) => {
      const failure = getBilingualOrgNames({ query: buildQuery(cause) })

      await expect(failure).rejects.toThrow(message)
      await expect(failure).rejects.toHaveProperty('cause', cause)
    })
  })
})
