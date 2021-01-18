import { ArangoTools, dbNameFromFile } from 'arango-tools'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { makeMigrations } from '../../../../migrations'
import { sslLoaderByKey } from '../index'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the sslLoaderByKey function', () => {
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
    await collections.ssl.save({})
    await collections.ssl.save({})
  })

  afterAll(async () => {
    await drop()
  })

  describe('given a single id', () => {
    it('returns a single ssl scan', async () => {
      const expectedCursor = await query`
      FOR sslScan IN ssl
        SORT sslScan._key ASC LIMIT 1
        RETURN MERGE({ id: sslScan._key, _type: "ssl" }, sslScan)
      `
      const expectedSsl = await expectedCursor.next()

      const loader = sslLoaderByKey(query, i18n)
      const ssl = await loader.load(expectedSsl._key)

      expect(ssl).toEqual(expectedSsl)
    })
  })
  describe('given multiple ids', () => {
    it('returns multiple ssl scans', async () => {
      const sslKeys = []
      const expectedSslScans = []

      const expectedCursor = await query`
        FOR sslScan IN ssl
          RETURN MERGE({ id: sslScan._key, _type: "ssl" }, sslScan)
      `

      while (expectedCursor.hasNext()) {
        const tempSsl = await expectedCursor.next()
        sslKeys.push(tempSsl._key)
        expectedSslScans.push(tempSsl)
      }

      const loader = sslLoaderByKey(query, i18n)
      const sslScans = await loader.loadMany(sslKeys)

      expect(sslScans).toEqual(expectedSslScans)
    })
  })
  describe('language set to english', () => {
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
        const loader = sslLoaderByKey(query, '1234', i18n)

        try {
          await loader.load('1')
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to find ssl scan. Please try again.'),
          )
        }
        expect(consoleErrorOutput).toEqual([
          `Database error occurred when user: 1234 running sslLoaderByKey: Error: Database error occurred.`,
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
        const loader = sslLoaderByKey(query, '1234', i18n)

        try {
          await loader.load('1')
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to find ssl scan. Please try again.'),
          )
        }
        expect(consoleErrorOutput).toEqual([
          `Cursor error occurred when user: 1234 running sslLoaderByKey: Error: Cursor error occurred.`,
        ])
      })
    })
  })
  describe('language set to french', () => {
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
        const loader = sslLoaderByKey(query, '1234', i18n)

        try {
          await loader.load('1')
        } catch (err) {
          expect(err).toEqual(new Error('todo'))
        }
        expect(consoleErrorOutput).toEqual([
          'Database error occurred when user: 1234 running sslLoaderByKey: Error: Database error occurred.',
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
        const loader = sslLoaderByKey(query, '1234', i18n)

        try {
          await loader.load('1')
        } catch (err) {
          expect(err).toEqual(new Error('todo'))
        }
        expect(consoleErrorOutput).toEqual([
          `Cursor error occurred when user: 1234 running sslLoaderByKey: Error: Cursor error occurred.`,
        ])
      })
    })
  })
})
