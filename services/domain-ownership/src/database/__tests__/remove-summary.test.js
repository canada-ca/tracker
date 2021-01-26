const { ArangoTools, dbNameFromFile } = require('arango-tools')

const { removeSummary } = require('../remove-summary')
const { makeMigrations } = require('../../../migrations')

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the removeSummary function', () => {
  let query, drop, truncate, migrate, collections

  beforeAll(async () => {
    ;({ migrate } = await ArangoTools({ rootPass, url }))
    ;({ query, drop, truncate, collections } = await migrate(
      makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
    ))
  })

  afterEach(async () => {
    await truncate()
  })

  afterAll(async () => {
    await drop()
  })

  describe('given no errors', () => {
    let summary
    beforeEach(async () => {
      summary = await collections.dmarcSummaries.save({
        detailTables: {
          dkimFailure: [],
          dmarcFailure: [],
          fullPass: [],
          spfFailure: [],
        },
        categoryTotals: {
          pass: 0,
          fail: 0,
          passDkimOnly: 0,
          passSpfOnly: 0,
        },
      })
    })

    it('removes the given summary', async () => {
      const removeSummaryFunc = removeSummary(query)

      await removeSummaryFunc({ summaryId: summary._id })

      const summaryCursor = await query`
        FOR summary IN dmarcSummaries
          RETURN summary
      `

      const summaryData = await summaryCursor.next()

      expect(summaryData).toBeUndefined()
    })
  })
  describe('given an error occurs', () => {
    it('throws an error', async () => {
      const mockedQuery = jest
        .fn()
        .mockRejectedValue('Database error occurred.')

      const removeSummaryFunc = removeSummary(mockedQuery)

      try {
        await removeSummaryFunc({ summaryId: 'id' })
      } catch (err) {
        expect(err).toEqual(new Error('Database error occurred.'))
      }
    })
  })
})
