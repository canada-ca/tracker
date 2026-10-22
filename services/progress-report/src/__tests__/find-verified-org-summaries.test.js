const { DB_PASS: rootPass, DB_URL: url } = process.env

const { dbNameFromFile } = require('arango-tools')
const { ensureDatabase: ensure } = require('../testUtilities')
const { databaseOptions } = require('../../database-options')

const { findOrgSummaries } = require('../database')

describe('given the findChartSummaries function', () => {
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
    await truncate()
  })

  afterAll(async () => {
    await drop()
  })

  describe('given a successful query', () => {
    let org, sum1, sum2
    beforeEach(async () => {
      org = await collections.organizations.save({
        verified: true,
      })
      sum1 = await collections.organizationSummaries.save({
        organization: org._id,
        date: '2021-01-01',
        https: {
          pass: 1,
          fail: 2,
          total: 3,
        },
        dmarc: {
          pass: 4,
          fail: 5,
          total: 9,
        },
      })
      sum2 = await collections.organizationSummaries.save({
        organization: org._id,
        date: '2021-01-31',
        https: {
          pass: 3,
          fail: 0,
          total: 3,
        },
        dmarc: {
          pass: 2,
          fail: 4,
          total: 6,
        },
      })
      await query`UPDATE ${org._key} WITH { latestSummaryId: ${sum2._id} } IN organizations`
    })
    it('returns the recent chart summaries', async () => {
      const orgSummaries = await findOrgSummaries({ query, startDate: '2021-01-01' })

      const expectedOrgSummaries = {
        _id: org._id,
        orgDetails: null,
        startSummary: {
          ...sum1,
          date: '2021-01-01',
          https: {
            pass: 1,
            fail: 2,
            total: 3,
          },
          dmarc: {
            pass: 4,
            fail: 5,
            total: 9,
          },
          organization: org._id,
        },
        endSummary: {
          ...sum2,
          date: '2021-01-31',
          https: {
            pass: 3,
            fail: 0,
            total: 3,
          },
          dmarc: {
            pass: 2,
            fail: 4,
            total: 6,
          },
          organization: org._id,
        },
      }

      const expectedObject = { [`${org._key}`]: expectedOrgSummaries }
      expect(orgSummaries).toEqual(expectedObject)
    })
  })
  describe('given an unsuccessful query', () => {
    describe('when the query fails', () => {
      it('throws an error', async () => {
        const mockQuery = jest.fn().mockRejectedValue(new Error('Database error occurred.'))
        try {
          await findOrgSummaries({ query: mockQuery })
        } catch (err) {
          expect(err).toEqual(
            new Error('Database error occurred while trying to find verified orgs: Error: Database error occurred.'),
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
          await findOrgSummaries({ query: mockQuery })
        } catch (err) {
          expect(err).toEqual(
            new Error('Cursor error occurred while trying to find verified orgs: Error: Cursor error occurred.'),
          )
        }
      })
    })
  })
})
