const { dbNameFromFile } = require('arango-tools')

const { removeSummary } = require('../remove-summary')
const { arangoConnection } = require('../index')

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the removeSummary function', () => {
  let query, truncate, collections, transaction, dbName, arangoDB, domain, org, summary

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
  })

  afterEach(async () => {
    await truncate()
  })

  afterAll(async () => {
    const systemDb = arangoDB.database('_system')
    await systemDb.dropDatabase(dbName)
  })

  it('removes the summary', async () => {
    await removeSummary({ transaction, collections, query })({
      domain: 'domain.ca',
      date: 'thirtyDays',
    })

    const dmarcSummariesCursor = await query`FOR item IN dmarcSummaries RETURN item`

    const dmarcSummaries = await dmarcSummariesCursor.next()

    expect(dmarcSummaries).toBeUndefined()
  })
  it('removes the domainsToDmarcSummaries edge', async () => {
    await removeSummary({ transaction, collections, query })({
      domain: 'domain.ca',
      date: 'thirtyDays',
    })

    const domainsToDmarcSummariesCursor = await query`FOR item IN domainsToDmarcSummaries RETURN item`

    const domainsToDmarcSummaries = await domainsToDmarcSummariesCursor.next()

    expect(domainsToDmarcSummaries).toBeUndefined()
  })
})
