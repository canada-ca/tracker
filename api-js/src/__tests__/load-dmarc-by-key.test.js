require('dotenv-safe').config({
  allowEmptyValues: true,
})
const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { makeMigrations } = require('../../migrations')
const { dmarcLoaderByKey } = require('../loaders')

describe('given the dmarcLoaderByKey function', () => {
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
    await collections.dmarc.save({})
    await collections.dmarc.save({})
  })

  afterAll(async () => {
    await drop()
  })
  describe('given a single id', () => {
    it('returns a single dmarc scan', async () => {
      const expectedCursor = await query`
        FOR dmarcScan IN dmarc
          SORT dmarcScan._key ASC LIMIT 1
          RETURN dmarcScan
      `
      const expectedDmarc = await expectedCursor.next()

      const loader = await dmarcLoaderByKey(query)
      const dmarc = await loader.load(expectedDmarc._key)

      expect(dmarc).toEqual(expectedDmarc)
    })
  })
  describe('given multiple ids', () => {
    it('returns multiple dmarc scans', async () => {
      const dmarcKeys = []
      const expectedDkimScans = []
      const expectedCursor = await query`
      FOR dmarcScan IN dmarc
        RETURN dmarcScan
      `
      
      while(expectedCursor.hasNext()) {
        const tempDmarc = await expectedCursor.next()
        dmarcKeys.push(tempDmarc._key)
        expectedDkimScans.push(tempDmarc)
      }

      const loader = await dmarcLoaderByKey(query)
      const dmarcScans = await loader.loadMany(dmarcKeys)

      expect(dmarcScans).toEqual(expectedDkimScans)
    })
  })
  describe('given a database error', () => {
    it('raises an error', async () => {
      query = jest.fn().mockRejectedValue(new Error('Database error occurred.'))
      const loader = dmarcLoaderByKey(query)

      try {
        await loader.load('1')
      } catch (err) {
        expect(err).toEqual(
          new Error('Unable to find dmarc scan. Please try again.'),
        )
      }

      expect(consoleErrorOutput).toEqual([
        `Database error occurred when running dmarcLoaderByKey: Error: Database error occurred.`,
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
      const loader = dmarcLoaderByKey(query)

      try {
        await loader.load('1')
      } catch (err) {
        expect(err).toEqual(
          new Error('Unable to find dmarc scan. Please try again.'),
        )
      }

      expect(consoleErrorOutput).toEqual([
        `Cursor error occurred when running dmarcLoaderByKey: Error: Cursor error occurred.`,
      ])
    })
  })
})
