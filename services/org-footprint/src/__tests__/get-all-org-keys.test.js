const { DB_PASS: rootPass, DB_URL: url } = process.env

const { dbNameFromFile } = require('arango-tools')
const { ensureDatabase: ensure } = require('../testUtilities')
const { databaseOptions } = require('../../database-options')

const { getAllOrgKeys } = require('../database')

describe('given the getAllOrgKeys function', () => {
  const consoleErrorOutput = []
  const consoleInfoOutput = []
  const mockedError = (output) => consoleErrorOutput.push(output)
  const mockedInfo = (output) => consoleInfoOutput.push(output)

  let query, drop, truncate, collections

  beforeAll(async () => {
    // Generate DB Items
    ;({ query, drop, truncate, collections } = await ensure({
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

  describe('given a successful query', () => {
    let org, org2
    beforeEach(async () => {
      org = await collections.organizations.save({
        orgDetails: {
          en: {
            name: 'test org',
          },
          fr: {
            name: 'test org',
          },
        },
      })
      org2 = await collections.organizations.save({
        orgDetails: {
          en: {
            name: 'test org 2',
          },
          fr: {
            name: 'test org 2',
          },
        },
      })
    })
    it('returns the org keys', async () => {
      const orgKeys = await getAllOrgKeys({ query })

      const expectedOrgKeys = [org._key, org2._key]

      expect(orgKeys).toEqual(expectedOrgKeys)
    })
  })
  describe('given an unsuccessful query', () => {
    describe('when the query fails', () => {
      it('throws an error', async () => {
        const mockQuery = jest.fn().mockRejectedValue(new Error('Database error occurred.'))
        try {
          await getAllOrgKeys({ query: mockQuery })
        } catch (err) {
          expect(err).toEqual(
            new Error('Database error occurred while trying to find org keys: Error: Database error occurred.'),
          )
        }
      })
    })
    describe('when the cursor fails', () => {
      it('throws an error', async () => {
        const cursor = {
          all() {
            throw new Error('Cursor error occurred.')
          },
        }
        const mockQuery = jest.fn().mockReturnValue(cursor)
        try {
          await getAllOrgKeys({ query: mockQuery })
        } catch (err) {
          expect(err).toEqual(
            new Error('Cursor error occurred while trying to find org keys: Error: Cursor error occurred.'),
          )
        }
      })
    })
  })
})
