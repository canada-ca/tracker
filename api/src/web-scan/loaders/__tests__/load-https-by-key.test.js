import { ensure, dbNameFromFile } from 'arango-tools'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { loadHttpsByKey } from '../index'
import dbschema from '../../../../database.json'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the loadHttpsByKey function', () => {
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
      await collections.https.save({})
      await collections.https.save({})
    })
    afterEach(async () => {
      await truncate()
    })
    afterAll(async () => {
      await drop()
    })
    describe('given a single id', () => {
      it('returns a single https scan', async () => {
        const expectedCursor = await query`
        FOR httpsScan IN https
          SORT httpsScan._key ASC LIMIT 1
          RETURN MERGE({ id: httpsScan._key, _type: "https" }, httpsScan)
        `
        const expectedHttps = await expectedCursor.next()

        const loader = loadHttpsByKey({ query })
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
          RETURN MERGE({ id: httpsScan._key, _type: "https" }, httpsScan)
        `

        while (expectedCursor.hasMore) {
          const tempHttps = await expectedCursor.next()
          httpsKeys.push(tempHttps._key)
          expectedHttpsScans.push(tempHttps)
        }

        const loader = loadHttpsByKey({ query })
        const httpsScans = await loader.loadMany(httpsKeys)

        expect(httpsScans).toEqual(expectedHttpsScans)
      })
    })
  })
  describe('given an unsuccessful load', () => {
    describe('language is set to english', () => {
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
          const loader = loadHttpsByKey({ query, userKey: '1234', i18n })

          try {
            await loader.load('1')
          } catch (err) {
            expect(err).toEqual(
              new Error('Unable to find HTTPS scan(s). Please try again.'),
            )
          }
          expect(consoleErrorOutput).toEqual([
            `Database error occurred when user: 1234 running loadHttpsByKey: Error: Database error occurred.`,
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
          const loader = loadHttpsByKey({ query, userKey: '1234', i18n })

          try {
            await loader.load('1')
          } catch (err) {
            expect(err).toEqual(
              new Error('Unable to load HTTPS scan(s). Please try again.'),
            )
          }
          expect(consoleErrorOutput).toEqual([
            `Cursor error occurred when user: 1234 running loadHttpsByKey: Error: Cursor error occurred.`,
          ])
        })
      })
    })
    describe('language is set to french', () => {
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
          const loader = loadHttpsByKey({ query, userKey: '1234', i18n })

          try {
            await loader.load('1')
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'Impossible de trouver le(s) scan(s) HTTPS. Veuillez réessayer.',
              ),
            )
          }
          expect(consoleErrorOutput).toEqual([
            `Database error occurred when user: 1234 running loadHttpsByKey: Error: Database error occurred.`,
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
          const loader = loadHttpsByKey({ query, userKey: '1234', i18n })

          try {
            await loader.load('1')
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'Impossible de charger le(s) scan(s) HTTPS. Veuillez réessayer.',
              ),
            )
          }
          expect(consoleErrorOutput).toEqual([
            `Cursor error occurred when user: 1234 running loadHttpsByKey: Error: Cursor error occurred.`,
          ])
        })
      })
    })
  })
})
