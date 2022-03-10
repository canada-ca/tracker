import { ensure, dbNameFromFile } from 'arango-tools'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { loadSslByKey } from '../index'
import dbschema from '../../../../database.json'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the loadSslByKey function', () => {
  let query, drop, truncate, collections, i18n

  const consoleErrorOutput = []
  const mockedError = (output) => consoleErrorOutput.push(output)

  beforeAll(() => {
    console.error = mockedError
    i18n = setupI18n({
      locale: 'en',
      localeData: {
        en: { plurals: {} },
        fr: { plurals: {} },
      },
      locales: ['en', 'fr'],
      messages: {
        en: englishMessages.messages,
        fr: frenchMessages.messages,
      },
    })
  })
  afterEach(() => {
    consoleErrorOutput.length = 0
  })

  describe('given a successful load', () => {
    beforeAll(async () => {
      ;({ query, drop, truncate, collections } = await ensure({
      variables: {
        dbname: dbNameFromFile(__filename),
        username: 'root',
        rootPassword: rootPass,
        password: rootPass,
        url,
      },

      schema: dbschema,
    }))
    })
    beforeEach(async () => {
      await collections.ssl.save({})
      await collections.ssl.save({})
    })
    afterEach(async () => {
      await truncate()
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

        const loader = loadSslByKey({ query, i18n })
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

        while (expectedCursor.hasMore) {
          const tempSsl = await expectedCursor.next()
          sslKeys.push(tempSsl._key)
          expectedSslScans.push(tempSsl)
        }

        const loader = loadSslByKey({ query, i18n })
        const sslScans = await loader.loadMany(sslKeys)

        expect(sslScans).toEqual(expectedSslScans)
      })
    })
  })
  describe('given an unsuccessful load', () => {
    describe('language set to english', () => {
      beforeAll(() => {
        i18n = setupI18n({
          locale: 'en',
          localeData: {
            en: { plurals: {} },
            fr: { plurals: {} },
          },
          locales: ['en', 'fr'],
          messages: {
            en: englishMessages.messages,
            fr: frenchMessages.messages,
          },
        })
      })
      describe('given a database error', () => {
        it('raises an error', async () => {
          query = jest
            .fn()
            .mockRejectedValue(new Error('Database error occurred.'))
          const loader = loadSslByKey({ query, userKey: '1234', i18n })

          try {
            await loader.load('1')
          } catch (err) {
            expect(err).toEqual(
              new Error('Unable to find SSL scan(s). Please try again.'),
            )
          }
          expect(consoleErrorOutput).toEqual([
            `Database error occurred when user: 1234 running loadSslByKey: Error: Database error occurred.`,
          ])
        })
      })
      describe('given a cursor error', () => {
        it('raises an error', async () => {
          const cursor = {
            forEach() {
              throw new Error('Cursor error occurred.')
            },
          }
          query = jest.fn().mockReturnValue(cursor)
          const loader = loadSslByKey({ query, userKey: '1234', i18n })

          try {
            await loader.load('1')
          } catch (err) {
            expect(err).toEqual(
              new Error('Unable to find SSL scan(s). Please try again.'),
            )
          }
          expect(consoleErrorOutput).toEqual([
            `Cursor error occurred when user: 1234 running loadSslByKey: Error: Cursor error occurred.`,
          ])
        })
      })
    })
    describe('language set to french', () => {
      beforeAll(() => {
        i18n = setupI18n({
          locale: 'fr',
          localeData: {
            en: { plurals: {} },
            fr: { plurals: {} },
          },
          locales: ['en', 'fr'],
          messages: {
            en: englishMessages.messages,
            fr: frenchMessages.messages,
          },
        })
      })
      describe('given a database error', () => {
        it('raises an error', async () => {
          query = jest
            .fn()
            .mockRejectedValue(new Error('Database error occurred.'))
          const loader = loadSslByKey({ query, userKey: '1234', i18n })

          try {
            await loader.load('1')
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'Impossible de trouver le(s) scan(s) SSL. Veuillez réessayer.',
              ),
            )
          }
          expect(consoleErrorOutput).toEqual([
            'Database error occurred when user: 1234 running loadSslByKey: Error: Database error occurred.',
          ])
        })
      })
      describe('given a cursor error', () => {
        it('raises an error', async () => {
          const cursor = {
            forEach() {
              throw new Error('Cursor error occurred.')
            },
          }
          query = jest.fn().mockReturnValue(cursor)
          const loader = loadSslByKey({ query, userKey: '1234', i18n })

          try {
            await loader.load('1')
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'Impossible de trouver le(s) scan(s) SSL. Veuillez réessayer.',
              ),
            )
          }
          expect(consoleErrorOutput).toEqual([
            `Cursor error occurred when user: 1234 running loadSslByKey: Error: Cursor error occurred.`,
          ])
        })
      })
    })
  })
})
