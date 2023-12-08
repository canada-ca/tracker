const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ensure, dbNameFromFile } = require('arango-tools')
const { databaseOptions } = require('../../database-options')

const { findChartSummaries } = require('../database')

describe('given the findChartSummaries function', () => {
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
    let sum1, sum2
    beforeEach(async () => {
      sum1 = await collections.chartSummaries.save({
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
      sum2 = await collections.chartSummaries.save({
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
    })
    it('returns the recent chart summaries', async () => {
      const chartSummaries = await findChartSummaries({
        log: console.log,
        query,
        startDate: '2021-01-01',
        endDate: '2021-01-31',
      })

      const expectedChartSummaries = {
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
        },
      }

      expect(chartSummaries).toEqual(expectedChartSummaries)
    })
  })
  describe('given an unsuccessful query', () => {
    describe('when the query fails', () => {
      it('throws an error', async () => {
        const mockQuery = jest.fn().mockRejectedValue(new Error('Database error occurred.'))
        try {
          await findChartSummaries({ query: mockQuery })
        } catch (err) {
          expect(err).toEqual(
            new Error('Database error occurred while trying to find chart summaries: Error: Database error occurred.'),
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
          await findChartSummaries({ query: mockQuery })
        } catch (err) {
          expect(err).toEqual(
            new Error('Cursor error occurred while trying to find chart summaries: Error: Cursor error occurred.'),
          )
        }
      })
    })
  })
})
