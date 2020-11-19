const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')

const { makeMigrations } = require('../../migrations')
const { createSuperAdminOrg } = require('../database')

describe('given the createSuperAdminOrg function', () => {
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

        try {
          await createSuperAdminOrg({
            collections,
            transaction: mockedTransaction,
          })
        } catch (err) {
          expect(err).toEqual(
            new Error(
              'Transaction run error occurred while creating new super admin org: Error: Database error occurred.',
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
