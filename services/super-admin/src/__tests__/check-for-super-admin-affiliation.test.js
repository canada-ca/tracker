const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { makeMigrations } = require('../../migrations')

const { checkForSuperAdminAffiliation } = require('../database')

describe('given the checkForSuperAdminAffiliation function', () => {
  const consoleErrorOutput = []
  const consoleInfoOutput = []
  const mockedError = (output) => consoleErrorOutput.push(output)
  const mockedInfo = (output) => consoleInfoOutput.push(output)

  let query, drop, truncate, migrate, collections

  beforeAll(async () => {
    // Generate DB Items
    ;({ migrate } = await ArangoTools({ rootPass, url }))
    ;({ query, drop, truncate, collections } = await migrate(
      makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
    ))
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
    let affiliation
    beforeEach(async () => {
      await collections.affiliations.save({
        _from: 'organizations/1',
        _to: 'user/1',
        permission: 'super_admin',
        defaultSA: true,
      })
      const affiliationCursor = await query`
        FOR aff IN affiliations
          FILTER aff.defaultSA == true
          RETURN aff
      `
      affiliation = await affiliationCursor.next()
    })
    it('returns the super admin affiliation', async () => {
      const superAdminAff = await checkForSuperAdminAffiliation({ query })
      expect(superAdminAff).toEqual(affiliation)
    })
  })
  describe('given an unsuccessful check', () => {
    describe('database error occurs', () => {
      it('throws an error', async () => {
        const mockQuery = jest
          .fn()
          .mockRejectedValue(new Error('Database error occurred.'))
        try {
          await checkForSuperAdminAffiliation({ query: mockQuery })
        } catch (err) {
          expect(err).toEqual(
            new Error(
              'Database error occurred well trying to find super admin affiliation: Error: Database error occurred.',
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
          await checkForSuperAdminAffiliation({ query: mockQuery })
        } catch (err) {
          expect(err).toEqual(
            new Error(
              'Cursor error occurred well trying to find super admin affiliation: Error: Cursor error occurred.',
            ),
          )
        }
      })
    })
  })
})
