import { ensure, dbNameFromFile } from 'arango-tools'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { databaseOptions } from '../../../../database-options'
import { loadDmarcGuidanceTagByTagId } from '../index'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the loadDmarcGuidanceTagByTagId function', () => {
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
      await collections.dmarcGuidanceTags.save({})
      await collections.dmarcGuidanceTags.save({})
    })
    afterEach(async () => {
      await truncate()
    })
    afterAll(async () => {
      await drop()
    })
    describe('given a single id', () => {
      it('returns a single dmarc guidance tag', async () => {
        // Get dmarc tag from db
        const expectedCursor = await query`
          FOR tag IN dmarcGuidanceTags
            SORT tag._key ASC LIMIT 1
            RETURN MERGE(tag, { tagId: tag._key, id: tag._key, _type: "guidanceTag" })
        `
        const expectedDmarcTag = await expectedCursor.next()

        const loader = loadDmarcGuidanceTagByTagId({ query, i18n })
        const dmarcTag = await loader.load(expectedDmarcTag._key)

        expect(dmarcTag).toEqual(expectedDmarcTag)
      })
    })
    describe('given multiple ids', () => {
      it('returns multiple dmarc guidance tags', async () => {
        const dmarcTagKeys = []
        const expectedDmarcTags = []
        const expectedCursor = await query`
          FOR tag IN dmarcGuidanceTags
            RETURN MERGE(tag, { tagId: tag._key, id: tag._key, _type: "guidanceTag" })
        `

        while (expectedCursor.hasMore) {
          const tempDkim = await expectedCursor.next()
          dmarcTagKeys.push(tempDkim._key)
          expectedDmarcTags.push(tempDkim)
        }

        const loader = loadDmarcGuidanceTagByTagId({ query, i18n })
        const dmarcTags = await loader.loadMany(dmarcTagKeys)
        expect(dmarcTags).toEqual(expectedDmarcTags)
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
        const loader = loadDmarcGuidanceTagByTagId({
          query,
          userKey: '1234',
          i18n,
        })

        try {
          await loader.load('1')
        } catch (err) {
          expect(err).toEqual(
            new Error(
              'Unable to find DMARC guidance tag(s). Please try again.',
            ),
          )
        }

        expect(consoleErrorOutput).toEqual([
          `Database error occurred when user: 1234 running loadDmarcGuidanceTagByTagId: Error: Database error occurred.`,
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
        const loader = loadDmarcGuidanceTagByTagId({
          query,
          userKey: '1234',
          i18n,
        })

        try {
          await loader.load('1')
        } catch (err) {
          expect(err).toEqual(
            new Error(
              'Unable to find DMARC guidance tag(s). Please try again.',
            ),
          )
        }

        expect(consoleErrorOutput).toEqual([
          `Cursor error occurred when user: 1234 running loadDmarcGuidanceTagByTagId: Error: Cursor error occurred.`,
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
        const loader = loadDmarcGuidanceTagByTagId({
          query,
          userKey: '1234',
          i18n,
        })

        try {
          await loader.load('1')
        } catch (err) {
          expect(err).toEqual(
            new Error(
              "Impossible de trouver le(s) tag(s) d'orientation DMARC. Veuillez réessayer.",
            ),
          )
        }

        expect(consoleErrorOutput).toEqual([
          `Database error occurred when user: 1234 running loadDmarcGuidanceTagByTagId: Error: Database error occurred.`,
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
        const loader = loadDmarcGuidanceTagByTagId({
          query,
          userKey: '1234',
          i18n,
        })

        try {
          await loader.load('1')
        } catch (err) {
          expect(err).toEqual(
            new Error(
              "Impossible de trouver le(s) tag(s) d'orientation DMARC. Veuillez réessayer.",
            ),
          )
        }

        expect(consoleErrorOutput).toEqual([
          `Cursor error occurred when user: 1234 running loadDmarcGuidanceTagByTagId: Error: Cursor error occurred.`,
        ])
      })
    })
  })
})
