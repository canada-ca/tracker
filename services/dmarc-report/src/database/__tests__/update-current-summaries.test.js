const { ArangoTools, dbNameFromFile } = require('arango-tools')

const { makeMigrations } = require('../../../migrations')
const { arrayEquals } = require('../../array-equals')
const { updateCurrentSummaries } = require('../index')
const { loadCurrentDates } = require('../../loaders')

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the updateCurrentSummaries function', () => {
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

  describe('updating dmarc summaries', () => {
    describe('updating current month and thirty days', () => {
      let domain, dates, dmarcSummary
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

        dmarcSummary = await collections.dmarcSummaries.save({
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

        await collections.domainsToDmarcSummaries.save({
          _from: domain._id,
          _to: dmarcSummary._id,
          startDate: '2021-01-01',
        })

        dates = [
          {
            startDate: '2021-01-01',
          },
        ]
      })
      it('updates thirtyDays', async () => {
        const mockedUpdateMonthSummary = jest.fn()
        const mockedUpdateThirtyDays = jest.fn()

        const updateSummaryFunc = updateCurrentSummaries(
          arrayEquals,
          loadCurrentDates(query),
          mockedUpdateThirtyDays,
          mockedUpdateMonthSummary,
        )

        await updateSummaryFunc({
          domain: 'domain.ca',
          domainId: domain._id,
          dates,
        })

        expect(mockedUpdateThirtyDays).toHaveBeenCalledTimes(1)
        expect(mockedUpdateThirtyDays).toHaveBeenCalledWith({
          domain: 'domain.ca',
          domainId: domain._id,
        })
      })
      it('updates current month', async () => {
        const mockedUpdateMonthSummary = jest.fn()
        const mockedUpdateThirtyDays = jest.fn()

        const updateSummaryFunc = updateCurrentSummaries(
          arrayEquals,
          loadCurrentDates(query),
          mockedUpdateThirtyDays,
          mockedUpdateMonthSummary,
        )

        await updateSummaryFunc({
          domain: 'domain.ca',
          domainId: domain._id,
          dates,
        })

        expect(mockedUpdateMonthSummary).toHaveBeenCalledTimes(1)
        expect(mockedUpdateMonthSummary).toHaveBeenCalledWith({
          dateToAdd: '2021-01-01',
          dateToRemove: '2021-01-01',
          domain: 'domain.ca',
          domainId: domain._id,
        })
      })
    })
    describe('removing old month and adding new one', () => {
      let domain, dates, dmarcSummary
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

        dmarcSummary = await collections.dmarcSummaries.save({
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

        await collections.domainsToDmarcSummaries.save({
          _from: domain._id,
          _to: dmarcSummary._id,
          startDate: '2020-01-01',
        })

        dates = [
          {
            startDate: '2021-01-01',
          },
        ]
      })
      it('updates thirtyDays', async () => {
        const mockedUpdateMonthSummary = jest.fn()
        const mockedUpdateThirtyDays = jest.fn()

        const updateSummaryFunc = updateCurrentSummaries(
          arrayEquals,
          loadCurrentDates(query),
          mockedUpdateThirtyDays,
          mockedUpdateMonthSummary,
        )

        await updateSummaryFunc({
          domain: 'domain.ca',
          domainId: domain._id,
          dates,
        })

        expect(mockedUpdateThirtyDays).toHaveBeenCalledTimes(1)
        expect(mockedUpdateThirtyDays).toHaveBeenCalledWith({
          domain: 'domain.ca',
          domainId: domain._id,
        })
      })
      it('updates removes old month, and adds new one', async () => {
        const mockedUpdateMonthSummary = jest.fn()
        const mockedUpdateThirtyDays = jest.fn()

        const updateSummaryFunc = updateCurrentSummaries(
          arrayEquals,
          loadCurrentDates(query),
          mockedUpdateThirtyDays,
          mockedUpdateMonthSummary,
        )

        await updateSummaryFunc({
          domain: 'domain.ca',
          domainId: domain._id,
          dates,
        })

        expect(mockedUpdateMonthSummary).toHaveBeenCalledTimes(1)
        expect(mockedUpdateMonthSummary).toHaveBeenCalledWith({
          dateToAdd: '2021-01-01',
          dateToRemove: '2020-01-01',
          domain: 'domain.ca',
          domainId: domain._id,
        })
      })
    })
  })
})
