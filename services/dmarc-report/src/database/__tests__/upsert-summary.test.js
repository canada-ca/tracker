const { ensure, dbNameFromFile } = require('arango-tools')

const { databaseOptions } = require('../../../database-options')
const { calculatePercentages } = require('../../utils')

const { upsertSummary } = require('../upsert-summary')

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the upsertSummary function', () => {
  let query,
    drop,
    truncate,
    collections,
    transaction,
    domain,
    org,
    summary,
    loadCategoryTotals,
    loadDkimFailureTable,
    loadDmarcFailureTable,
    loadFullPassTable,
    loadSpfFailureTable

  beforeAll(async () => {
    ;({ query, drop, truncate, collections, transaction } = await ensure({
      type: 'database',
      name: dbNameFromFile(__filename),
      url,
      rootPassword: rootPass,
      options: databaseOptions({ rootPass }),
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
    loadCategoryTotals = jest
      .fn()
      .mockReturnValue({ pass: 1, fail: 1, passDkimOnly: 1, passSpfOnly: 1 })
    loadDkimFailureTable = jest.fn().mockReturnValue([{ key: 'value' }])
    loadDmarcFailureTable = jest.fn().mockReturnValue([{ key: 'value' }])
    loadFullPassTable = jest.fn().mockReturnValue([{ key: 'value' }])
    loadSpfFailureTable = jest.fn().mockReturnValue([{ key: 'value' }])
  })

  afterEach(async () => {
    await truncate()
  })

  afterAll(async () => {
    await drop()
  })

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
