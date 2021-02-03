const { ArangoTools, dbNameFromFile } = require('arango-tools')

const { makeMigrations } = require('../../../migrations')
const { updateMonthSummary } = require('../index')
const { loadSummaryByDate } = require('../../loaders')
const { calculatePercentages } = require('../../calculate-percentages')

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the updateMonthSummary function', () => {
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

  describe('updating the given month summary', () => {
    let domain, mockedContainer
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
    })
    it('removes the current summary edge', async () => {
      const mockedCreateEdge = jest.fn()
      const mockedCreateSummary = jest
        .fn()
        .mockReturnValue({ _id: 'dmarcSummaries/1' })
      const mockedRemoveEdge = jest
        .fn()
        .mockReturnValue({ _to: 'dmarcSummaries/1' })
      const mockedRemoveSummary = jest.fn()

      const updateMonthSummaryFunc = updateMonthSummary(
        calculatePercentages,
        mockedCreateSummary,
        mockedCreateEdge,
        loadSummaryByDate(mockedContainer),
        mockedRemoveEdge,
        mockedRemoveSummary,
      )

      await updateMonthSummaryFunc({
        dateToRemove: '2021-01-01',
        dateToAdd: '2021-01-01',
        domain: 'domain.ca',
        domainId: domain._id,
      })

      expect(mockedRemoveEdge).toHaveBeenCalledTimes(1)
      expect(mockedRemoveEdge).toHaveBeenNthCalledWith(1, {
        domainId: domain._id,
        monthToRemove: '2021-01-01',
      })
    })
    it('removes the current summary', async () => {
      const mockedCreateEdge = jest.fn()
      const mockedCreateSummary = jest
        .fn()
        .mockReturnValue({ _id: 'dmarcSummaries/1' })
      const mockedRemoveEdge = jest
        .fn()
        .mockReturnValue({ _to: 'dmarcSummaries/1' })
      const mockedRemoveSummary = jest.fn()

      const updateMonthSummaryFunc = updateMonthSummary(
        calculatePercentages,
        mockedCreateSummary,
        mockedCreateEdge,
        loadSummaryByDate(mockedContainer),
        mockedRemoveEdge,
        mockedRemoveSummary,
      )

      await updateMonthSummaryFunc({
        dateToRemove: '2021-01-01',
        dateToAdd: '2021-01-01',
        domain: 'domain.ca',
        domainId: domain._id,
      })

      expect(mockedRemoveSummary).toHaveBeenCalledTimes(1)
      expect(mockedRemoveSummary).toHaveBeenNthCalledWith(1, {
        summaryId: 'dmarcSummaries/1',
      })
    })
    it('creates the new summary', async () => {
      const mockedCreateEdge = jest.fn()
      const mockedCreateSummary = jest
        .fn()
        .mockReturnValue({ _id: 'dmarcSummaries/1' })
      const mockedRemoveEdge = jest
        .fn()
        .mockReturnValue({ _to: 'dmarcSummaries/1' })
      const mockedRemoveSummary = jest.fn()

      const updateMonthSummaryFunc = updateMonthSummary(
        calculatePercentages,
        mockedCreateSummary,
        mockedCreateEdge,
        loadSummaryByDate(mockedContainer),
        mockedRemoveEdge,
        mockedRemoveSummary,
      )

      await updateMonthSummaryFunc({
        dateToRemove: '2021-01-01',
        dateToAdd: '2021-01-01',
        domain: 'domain.ca',
        domainId: domain._id,
      })

      expect(mockedCreateSummary).toHaveBeenCalledTimes(1)
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
        },
      })
    })
    it('creates the new summary edge', async () => {
      const mockedCreateEdge = jest.fn()
      const mockedCreateSummary = jest
        .fn()
        .mockReturnValue({ _id: 'dmarcSummaries/1' })
      const mockedRemoveEdge = jest
        .fn()
        .mockReturnValue({ _to: 'dmarcSummaries/1' })
      const mockedRemoveSummary = jest.fn()

      const updateMonthSummaryFunc = updateMonthSummary(
        calculatePercentages,
        mockedCreateSummary,
        mockedCreateEdge,
        loadSummaryByDate(mockedContainer),
        mockedRemoveEdge,
        mockedRemoveSummary,
      )

      await updateMonthSummaryFunc({
        dateToRemove: '2021-01-01',
        dateToAdd: '2021-01-01',
        domain: 'domain.ca',
        domainId: domain._id,
      })

      expect(mockedCreateEdge).toHaveBeenCalledTimes(1)
      expect(mockedCreateEdge).toHaveBeenNthCalledWith(1, {
        domainId: domain._id,
        summaryId: 'dmarcSummaries/1',
        startDate: '2021-01-01',
      })
    })
    describe('if currentEdge is undefined', () => {
      it('returns', async () => {
        const mockedCreateEdge = jest.fn()
        const mockedCreateSummary = jest
          .fn()
          .mockReturnValue({ _id: 'dmarcSummaries/1' })
        const mockedRemoveEdge = jest.fn().mockReturnValue(undefined)
        const mockedRemoveSummary = jest.fn()

        const updateMonthSummaryFunc = updateMonthSummary(
          calculatePercentages,
          mockedCreateSummary,
          mockedCreateEdge,
          loadSummaryByDate(mockedContainer),
          mockedRemoveEdge,
          mockedRemoveSummary,
        )

        const data = await updateMonthSummaryFunc({
          dateToRemove: '2021-01-01',
          dateToAdd: '2021-01-01',
          domain: 'domain.ca',
          domainId: domain._id,
        })

        expect(data).toBeUndefined()
      })
    })
  })
})
