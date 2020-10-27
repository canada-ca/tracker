require('dotenv-safe').config({
  allowEmptyValues: true,
})

const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { setupI18n } = require('@lingui/core')

const englishMessages = require('../locale/en/messages')
const frenchMessages = require('../locale/fr/messages')
const { makeMigrations } = require('../../migrations')
const { dkimLoaderByKey } = require('../loaders')

describe('given the dkimLoaderByKey function', () => {
  let query, drop, truncate, migrate, collections, i18n

  const consoleErrorOutput = []
  const mockedError = (output) => consoleErrorOutput.push(output)

  beforeAll(async () => {
    ;({ migrate } = await ArangoTools({ rootPass, url }))
    ;({ query, drop, truncate, collections } = await migrate(
      makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
    ))
    console.error = mockedError
    i18n = setupI18n({
      language: 'en',
      locales: ['en', 'fr'],
      missing: 'Traduction manquante',
      catalogs: {
        en: englishMessages,
        fr: frenchMessages,
      },
    })
  })

  beforeEach(async () => {
    consoleErrorOutput.length = 0

    await truncate()
    await collections.dkim.save({})
    await collections.dkim.save({})
  })

  afterAll(async () => {
    await drop()
  })

  describe('given a single id', () => {
    it('returns a single dkim scan', async () => {
      // Get dkim from db
      const expectedCursor = await query`
        FOR dkimScan IN dkim
          SORT dkimScan._key ASC LIMIT 1
          RETURN dkimScan
      `
      const expectedDkim = await expectedCursor.next()

      const loader = dkimLoaderByKey(query, i18n)
      const dkim = await loader.load(expectedDkim._key)

      expect(dkim).toEqual(expectedDkim)
    })
  })
  describe('given multiple ids', () => {
    it('returns multiple dkim scans', async () => {
      const dkimKeys = []
      const expectedDkimScans = []
      const expectedCursor = await query`
        FOR dkimScan IN dkim
          RETURN dkimScan
      `

      while (expectedCursor.hasNext()) {
        const tempDkim = await expectedCursor.next()
        dkimKeys.push(tempDkim._key)
        expectedDkimScans.push(tempDkim)
      }

      const loader = dkimLoaderByKey(query, i18n)
      const dkimScans = await loader.loadMany(dkimKeys)
      expect(dkimScans).toEqual(expectedDkimScans)
    })
  })
  describe('users language is set to english', () => {
    beforeAll(() => {
      i18n = setupI18n({
        language: 'en',
        locales: ['en', 'fr'],
        missing: 'Traduction manquante',
        catalogs: {
          en: englishMessages,
          fr: frenchMessages,
        },
      })
    })
    describe('given a database error', () => {
      it('raises an error', async () => {
        query = jest
          .fn()
          .mockRejectedValue(new Error('Database error occurred.'))
        const loader = dkimLoaderByKey(query, i18n)

        try {
          await loader.load('1')
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to find dkim scan. Please try again.'),
          )
        }

        expect(consoleErrorOutput).toEqual([
          `Database error occurred when running dkimLoaderByKey: Error: Database error occurred.`,
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
        const loader = dkimLoaderByKey(query, i18n)

        try {
          await loader.load('1')
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to find dkim scan. Please try again.'),
          )
        }

        expect(consoleErrorOutput).toEqual([
          `Cursor error occurred when running dkimLoaderByKey: Error: Cursor error occurred.`,
        ])
      })
    })
  })
  describe('users language is set to french', () => {
    beforeAll(() => {
      i18n = setupI18n({
        language: 'fr',
        locales: ['en', 'fr'],
        missing: 'Traduction manquante',
        catalogs: {
          en: englishMessages,
          fr: frenchMessages,
        },
      })
    })
    describe('given a database error', () => {
      it('raises an error', async () => {
        query = jest
          .fn()
          .mockRejectedValue(new Error('Database error occurred.'))
        const loader = dkimLoaderByKey(query, i18n)

        try {
          await loader.load('1')
        } catch (err) {
          expect(err).toEqual(
            new Error('todo'),
          )
        }

        expect(consoleErrorOutput).toEqual([
          `Database error occurred when running dkimLoaderByKey: Error: Database error occurred.`,
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
        const loader = dkimLoaderByKey(query, i18n)

        try {
          await loader.load('1')
        } catch (err) {
          expect(err).toEqual(
            new Error('todo'),
          )
        }

        expect(consoleErrorOutput).toEqual([
          `Cursor error occurred when running dkimLoaderByKey: Error: Cursor error occurred.`,
        ])
      })
    })
  })
})
