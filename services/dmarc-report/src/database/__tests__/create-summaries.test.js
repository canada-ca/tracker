const { ArangoTools, dbNameFromFile } = require('arango-tools')

const { makeMigrations } = require('../../../migrations')
const { createSummaries } = require('../index')
const { loadSummaryCountByDomain } = require('../../loaders')

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('Given the createSummaries function', () => {
  let query, drop, truncate, migrate, collections

  const infoConsole = []
  const mockedInfo = (output) => infoConsole.push(output)
  beforeAll(async () => {
    ;({ migrate } = await ArangoTools({ rootPass, url }))
    ;({ query, drop, truncate, collections } = await migrate(
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
  describe('the domain summary count is not equal to 14', () => {
    let domain, dates
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

      dates = [
        {
          startDate: '2020-01-01',
        },
        {
          startDate: '2020-02-01',
        },
        {
          startDate: '2020-03-01',
        },
        {
          startDate: '2020-04-01',
        },
        {
          startDate: '2020-05-01',
        },
        {
          startDate: '2020-06-01',
        },
        {
          startDate: '2020-07-01',
        },
        {
          startDate: '2020-08-01',
        },
        {
          startDate: '2020-09-01',
        },
        {
          startDate: '2020-10-01',
        },
        {
          startDate: '2020-11-01',
        },
        {
          startDate: '2020-12-01',
        },
        {
          startDate: '2021-01-01',
        },
      ]
    })
    it('initializes summaries', async () => {
      const mockedInitializeSummaries = jest.fn()
      const mockedUpdateCurrentSummaries = jest.fn()
      const mockedLoadDates = jest.fn().mockReturnValue(dates)

      const createSummariesFunc = createSummaries(
        mockedLoadDates,
        loadSummaryCountByDomain(query),
        mockedInitializeSummaries,
        mockedUpdateCurrentSummaries,
      )

      await createSummariesFunc({ domain: 'domain.ca' })

      expect(mockedInitializeSummaries).toHaveBeenCalledTimes(1)
      expect(mockedInitializeSummaries).toHaveBeenNthCalledWith(1, {
        domain: 'domain.ca',
        domainId: domain._id,
        dates: dates,
      })
    })
  })
  describe('the domain summary count is equal to 14', () => {
    let domain, dates
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

      dates = [
        {
          startDate: '2020-01-01',
        },
        {
          startDate: '2020-02-01',
        },
        {
          startDate: '2020-03-01',
        },
        {
          startDate: '2020-04-01',
        },
        {
          startDate: '2020-05-01',
        },
        {
          startDate: '2020-06-01',
        },
        {
          startDate: '2020-07-01',
        },
        {
          startDate: '2020-08-01',
        },
        {
          startDate: '2020-09-01',
        },
        {
          startDate: '2020-10-01',
        },
        {
          startDate: '2020-11-01',
        },
        {
          startDate: '2020-12-01',
        },
        {
          startDate: '2021-01-01',
        },
      ]
    })
    it('updates the given summary', async () => {
      const mockedInitializeSummaries = jest.fn()
      const mockedUpdateCurrentSummaries = jest.fn()
      const mockedLoadDates = jest.fn().mockReturnValue(dates)
      const mockedLoadSummaryCountByDomain = jest
        .fn()
        .mockReturnValue({ summaryCount: 14, domainId: domain._id })

      const createSummariesFunc = createSummaries(
        mockedLoadDates,
        mockedLoadSummaryCountByDomain,
        mockedInitializeSummaries,
        mockedUpdateCurrentSummaries,
      )

      await createSummariesFunc({ domain: 'domain.ca' })

      expect(mockedUpdateCurrentSummaries).toHaveBeenCalledTimes(1)
      expect(mockedUpdateCurrentSummaries).toHaveBeenNthCalledWith(1, {
        domain: 'domain.ca',
        domainId: domain._id,
        dates: dates,
      })
    })
  })
  describe('domain cannot be found', () => {
    it('returns undefined', async () => {
      const mockedInitializeSummaries = jest.fn()
      const mockedUpdateCurrentSummaries = jest.fn()
      const mockedLoadDates = jest.fn()
      const mockedLoadSummaryCountByDomain = jest
        .fn()
        .mockReturnValue({ summaryCount: 14, domainId: undefined })

      const createSummariesFunc = createSummaries(
        mockedLoadDates,
        mockedLoadSummaryCountByDomain,
        mockedInitializeSummaries,
        mockedUpdateCurrentSummaries,
      )

      const data = await createSummariesFunc({ domain: 'domain.ca' })

      expect(data).toBeUndefined()
    })
  })
})
