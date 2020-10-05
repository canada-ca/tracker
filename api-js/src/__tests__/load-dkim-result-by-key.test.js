require('dotenv-safe').config({
  allowEmptyValues: true,
})

const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { makeMigrations } = require('../../migrations')
const { dkimResultLoaderByKey } = require('../loaders')

describe('given the dkimResultLoaderByKey function', () => {
  let query, drop, truncate, migrate, collections

  const consoleErrorOutput = []
  const mockedError = (output) => consoleErrorOutput.push(output)

  beforeAll(async () => {
    ;({ migrate } = await ArangoTools({ rootPass, url }))
    ;({ query, drop, truncate, collections } = await migrate(
      makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
    ))
    console.error = mockedError
  })

  beforeEach(async () => {
    consoleErrorOutput.length = 0

    await truncate()
    await collections.dkimResults.save({})
    await collections.dkimResults.save({})
  })

  afterAll(async () => {
    await drop()
  })

  describe('given a single id', () => {
    it('returns a single dkim result', async () => {
      // Get dkim result from db
      const expectedCursor = await query`
        FOR dkimResult IN dkimResults
          SORT dkimResult._key ASC LIMIT 1
          RETURN dkimResult
      `
      const expectedDkimResult = await expectedCursor.next()

      const loader = dkimResultLoaderByKey(query)
      const dkimResult = await loader.load(expectedDkimResult._key)

      expect(dkimResult).toEqual(expectedDkimResult)
    })
  })
  describe('given multiple ids', () => {
    it('returns multiple dkim results', async () => {
      const dkimResultKeys = []
      const expectedDkimResults = []
      const expectedCursor = await query`
        FOR dkimResult IN dkimResults
          RETURN dkimResult
      `

      while(expectedCursor.hasNext()) {
        const tempDkimResult = await expectedCursor.next()
        dkimResultKeys.push(tempDkimResult._key)
        expectedDkimResults.push(tempDkimResult)
      }

      const loader = dkimResultLoaderByKey(query)
      const dkimResults = await loader.loadMany(dkimResultKeys)
      expect(dkimResults).toEqual(expectedDkimResults)
    })
  })
  describe('given a database error', () => {
    it('raises an error', async () => {
      query = jest.fn().mockRejectedValue(new Error('Database error occurred.'))
      const loader = dkimResultLoaderByKey(query)

      try {
        await loader.load('1')
      } catch (err) {
        expect(err).toEqual(
          new Error('Unable to find dkim result. Please try again.'),
        )
      }

      expect(consoleErrorOutput).toEqual([
        `Database error occurred when running dkimResultLoaderByKey: Error: Database error occurred.`,
      ])
    })
  })
  describe('given a cursor error', () => {
    it('raises an error', async () => {
      const cursor = {
        each() {
          throw new Error('Cursor error occurred.')
        },
      }
      query = jest.fn().mockReturnValue(cursor)
      const loader = dkimResultLoaderByKey(query)

      try {
        await loader.load('1')
      } catch (err) {
        expect(err).toEqual(
          new Error('Unable to find dkim result. Please try again.'),
        )
      }

      expect(consoleErrorOutput).toEqual([
        `Cursor error occurred when running dkimResultLoaderByKey: Error: Cursor error occurred.`,
      ])
    })
  })
})
