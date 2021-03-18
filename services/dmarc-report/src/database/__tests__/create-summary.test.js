const { ensure, dbNameFromFile } = require('arango-tools')

const { createSummary } = require('../create-summary')
const { databaseOptions } = require('../../../database-options')

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the createSummary function', () => {
  let query, drop, truncate

  beforeAll(async () => {
    ;({ query, drop, truncate } = await ensure({
      type: 'database',
      name: dbNameFromFile(__filename),
      url,
      rootPassword: rootPass,
      options: databaseOptions({ rootPass }),
    }))
  })

  afterEach(async () => {
    await truncate()
  })

  afterAll(async () => {
    await drop()
  })

  describe('given no errors', () => {
    it('creates the given summary', async () => {
      const createSummaryFunc = createSummary(query)

      const currentSummary = {
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
      }

      await createSummaryFunc({ currentSummary })

      const summaryCursor = await query`
        FOR summary IN dmarcSummaries
          RETURN summary
      `

      const summaryData = await summaryCursor.next()

      const expectedSummaryData = {
        _id: summaryData._id,
        _key: summaryData._key,
        _rev: summaryData._rev,
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
      }

      expect(summaryData).toEqual(expectedSummaryData)
    })
  })
  describe('given an error occurs', () => {
    it('throws an error', async () => {
      const mockedQuery = jest
        .fn()
        .mockRejectedValue('Database error occurred.')

      const createSummaryFunc = createSummary(mockedQuery)

      try {
        await createSummaryFunc({ currentSummary: {} })
      } catch (err) {
        expect(err).toEqual(new Error('Database error occurred.'))
      }
    })
  })
})
