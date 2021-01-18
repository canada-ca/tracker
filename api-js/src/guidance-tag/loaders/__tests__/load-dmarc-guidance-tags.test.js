import { ArangoTools, dbNameFromFile } from 'arango-tools'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { makeMigrations } from '../../../../migrations'
import { dmarcGuidanceTagLoader } from '../index'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the dmarcGuidanceTagLoader function', () => {
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
    await collections.dmarcGuidanceTags.save({})
    await collections.dmarcGuidanceTags.save({})
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

      const loader = dmarcGuidanceTagLoader(query, i18n)
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

      while (expectedCursor.hasNext()) {
        const tempDkim = await expectedCursor.next()
        dmarcTagKeys.push(tempDkim._key)
        expectedDmarcTags.push(tempDkim)
      }

      const loader = dmarcGuidanceTagLoader(query, i18n)
      const dmarcTags = await loader.loadMany(dmarcTagKeys)
      expect(dmarcTags).toEqual(expectedDmarcTags)
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
        const loader = dmarcGuidanceTagLoader(query, '1234', i18n)

        try {
          await loader.load('1')
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to find dmarc guidance tags. Please try again.'),
          )
        }

        expect(consoleErrorOutput).toEqual([
          `Database error occurred when user: 1234 running dmarcGuidanceTagLoader: Error: Database error occurred.`,
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
        const loader = dmarcGuidanceTagLoader(query, '1234', i18n)

        try {
          await loader.load('1')
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to find dmarc guidance tags. Please try again.'),
          )
        }

        expect(consoleErrorOutput).toEqual([
          `Cursor error occurred when user: 1234 running dmarcGuidanceTagLoader: Error: Cursor error occurred.`,
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
        const loader = dmarcGuidanceTagLoader(query, '1234', i18n)

        try {
          await loader.load('1')
        } catch (err) {
          expect(err).toEqual(new Error('todo'))
        }

        expect(consoleErrorOutput).toEqual([
          `Database error occurred when user: 1234 running dmarcGuidanceTagLoader: Error: Database error occurred.`,
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
        const loader = dmarcGuidanceTagLoader(query, '1234', i18n)

        try {
          await loader.load('1')
        } catch (err) {
          expect(err).toEqual(new Error('todo'))
        }

        expect(consoleErrorOutput).toEqual([
          `Cursor error occurred when user: 1234 running dmarcGuidanceTagLoader: Error: Cursor error occurred.`,
        ])
      })
    })
  })
})
