const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ensure, dbNameFromFile } = require('arango-tools')
const { databaseOptions } = require('../../database-options')

const { checkForSuperAdminOrg, createSuperAdminOrg } = require('../database')

describe('given the checkForSuperAdminOrg function', () => {
  const consoleErrorOutput = []
  const consoleInfoOutput = []
  const mockedError = (output) => consoleErrorOutput.push(output)
  const mockedInfo = (output) => consoleInfoOutput.push(output)

  let query, drop, truncate, collections, transaction

  beforeAll(async () => {
    // Generate DB Items
    ;({ query, drop, truncate, collections, transaction } = await ensure({
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

  describe('given a successful check', () => {
    let org
    beforeEach(async () => {
      const orgDBInfo = await createSuperAdminOrg({ collections, transaction })
      const orgCursor = await query`
        FOR org IN organizations
          FILTER org._key == ${orgDBInfo._key}
          RETURN org
      `
      org = await orgCursor.next()
    })
    it('returns the super admin org', async () => {
      const superAdminOrg = await checkForSuperAdminOrg({ query })
      expect(superAdminOrg).toEqual(org)
    })
  })
  describe('given an unsuccessful check', () => {
    describe('database error occurs', () => {
      it('throws an error', async () => {
        const mockQuery = jest
          .fn()
          .mockRejectedValue(new Error('Database error occurred.'))
        try {
          await checkForSuperAdminOrg({ query: mockQuery })
        } catch (err) {
          expect(err).toEqual(
            new Error(
              'Database error occurred well trying to find super admin org: Error: Database error occurred.',
            ),
          )
        }
      })
    })
    describe('cursor error occurs', () => {
      it('throws an error', async () => {
        const cursor = {
          next() {
            throw new Error('Cursor error occurred.')
          },
        }
        const mockQuery = jest.fn().mockReturnValue(cursor)

        try {
          await checkForSuperAdminOrg({ query: mockQuery })
        } catch (err) {
          expect(err).toEqual(
            new Error(
              'Cursor error occurred well trying to find super admin org: Error: Cursor error occurred.',
            ),
          )
        }
      })
    })
  })
})
