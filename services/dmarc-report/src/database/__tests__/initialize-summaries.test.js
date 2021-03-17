const { ensure, dbNameFromFile } = require('arango-tools')

const { databaseOptions } = require('../../../database-options')
const { initializeSummaries } = require('../index')
const { loadSummaryByDate } = require('../../loaders')
const { calculatePercentages } = require('../../calculate-percentages')

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the initializeSummaries function', () => {
  let drop, truncate, collections

  const infoConsole = []
  const mockedInfo = (output) => infoConsole.push(output)
  beforeAll(async () => {
    ;({ drop, truncate, collections } = await ensure({
      type: 'database',
      name: dbNameFromFile(__filename),
      url,
      rootPassword: rootPass,
      options: databaseOptions({ rootPass }),
    }))
    console.info = mockedInfo
  })

  afterEach(async () => {
    await truncate()
  })

  afterAll(async () => {
    await drop()
  })

  describe('creating initial dmarc report summaries', () => {
    let domain, mockedContainer, dates
    beforeEach(async () => {
      domain = await collections.domains.save({
        domain: 'domain.ca',
        selectors: '',
        status: {
          dkim: 'fail',
          dmarc: 'fail',
          https: 'fail',
          spf: 'fail',
          ssl: 'fail',
        },
        lastRan: '2021-01-01 12:12:12.000000',
      })

      mockedContainer = {
        items: {
          query: jest.fn().mockReturnValue({
            fetchAll() {
              return {
                resources: [],
              }
            },
          }),
        },
      }

      dates = [
        {
          startDate: '2021-01-01',
        },
      ]
    })
    it('creates n+1 amount initial dmarc report summaries', async () => {
      const mockedCreateEdge = jest.fn()
      const mockedCreateSummary = jest
        .fn()
        .mockReturnValue({ _id: 'dmarcSummaries/1' })

      const initialSummaryFunc = initializeSummaries(
        calculatePercentages,
        mockedCreateEdge,
        mockedCreateSummary,
        loadSummaryByDate(mockedContainer),
      )

      await initialSummaryFunc({
        domain: 'domain.ca',
        domainId: domain._id,
        dates,
      })

      expect(mockedCreateSummary).toHaveBeenCalledTimes(2)
      expect(mockedCreateSummary).toHaveBeenNthCalledWith(1, {
        currentSummary: {
          categoryPercentages: {
            pass: 0,
            fail: 0,
            passDkimOnly: 0,
            passSpfOnly: 0,
          },
          categoryTotals: {
            fail: 0,
            pass: 0,
            passDkimOnly: 0,
            passSpfOnly: 0,
          },
          detailTables: {
            dkimFailure: [],
            dmarcFailure: [],
            fullPass: [],
            spfFailure: [],
          },
          totalMessages: 0,
        },
      })
      expect(mockedCreateSummary).toHaveBeenNthCalledWith(2, {
        currentSummary: {
          categoryPercentages: {
            pass: 0,
            fail: 0,
            passDkimOnly: 0,
            passSpfOnly: 0,
          },
          categoryTotals: {
            fail: 0,
            pass: 0,
            passDkimOnly: 0,
            passSpfOnly: 0,
          },
          detailTables: {
            dkimFailure: [],
            dmarcFailure: [],
            fullPass: [],
            spfFailure: [],
          },
          totalMessages: 0,
        },
      })
    })
    it('creates n+1 summary edges', async () => {
      const mockedCreateEdge = jest.fn()
      const mockedCreateSummary = jest
        .fn()
        .mockReturnValue({ _id: 'dmarcSummaries/1' })

      const initialSummaryFunc = initializeSummaries(
        calculatePercentages,
        mockedCreateEdge,
        mockedCreateSummary,
        loadSummaryByDate(mockedContainer),
      )

      await initialSummaryFunc({
        domain: 'domain.ca',
        domainId: domain._id,
        dates,
      })

      expect(mockedCreateEdge).toHaveBeenCalledTimes(2)
      expect(mockedCreateEdge).toHaveBeenNthCalledWith(1, {
        domainId: domain._id,
        summaryId: 'dmarcSummaries/1',
        startDate: '2021-01-01',
      })
      expect(mockedCreateEdge).toHaveBeenNthCalledWith(2, {
        domainId: domain._id,
        summaryId: 'dmarcSummaries/1',
        startDate: 'thirtyDays',
      })
    })
  })
})
