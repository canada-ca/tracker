const { ArangoTools, dbNameFromFile } = require('arango-tools')

const { createSummaryEdge } = require('../create-summary-edge')
const { makeMigrations } = require('../../../migrations')

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the createSummary function', () => {
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
    it('creates the given summary', async () => {
      const createEdgeFunc = createSummaryEdge(collections)

      await createEdgeFunc({
        domainId: 'domains/1',
        summaryId: 'dmarcSummaries/1',
        startDate: '2021-01-01',
      })

      const edgeCursor = await query`
        FOR edge IN domainsToDmarcSummaries
          RETURN edge
      `

      const edgeData = await edgeCursor.next()

      const expectedEdgeData = {
        _id: edgeData._id,
        _key: edgeData._key,
        _rev: edgeData._rev,
        _from: 'domains/1',
        _to: 'dmarcSummaries/1',
        startDate: '2021-01-01',
      }

      expect(edgeData).toEqual(expectedEdgeData)
    })
  })
  describe('given an error occurs', () => {
    it('throws an error', async () => {
      const mockedCollection = {
        domainsToDmarcSummaries: {
          save: jest.fn().mockRejectedValue('Database error occurred.'),
        },
      }

      const createEdgeFunc = createSummaryEdge(mockedCollection)

      try {
        await createEdgeFunc({
          domainId: 'domains/1',
          summaryId: 'dmarcSummaries/1',
          startDate: '2021-01-01',
        })
      } catch (err) {
        expect(err).toEqual(new Error('Database error occurred.'))
      }
    })
  })
})
