const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')

const { makeMigrations } = require('../../migrations')
const { createSuperAdminAffiliation } = require('../database')

describe('given the createSuperAdminAffiliation function', () => {
  const consoleErrorOutput = []
  const consoleInfoOutput = []
  const mockedError = (output) => consoleErrorOutput.push(output)
  const mockedInfo = (output) => consoleInfoOutput.push(output)

  let query, drop, truncate, migrate, collections, transaction

  beforeAll(async () => {
    // Generate DB Items
    ;({ migrate } = await ArangoTools({ rootPass, url }))
    ;({ query, drop, truncate, collections, transaction } = await migrate(
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

  describe('given a successful creation', () => {
    it('returns the super admin affiliation', async () => {
      const org = {
        _id: 'organizations/1',
      }
      const admin = {
        _id: 'users/1',
      }
      const superAdminAffiliation = await createSuperAdminAffiliation({
        collections,
        transaction,
        org,
        admin,
      })

      const affiliationCursor = await query`
      FOR aff IN affiliations
        RETURN { _id: aff._id, _key: aff._key, _rev: aff._rev }
    `
      const expectedAffiliation = await affiliationCursor.next()
      expect(superAdminAffiliation).toEqual(expectedAffiliation)
    })
  })
  describe('given an unsuccessful creation', () => {
    describe('transaction run error occurs', () => {
      it('throws an error', async () => {
        const mockedTransaction = jest.fn().mockReturnValueOnce({
          run() {
            throw new Error('Database error occurred.')
          },
          commit() {
            throw new Error('Database error occurred.')
          },
        })

        const org = {
          _id: 'organizations/1',
        }
        const admin = {
          _id: 'users/1',
        }

        try {
          await createSuperAdminAffiliation({
            collections,
            transaction: mockedTransaction,
            org,
            admin,
          })
        } catch (err) {
          expect(err).toEqual(
            new Error(
              'Transaction run error occurred while creating new super admin affiliation: Error: Database error occurred.',
            ),
          )
        }
      })
    })
    describe('transaction commit error occurs', () => {
      it('throws an error', async () => {
        const mockedTransaction = jest.fn().mockReturnValueOnce({
          run() {
            return 'string'
          },
          commit() {
            throw new Error('Database error occurred.')
          },
        })

        const org = {
          _id: 'organizations/1',
        }
        const admin = {
          _id: 'users/1',
        }

        try {
          await createSuperAdminAffiliation({
            collections,
            transaction: mockedTransaction,
            org,
            admin,
          })
        } catch (err) {
          expect(err).toEqual(
            new Error(
              'Transaction commit error occurred while creating new super admin affiliation: Error: Database error occurred.',
            ),
          )
        }
      })
    })
  })
})
