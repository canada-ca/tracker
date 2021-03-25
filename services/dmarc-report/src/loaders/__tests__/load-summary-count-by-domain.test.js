const { ensure, dbNameFromFile } = require('arango-tools')

const { loadSummaryCountByDomain } = require('../load-summary-count-by-domain')
const { databaseOptions } = require('../../../database-options')

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the loadSummaryCountByDomain function', () => {
  let query, drop, truncate, collections
  const consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)

  beforeAll(async () => {
    ;({ query, drop, truncate, collections } = await ensure({
      type: 'database',
      name: dbNameFromFile(__filename),
      url,
      rootPassword: rootPass,
      options: databaseOptions({ rootPass }),
    }))
    console.info = mockedInfo
  })

  afterEach(async () => {
    consoleOutput.length = 0
    await truncate()
  })

  afterAll(async () => {
    await drop()
  })

  describe('given no errors', () => {
    describe('domain is found', () => {
      let domain
      beforeEach(async () => {
        domain = await collections.domains.save({
          domain: 'test.gc.ca',
          slug: 'test-gc-ca',
          lastRan: null,
          selectors: ['selector1._domainkey', 'selector2._domainkey'],
        })
        await collections.domainsToDmarcSummaries.save({
          _from: domain._id,
          _to: 'dmarcSummaries/1',
          startDate: '2020-01-01',
        })
        await collections.domainsToDmarcSummaries.save({
          _from: domain._id,
          _to: 'dmarcSummaries/1',
          startDate: '2020-02-01',
        })
        await collections.domainsToDmarcSummaries.save({
          _from: domain._id,
          _to: 'dmarcSummaries/1',
          startDate: '2020-03-01',
        })
        await collections.domainsToDmarcSummaries.save({
          _from: domain._id,
          _to: 'dmarcSummaries/1',
          startDate: '2020-04-01',
        })
        await collections.domainsToDmarcSummaries.save({
          _from: domain._id,
          _to: 'dmarcSummaries/1',
          startDate: '2020-05-01',
        })
        await collections.domainsToDmarcSummaries.save({
          _from: domain._id,
          _to: 'dmarcSummaries/1',
          startDate: '2020-06-01',
        })
        await collections.domainsToDmarcSummaries.save({
          _from: domain._id,
          _to: 'dmarcSummaries/1',
          startDate: '2020-07-01',
        })
        await collections.domainsToDmarcSummaries.save({
          _from: domain._id,
          _to: 'dmarcSummaries/1',
          startDate: '2020-08-01',
        })
        await collections.domainsToDmarcSummaries.save({
          _from: domain._id,
          _to: 'dmarcSummaries/1',
          startDate: '2020-09-01',
        })
        await collections.domainsToDmarcSummaries.save({
          _from: domain._id,
          _to: 'dmarcSummaries/1',
          startDate: '2020-10-01',
        })
        await collections.domainsToDmarcSummaries.save({
          _from: domain._id,
          _to: 'dmarcSummaries/1',
          startDate: '2020-11-01',
        })
        await collections.domainsToDmarcSummaries.save({
          _from: domain._id,
          _to: 'dmarcSummaries/1',
          startDate: '2020-12-01',
        })
        await collections.domainsToDmarcSummaries.save({
          _from: domain._id,
          _to: 'dmarcSummaries/1',
          startDate: '2021-01-01',
        })
        await collections.domainsToDmarcSummaries.save({
          _from: domain._id,
          _to: 'dmarcSummaries/1',
          startDate: 'thirtyDays',
        })
      })
      it('returns the current dates', async () => {
        const loadSummaryCountByDomainFunc = loadSummaryCountByDomain(query)

        const data = await loadSummaryCountByDomainFunc({
          domain: 'test.gc.ca',
        })

        const expectedData = {
          domainId: domain._id,
          summaryCount: 14,
        }
        expect(data).toEqual(expectedData)
      })
    })
    describe('domain cannot be found', () => {
      it('returns struct of undefined values', async () => {
        const loadSummaryCountByDomainFunc = loadSummaryCountByDomain(query)

        const data = await loadSummaryCountByDomainFunc({
          domain: 'test.gc.ca',
        })

        const expectedData = {
          domainId: undefined,
          summaryCount: undefined,
        }
        expect(data).toEqual(expectedData)

        expect(consoleOutput).toEqual([`\tDomain not found in db: test.gc.ca`])
      })
    })
  })
  describe('given a db error', () => {
    it('throws an error', async () => {
      const mockedQuery = jest
        .fn()
        .mockRejectedValue('Database error occurred.')

      const loadSummaryCountByDomainFunc = loadSummaryCountByDomain(mockedQuery)

      try {
        await loadSummaryCountByDomainFunc({ domain: 'domain.ca' })
      } catch (err) {
        expect(err).toEqual(new Error('Database error occurred.'))
      }
    })
  })
})
