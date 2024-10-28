const { DB_PASS: rootPass, DB_URL: url } = process.env

const { dbNameFromFile } = require('arango-tools')
const { ensureDatabase: ensure } = require('../testUtilities')

const { databaseOptions } = require('../../database-options')
const { createSuperAdminOrg } = require('../database')

describe('given the createSuperAdminOrg function', () => {
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
    it('returns the super admin org', async () => {
      const superAdminOrg = await createSuperAdminOrg({
        collections,
        transaction,
      })

      const orgCursor = await query`
        FOR org IN organizations
          RETURN { _id: org._id, _key: org._key, _rev: org._rev }
      `
      const expectedOrg = await orgCursor.next()

      expect(superAdminOrg).toEqual(expectedOrg)
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

        try {
          await createSuperAdminOrg({
            collections,
            transaction: mockedTransaction,
          })
        } catch (err) {
          expect(err).toEqual(
            new Error(
              'Transaction step error occurred while creating new super admin org: Error: Database error occurred.',
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

        try {
          await createSuperAdminOrg({
            collections,
            transaction: mockedTransaction,
          })
        } catch (err) {
          expect(err).toEqual(
            new Error(
              'Transaction commit error occurred while creating new super admin org: Error: Database error occurred.',
            ),
          )
        }
      })
    })
  })
})
