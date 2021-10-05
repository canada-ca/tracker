import { ensure, dbNameFromFile } from 'arango-tools'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { databaseOptions } from '../../../../database-options'
import { loadDkimResultByKey } from '../index'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the loadDkimResultByKey function', () => {
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
      await collections.dkimResults.save({})
      await collections.dkimResults.save({})
    })
    afterEach(async () => {
      await truncate()
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
            RETURN MERGE({ id: dkimResult._key, _type: "dkimResult"  }, dkimResult)
        `
        const expectedDkimResult = await expectedCursor.next()

        const loader = loadDkimResultByKey({ query, i18n })
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
            RETURN MERGE({ id: dkimResult._key, _type: "dkimResult"  }, dkimResult)
        `

        while (expectedCursor.hasMore) {
          const tempDkimResult = await expectedCursor.next()
          dkimResultKeys.push(tempDkimResult._key)
          expectedDkimResults.push(tempDkimResult)
        }

        const loader = loadDkimResultByKey({ query, i18n })
        const dkimResults = await loader.loadMany(dkimResultKeys)
        expect(dkimResults).toEqual(expectedDkimResults)
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
        const loader = loadDkimResultByKey({ query, userKey: '1234', i18n })

        try {
          await loader.load('1')
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to find DKIM result(s). Please try again.'),
          )
        }

        expect(consoleErrorOutput).toEqual([
          `Database error occurred when user: 1234 running loadDkimResultByKey: Error: Database error occurred.`,
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
        const loader = loadDkimResultByKey({ query, userKey: '1234', i18n })

        try {
          await loader.load('1')
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to find DKIM result(s). Please try again.'),
          )
        }

        expect(consoleErrorOutput).toEqual([
          `Cursor error occurred when user: 1234 running loadDkimResultByKey: Error: Cursor error occurred.`,
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
        const loader = loadDkimResultByKey({ query, userKey: '1234', i18n })

        try {
          await loader.load('1')
        } catch (err) {
          expect(err).toEqual(
            new Error(
              'Impossible de trouver le(s) résultat(s) DKIM. Veuillez réessayer.',
            ),
          )
        }

        expect(consoleErrorOutput).toEqual([
          `Database error occurred when user: 1234 running loadDkimResultByKey: Error: Database error occurred.`,
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
        const loader = loadDkimResultByKey({ query, userKey: '1234', i18n })

        try {
          await loader.load('1')
        } catch (err) {
          expect(err).toEqual(
            new Error(
              'Impossible de trouver le(s) résultat(s) DKIM. Veuillez réessayer.',
            ),
          )
        }

        expect(consoleErrorOutput).toEqual([
          `Cursor error occurred when user: 1234 running loadDkimResultByKey: Error: Cursor error occurred.`,
        ])
      })
    })
  })
})
