import { ensure, dbNameFromFile } from 'arango-tools'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { databaseOptions } from '../../../../database-options'
import { loadSpfByKey } from '../index'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the loadSpfByKey function', () => {
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
  beforeEach(() => {
    consoleErrorOutput.length = 0
  })

  describe('given a successful load', () => {
    beforeAll(async () => {
      ;({ query, drop, truncate, collections } = await ensure({
        type: 'database',
        name: dbNameFromFile(__filename),
        url,
        rootPassword: rootPass,
        options: databaseOptions({ rootPass }),
      }))
    })
    beforeEach(async () => {
      await collections.spf.save({})
      await collections.spf.save({})
    })
    afterEach(async () => {
      await truncate()
    })
    afterAll(async () => {
      await drop()
    })
    describe('given a single id', () => {
      it('returns a single spf scan', async () => {
        const expectedCursor = await query`
        FOR spfScan IN spf
          SORT spfScan._key ASC LIMIT 1
          RETURN MERGE({ id: spfScan._key, _type: "spf" }, spfScan)
      `
        const expectedSpf = await expectedCursor.next()

        const loader = loadSpfByKey({ query, i18n })
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
            RETURN MERGE({ id: spfScan._key, _type: "spf" }, spfScan)
        `

        while (expectedCursor.hasMore) {
          const tempSpf = await expectedCursor.next()
          spfKeys.push(tempSpf._key)
          expectedSpfScans.push(tempSpf)
        }

        const loader = loadSpfByKey({ query, i18n })
        const dkimScans = await loader.loadMany(spfKeys)
        expect(dkimScans).toEqual(expectedSpfScans)
      })
    })
  })
  describe('users language is set to english', () => {
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
        const loader = loadSpfByKey({ query, userKey: '1234', i18n })

        try {
          await loader.load('1')
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to find SPF scan(s). Please try again.'),
          )
        }

        expect(consoleErrorOutput).toEqual([
          `Database error occurred when user: 1234 running loadSpfByKey: Error: Database error occurred.`,
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
        const loader = loadSpfByKey({ query, userKey: '1234', i18n })

        try {
          await loader.load('1')
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to find SPF scan(s). Please try again.'),
          )
        }

        expect(consoleErrorOutput).toEqual([
          `Cursor error occurred when user: 1234 running loadSpfByKey: Error: Cursor error occurred.`,
        ])
      })
    })
  })
  describe('users language is set to french', () => {
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
        const loader = loadSpfByKey({ query, userKey: '1234', i18n })

        try {
          await loader.load('1')
        } catch (err) {
          expect(err).toEqual(
            new Error(
              'Impossible de trouver le(s) scan(s) SPF. Veuillez réessayer.',
            ),
          )
        }

        expect(consoleErrorOutput).toEqual([
          `Database error occurred when user: 1234 running loadSpfByKey: Error: Database error occurred.`,
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
        const loader = loadSpfByKey({ query, userKey: '1234', i18n })

        try {
          await loader.load('1')
        } catch (err) {
          expect(err).toEqual(
            new Error(
              'Impossible de trouver le(s) scan(s) SPF. Veuillez réessayer.',
            ),
          )
        }

        expect(consoleErrorOutput).toEqual([
          `Cursor error occurred when user: 1234 running loadSpfByKey: Error: Cursor error occurred.`,
        ])
      })
    })
  })
})
