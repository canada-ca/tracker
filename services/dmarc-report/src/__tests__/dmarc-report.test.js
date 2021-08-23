const { ensure, dbNameFromFile } = require('arango-tools')

const { databaseOptions } = require('../../database-options')
const {
  createOwnership,
  createSummary,
  removeSummary,
  upsertSummary,
} = require('../database')
const { loadArangoDates } = require('../loaders')
const { calculatePercentages } = require('../utils')

const { dmarcReport } = require('../dmarc-report')

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the dmarcReport function', () => {
  let query, drop, truncate, collections, transaction, domain, org

  const consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)

  beforeAll(async () => {
    console.info = mockedInfo
    console.warn = mockedWarn
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
  })

  afterEach(async () => {
    await truncate()
    consoleOutput.length = 0
  })

  afterAll(async () => {
    await drop()
  })

  describe('org is not found in arango', () => {
    it('logs message to console', async () => {
      await dmarcReport({
        ownerships: { ECR: [] },
        loadArangoDates: jest.fn(),
        loadArangoThirtyDaysCount: jest.fn().mockReturnValue([]),
        loadCheckOrg: jest.fn().mockReturnValue(false),
        loadCheckDomain: jest.fn().mockReturnValue([]),
        loadOrgOwner: jest.fn().mockReturnValue([]),
        createOwnership: jest.fn().mockReturnValue([]),
        removeOwnership: jest.fn().mockReturnValue([]),
        removeSummary: jest.fn().mockReturnValue([]),
        createSummary: jest.fn().mockReturnValue([]),
        upsertSummary: jest.fn().mockReturnValue([]),
        cosmosDates: jest.fn().mockReturnValue([]),
        currentDate: jest.fn().mockReturnValue('2021-01-01'),
      })

      expect(consoleOutput[0]).toEqual('Org: ECR cannot be found in datastore')
    })
  })
  describe('domain is not found in arango', () => {
    it('logs message to console', async () => {
      await dmarcReport({
        ownerships: { ECR: ['domain.ca'] },
        loadArangoDates: jest.fn(),
        loadArangoThirtyDaysCount: jest.fn().mockReturnValue([]),
        loadCheckOrg: jest.fn().mockReturnValue(true),
        loadCheckDomain: jest.fn().mockReturnValue(false),
        loadOrgOwner: jest.fn().mockReturnValue([]),
        createOwnership: jest.fn().mockReturnValue([]),
        removeOwnership: jest.fn().mockReturnValue([]),
        removeSummary: jest.fn().mockReturnValue([]),
        createSummary: jest.fn().mockReturnValue([]),
        upsertSummary: jest.fn().mockReturnValue([]),
        cosmosDates: jest.fn().mockReturnValue([]),
        currentDate: jest.fn().mockReturnValue('2021-01-01'),
      })

      expect(consoleOutput[1]).toEqual(
        '\tdomain.ca cannot be found in the datastore',
      )
    })
  })
  describe('no org owns the domain', () => {
    it('assigns ownership to domain', async () => {
      await dmarcReport({
        ownerships: { ACR: ['domain.ca'] },
        loadArangoDates: jest.fn().mockReturnValue(['2021-01-01']),
        loadArangoThirtyDaysCount: jest.fn().mockReturnValue([]),
        loadCheckOrg: jest.fn().mockReturnValue(true),
        loadCheckDomain: jest.fn().mockReturnValue(true),
        loadOrgOwner: jest.fn().mockReturnValue(undefined),
        createOwnership: createOwnership({ transaction, collections, query }),
        removeOwnership: jest.fn().mockReturnValue([]),
        removeSummary: jest.fn().mockReturnValue([]),
        createSummary: jest.fn().mockReturnValue([]),
        upsertSummary: jest.fn().mockReturnValue([]),
        cosmosDates: ['2021-01-01'],
        currentDate: jest.fn().mockReturnValue('2021-01-01'),
      })

      const checkCursor = await query`FOR item IN ownership RETURN item`
      const checkOwner = await checkCursor.next()

      const expectedResult = {
        _id: checkOwner._id,
        _key: checkOwner._key,
        _rev: checkOwner._rev,
        _from: org._id,
        _to: domain._id,
      }

      expect(checkOwner).toEqual(expectedResult)
      expect(consoleOutput[2]).toEqual(
        '\t\tAssigning domain.ca ownership to: ACR',
      )
    })
  })
  describe('another org owns the domain', () => {
    let org2
    beforeEach(async () => {
      org2 = await collections.organizations.save({
        orgDetails: {
          en: {
            acronym: 'ECR',
          },
        },
      })
    })
    it('removes old ownership', async () => {
      await dmarcReport({
        ownerships: { ACR: ['domain.ca'] },
        loadArangoDates: jest.fn().mockReturnValue(['2021-01-01']),
        loadArangoThirtyDaysCount: jest.fn().mockReturnValue([]),
        loadCheckOrg: jest.fn().mockReturnValue(true),
        loadCheckDomain: jest.fn().mockReturnValue(true),
        loadOrgOwner: jest.fn().mockReturnValue([]),
        createOwnership: createOwnership({ transaction, collections, query }),
        removeOwnership: jest.fn().mockReturnValue([]),
        removeSummary: jest.fn().mockReturnValue([]),
        createSummary: jest.fn().mockReturnValue([]),
        upsertSummary: jest.fn().mockReturnValue([]),
        cosmosDates: ['2021-01-01'],
        currentDate: jest.fn().mockReturnValue('2021-01-01'),
      })

      const checkCursor =
        await query`FOR item IN ownership FILTER item._from == ${org2._id} RETURN item`
      const checkOwner = await checkCursor.next()

      expect(checkOwner).toBeUndefined()
      expect(consoleOutput[2]).toEqual(
        '\t\tRemoving domain.ca ownership to: domain.ca',
      )
    })
    it('creates new ownership', async () => {
      await dmarcReport({
        ownerships: { ACR: ['domain.ca'] },
        loadArangoDates: jest.fn().mockReturnValue(['2021-01-01']),
        loadArangoThirtyDaysCount: jest.fn().mockReturnValue([]),
        loadCheckOrg: jest.fn().mockReturnValue(true),
        loadCheckDomain: jest.fn().mockReturnValue(true),
        loadOrgOwner: jest.fn().mockReturnValue([]),
        createOwnership: createOwnership({ transaction, collections, query }),
        removeOwnership: jest.fn().mockReturnValue([]),
        removeSummary: jest.fn().mockReturnValue([]),
        createSummary: jest.fn().mockReturnValue([]),
        upsertSummary: jest.fn().mockReturnValue([]),
        cosmosDates: ['2021-01-01'],
        currentDate: jest.fn().mockReturnValue('2021-01-01'),
      })

      const checkCursor = await query`FOR item IN ownership RETURN item`
      const checkOwner = await checkCursor.next()

      const expectedResult = {
        _id: checkOwner._id,
        _key: checkOwner._key,
        _rev: checkOwner._rev,
        _from: org._id,
        _to: domain._id,
      }

      expect(checkOwner).toEqual(expectedResult)
      expect(consoleOutput[3]).toEqual(
        '\t\tAssigning domain.ca ownership to: ACR',
      )
    })
  })
  describe('org already owns the domain', () => {
    beforeEach(async () => {
      await collections.ownership.save({
        _from: org._id,
        _to: domain._id,
      })
    })
    it('logs to console', async () => {
      await dmarcReport({
        ownerships: { ACR: ['domain.ca'] },
        loadArangoDates: jest.fn().mockReturnValue(['2021-01-01']),
        loadArangoThirtyDaysCount: jest.fn().mockReturnValue([]),
        loadCheckOrg: jest.fn().mockReturnValue(true),
        loadCheckDomain: jest.fn().mockReturnValue(true),
        loadOrgOwner: jest.fn().mockReturnValue('ACR'),
        createOwnership: createOwnership({ transaction, collections, query }),
        removeOwnership: jest.fn().mockReturnValue([]),
        removeSummary: jest.fn().mockReturnValue([]),
        createSummary: jest.fn().mockReturnValue([]),
        upsertSummary: jest.fn().mockReturnValue([]),
        cosmosDates: ['2021-01-01'],
        currentDate: jest.fn().mockReturnValue('2021-01-01'),
      })

      expect(consoleOutput[2]).toEqual(
        '\t\tOwnership of domain.ca is already assigned to ACR',
      )
    })
  })
  describe('old date is found in arango', () => {
    let summary
    beforeEach(async () => {
      await collections.ownership.save({
        _from: org._id,
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
    it('removes the summary edge for that date', async () => {
      await dmarcReport({
        ownerships: { ACR: ['domain.ca'] },
        loadArangoDates: loadArangoDates({ query }),
        loadArangoThirtyDaysCount: jest.fn().mockReturnValue([]),
        loadCheckOrg: jest.fn().mockReturnValue(true),
        loadCheckDomain: jest.fn().mockReturnValue(true),
        loadOrgOwner: jest.fn().mockReturnValue('ACR'),
        createOwnership: createOwnership({ transaction, collections, query }),
        removeOwnership: jest.fn().mockReturnValue([]),
        removeSummary: removeSummary({ transaction, collections, query }),
        createSummary: jest.fn().mockReturnValue([]),
        upsertSummary: jest.fn().mockReturnValue([]),
        cosmosDates: ['2021-01-01'],
        currentDate: '2021-01-01',
      })

      const checkCursor =
        await query`FOR item IN domainsToDmarcSummaries FILTER item._to == ${summary._id} RETURN item`
      const checkEdge = await checkCursor.next()

      expect(checkEdge).toBeUndefined()
      expect(consoleOutput[3]).toEqual('\t\tRemoving 2000-01-01 for domain.ca')
    })
    it('removes the summary for that date', async () => {
      await dmarcReport({
        ownerships: { ACR: ['domain.ca'] },
        loadArangoDates: loadArangoDates({ query }),
        loadArangoThirtyDaysCount: jest.fn().mockReturnValue([]),
        loadCheckOrg: jest.fn().mockReturnValue(true),
        loadCheckDomain: jest.fn().mockReturnValue(true),
        loadOrgOwner: jest.fn().mockReturnValue('ACR'),
        createOwnership: createOwnership({ transaction, collections, query }),
        removeOwnership: jest.fn().mockReturnValue([]),
        removeSummary: removeSummary({ transaction, collections, query }),
        createSummary: jest.fn().mockReturnValue([]),
        upsertSummary: jest.fn().mockReturnValue([]),
        cosmosDates: ['2021-01-01'],
        currentDate: '2021-01-01',
      })

      const checkCursor = await query`FOR item IN dmarcSummaries RETURN item`
      const checkSummary = await checkCursor.next()

      expect(checkSummary).toBeUndefined()
      expect(consoleOutput[3]).toEqual('\t\tRemoving 2000-01-01 for domain.ca')
    })
  })
  describe('date is not found in arango dates', () => {
    it('creates the summary edge', async () => {
      await dmarcReport({
        ownerships: { ACR: ['domain.ca'] },
        loadArangoDates: loadArangoDates({ query }),
        loadArangoThirtyDaysCount: jest.fn().mockReturnValue([]),
        loadCheckOrg: jest.fn().mockReturnValue(true),
        loadCheckDomain: jest.fn().mockReturnValue(true),
        loadOrgOwner: jest.fn().mockReturnValue('ACR'),
        createOwnership: createOwnership({ transaction, collections, query }),
        removeOwnership: jest.fn().mockReturnValue([]),
        removeSummary: removeSummary({ transaction, collections, query }),
        createSummary: createSummary({
          transaction,
          collections,
          query,
          loadCategoryTotals: jest.fn().mockReturnValue({
            totalMessages: 0,
            categoryPercentages: {
              fail: 0,
              pass: 0,
              passDkimOnly: 0,
              passSpfOnly: 0,
            },
          }),
          loadDkimFailureTable: jest.fn().mockReturnValue([]),
          loadDmarcFailureTable: jest.fn().mockReturnValue([]),
          loadFullPassTable: jest.fn().mockReturnValue([]),
          loadSpfFailureTable: jest.fn().mockReturnValue([]),
          calculatePercentages,
        }),
        upsertSummary: jest.fn().mockReturnValue([]),
        cosmosDates: ['2021-01-01'],
        currentDate: '2021-01-01',
      })

      const checkCursor =
        await query`FOR item IN domainsToDmarcSummaries RETURN item`
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
      expect(consoleOutput[3]).toEqual(
        '\t\tInitializing 2021-01-01 for domain.ca',
      )
    })
    it('creates the summary', async () => {
      await dmarcReport({
        ownerships: { ACR: ['domain.ca'] },
        loadArangoDates: loadArangoDates({ query }),
        loadArangoThirtyDaysCount: jest.fn().mockReturnValue([]),
        loadCheckOrg: jest.fn().mockReturnValue(true),
        loadCheckDomain: jest.fn().mockReturnValue(true),
        loadOrgOwner: jest.fn().mockReturnValue('ACR'),
        createOwnership: createOwnership({ transaction, collections, query }),
        removeOwnership: jest.fn().mockReturnValue([]),
        removeSummary: removeSummary({ transaction, collections, query }),
        createSummary: createSummary({
          transaction,
          collections,
          query,
          loadCategoryTotals: jest.fn().mockReturnValue({
            pass: 0,
            fail: 0,
            passDkimOnly: 0,
            passSpfOnly: 0,
          }),
          loadDkimFailureTable: jest.fn().mockReturnValue([]),
          loadDmarcFailureTable: jest.fn().mockReturnValue([]),
          loadFullPassTable: jest.fn().mockReturnValue([]),
          loadSpfFailureTable: jest.fn().mockReturnValue([]),
          calculatePercentages,
        }),
        upsertSummary: jest.fn().mockReturnValue([]),
        cosmosDates: ['2021-01-01'],
        currentDate: '2021-01-01',
      })

      const checkCursor = await query`FOR item IN dmarcSummaries RETURN item`
      const checkSummary = await checkCursor.next()

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
      expect(consoleOutput[3]).toEqual(
        '\t\tInitializing 2021-01-01 for domain.ca',
      )
    })
  })
  describe('date is found in arango dates', () => {
    let summary
    beforeEach(async () => {
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
        startDate: '2021-01-01',
      })
    })
    it('updates the summary', async () => {
      await dmarcReport({
        ownerships: { ACR: ['domain.ca'] },
        loadArangoDates: loadArangoDates({ query }),
        loadArangoThirtyDaysCount: jest.fn().mockReturnValue(0),
        loadCheckOrg: jest.fn().mockReturnValue(true),
        loadCheckDomain: jest.fn().mockReturnValue(true),
        loadOrgOwner: jest.fn().mockReturnValue('ACR'),
        createOwnership: createOwnership({ transaction, collections, query }),
        removeOwnership: jest.fn().mockReturnValue([]),
        removeSummary: removeSummary({ transaction, collections, query }),
        createSummary: jest.fn(),
        upsertSummary: upsertSummary({
          transaction,
          collections,
          query,
          loadCategoryTotals: jest.fn().mockReturnValue({
            pass: 1,
            fail: 1,
            passDkimOnly: 1,
            passSpfOnly: 1,
          }),
          loadDkimFailureTable: jest.fn().mockReturnValue([{ key: 'value' }]),
          loadDmarcFailureTable: jest.fn().mockReturnValue([{ key: 'value' }]),
          loadFullPassTable: jest.fn().mockReturnValue([{ key: 'value' }]),
          loadSpfFailureTable: jest.fn().mockReturnValue([{ key: 'value' }]),
          calculatePercentages,
        }),
        cosmosDates: ['2021-01-01'],
        currentDate: '2021-01-01',
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
          dkimFailure: [{ key: 'value' }],
          dmarcFailure: [{ key: 'value' }],
          fullPass: [{ key: 'value' }],
          spfFailure: [{ key: 'value' }],
        },
        totalMessages: 4,
      }

      expect(checkSummary).toEqual(expectedResult)
      expect(consoleOutput[3]).toEqual('\t\tUpdating 2021-01-01 for domain.ca')
    })
  })
  describe('thirty days is not found in arango', () => {
    let summary
    beforeEach(async () => {
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
        startDate: '2021-01-01',
      })
    })
    it('creates the summary edge', async () => {
      await dmarcReport({
        ownerships: { ACR: ['domain.ca'] },
        loadArangoDates: loadArangoDates({ query }),
        loadArangoThirtyDaysCount: jest.fn().mockReturnValue(0),
        loadCheckOrg: jest.fn().mockReturnValue(true),
        loadCheckDomain: jest.fn().mockReturnValue(true),
        loadOrgOwner: jest.fn().mockReturnValue('ACR'),
        createOwnership: createOwnership({ transaction, collections, query }),
        removeOwnership: jest.fn().mockReturnValue([]),
        removeSummary: removeSummary({ transaction, collections, query }),
        createSummary: createSummary({
          transaction,
          collections,
          query,
          loadCategoryTotals: jest.fn().mockReturnValue({
            pass: 0,
            fail: 0,
            passDkimOnly: 0,
            passSpfOnly: 0,
          }),
          loadDkimFailureTable: jest.fn().mockReturnValue([]),
          loadDmarcFailureTable: jest.fn().mockReturnValue([]),
          loadFullPassTable: jest.fn().mockReturnValue([]),
          loadSpfFailureTable: jest.fn().mockReturnValue([]),
          calculatePercentages,
        }),
        upsertSummary: upsertSummary({
          transaction,
          collections,
          query,
          loadCategoryTotals: jest.fn().mockReturnValue({
            pass: 1,
            fail: 1,
            passDkimOnly: 1,
            passSpfOnly: 1,
          }),
          loadDkimFailureTable: jest.fn().mockReturnValue([{ key: 'value' }]),
          loadDmarcFailureTable: jest.fn().mockReturnValue([{ key: 'value' }]),
          loadFullPassTable: jest.fn().mockReturnValue([{ key: 'value' }]),
          loadSpfFailureTable: jest.fn().mockReturnValue([{ key: 'value' }]),
          calculatePercentages,
        }),
        cosmosDates: ['2021-01-01'],
        currentDate: '2021-01-01',
      })

      const checkCursor =
        await query`FOR item IN domainsToDmarcSummaries FILTER item.startDate == "thirtyDays" RETURN item`
      const checkSummary = await checkCursor.next()

      const expectedResult = {
        _id: checkSummary._id,
        _key: checkSummary._key,
        _rev: checkSummary._rev,
        _from: domain._id,
        _to: checkSummary._to,
        startDate: 'thirtyDays',
      }

      expect(checkSummary).toEqual(expectedResult)
      expect(consoleOutput[4]).toEqual(
        '\t\tInitializing Thirty Days for domain.ca',
      )
    })
    it('creates the summary', async () => {
      await dmarcReport({
        ownerships: { ACR: ['domain.ca'] },
        loadArangoDates: loadArangoDates({ query }),
        loadArangoThirtyDaysCount: jest.fn().mockReturnValue(0),
        loadCheckOrg: jest.fn().mockReturnValue(true),
        loadCheckDomain: jest.fn().mockReturnValue(true),
        loadOrgOwner: jest.fn().mockReturnValue('ACR'),
        createOwnership: createOwnership({ transaction, collections, query }),
        removeOwnership: jest.fn().mockReturnValue([]),
        removeSummary: removeSummary({ transaction, collections, query }),
        createSummary: createSummary({
          transaction,
          collections,
          query,
          loadCategoryTotals: jest.fn().mockReturnValue({
            pass: 0,
            fail: 0,
            passDkimOnly: 0,
            passSpfOnly: 0,
          }),
          loadDkimFailureTable: jest.fn().mockReturnValue([]),
          loadDmarcFailureTable: jest.fn().mockReturnValue([]),
          loadFullPassTable: jest.fn().mockReturnValue([]),
          loadSpfFailureTable: jest.fn().mockReturnValue([]),
          calculatePercentages,
        }),
        upsertSummary: upsertSummary({
          transaction,
          collections,
          query,
          loadCategoryTotals: jest.fn().mockReturnValue({
            pass: 1,
            fail: 1,
            passDkimOnly: 1,
            passSpfOnly: 1,
          }),
          loadDkimFailureTable: jest.fn().mockReturnValue([{ key: 'value' }]),
          loadDmarcFailureTable: jest.fn().mockReturnValue([{ key: 'value' }]),
          loadFullPassTable: jest.fn().mockReturnValue([{ key: 'value' }]),
          loadSpfFailureTable: jest.fn().mockReturnValue([{ key: 'value' }]),
          calculatePercentages,
        }),
        cosmosDates: ['2021-01-01'],
        currentDate: '2021-01-01',
      })

      const sumIdCursor =
        await query`FOR item IN domainsToDmarcSummaries FILTER item.startDate == "thirtyDays" RETURN item`
      const sumId = await sumIdCursor.next()
      const checkCursor =
        await query`FOR item IN dmarcSummaries FILTER item._id == ${sumId._to} RETURN item`
      const checkSummary = await checkCursor.next()

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
      expect(consoleOutput[4]).toEqual(
        '\t\tInitializing Thirty Days for domain.ca',
      )
    })
  })
  describe('thirty days is found in arango', () => {
    let summary, summary2
    beforeEach(async () => {
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
        loadArangoDates: loadArangoDates({ query }),
        loadArangoThirtyDaysCount: jest.fn().mockReturnValue(1),
        loadCheckOrg: jest.fn().mockReturnValue(true),
        loadCheckDomain: jest.fn().mockReturnValue(true),
        loadOrgOwner: jest.fn().mockReturnValue('ACR'),
        createOwnership: createOwnership({ transaction, collections, query }),
        removeOwnership: jest.fn().mockReturnValue([]),
        removeSummary: removeSummary({ transaction, collections, query }),
        createSummary: jest.fn(),
        upsertSummary: upsertSummary({
          transaction,
          collections,
          query,
          loadCategoryTotals: jest.fn().mockReturnValue({
            pass: 1,
            fail: 1,
            passDkimOnly: 1,
            passSpfOnly: 1,
          }),
          loadDkimFailureTable: jest.fn().mockReturnValue([{ key: 'value' }]),
          loadDmarcFailureTable: jest.fn().mockReturnValue([{ key: 'value' }]),
          loadFullPassTable: jest.fn().mockReturnValue([{ key: 'value' }]),
          loadSpfFailureTable: jest.fn().mockReturnValue([{ key: 'value' }]),
          calculatePercentages,
        }),
        cosmosDates: ['2021-01-01'],
        currentDate: '2021-01-01',
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
          dkimFailure: [{ key: 'value' }],
          dmarcFailure: [{ key: 'value' }],
          fullPass: [{ key: 'value' }],
          spfFailure: [{ key: 'value' }],
        },
        totalMessages: 4,
      }

      expect(checkSummary).toEqual(expectedResult)
      expect(consoleOutput[4]).toEqual('\t\tUpdating Thirty Days for domain.ca')
    })
  })
})
