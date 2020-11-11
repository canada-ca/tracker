const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { setupI18n } = require('@lingui/core')

const englishMessages = require('../../../locale/en/messages')
const frenchMessages = require('../../../locale/fr/messages')
const { makeMigrations } = require('../../../../migrations')
const { spfGuidanceTagLoader } = require('../..')

describe('given the spfGuidanceTagLoader function', () => {
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
    await collections.spfGuidanceTags.save({})
    await collections.spfGuidanceTags.save({})
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
          RETURN MERGE(tag, { tagId: tag._key, id: tag._key })
      `
      const expectedSpfTag = await expectedCursor.next()

      const loader = spfGuidanceTagLoader(query, i18n)
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
          RETURN MERGE(tag, { tagId: tag._key, id: tag._key })
      `

      while (expectedCursor.hasNext()) {
        const tempSpf = await expectedCursor.next()
        spfTagKeys.push(tempSpf._key)
        expectedSpfTags.push(tempSpf)
      }

      const loader = spfGuidanceTagLoader(query, i18n)
      const spfTags = await loader.loadMany(spfTagKeys)
      expect(spfTags).toEqual(expectedSpfTags)
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
        const loader = spfGuidanceTagLoader(query, '1234', i18n)

        try {
          await loader.load('1')
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to find spf guidance tags. Please try again.'),
          )
        }

        expect(consoleErrorOutput).toEqual([
          `Database error occurred when user: 1234 running spfGuidanceTagLoader: Error: Database error occurred.`,
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
        const loader = spfGuidanceTagLoader(query, '1234', i18n)

        try {
          await loader.load('1')
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to find spf guidance tags. Please try again.'),
          )
        }

        expect(consoleErrorOutput).toEqual([
          `Cursor error occurred when user: 1234 running spfGuidanceTagLoader: Error: Cursor error occurred.`,
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
        const loader = spfGuidanceTagLoader(query, '1234', i18n)

        try {
          await loader.load('1')
        } catch (err) {
          expect(err).toEqual(new Error('todo'))
        }

        expect(consoleErrorOutput).toEqual([
          `Database error occurred when user: 1234 running spfGuidanceTagLoader: Error: Database error occurred.`,
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
        const loader = spfGuidanceTagLoader(query, '1234', i18n)

        try {
          await loader.load('1')
        } catch (err) {
          expect(err).toEqual(new Error('todo'))
        }

        expect(consoleErrorOutput).toEqual([
          `Cursor error occurred when user: 1234 running spfGuidanceTagLoader: Error: Cursor error occurred.`,
        ])
      })
    })
  })
})
