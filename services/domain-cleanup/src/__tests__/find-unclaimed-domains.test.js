const { DB_PASS: rootPass, DB_URL: url } = process.env

const { dbNameFromFile } = require('arango-tools')
const { ensureDatabase: ensure } = require('../testUtilities')
const { databaseOptions } = require('../../database-options')

const { findUnclaimedDomains } = require('../database')

describe('given the findUnclaimedDomains function', () => {
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
    // eslint-disable-next-line no-unused-vars
    let org, domain, claim
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
      domain = await collections.domains.save({
        domain: 'test.domain.gc.ca',
      })
      claim = await collections.claims.save({
        _from: org._id,
        _to: domain._id,
      })
    })
    it('returns the domain claims', async () => {
      const unclaimedDomains = await findUnclaimedDomains({ query, orgId: org._id })
      const expectedDomains = [{ ...domain, domain: 'test.domain.gc.ca' }]
      expect(unclaimedDomains).toEqual(expectedDomains)
    })
  })
  describe('given an unsuccessful query', () => {
    describe('when the query fails', () => {
      it('throws an error', async () => {
        const mockQuery = jest.fn().mockRejectedValue(new Error('Database error occurred.'))
        try {
          await findUnclaimedDomains({ query: mockQuery })
        } catch (err) {
          expect(err).toEqual(
            new Error(
              'Database error occurred while trying to find unclaimed domains: Error: Database error occurred.',
            ),
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
          await findUnclaimedDomains({ query: mockQuery, domainId: 'domains/1' })
        } catch (err) {
          expect(err).toEqual(
            new Error('Cursor error occurred while trying to find unclaimed domains: Error: Cursor error occurred.'),
          )
        }
      })
    })
  })
})
