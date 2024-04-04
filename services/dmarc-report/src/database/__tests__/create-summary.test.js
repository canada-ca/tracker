const { dbNameFromFile } = require('arango-tools')

const { createSummary } = require('../create-summary')
const { calculatePercentages } = require('../../utils')
const { arangoConnection } = require('../index')

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the createSummary function', () => {
  let query,
    truncate,
    collections,
    transaction,
    dbName,
    arangoDB,
    domain,
    org,
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
    loadCategoryTotals = jest
      .fn()
      .mockReturnValue({ resources: [{ pass: 0, fail: 0, passDkimOnly: 0, passSpfOnly: 0 }] })
    loadDkimFailureTable = jest.fn().mockReturnValue({ resources: [] })
    loadDmarcFailureTable = jest.fn().mockReturnValue({ resources: [] })
    loadFullPassTable = jest.fn().mockReturnValue({ resources: [] })
    loadSpfFailureTable = jest.fn().mockReturnValue({ resources: [] })
  })

  afterEach(async () => {
    await truncate()
  })

  afterAll(async () => {
    const systemDb = arangoDB.database('_system')
    await systemDb.dropDatabase(dbName)
  })

  describe('date is thirtyDays', () => {
    it('inserts the summary into arango', async () => {
      await createSummary({
        transaction,
        collections,
        query,
        loadCategoryTotals,
        loadDkimFailureTable,
        loadDmarcFailureTable,
        loadFullPassTable,
        loadSpfFailureTable,
      })({ date: 'thirtyDays', domain: 'domain.ca' })

      const checkSummaryCursor = await query`FOR summary IN dmarcSummaries RETURN summary`

      const checkSummary = await checkSummaryCursor.next()

      expect(checkSummary).toBeDefined()

      const expectedResult = {
        _id: checkSummary._id,
        _key: checkSummary._key,
        _rev: checkSummary._rev,
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
      }

      expect(checkSummary).toEqual(expectedResult)
    })
    it('inserts the edge into arango', async () => {
      await createSummary({
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

      const checkSummaryEdgeCursor = await query`FOR edge IN domainsToDmarcSummaries RETURN edge`

      const checkSummaryEdge = await checkSummaryEdgeCursor.next()

      expect(checkSummaryEdge).toBeDefined()

      const checkSummaryCursor = await query`FOR summary IN dmarcSummaries RETURN summary`

      const checkSummary = await checkSummaryCursor.next()

      const expectedResult = {
        _id: checkSummaryEdge._id,
        _key: checkSummaryEdge._key,
        _rev: checkSummaryEdge._rev,
        _from: domain._id,
        _to: checkSummary._id,
        startDate: 'thirtyDays',
      }

      expect(checkSummaryEdge).toEqual(expectedResult)
    })
  })
  describe('date is not thirtyDays', () => {
    it('inserts the summary into arango', async () => {
      await createSummary({
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

      const checkSummaryCursor = await query`FOR summary IN dmarcSummaries RETURN summary`

      const checkSummary = await checkSummaryCursor.next()

      expect(checkSummary).toBeDefined()

      const expectedResult = {
        _id: checkSummary._id,
        _key: checkSummary._key,
        _rev: checkSummary._rev,
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
      }

      expect(checkSummary).toEqual(expectedResult)
    })
    it('inserts the edge into arango', async () => {
      await createSummary({
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

      const checkSummaryEdgeCursor = await query`FOR edge IN domainsToDmarcSummaries RETURN edge`

      const checkSummaryEdge = await checkSummaryEdgeCursor.next()

      expect(checkSummaryEdge).toBeDefined()

      const checkSummaryCursor = await query`FOR summary IN dmarcSummaries RETURN summary`

      const checkSummary = await checkSummaryCursor.next()

      const expectedResult = {
        _id: checkSummaryEdge._id,
        _key: checkSummaryEdge._key,
        _rev: checkSummaryEdge._rev,
        _from: domain._id,
        _to: checkSummary._id,
        startDate: '2021-01-01',
      }

      expect(checkSummaryEdge).toEqual(expectedResult)
    })
  })
})
