const { DB_PASS: rootPass, DB_URL: url } = process.env

const { dbNameFromFile } = require('arango-tools')
const { ensureDatabase: ensure } = require('../testUtilities')
const { databaseOptions } = require('../../database-options')

const { getOrgUsers } = require('../database')

describe('given the getOrgUsers function', () => {
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
    let org, user
    beforeEach(async () => {
      org = await collections.organizations.save({})
      user = await collections.users.save({
        userName: 'user@test.ca',
        emailUpdateOptions: { orgFootprint: true },
      })
      await collections.affiliations.save({
        _from: org._id,
        _to: user._id,
        permission: 'user',
      })
    })
    it('returns the org users', async () => {
      const users = await getOrgUsers({ query, orgKey: org._key })
      expect(users).toEqual([expect.objectContaining({ _key: user._key, userName: 'user@test.ca' })])
    })
  })
  describe('given an unsuccessful query', () => {
    const failures = [
      {
        name: 'the query fails',
        buildQuery: (cause) => jest.fn().mockRejectedValue(cause),
        cause: new Error('Database error occurred.'),
        message: 'Database error occurred while trying to find org users',
      },
      {
        name: 'the cursor fails',
        buildQuery: (cause) => jest.fn().mockResolvedValue({ all: () => Promise.reject(cause) }),
        cause: new Error('Cursor error occurred.'),
        message: 'Cursor error occurred while trying to find org users',
      },
    ]

    it.each(failures)('throws with the original error as cause when $name', async ({ buildQuery, cause, message }) => {
      const failure = getOrgUsers({ query: buildQuery(cause), orgKey: '123' })

      await expect(failure).rejects.toThrow(message)
      await expect(failure).rejects.toHaveProperty('cause', cause)
    })
  })
})
