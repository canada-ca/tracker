const { dbNameFromFile } = require('arango-tools')

const { createSummary } = require('../create-summary')
const { arangoConnection } = require('../index')

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the createSummary function', () => {
  let query, truncate, collections, arangoCtx, transaction, dbName, arangoDB, domain, org

  beforeAll(async () => {
    dbName = dbNameFromFile(__filename)
    ;({ collections, query, transaction, arangoDB, truncate } = await arangoConnection({
      url,
      databaseName: dbName,
      rootPass,
    }))
    arangoCtx = { collections, query, transaction }
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
  })

  afterEach(async () => {
    await truncate()
  })

  afterAll(async () => {
    const systemDb = arangoDB.database('_system')
    await systemDb.dropDatabase(dbName)
  })

  describe('date is thirtyDays', () => {
    it('inserts the summary and edge into arango', async () => {
      await createSummary({
        arangoCtx,
        date: 'thirtyDays',
        domain: 'domain.ca',
        summaryData: {
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
            dkimFailure: [],
            dmarcFailure: [],
            fullPass: [],
            spfFailure: [],
          },
          totalMessages: 4,
        },
      })

      const checkSummaryCursor = await query`FOR summary IN dmarcSummaries RETURN summary`

      const checkSummary = await checkSummaryCursor.next()

      expect(checkSummary).toBeDefined()

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
          dkimFailure: [],
          dmarcFailure: [],
          fullPass: [],
          spfFailure: [],
        },
        totalMessages: 4,
      }

      expect(checkSummary).toEqual(expectedResult)

      const checkSummaryEdgeCursor = await query`FOR edge IN domainsToDmarcSummaries RETURN edge`

      const checkSummaryEdge = await checkSummaryEdgeCursor.next()

      expect(checkSummaryEdge).toBeDefined()
      const edgeExpectedResult = {
        _id: checkSummaryEdge._id,
        _key: checkSummaryEdge._key,
        _rev: checkSummaryEdge._rev,
        _from: domain._id,
        _to: checkSummary._id,
        startDate: 'thirtyDays',
      }

      expect(checkSummaryEdge).toEqual(edgeExpectedResult)
    })
  })
  describe('date is not thirtyDays', () => {
    it('inserts the summary and edge into arango', async () => {
      await createSummary({
        arangoCtx,
        date: '2021-01-01',
        domain: 'domain.ca',
        summaryData: {
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
            dkimFailure: [],
            dmarcFailure: [],
            fullPass: [],
            spfFailure: [],
          },
          totalMessages: 4,
        },
      })

      const checkSummaryCursor = await query`FOR summary IN dmarcSummaries RETURN summary`

      const checkSummary = await checkSummaryCursor.next()

      expect(checkSummary).toBeDefined()

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
          dkimFailure: [],
          dmarcFailure: [],
          fullPass: [],
          spfFailure: [],
        },
        totalMessages: 4,
      }

      expect(checkSummary).toEqual(expectedResult)

      const checkSummaryEdgeCursor = await query`FOR edge IN domainsToDmarcSummaries RETURN edge`

      const checkSummaryEdge = await checkSummaryEdgeCursor.next()

      expect(checkSummaryEdge).toBeDefined()
      const edgeExpectedResult = {
        _id: checkSummaryEdge._id,
        _key: checkSummaryEdge._key,
        _rev: checkSummaryEdge._rev,
        _from: domain._id,
        _to: checkSummary._id,
        startDate: '2021-01-01',
      }

      expect(checkSummaryEdge).toEqual(edgeExpectedResult)
    })
  })
})
