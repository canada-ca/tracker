const { ensure, dbNameFromFile } = require('arango-tools')

const {
  loadArangoThirtyDaysCount,
} = require('../load-arango-thirty-days-count')
const { databaseOptions } = require('../../../database-options')

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the loadArangoThirtyDaysCount', () => {
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

  describe('given there is a thirty day record', () => {
    beforeEach(async () => {
      await collections.domains.save({
        _key: '1',
        domain: 'domain.ca',
      })
      await collections.domainsToDmarcSummaries.save({
        _from: 'domains/1',
        _to: 'dmarcSummaries/1',
        startDate: 'thirtyDays',
      })
    })
    it('returns a number greater than 0', async () => {
      const count = await loadArangoThirtyDaysCount({ query })({
        domain: 'domain.ca',
      })
      expect(count).toBeGreaterThan(0)
    })
  })
  describe('given there is no thirty day records', () => {
    beforeEach(async () => {
      await collections.domains.save({
        _key: '1',
        domain: 'domain.ca',
      })
    })
    it('returns a number equal than 0', async () => {
      const count = await loadArangoThirtyDaysCount({ query })({
        domain: 'domain.ca',
      })
      expect(count).toBeLessThanOrEqual(0)
    })
  })
})
