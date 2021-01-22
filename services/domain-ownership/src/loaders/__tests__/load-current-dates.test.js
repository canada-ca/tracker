const { ArangoTools, dbNameFromFile } = require('arango-tools')

const { loadCurrentDates } = require('../load-current-dates')
const { makeMigrations } = require('../../../migrations')

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the loadCurrentDates function', () => {
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
    beforeEach(async () => {
      await collections.domainsToDmarcSummaries.save({
        _from: 'domains/1',
        _to: 'dmarcSummaries/1',
        startDate: '2020-01-01',
      })
      await collections.domainsToDmarcSummaries.save({
        _from: 'domains/1',
        _to: 'dmarcSummaries/1',
        startDate: '2020-02-01',
      })
      await collections.domainsToDmarcSummaries.save({
        _from: 'domains/1',
        _to: 'dmarcSummaries/1',
        startDate: '2020-03-01',
      })
      await collections.domainsToDmarcSummaries.save({
        _from: 'domains/1',
        _to: 'dmarcSummaries/1',
        startDate: '2020-04-01',
      })
      await collections.domainsToDmarcSummaries.save({
        _from: 'domains/1',
        _to: 'dmarcSummaries/1',
        startDate: '2020-05-01',
      })
      await collections.domainsToDmarcSummaries.save({
        _from: 'domains/1',
        _to: 'dmarcSummaries/1',
        startDate: '2020-06-01',
      })
      await collections.domainsToDmarcSummaries.save({
        _from: 'domains/1',
        _to: 'dmarcSummaries/1',
        startDate: '2020-07-01',
      })
      await collections.domainsToDmarcSummaries.save({
        _from: 'domains/1',
        _to: 'dmarcSummaries/1',
        startDate: '2020-08-01',
      })
      await collections.domainsToDmarcSummaries.save({
        _from: 'domains/1',
        _to: 'dmarcSummaries/1',
        startDate: '2020-09-01',
      })
      await collections.domainsToDmarcSummaries.save({
        _from: 'domains/1',
        _to: 'dmarcSummaries/1',
        startDate: '2020-10-01',
      })
      await collections.domainsToDmarcSummaries.save({
        _from: 'domains/1',
        _to: 'dmarcSummaries/1',
        startDate: '2020-11-01',
      })
      await collections.domainsToDmarcSummaries.save({
        _from: 'domains/1',
        _to: 'dmarcSummaries/1',
        startDate: '2020-12-01',
      })
      await collections.domainsToDmarcSummaries.save({
        _from: 'domains/1',
        _to: 'dmarcSummaries/1',
        startDate: '2021-01-01',
      })
    })
    it('returns the current dates', async () => {
      const loadCurrDatesFunc = loadCurrentDates(query)

      const dates = await loadCurrDatesFunc()

      const expectedDates = [
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
      expect(dates).toEqual(expectedDates)
    })
  })
  describe('given a db error', () => {
    it('throws an error', async () => {
      const mockedQuery = jest
        .fn()
        .mockRejectedValue('Database error occurred.')

      const loadCurrDatesFunc = loadCurrentDates(mockedQuery)

      try {
        await loadCurrDatesFunc()
      } catch (err) {
        expect(err).toEqual(new Error('Database error occurred.'))
      }
    })
  })
})
