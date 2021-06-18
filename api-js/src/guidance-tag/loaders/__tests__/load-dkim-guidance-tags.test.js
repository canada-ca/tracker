import { ensure, dbNameFromFile } from 'arango-tools'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { databaseOptions } from '../../../../database-options'
import { loadDkimGuidanceTagById } from '../index'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the loadDkimGuidanceTagById function', () => {
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
        type: 'database',
        name: dbNameFromFile(__filename),
        url,
        rootPassword: rootPass,
        options: databaseOptions({ rootPass }),
      }))
    })
    beforeEach(async () => {
      await collections.dkimGuidanceTags.save({})
      await collections.dkimGuidanceTags.save({})
    })
    afterEach(async () => {
      await truncate()
    })
    afterAll(async () => {
      await drop()
    })
    describe('given a single id', () => {
      it('returns a single dkim guidance tag', async () => {
        // Get dkim tag from db
        const expectedCursor = await query`
          FOR tag IN dkimGuidanceTags
            SORT tag._key ASC LIMIT 1
            RETURN MERGE(tag, { tagId: tag._key, id: tag._key, _type: "guidanceTag" })
        `
        const expectedDkimTag = await expectedCursor.next()

        const loader = loadDkimGuidanceTagById({ query, i18n })
        const dkim = await loader.load(expectedDkimTag._key)

        expect(dkim).toEqual(expectedDkimTag)
      })
    })
    describe('given multiple ids', () => {
      it('returns multiple dkim guidance tags', async () => {
        const dkimTagKeys = []
        const expectedDkimTags = []
        const expectedCursor = await query`
          FOR tag IN dkimGuidanceTags
            RETURN MERGE(tag, { tagId: tag._key, id: tag._key, _type: "guidanceTag" })
        `

        while (expectedCursor.hasMore) {
          const tempDkim = await expectedCursor.next()
          dkimTagKeys.push(tempDkim._key)
          expectedDkimTags.push(tempDkim)
        }

        const loader = loadDkimGuidanceTagById({ query, i18n })
        const dkimTags = await loader.loadMany(dkimTagKeys)
        expect(dkimTags).toEqual(expectedDkimTags)
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
        const loader = loadDkimGuidanceTagById({ query, userKey: '1234', i18n })

        try {
          await loader.load('1')
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to find DKIM guidance tag(s). Please try again.'),
          )
        }

        expect(consoleErrorOutput).toEqual([
          `Database error occurred when user: 1234 running loadDkimGuidanceTagById: Error: Database error occurred.`,
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
        const loader = loadDkimGuidanceTagById({ query, userKey: '1234', i18n })

        try {
          await loader.load('1')
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to find DKIM guidance tag(s). Please try again.'),
          )
        }

        expect(consoleErrorOutput).toEqual([
          `Cursor error occurred when user: 1234 running loadDkimGuidanceTagById: Error: Cursor error occurred.`,
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
        const loader = loadDkimGuidanceTagById({ query, userKey: '1234', i18n })

        try {
          await loader.load('1')
        } catch (err) {
          expect(err).toEqual(
            new Error(
              "Impossible de trouver le(s) tag(s) d'orientation DKIM. Veuillez réessayer.",
            ),
          )
        }

        expect(consoleErrorOutput).toEqual([
          `Database error occurred when user: 1234 running loadDkimGuidanceTagById: Error: Database error occurred.`,
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
        const loader = loadDkimGuidanceTagById({ query, userKey: '1234', i18n })

        try {
          await loader.load('1')
        } catch (err) {
          expect(err).toEqual(
            new Error(
              "Impossible de trouver le(s) tag(s) d'orientation DKIM. Veuillez réessayer.",
            ),
          )
        }

        expect(consoleErrorOutput).toEqual([
          `Cursor error occurred when user: 1234 running loadDkimGuidanceTagById: Error: Cursor error occurred.`,
        ])
      })
    })
  })
})
