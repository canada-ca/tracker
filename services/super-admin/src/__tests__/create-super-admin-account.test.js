const { DB_PASS: rootPass, DB_URL: url } = process.env

const bcrypt = require('bcryptjs')
const { ensure, dbNameFromFile } = require('arango-tools')

const { databaseOptions } = require('../../database-options')
const { createSuperAdminAccount } = require('../database')

describe('given the createSuperAdminAccount function', () => {
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
    it('returns the super admin', async () => {
      const superAdminAccount = await createSuperAdminAccount({
        collections,
        transaction,
        bcrypt,
      })

      const userCursor = await query`
        FOR user IN users
          RETURN { _id: user._id, _key: user._key, _rev: user._rev }
      `
      const expectedUser = await userCursor.next()

      expect(superAdminAccount).toEqual(expectedUser)
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
          await createSuperAdminAccount({
            collections,
            transaction: mockedTransaction,
            bcrypt,
          })
        } catch (err) {
          expect(err).toEqual(
            new Error(
              'Transaction run error occurred while creating new super admin account: Error: Database error occurred.',
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
          await createSuperAdminAccount({
            collections,
            transaction: mockedTransaction,
            bcrypt,
          })
        } catch (err) {
          expect(err).toEqual(
            new Error(
              'Transaction commit error occurred while creating new super admin account: Error: Database error occurred.',
            ),
          )
        }
      })
    })
  })
})
