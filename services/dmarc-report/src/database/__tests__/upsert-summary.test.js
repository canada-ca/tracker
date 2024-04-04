const { calculatePercentages } = require('../../utils')

const { upsertSummary } = require('../upsert-summary')
const { arangoConnection } = require('../index')
const { dbNameFromFile } = require('arango-tools')

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the upsertSummary function', () => {
  let query,
    truncate,
    collections,
    transaction,
    dbName,
    arangoDB,
    domain,
    org,
    summary,
    loadCategoryTotals,
    loadDkimFailureTable,
    loadDmarcFailureTable,
    loadFullPassTable,
    loadSpfFailureTable

  beforeAll(async () => {
    dbName = dbNameFromFile(__filename)
    ;({ collections, query, transaction, arangoDB, truncate } = await arangoConnection({
      url,
      databaseName: dbName,
      rootPass,
    }))
  })

  beforeEach(async () => {
    domain = await collections.domains.save({
      domain: 'domain.ca',
    })
    org = await collections.organizations.save({
      orgDetails: {
        en: {
          acronym: 'ACR',
        },
      },
    })
    await collections.ownership.save({
      _from: org._id,
      _to: domain._id,
    })
    summary = await collections.dmarcSummaries.save({
      categoryPercentages: {
        fail: 0,
        pass: 0,
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
    })
    await collections.domainsToDmarcSummaries.save({
      _from: domain._id,
      _to: summary._id,
      startDate: 'thirtyDays',
    })
    await collections.domainsToDmarcSummaries.save({
      _from: domain._id,
      _to: summary._id,
      startDate: '2021-01-01',
    })
    loadCategoryTotals = jest
      .fn()
      .mockReturnValue({ resources: [{ pass: 1, fail: 1, passDkimOnly: 1, passSpfOnly: 1 }] })
    loadDkimFailureTable = jest.fn().mockReturnValue({ resources: [{ key: 'value' }] })
    loadDmarcFailureTable = jest.fn().mockReturnValue({ resources: [{ key: 'value' }] })
    loadFullPassTable = jest.fn().mockReturnValue({ resources: [{ key: 'value' }] })
    loadSpfFailureTable = jest.fn().mockReturnValue({ resources: [{ key: 'value' }] })
  })

  afterEach(async () => {
    await truncate()
  })

  afterAll(async () => {
    const systemDb = arangoDB.database('_system')
    await systemDb.dropDatabase(dbName)
  })

  describe('date is thirtyDays', () => {
    it('upserts the given summary', async () => {
      await upsertSummary({
        transaction,
        collections,
        query,
        loadCategoryTotals,
        loadDkimFailureTable,
        loadDmarcFailureTable,
        loadFullPassTable,
        loadSpfFailureTable,
        calculatePercentages,
      })({ date: 'thirtyDays', domain: 'domain.ca' })

      const summaryCursor = await query`FOR item IN dmarcSummaries RETURN item`
      const checkSummary = await summaryCursor.next()

      const expectedResult = {
        _id: checkSummary._id,
        _key: checkSummary._key,
        _rev: checkSummary._rev,
        categoryPercentages: {
          fail: 25,
          pass: 25,
          passDkimOnly: 25,
          passSpfOnly: 25,
        },
        categoryTotals: {
          fail: 1,
          pass: 1,
          passDkimOnly: 1,
          passSpfOnly: 1,
        },
        detailTables: {
          dkimFailure: [{ key: 'value' }],
          dmarcFailure: [{ key: 'value' }],
          fullPass: [{ key: 'value' }],
          spfFailure: [{ key: 'value' }],
        },
        totalMessages: 4,
      }

      expect(checkSummary).toEqual(expectedResult)
    })
  })
  describe('date is not thirtyDays', () => {
    it('upserts the given summary', async () => {
      await upsertSummary({
        transaction,
        collections,
        query,
        loadCategoryTotals,
        loadDkimFailureTable,
        loadDmarcFailureTable,
        loadFullPassTable,
        loadSpfFailureTable,
        calculatePercentages,
      })({ date: '2021-01-01', domain: 'domain.ca' })

      const summaryCursor = await query`FOR item IN dmarcSummaries RETURN item`
      const checkSummary = await summaryCursor.next()

      const expectedResult = {
        _id: checkSummary._id,
        _key: checkSummary._key,
        _rev: checkSummary._rev,
        categoryPercentages: {
          fail: 25,
          pass: 25,
          passDkimOnly: 25,
          passSpfOnly: 25,
        },
        categoryTotals: {
          fail: 1,
          pass: 1,
          passDkimOnly: 1,
          passSpfOnly: 1,
        },
        detailTables: {
          dkimFailure: [{ key: 'value' }],
          dmarcFailure: [{ key: 'value' }],
          fullPass: [{ key: 'value' }],
          spfFailure: [{ key: 'value' }],
        },
        totalMessages: 4,
      }

      expect(checkSummary).toEqual(expectedResult)
    })
  })
})
