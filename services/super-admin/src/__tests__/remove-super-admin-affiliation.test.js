const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')

const { makeMigrations } = require('../../migrations')
const { removeSuperAdminAffiliation } = require('../database')

describe('given the removeSuperAdminAffiliation function', () => {
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

  describe('given a successful removal', () => {
    beforeEach(async () => {
      await collections.affiliations.save({
        _from: 'organizations/1',
        _to: 'users/1',
        permission: 'super_admin',
        defaultSA: true,
      })
    })
    it('returns the old affiliation', async () => {
      await removeSuperAdminAffiliation({ query, collections, transaction })

      const affCursor = await query`
        FOR aff IN affiliations
          FILTER aff.defaultSA == true
          RETURN aff
      `
      const affiliation = await affCursor.next()
      expect(affiliation).toEqual(undefined)
    })
  })
  describe('given an unsuccessful removal', () => {
    describe('database error occurs', () => {
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
          await removeSuperAdminAffiliation({
            query,
            collections,
            transaction: mockedTransaction,
          })
        } catch (err) {
          expect(err).toEqual(
            new Error(
              'Transaction run error occurred well removing super admin affiliation: Error: Database error occurred.',
            ),
          )
        }
      })
    })
    describe('cursor error occurs', () => {
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
          await removeSuperAdminAffiliation({
            query,
            collections,
            transaction: mockedTransaction,
          })
        } catch (err) {
          expect(err).toEqual(
            new Error(
              'Transaction commit error occurred while removing new super admin affiliation: Error: Database error occurred.',
            ),
          )
        }
      })
    })
  })
})
