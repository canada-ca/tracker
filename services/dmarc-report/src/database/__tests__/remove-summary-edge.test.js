const { ensure, dbNameFromFile } = require('arango-tools')

const { removeSummaryEdge } = require('../remove-summary-edge')
const { databaseOptions } = require('../../../database-options')

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the removeSummaryEdge function', () => {
  let query, drop, truncate, collections

  beforeAll(async () => {
    ;({ query, drop, truncate, collections } = await ensure({
      type: 'database',
      name: dbNameFromFile(__filename),
      url,
      rootPassword: rootPass,
      options: databaseOptions({ rootPass }),
    }))
  })

  afterEach(async () => {
    await truncate()
  })

  afterAll(async () => {
    await drop()
  })

  describe('given no errors', () => {
    beforeEach(async () => {
      await collections.domainsToDmarcSummaries.save({
        _from: 'domains/1',
        _to: 'dmarcSummaries/1',
        startDate: '2021-01-01',
      })
    })
    it('removes the given summary edge', async () => {
      const removeSummaryFunc = removeSummaryEdge(query)

      await removeSummaryFunc({
        domainId: 'domains/1',
        monthToRemove: '2021-01-01',
      })

      const summaryEdgeCursor = await query`
        FOR summaryEdge IN domainsToDmarcSummaries
          RETURN summaryEdge
      `

      const summaryEdgeData = await summaryEdgeCursor.next()

      expect(summaryEdgeData).toBeUndefined()
    })
  })
  describe('passed in value is undefined', () => {
    describe('domainId is undefined', () => {
      it('returns undefined', async () => {
        const removeSummaryFunc = removeSummaryEdge(query)

        const data = await removeSummaryFunc({
          domainId: undefined,
          monthToRemove: '2021-01-01',
        })

        expect(data).toBeUndefined()
      })
    })
    describe('monthToRemove is undefined', () => {
      it('returns undefined', async () => {
        const removeSummaryFunc = removeSummaryEdge(query)

        const data = await removeSummaryFunc({
          domainId: 'domains/1',
          monthToRemove: undefined,
        })

        expect(data).toBeUndefined()
      })
    })
  })
  describe('given an error occurs', () => {
    it('throws an error', async () => {
      const mockedQuery = jest
        .fn()
        .mockRejectedValue('Database error occurred.')

      const removeSummaryFunc = removeSummaryEdge(mockedQuery)

      try {
        await removeSummaryFunc({ domainId: 'id', monthToRemove: '' })
      } catch (err) {
        expect(err).toEqual(new Error('Database error occurred.'))
      }
    })
  })
})
