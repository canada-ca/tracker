const { DB_PASS: rootPass, DB_URL: url } = process.env

const { dbNameFromFile } = require('arango-tools')
const { ensureDatabase: ensure } = require('../testUtilities')
const { databaseOptions } = require('../../database-options')

const { getBilingualOrgNames } = require('../database')

describe('given the getBilingualOrgNames function', () => {
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
    let org
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
    })
    it('returns the org names', async () => {
      const orgNames = await getBilingualOrgNames({
        query,
        orgKey: org._key,
      })

      const expectedOrgNames = {
        en: 'test org',
        fr: 'test org',
      }

      expect(orgNames).toEqual(expectedOrgNames)
    })
  })
  describe('given an unsuccessful query', () => {
    describe('when the query fails', () => {
      it('throws an error', async () => {
        const mockQuery = jest.fn().mockRejectedValue(new Error('Database error occurred.'))
        try {
          await getBilingualOrgNames({ query: mockQuery })
        } catch (err) {
          expect(err).toEqual(
            new Error('Database error occurred while trying to find org names: Error: Database error occurred.'),
          )
        }
      })
    })
    describe('when the cursor fails', () => {
      it('throws an error', async () => {
        const cursor = {
          next() {
            throw new Error('Cursor error occurred.')
          },
        }
        const mockQuery = jest.fn().mockReturnValue(cursor)
        try {
          await getBilingualOrgNames({ query: mockQuery })
        } catch (err) {
          expect(err).toEqual(
            new Error('Cursor error occurred while trying to find org names: Error: Cursor error occurred.'),
          )
        }
      })
    })
  })
})
