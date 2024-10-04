const { DB_PASS: rootPass, DB_URL: url } = process.env

const { dbNameFromFile } = require('arango-tools')
const { ensureDatabase: ensure } = require('../testUtilities')
const { databaseOptions } = require('../../database-options')

const { getNXDomains } = require('../database')

describe('given the getNXDomains function', () => {
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
    let domain
    beforeEach(async () => {
      domain = await collections.domains.save({
        domain: 'test.domain.gc.ca',
        rcode: 'NXDOMAIN',
      })
    })
    it('returns the domain keys', async () => {
      const nxDomains = await getNXDomains({ query })

      const expectedNXDomains = [{ _key: domain._key, _id: domain._id, domain: 'test.domain.gc.ca' }]

      expect(nxDomains).toEqual(expectedNXDomains)
    })
  })
  describe('given an unsuccessful query', () => {
    describe('when the query fails', () => {
      it('throws an error', async () => {
        const mockQuery = jest.fn().mockRejectedValue(new Error('Database error occurred.'))
        try {
          await getNXDomains({ query: mockQuery })
        } catch (err) {
          expect(err).toEqual(
            new Error('Database error occurred while trying to find NXDOMAINs: Error: Database error occurred.'),
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
          await getNXDomains({ query: mockQuery })
        } catch (err) {
          expect(err).toEqual(
            new Error('Cursor error occurred while trying to find NXDOMAINs: Error: Cursor error occurred.'),
          )
        }
      })
    })
  })
})
