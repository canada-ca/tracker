const { createOwnership, createSummary, removeSummary, upsertSummary, arangoConnection } = require('../database')
const { loadArangoDates } = require('../loaders')

const { dmarcReport } = require('../dmarc-report')
const { dbNameFromFile } = require('arango-tools')

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the dmarcReport function', () => {
  let query, truncate, collections, transaction, arangoCtx, dbName, arangoDB, domain, acrOrg, ecrOrg

  const consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)

  beforeAll(async () => {
    console.info = mockedInfo
    console.warn = mockedWarn
    dbName = dbNameFromFile(__filename)
    ;({ collections, query, transaction, arangoDB, truncate } = await arangoConnection({
      url,
      databaseName: dbName,
      rootPass,
    }))
    arangoCtx = { query, collections, transaction }
  })

  beforeEach(async () => {
    domain = await collections.domains.save({
      domain: 'domain.ca',
    })
    acrOrg = await collections.organizations.save({
      orgDetails: {
        en: {
          acronym: 'ACR',
        },
      },
    })
    ecrOrg = await collections.organizations.save({
      orgDetails: {
        en: {
          acronym: 'ECR',
        },
      },
    })
  })

  afterEach(async () => {
    await truncate()
    consoleOutput.length = 0
  })

  afterAll(async () => {
    const systemDb = arangoDB.database('_system')
    await systemDb.dropDatabase(dbName)
  })

  describe('org is not found in arango', () => {
    it('logs message to console', async () => {
      await dmarcReport({
        ownerships: { NOEXISTORG: [] },
        arangoCtx,
        currentDate: '2021-01-01',
        cosmosDates: [],
        container: {
          items: {
            query: jest.fn().mockReturnValue({
              fetchAll: jest.fn().mockReturnValue({ resources: [] }),
            }),
          },
        },
        updateAllDates: false,
      })

      expect(consoleOutput[0]).toEqual('Org: NOEXISTORG cannot be found in datastore')
    })
  })
  describe('domain is not found in arango', () => {
    it('logs message to console', async () => {
      await dmarcReport({
        ownerships: { ACR: ['domain.doesnt.exist'] },
        arangoCtx,
        currentDate: '2021-01-01',
        cosmosDates: [],
        container: {
          items: {
            query: jest.fn().mockReturnValue({
              fetchAll: jest.fn().mockReturnValue({ resources: [] }),
            }),
          },
        },
        updateAllDates: false,
      })

      expect(consoleOutput).toContain('\tdomain.doesnt.exist cannot be found in the datastore')
    })
  })
  describe('no org owns the domain', () => {
    it('assigns ownership to domain', async () => {
      await dmarcReport({
        ownerships: { ACR: ['domain.ca'] },
        arangoCtx,
        currentDate: '2021-01-01',
        cosmosDates: [],
        container: {
          items: {
            query: jest.fn().mockReturnValue({
              fetchAll: jest.fn().mockReturnValue({ resources: [] }),
            }),
          },
        },
        updateAllDates: false,
      })

      const checkCursor = await query`FOR item IN ownership RETURN item`
      const checkOwner = await checkCursor.next()

      const expectedResult = {
        _id: checkOwner._id,
        _key: checkOwner._key,
        _rev: checkOwner._rev,
        _from: acrOrg._id,
        _to: domain._id,
      }

      expect(checkOwner).toEqual(expectedResult)
      expect(consoleOutput).toContain('\t\tAssigning domain.ca ownership to: ACR')
    })
  })
  describe('another org owns the domain', () => {
    let oldOwnership
    beforeEach(async () => {
      oldOwnership = (
        await collections.ownership.save(
          {
            _from: ecrOrg._id,
            _to: domain._id,
          },
          { returnNew: true },
        )
      ).new
    })
    it('removes old ownership and creates new one', async () => {
      await dmarcReport({
        ownerships: { ACR: ['domain.ca'] },
        arangoCtx,
        currentDate: '2021-01-01',
        cosmosDates: [],
        container: {
          items: {
            query: jest.fn().mockReturnValue({
              fetchAll: jest.fn().mockReturnValue({ resources: [] }),
            }),
          },
        },
        updateAllDates: false,
      })

      const checkCursor = await query`FOR item IN ownership FILTER item._from == ${oldOwnership._from} RETURN item`
      const checkOwner = await checkCursor.next()

      expect(checkOwner).toBeUndefined()
      expect(consoleOutput).toContain('\t\tRemoving domain.ca ownership from: ECR')

      const newCursor =
        await query`FOR item IN ownership FILTER item._from == ${acrOrg._id} RETURN {_id: item._id, _from: item._from, _to: item._to}`
      const newOwner = await newCursor.next()

      const expectedResult = {
        _id: newOwner._id,
        _from: acrOrg._id,
        _to: domain._id,
      }
      expect(newOwner).toEqual(expectedResult)
      expect(consoleOutput).toContain('\t\tAssigning domain.ca ownership to: ACR')
    })
  })
  describe('org already owns the domain', () => {
    beforeEach(async () => {
      await collections.ownership.save({
        _from: acrOrg._id,
        _to: domain._id,
      })
    })
    it('logs to console', async () => {
      await dmarcReport({
        ownerships: { ACR: ['domain.ca'] },
        arangoCtx,
        currentDate: '2021-01-01',
        cosmosDates: [],
        container: {
          items: {
            query: jest.fn().mockReturnValue({
              fetchAll: jest.fn().mockReturnValue({ resources: [] }),
            }),
          },
        },
        updateAllDates: false,
      })

      expect(consoleOutput).toContain('\t\tOwnership of domain.ca is already assigned to ACR')
    })
  })
  describe('old date is found in arango', () => {
    let summary
    beforeEach(async () => {
      await collections.ownership.save({
        _from: acrOrg._id,
        _to: domain._id,
      })
      summary = await collections.dmarcSummaries.save({
        totalMessages: 10,
      })
      await collections.domainsToDmarcSummaries.save({
        _from: domain._id,
        _to: summary._id,
        startDate: '2000-01-01',
      })
    })
    it('removes the summary and edge for that date', async () => {
      await dmarcReport({
        ownerships: { ACR: ['domain.ca'] },
        arangoCtx,
        currentDate: '2021-01-01',
        cosmosDates: [],
        container: {
          items: {
            query: jest.fn().mockReturnValue({
              fetchAll: jest.fn().mockReturnValue({ resources: [] }),
            }),
          },
        },
        updateAllDates: false,
      })

      const checkCursor = await query`FOR item IN domainsToDmarcSummaries FILTER item._to == ${summary._id} RETURN item`
      const checkEdge = await checkCursor.next()

      expect(checkEdge).toBeUndefined()
      expect(consoleOutput).toContain('\t\tRemoving 2000-01-01 for domain.ca')

      const checkSummaryCursor = await query`FOR item IN dmarcSummaries RETURN item`
      const checkSummary = await checkSummaryCursor.next()

      expect(checkSummary).toBeUndefined()
      expect(consoleOutput).toContain('\t\tRemoving 2000-01-01 for domain.ca')
    })
  })
  describe('date is not found in arango dates', () => {
    it('creates the summary and edge', async () => {
      await dmarcReport({
        ownerships: { ACR: ['domain.ca'] },
        arangoCtx,
        currentDate: '2021-01-01',
        cosmosDates: ['2021-01-01'],
        container: {
          items: {
            query: jest.fn().mockReturnValue({
              fetchAll: jest.fn().mockReturnValue({ resources: [] }),
            }),
          },
        },
        updateAllDates: false,
      })

      const checkCursor = await query`FOR item IN domainsToDmarcSummaries RETURN item`
      const checkEdge = await checkCursor.next()

      const expectedResult = {
        _id: checkEdge._id,
        _key: checkEdge._key,
        _rev: checkEdge._rev,
        _to: checkEdge._to,
        _from: domain._id,
        startDate: '2021-01-01',
      }

      expect(checkEdge).toEqual(expectedResult)
      expect(consoleOutput).toContain('\t\tInitializing 2021-01-01 for domain.ca')

      const checkSummaryCursor = await query`FOR item IN dmarcSummaries RETURN item`
      const checkSummary = await checkSummaryCursor.next()

      const expectedSummary = {
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

      expect(checkSummary).toEqual(expectedSummary)
    })
  })
  describe('date is found in arango dates', () => {
    let summary
    beforeEach(async () => {
      await collections.ownership.save({
        _from: acrOrg._id,
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
        startDate: '2021-01-01',
      })
    })
    it('updates the summary', async () => {
      await dmarcReport({
        ownerships: { ACR: ['domain.ca'] },
        arangoCtx,
        currentDate: '2021-01-01',
        cosmosDates: ['2021-01-01'],
        container: {
          items: {
            query: jest.fn().mockReturnValue({
              fetchAll: jest.fn().mockReturnValue({
                resources: [
                  {
                    id: '2021-01-01',
                    domain: 'domain.ca',
                    start_date: '2021-01-01',
                    end_date: '2021-01-30',
                    category_totals: {
                      pass: 1,
                      fail: 1,
                      'pass-dkim-only': 1,
                      'pass-spf-only': 1,
                    },
                    detail_tables: {
                      full_pass: [],
                      spf_failure: [],
                      dkim_failure: [],
                      dmarc_failure: [],
                    },
                  },
                ],
              }),
            }),
          },
        },
        updateAllDates: false,
      })

      const checkCursor = await query`FOR item IN dmarcSummaries RETURN item`
      const checkSummary = await checkCursor.next()

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
      expect(consoleOutput).toContain('\t\tUpdating 2021-01-01 for domain.ca')
    })
  })
  describe('thirty days is not found in arango', () => {
    let summary
    beforeEach(async () => {
      await collections.ownership.save({
        _from: acrOrg._id,
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
        startDate: '2021-01-01',
      })
    })
    it('creates the summary and edge', async () => {
      await dmarcReport({
        ownerships: { ACR: ['domain.ca'] },
        arangoCtx,
        currentDate: '2021-01-01',
        cosmosDates: ['thirty_days'],
        container: {
          items: {
            query: jest.fn().mockReturnValue({
              fetchAll: jest.fn().mockReturnValue({
                resources: [],
              }),
            }),
          },
        },
        updateAllDates: false,
      })

      const checkCursor =
        await query`FOR item IN domainsToDmarcSummaries FILTER item.startDate == "thirtyDays" RETURN item`
      const checkSummaryEdge = await checkCursor.next()

      const expectedResult = {
        _id: checkSummaryEdge._id,
        _key: checkSummaryEdge._key,
        _rev: checkSummaryEdge._rev,
        _from: domain._id,
        _to: checkSummaryEdge._to,
        startDate: 'thirtyDays',
      }

      expect(checkSummaryEdge).toEqual(expectedResult)
      expect(consoleOutput).toContain('\t\tInitializing thirtyDays for domain.ca')

      const sumIdCursor =
        await query`FOR item IN domainsToDmarcSummaries FILTER item.startDate == "thirtyDays" RETURN item`
      const sumId = await sumIdCursor.next()
      const sumCheckCursor = await query`FOR item IN dmarcSummaries FILTER item._id == ${sumId._to} RETURN item`
      const sumCheck = await sumCheckCursor.next()

      const sumExpectedResult = {
        _id: sumCheck._id,
        _key: sumCheck._key,
        _rev: sumCheck._rev,
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
      expect(sumCheck).toEqual(sumExpectedResult)
    })
  })
  describe('thirty days is found in arango', () => {
    let summary, summary2
    beforeEach(async () => {
      await collections.ownership.save({
        _from: acrOrg._id,
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
        startDate: '2021-01-01',
      })
      summary2 = await collections.dmarcSummaries.save({
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
        _to: summary2._id,
        startDate: 'thirtyDays',
      })
    })
    it('updates the summary', async () => {
      await dmarcReport({
        ownerships: { ACR: ['domain.ca'] },
        arangoCtx,
        currentDate: '2021-01-01',
        cosmosDates: ['thirty_days'],
        container: {
          items: {
            query: jest.fn().mockReturnValue({
              fetchAll: jest.fn().mockReturnValue({
                resources: [
                  {
                    id: 'thirty_days',
                    domain: 'domain.ca',
                    start_date: '2021-01-01',
                    end_date: '2021-01-30',
                    thirty_days: true,
                    category_totals: {
                      pass: 1,
                      fail: 1,
                      'pass-dkim-only': 1,
                      'pass-spf-only': 1,
                    },
                    detail_tables: {
                      full_pass: [],
                      spf_failure: [],
                      dkim_failure: [],
                      dmarc_failure: [],
                    },
                  },
                ],
              }),
            }),
          },
        },
        updateAllDates: false,
      })

      const checkCursor = await query`FOR item IN dmarcSummaries RETURN item`
      const checkSummary = await checkCursor.next()

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
      expect(consoleOutput).toContain('\t\tUpdating thirtyDays for domain.ca')
    })
  })
})
