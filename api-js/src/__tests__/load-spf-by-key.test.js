require('dotenv-safe').config({
  allowEmptyValues: true,
})

const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { makeMigrations } = require('../../migrations')
const { spfLoaderByKey } = require('../loaders')

describe('given the spfLoaderByKey function', () => {
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
    await collections.spf.save({})
    await collections.spf.save({})
  })

  afterAll(async () => {
    await drop()
  })

  describe('given a single id', () => {
    it('returns a single spf scan', async () => {
      const expectedCursor = await query`
      FOR spfScan IN spf
        SORT spfScan._key ASC LIMIT 1
        RETURN spfScan
    `
    const expectedSpf = await expectedCursor.next()

    const loader = spfLoaderByKey(query)
    const spf = await loader.load(expectedSpf._key)

    expect(spf).toEqual(expectedSpf)
    })
  })
  describe('given multiple ids', () => {
    it('returns multiple spf scans', async () => {
      const spfKeys = []
      const expectedSpfScans = []
      const expectedCursor = await query`
        FOR spfScan IN spf
          RETURN spfScan
      `

      while (expectedCursor.hasNext()) {
        const tempSpf = await expectedCursor.next()
        spfKeys.push(tempSpf._key)
        expectedSpfScans.push(tempSpf)
      }

      const loader = spfLoaderByKey(query)
      const dkimScans = await loader.loadMany(spfKeys)
      expect(dkimScans).toEqual(expectedSpfScans)
    })
  })
  describe('given a database error', () => {
    it('raises an error', async () => {
      query = jest.fn().mockRejectedValue(new Error('Database error occurred.'))
      const loader = spfLoaderByKey(query)

      try {
        await loader.load('1')
      } catch (err) {
        expect(err).toEqual(
          new Error('Unable to find spf scan. Please try again.'),
        )
      }

      expect(consoleErrorOutput).toEqual([
        `Database error occurred when running spfLoaderByKey: Error: Database error occurred.`,
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
      const loader = spfLoaderByKey(query)

      try {
        await loader.load('1')
      } catch (err) {
        expect(err).toEqual(
          new Error('Unable to find spf scan. Please try again.'),
        )
      }

      expect(consoleErrorOutput).toEqual([
        `Cursor error occurred when running spfLoaderByKey: Error: Cursor error occurred.`,
      ])
    })
  })
})
