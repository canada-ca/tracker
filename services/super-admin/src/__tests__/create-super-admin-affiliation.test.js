const { DB_PASS: rootPass, DB_URL: url } = process.env

const { dbNameFromFile } = require('arango-tools')
const { ensureDatabase: ensure } = require('../testUtilities')

const { databaseOptions } = require('../../database-options')
const { createSuperAdminAffiliation } = require('../database')

describe('given the createSuperAdminAffiliation function', () => {
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
    describe('transaction step error occurs', () => {
      it('throws an error', async () => {
        const mockedTransaction = jest.fn().mockReturnValueOnce({
          step() {
            throw new Error('Database error occurred.')
          },
          commit() {
            throw new Error('Database error occurred.')
          },
          abort() {},
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
              'Transaction step error occurred while creating new super admin affiliation: Error: Database error occurred.',
            ),
          )
        }
      })
    })
    describe('transaction commit error occurs', () => {
      it('throws an error', async () => {
        const mockedTransaction = jest.fn().mockReturnValueOnce({
          step() {
            return 'string'
          },
          commit() {
            throw new Error('Database error occurred.')
          },
          abort() {},
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
