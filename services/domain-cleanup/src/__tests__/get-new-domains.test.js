const { DB_PASS: rootPass, DB_URL: url } = process.env

const { dbNameFromFile } = require('arango-tools')
const { ensureDatabase: ensure } = require('../testUtilities')
const { databaseOptions } = require('../../database-options')

const { getNewDomains } = require('../database')

describe('given the getNewDomains function', () => {
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
    let org, domain, domain2, claim, claim2
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
      domain2 = await collections.domains.save({
        domain: 'test2.domain.gc.ca',
      })
      claim = await collections.claims.save({
        _from: org._id,
        _to: domain._id,
        tags: ['new-nouveau', 'test-test'],
        firstSeen: '2021-01-01',
      })
      claim2 = await collections.claims.save({
        _from: org._id,
        _to: domain2._id,
        tags: [],
        firstSeen: '2021-01-01',
      })
    })
    it('returns the domain claims', async () => {
      const claims = await getNewDomains({ query, domainId: domain._id })

      const expectedClaims = [
        {
          ...claim,
          _from: org._id,
          _to: domain._id,
          tags: ['new-nouveau', 'test-test'],
          firstSeen: '2021-01-01',
        },
      ]

      expect(claims).toEqual(expectedClaims)
    })
  })
  describe('given an unsuccessful query', () => {
    describe('when the query fails', () => {
      it('throws an error', async () => {
        const mockQuery = jest.fn().mockRejectedValue(new Error('Database error occurred.'))
        try {
          await getNewDomains({ query: mockQuery })
        } catch (err) {
          expect(err).toEqual(
            new Error('Database error occurred while trying to find new domains: Error: Database error occurred.'),
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
          await getNewDomains({ query: mockQuery, domainId: 'domains/1' })
        } catch (err) {
          expect(err).toEqual(
            new Error('Cursor error occurred while trying to find new domains: Error: Cursor error occurred.'),
          )
        }
      })
    })
  })
})
