const { ensure, dbNameFromFile } = require('arango-tools')

const { loadArangoDates } = require('../load-arango-dates')
const { databaseOptions } = require('../../../database-options')

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the loadArangoDates function', () => {
  let query, drop, truncate, collections

  beforeAll(async () => {
    ;({ query, drop, truncate, collections } = await ensure({
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
    beforeEach(async () => {
      await collections.domains.save({
        _key: '1',
        domain: 'domain.ca',
      })
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
      const loadCurrDatesFunc = loadArangoDates({ query })

      const dates = await loadCurrDatesFunc({ domain: 'domain.ca' })

      const expectedDates = [
        '2020-01-01',
        '2020-02-01',
        '2020-03-01',
        '2020-04-01',
        '2020-05-01',
        '2020-06-01',
        '2020-07-01',
        '2020-08-01',
        '2020-09-01',
        '2020-10-01',
        '2020-11-01',
        '2020-12-01',
        '2021-01-01',
      ]
      expect(dates).toEqual(expectedDates)
    })
  })
  describe('given a db error', () => {
    it('throws an error', async () => {
      const mockedQuery = jest
        .fn()
        .mockRejectedValue('Database error occurred.')

      const loadCurrDatesFunc = loadArangoDates({ query: mockedQuery })

      try {
        await loadCurrDatesFunc({
          domain: 'domain.ca',
        })
      } catch (err) {
        expect(err).toEqual('Database error occurred.')
      }
    })
  })
})
