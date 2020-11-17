const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const bcrypt = require('bcrypt')
const { makeMigrations } = require('../../migrations')

const {
  checkForSuperAdminAccount,
  createSuperAdminAccount,
} = require('../database')

describe('given the checkForSuperAdminAccount function', () => {
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
    let user
    beforeEach(async () => {
      const userDBInfo = await createSuperAdminAccount({ collections, bcrypt })
      const userCursor = await query`
        FOR user IN users
          FILTER user._key == ${userDBInfo._key}
          RETURN user
      `
      user = await userCursor.next()
    })
    it('returns the super admin', async () => {
      const superAdmin = await checkForSuperAdminAccount({ query })
      expect(superAdmin).toEqual(user)
    })
  })
  describe('given an unsuccessful check', () => {
    describe('database error occurs', () => {
      it('throws an error', async () => {
        const mockQuery = jest
          .fn()
          .mockRejectedValue(new Error('Database error occurred.'))
        try {
          await checkForSuperAdminAccount({ query: mockQuery })
        } catch (err) {
          expect(err).toEqual(
            new Error(
              'Database error occurred well trying to find super admin account: Error: Database error occurred.',
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
          await checkForSuperAdminAccount({ query: mockQuery })
        } catch (err) {
          expect(err).toEqual(
            new Error(
              'Cursor error occurred well trying to find super admin account: Error: Cursor error occurred.',
            ),
          )
        }
      })
    })
  })
})
