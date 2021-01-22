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

  beforeAll(async () => {
    ;({ migrate } = await ArangoTools({ rootPass, url }))
    ;({ query, drop, truncate, collections } = await migrate(
      makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
    ))
  })

  afterEach(async () => {
    await truncate()
  })

  afterAll(async () => {
    await drop()
  })

  describe('dmarc summaries have to all be initialized', () => {
    let mockedContainer, mockedDates
    beforeAll(async () => {
      await collections.domains.save({
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
        createSummaryEdge(collections),
        createSummary(query),
        mockedDates,
        loadSummaryByDate(mockedContainer),
        removeSummaryEdge(query),
        removeSummary(query),
      )

      await createSummaryFunc({ domain: 'domain.ca' })
    })
  })
  describe('thirty days and current month need to be updated', () => {
    it('updates two records', async () => {})
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
        createSummaryEdge(collections),
        createSummary(query),
        loadDates(moment),
        loadSummaryByDate(jest.fn()),
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
          createSummaryEdge(collections),
          createSummary(query),
          loadDates(moment),
          loadSummaryByDate(jest.fn()),
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
          createSummaryEdge(collections),
          createSummary(query),
          loadDates(moment),
          loadSummaryByDate(jest.fn()),
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
          createSummaryEdge(collections),
          createSummary(query),
          loadDates(moment),
          loadSummaryByDate(jest.fn()),
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
