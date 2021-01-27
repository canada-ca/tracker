const { ArangoTools, dbNameFromFile } = require('arango-tools')

const { makeMigrations } = require('../../../migrations')
const { initializeSummaries } = require('../index')
const { loadSummaryByDate } = require('../../loaders')

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the initializeSummaries function', () => {
  let drop, truncate, migrate, collections

  const infoConsole = []
  const mockedInfo = (output) => infoConsole.push(output)
  beforeAll(async () => {
    ;({ migrate } = await ArangoTools({ rootPass, url }))
    ;({ drop, truncate, collections } = await migrate(
      makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
    ))
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
        },
      })
      expect(mockedCreateSummary).toHaveBeenNthCalledWith(2, {
        currentSummary: {
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
        },
      })
    })
    it('creates n+1 summary edges', async () => {
      const mockedCreateEdge = jest.fn()
      const mockedCreateSummary = jest
        .fn()
        .mockReturnValue({ _id: 'dmarcSummaries/1' })

      const initialSummaryFunc = initializeSummaries(
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
