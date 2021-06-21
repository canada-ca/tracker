import { ensure, dbNameFromFile } from 'arango-tools'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { databaseOptions } from '../../../../database-options'
import { loadSpfGuidanceTagByTagId } from '../index'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the loadSpfGuidanceTagByTagId function', () => {
  let query, drop, truncate, collections, i18n

  const consoleErrorOutput = []
  const mockedError = (output) => consoleErrorOutput.push(output)

  beforeAll(async () => {
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
  afterEach(async () => {
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
      await collections.spfGuidanceTags.save({})
      await collections.spfGuidanceTags.save({})
    })
    afterEach(async () => {
      await truncate()
    })
    afterAll(async () => {
      await drop()
    })
    describe('given a single id', () => {
      it('returns a single spf guidance tag', async () => {
        // Get spf tag from db
        const expectedCursor = await query`
          FOR tag IN spfGuidanceTags
            SORT tag._key ASC LIMIT 1
            RETURN MERGE(tag, { tagId: tag._key, id: tag._key, _type: "guidanceTag" })
        `
        const expectedSpfTag = await expectedCursor.next()

        const loader = loadSpfGuidanceTagByTagId({ query, i18n })
        const spfTag = await loader.load(expectedSpfTag._key)

        expect(spfTag).toEqual(expectedSpfTag)
      })
    })
    describe('given multiple ids', () => {
      it('returns multiple spf guidance tags', async () => {
        const spfTagKeys = []
        const expectedSpfTags = []
        const expectedCursor = await query`
          FOR tag IN spfGuidanceTags
            RETURN MERGE(tag, { tagId: tag._key, id: tag._key, _type: "guidanceTag" })
        `

        while (expectedCursor.hasMore) {
          const tempSpf = await expectedCursor.next()
          spfTagKeys.push(tempSpf._key)
          expectedSpfTags.push(tempSpf)
        }

        const loader = loadSpfGuidanceTagByTagId({ query, i18n })
        const spfTags = await loader.loadMany(spfTagKeys)
        expect(spfTags).toEqual(expectedSpfTags)
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
        const loader = loadSpfGuidanceTagByTagId({
          query,
          userKey: '1234',
          i18n,
        })

        try {
          await loader.load('1')
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to find SPF guidance tag(s). Please try again.'),
          )
        }

        expect(consoleErrorOutput).toEqual([
          `Database error occurred when user: 1234 running loadSpfGuidanceTagByTagId: Error: Database error occurred.`,
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
        const loader = loadSpfGuidanceTagByTagId({
          query,
          userKey: '1234',
          i18n,
        })

        try {
          await loader.load('1')
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to find SPF guidance tag(s). Please try again.'),
          )
        }

        expect(consoleErrorOutput).toEqual([
          `Cursor error occurred when user: 1234 running loadSpfGuidanceTagByTagId: Error: Cursor error occurred.`,
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
        const loader = loadSpfGuidanceTagByTagId({
          query,
          userKey: '1234',
          i18n,
        })

        try {
          await loader.load('1')
        } catch (err) {
          expect(err).toEqual(
            new Error(
              "Impossible de trouver le(s) tag(s) d'orientation SPF. Veuillez réessayer.",
            ),
          )
        }

        expect(consoleErrorOutput).toEqual([
          `Database error occurred when user: 1234 running loadSpfGuidanceTagByTagId: Error: Database error occurred.`,
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
        const loader = loadSpfGuidanceTagByTagId({
          query,
          userKey: '1234',
          i18n,
        })

        try {
          await loader.load('1')
        } catch (err) {
          expect(err).toEqual(
            new Error(
              "Impossible de trouver le(s) tag(s) d'orientation SPF. Veuillez réessayer.",
            ),
          )
        }

        expect(consoleErrorOutput).toEqual([
          `Cursor error occurred when user: 1234 running loadSpfGuidanceTagByTagId: Error: Cursor error occurred.`,
        ])
      })
    })
  })
})
