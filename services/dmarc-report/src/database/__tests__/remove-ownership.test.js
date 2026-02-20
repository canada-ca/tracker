const { removeOwnershipAndSummaries } = require('../remove-ownership-and-summaries')
const { arangoConnection } = require('../arango-connection')
const { dbNameFromFile } = require('arango-tools')

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the removeOwnership function', () => {
  let query, truncate, collections, transaction, arangoCtx, dbName, arangoDB, domain, org, summary

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

  it('removes the ownership', async () => {
    await removeOwnershipAndSummaries({
      arangoCtx,
      domain: 'domain.ca',
      orgAcronymEn: 'ACR',
    })

    const ownershipCursor = await query`FOR item IN ownership RETURN item`

    const ownership = await ownershipCursor.next()

    expect(ownership).toBeUndefined()
  })
  it('removes domainsToDmarcSummaries', async () => {
    await removeOwnershipAndSummaries({
      arangoCtx,
      domain: 'domain.ca',
      orgAcronymEn: 'ACR',
    })

    const domainsToDmarcSummariesCursor = await query`FOR item IN domainsToDmarcSummaries RETURN item`

    const domainsToDmarcSummaries = await domainsToDmarcSummariesCursor.next()

    expect(domainsToDmarcSummaries).toBeUndefined()
  })
  it('removes dmarc summary', async () => {
    await removeOwnershipAndSummaries({
      arangoCtx,
      domain: 'domain.ca',
      orgAcronymEn: 'ACR',
    })

    const dmarcSummariesCursor = await query`FOR item IN dmarcSummaries RETURN item`

    const dmarcSummaries = await dmarcSummariesCursor.next()

    expect(dmarcSummaries).toBeUndefined()
  })
})
