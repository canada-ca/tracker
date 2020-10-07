require('dotenv-safe').config({
  allowEmptyValues: true,
})

const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { makeMigrations } = require('../../migrations')
const { httpsLoaderByKey } = require('../loaders')

describe('given the httpsLoaderByKey function', () => {
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
    await collections.https.save({})
    await collections.https.save({})
  })

  afterAll(async () => {
    await drop()
  })

  describe('given a single id', () => {
    it('returns a single https scan', async () => {
      const expectedCursor = await query`
      FOR httpsScan IN https
        SORT httpsScan._key ASC LIMIT 1
        RETURN httpsScan
      `
      const expectedHttps = await expectedCursor.next()
      
      const loader = httpsLoaderByKey(query)
      const https = await loader.load(expectedHttps._key)
      
      expect(https).toEqual(expectedHttps)
    })
  })
  describe('given multiple ids', () => {
    it('returns multiple https scans', async () => {
      const httpsKeys = []
      const expectedHttpsScans = []
      
      const expectedCursor = await query`
      FOR httpsScan IN https
        RETURN httpsScan
      `

      while (expectedCursor.hasNext()) {
        const tempHttps = await expectedCursor.next()
        httpsKeys.push(tempHttps._key)
        expectedHttpsScans.push(tempHttps)
      }

      const loader = httpsLoaderByKey(query)
      const httpsScans = await loader.loadMany(httpsKeys)

      expect(httpsScans).toEqual(expectedHttpsScans)
    })
  })
  describe('given a database error', () => {
    it('raises an error', async () => {
      query = jest.fn().mockRejectedValue(new Error('Database error occurred.'))
      const loader = httpsLoaderByKey(query)

      try {
        await loader.load('1')
      } catch (err) {
        expect(err).toEqual(
          new Error('Unable to find https scan. Please try again.'),
        )
      }
      expect(consoleErrorOutput).toEqual([
        `Database error occurred when running httpsLoaderByKey: Error: Database error occurred.`,
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
      const loader = httpsLoaderByKey(query)

      try {
        await loader.load('1')
      } catch (err) {
        expect(err).toEqual(
          new Error('Unable to find https scan. Please try again.'),
        )
      }
      expect(consoleErrorOutput).toEqual([
        `Cursor error occurred when running httpsLoaderByKey: Error: Cursor error occurred.`,
      ])
    })
  })
})
