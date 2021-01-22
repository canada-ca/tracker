const { ArangoTools, dbNameFromFile } = require('arango-tools')
const moment = require('moment')

const { createSummaries } = require('../create-summaries')
const { makeMigrations } = require('../../../migrations')
const {
  arrayEquals,
  loadDates,
  loadSummaryByDate,
  createSummaryEdge,
  createSummary,
  removeSummaryEdge,
  removeSummary,
} = require('../../index')

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the createSummaries function', () => {
  let query, drop, truncate, migrate, collections

  const infoConsole = []
  const mockedInfo = (output) => infoConsole.push(output)
  beforeAll(async () => {
    ;({ migrate } = await ArangoTools({ rootPass, url }))
    ;({ query, drop, truncate, collections } = await migrate(
      makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
    ))
    console.info = mockedInfo
  })

  afterEach(async () => {
    await truncate()
  })

  afterAll(async () => {
    await drop()
  })

  describe('dmarc summaries have to all be initialized', () => {
    let domain, mockedContainer, mockedDates
    beforeAll(async () => {
      domain = await collections.domains.save({
        domain: 'domain.ca',
        selectors: '',
        status: {
          dkim: 'fail',
          dmarc: 'fail',
          https: 'fail',
          spf: 'fail',
          ssl: 'fail',
        },
        lastRan: '2021-01-01 12:12:12.000000',
      })

      mockedContainer = {
        items: {
          query: jest.fn().mockReturnValue({
            fetchAll() {
              return {
                resources: [],
              }
            },
          }),
        },
      }

      mockedDates = jest.fn().mockReturnValue([
        {
          startDate: '2020-01-01',
        },
        {
          startDate: '2020-02-01',
        },
        {
          startDate: '2020-03-01',
        },
        {
          startDate: '2020-04-01',
        },
        {
          startDate: '2020-05-01',
        },
        {
          startDate: '2020-06-01',
        },
        {
          startDate: '2020-07-01',
        },
        {
          startDate: '2020-08-01',
        },
        {
          startDate: '2020-09-01',
        },
        {
          startDate: '2020-10-01',
        },
        {
          startDate: '2020-11-01',
        },
        {
          startDate: '2020-12-01',
        },
        {
          startDate: '2021-01-01',
        },
      ])
    })
    it('creates 14 dmarc summaries', async () => {
      const createSummaryFunc = createSummaries(
        query,
        arrayEquals,
        mockedDates,
        loadSummaryByDate(mockedContainer),
        createSummaryEdge(collections),
        createSummary(query),
        removeSummaryEdge(query),
        removeSummary(query),
      )

      await createSummaryFunc({ domain: 'domain.ca' })

      const summaryEdgeCursor = await query`
        FOR summary IN domainsToDmarcSummaries
          RETURN { startDate: summary.startDate, _from: summary._from }
      `

      const expectedSummaryEdges = [
        {
          _from: domain._id,
          startDate: '2020-01-01',
        },
        {
          _from: domain._id,
          startDate: '2020-02-01',
        },
        {
          _from: domain._id,
          startDate: '2020-03-01',
        },
        {
          _from: domain._id,
          startDate: '2020-04-01',
        },
        {
          _from: domain._id,
          startDate: '2020-05-01',
        },
        {
          _from: domain._id,
          startDate: '2020-06-01',
        },
        {
          _from: domain._id,
          startDate: '2020-07-01',
        },
        {
          _from: domain._id,
          startDate: '2020-08-01',
        },
        {
          _from: domain._id,
          startDate: '2020-09-01',
        },
        {
          _from: domain._id,
          startDate: '2020-10-01',
        },
        {
          _from: domain._id,
          startDate: '2020-11-01',
        },
        {
          _from: domain._id,
          startDate: '2020-12-01',
        },
        {
          _from: domain._id,
          startDate: '2021-01-01',
        },
        {
          _from: domain._id,
          startDate: 'thirtyDays',
        },
      ]

      await expect(summaryEdgeCursor.all()).resolves.toEqual(
        expectedSummaryEdges,
      )

      const summaryCursor = await query`
        FOR summary IN dmarcSummaries
          RETURN summary
      `

      const expectedSummaries = [
        {
          detailTables: {
            dkimFailure: [],
            dmarcFailure: [],
            fullPass: [],
            spfFailure: [],
          },
          categoryTotals: {
            pass: 0,
            fail: 0,
            passDkimOnly: 0,
            passSpfOnly: 0,
          },
        },
        {
          detailTables: {
            dkimFailure: [],
            dmarcFailure: [],
            fullPass: [],
            spfFailure: [],
          },
          categoryTotals: {
            pass: 0,
            fail: 0,
            passDkimOnly: 0,
            passSpfOnly: 0,
          },
        },
        {
          detailTables: {
            dkimFailure: [],
            dmarcFailure: [],
            fullPass: [],
            spfFailure: [],
          },
          categoryTotals: {
            pass: 0,
            fail: 0,
            passDkimOnly: 0,
            passSpfOnly: 0,
          },
        },
        {
          detailTables: {
            dkimFailure: [],
            dmarcFailure: [],
            fullPass: [],
            spfFailure: [],
          },
          categoryTotals: {
            pass: 0,
            fail: 0,
            passDkimOnly: 0,
            passSpfOnly: 0,
          },
        },
        {
          detailTables: {
            dkimFailure: [],
            dmarcFailure: [],
            fullPass: [],
            spfFailure: [],
          },
          categoryTotals: {
            pass: 0,
            fail: 0,
            passDkimOnly: 0,
            passSpfOnly: 0,
          },
        },
        {
          detailTables: {
            dkimFailure: [],
            dmarcFailure: [],
            fullPass: [],
            spfFailure: [],
          },
          categoryTotals: {
            pass: 0,
            fail: 0,
            passDkimOnly: 0,
            passSpfOnly: 0,
          },
        },
        {
          detailTables: {
            dkimFailure: [],
            dmarcFailure: [],
            fullPass: [],
            spfFailure: [],
          },
          categoryTotals: {
            pass: 0,
            fail: 0,
            passDkimOnly: 0,
            passSpfOnly: 0,
          },
        },
        {
          detailTables: {
            dkimFailure: [],
            dmarcFailure: [],
            fullPass: [],
            spfFailure: [],
          },
          categoryTotals: {
            pass: 0,
            fail: 0,
            passDkimOnly: 0,
            passSpfOnly: 0,
          },
        },
        {
          detailTables: {
            dkimFailure: [],
            dmarcFailure: [],
            fullPass: [],
            spfFailure: [],
          },
          categoryTotals: {
            pass: 0,
            fail: 0,
            passDkimOnly: 0,
            passSpfOnly: 0,
          },
        },
        {
          detailTables: {
            dkimFailure: [],
            dmarcFailure: [],
            fullPass: [],
            spfFailure: [],
          },
          categoryTotals: {
            pass: 0,
            fail: 0,
            passDkimOnly: 0,
            passSpfOnly: 0,
          },
        },
        {
          detailTables: {
            dkimFailure: [],
            dmarcFailure: [],
            fullPass: [],
            spfFailure: [],
          },
          categoryTotals: {
            pass: 0,
            fail: 0,
            passDkimOnly: 0,
            passSpfOnly: 0,
          },
        },
        {
          detailTables: {
            dkimFailure: [],
            dmarcFailure: [],
            fullPass: [],
            spfFailure: [],
          },
          categoryTotals: {
            pass: 0,
            fail: 0,
            passDkimOnly: 0,
            passSpfOnly: 0,
          },
        },
        {
          detailTables: {
            dkimFailure: [],
            dmarcFailure: [],
            fullPass: [],
            spfFailure: [],
          },
          categoryTotals: {
            pass: 0,
            fail: 0,
            passDkimOnly: 0,
            passSpfOnly: 0,
          },
        },
      ]

      await expect(summaryCursor.all()).resolves.toEqual(expectedSummaries)
    })
  })
  describe('thirty days and current month need to be updated', () => {
    it('updates two records', async () => {
      let domain, mockedContainer, mockedDates
      beforeAll(async () => {
        domain = await collections.domains.save({
          domain: 'domain.ca',
          selectors: '',
          status: {
            dkim: 'fail',
            dmarc: 'fail',
            https: 'fail',
            spf: 'fail',
            ssl: 'fail',
          },
          lastRan: '2021-01-01 12:12:12.000000',
        })

        mockedContainer = {
          items: {
            query: jest.fn().mockReturnValue({
              fetchAll() {
                return {
                  resources: [],
                }
              },
            }),
          },
        }

        mockedDates = jest.fn().mockReturnValue([
          {
            startDate: '2020-01-01',
          },
          {
            startDate: '2020-02-01',
          },
          {
            startDate: '2020-03-01',
          },
          {
            startDate: '2020-04-01',
          },
          {
            startDate: '2020-05-01',
          },
          {
            startDate: '2020-06-01',
          },
          {
            startDate: '2020-07-01',
          },
          {
            startDate: '2020-08-01',
          },
          {
            startDate: '2020-09-01',
          },
          {
            startDate: '2020-10-01',
          },
          {
            startDate: '2020-11-01',
          },
          {
            startDate: '2020-12-01',
          },
          {
            startDate: '2021-01-01',
          },
        ])
      })

      const createSummaryFunc = createSummaries(
        query,
        arrayEquals,
        mockedDates,
        loadSummaryByDate(mockedContainer),
        createSummaryEdge(collections),
        createSummary(query),
        removeSummaryEdge(query),
        removeSummary(query),
      )

      await createSummaryFunc({ domain: 'domain.ca' })
    })
    describe('current month is a new month', () => {
      it('removes oldest month', async () => {})
      it('creates a new month record', async () => {})
    })
  })
  describe('domain cannot be found', () => {
    const consoleOutput = []
    const mockedWarning = (output) => consoleOutput.push(output)
    beforeAll(() => {
      console.warn = mockedWarning
    })
    afterAll(() => {
      consoleOutput.length = 0
    })
    it('logs to terminal', async () => {
      const cursor = {
        next() {
          return undefined
        },
      }

      const mockedQuery = jest.fn().mockReturnValue(cursor)

      const createSummaryFunc = createSummaries(
        mockedQuery,
        arrayEquals,
        loadDates(moment),
        loadSummaryByDate(jest.fn()),
        createSummaryEdge(collections),
        createSummary(query),
        removeSummaryEdge(query),
        removeSummary(query),
      )

      await createSummaryFunc({ domain: 'domain.ca' })

      expect(consoleOutput).toEqual([`Could not find domain in DB: domain.ca`])
    })
  })
  describe('database error occurs', () => {
    describe('when checking for domain', () => {
      it('throws an error', async () => {
        const mockedQuery = jest
          .fn()
          .mockRejectedValue('Database error occurred.')

        const createSummaryFunc = createSummaries(
          mockedQuery,
          arrayEquals,
          loadDates(moment),
          loadSummaryByDate(jest.fn()),
          createSummaryEdge(collections),
          createSummary(query),
          removeSummaryEdge(query),
          removeSummary(query),
        )

        try {
          await createSummaryFunc({ domain: 'domain.ca' })
        } catch (err) {
          expect(err).toEqual(Error('Database error occurred.'))
        }
      })
    })
    describe('when checking for any dmarc summary connections', () => {
      it('throws an error', async () => {
        const cursor = {
          next() {
            return {
              _id: 'domains/1',
            }
          },
        }

        const mockedQuery = jest
          .fn()
          .mockReturnValueOnce(cursor)
          .mockRejectedValue('Database error occurred.')

        const createSummaryFunc = createSummaries(
          mockedQuery,
          arrayEquals,
          loadDates(moment),
          loadSummaryByDate(jest.fn()),
          createSummaryEdge(collections),
          createSummary(query),
          removeSummaryEdge(query),
          removeSummary(query),
        )

        try {
          await createSummaryFunc({ domain: 'domain.ca' })
        } catch (err) {
          expect(err).toEqual(Error('Database error occurred.'))
        }
      })
    })
  })
  describe('cursor error occurs', () => {
    describe('when checking for domain', () => {
      it('throws an error', async () => {
        const cursor = {
          next: jest.fn().mockRejectedValue('Cursor error ocurred.'),
        }

        const mockedQuery = jest.fn().mockReturnValue(cursor)

        const createSummaryFunc = createSummaries(
          mockedQuery,
          arrayEquals,
          loadDates(moment),
          loadSummaryByDate(jest.fn()),
          createSummaryEdge(collections),
          createSummary(query),
          removeSummaryEdge(query),
          removeSummary(query),
        )

        await expect(
          createSummaryFunc({ domain: 'domain.ca' }),
        ).rejects.toEqual(new Error('Cursor error ocurred.'))
      })
    })
  })
})
