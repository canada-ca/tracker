const { ArangoTools, dbNameFromFile } = require('arango-tools')

const { removeSummaryEdge } = require('../remove-summary-edge')
const { makeMigrations } = require('../../../migrations')

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the removeSummaryEdge function', () => {
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
