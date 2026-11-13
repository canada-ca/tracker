const { DB_PASS: rootPass, DB_URL: url } = process.env

const { dbNameFromFile } = require('arango-tools')
const { ensureDatabase: ensure } = require('../testUtilities')
const { databaseOptions } = require('../../database-options')

const { getPendingOrgUserCount } = require('../database')

describe('given the getPendingOrgUserCount function', () => {
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
    // eslint-disable-next-line no-unused-vars
    let org, user, affiliation
    beforeEach(async () => {
      org = await collections.organizations.save({})
      user = await collections.users.save({})
      affiliation = await collections.affiliations.save({
        _from: org._id,
        _to: user._id,
        permission: 'pending',
      })
    })
    it('returns the pending user count', async () => {
      const pendingUserCount = await getPendingOrgUserCount({ query, orgKey: org._key })

      const expectedPendingUserCount = 1

      expect(pendingUserCount).toEqual(expectedPendingUserCount)
    })
  })
  describe('given an unsuccessful query', () => {
    const failures = [
      {
        name: 'the query fails',
        buildQuery: (cause) => jest.fn().mockRejectedValue(cause),
        cause: new Error('Database error occurred.'),
        message: 'Database error occurred while trying to find pending users',
      },
      {
        name: 'the cursor fails',
        buildQuery: (cause) => jest.fn().mockResolvedValue({ all: () => Promise.reject(cause) }),
        cause: new Error('Cursor error occurred.'),
        message: 'Cursor error occurred while trying to find pending users',
      },
    ]

    it.each(failures)('throws with the original error as cause when $name', async ({ buildQuery, cause, message }) => {
      const failure = getPendingOrgUserCount({ query: buildQuery(cause) })

      await expect(failure).rejects.toThrow(message)
      await expect(failure).rejects.toHaveProperty('cause', cause)
    })
  })
})
