import { ensure, dbNameFromFile } from 'arango-tools'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { loadSpfGuidanceTagByTagId } from '../index'
import dbschema from '../../../../database.json'

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
      await collections.spfGuidanceTags.save({
        _key: 'spf1',
        en: {
          tagName: 'Some Cool Tag Name A',
          guidance: 'Some Cool Guidance A',
          refLinksGuide: [
            {
              description: 'IT PIN A',
            },
          ],
          refLinksTechnical: [''],
        },
        fr: {
          tagName: 'todo a',
          guidance: 'todo a',
          refLinksGuide: [
            {
              description: 'todo a',
            },
          ],
          refLinksTechnical: [''],
        },
      })
      await collections.spfGuidanceTags.save({
        _key: 'spf2',
        en: {
          tagName: 'Some Cool Tag Name B',
          guidance: 'Some Cool Guidance B',
          refLinksGuide: [
            {
              description: 'IT PIN B',
            },
          ],
          refLinksTechnical: [''],
        },
        fr: {
          tagName: 'todo b',
          guidance: 'todo b',
          refLinksGuide: [
            {
              description: 'todo b',
            },
          ],
          refLinksTechnical: [''],
        },
      })
    })
    afterEach(async () => {
      await truncate()
    })
    afterAll(async () => {
      await drop()
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
      describe('given a single id', () => {
        it('returns a single spf guidance tag', async () => {
          // Get spf tag from db
          const expectedCursor = await query`
            FOR tag IN spfGuidanceTags
              SORT tag._key ASC LIMIT 1
              RETURN MERGE(
                {
                  _id: tag._id,
                  _key: tag._key,
                  _rev: tag._rev,
                  _type: "guidanceTag",
                  id: tag._key,
                  tagId: tag._key
                },
                TRANSLATE("en", tag)
              )
          `
          const expectedSpfTag = await expectedCursor.next()

          const loader = loadSpfGuidanceTagByTagId({
            query,
            i18n,
            language: 'en',
          })
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
              RETURN MERGE(
                {
                  _id: tag._id,
                  _key: tag._key,
                  _rev: tag._rev,
                  _type: "guidanceTag",
                  id: tag._key,
                  tagId: tag._key
                },
                TRANSLATE("en", tag)
              )
          `

          while (expectedCursor.hasMore) {
            const tempSpf = await expectedCursor.next()
            spfTagKeys.push(tempSpf._key)
            expectedSpfTags.push(tempSpf)
          }

          const loader = loadSpfGuidanceTagByTagId({
            query,
            i18n,
            language: 'en',
          })
          const spfTags = await loader.loadMany(spfTagKeys)
          expect(spfTags).toEqual(expectedSpfTags)
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
      describe('given a single id', () => {
        it('returns a single spf guidance tag', async () => {
          // Get spf tag from db
          const expectedCursor = await query`
            FOR tag IN spfGuidanceTags
              SORT tag._key ASC LIMIT 1
              RETURN MERGE(
                {
                  _id: tag._id,
                  _key: tag._key,
                  _rev: tag._rev,
                  _type: "guidanceTag",
                  id: tag._key,
                  tagId: tag._key
                },
                TRANSLATE("fr", tag)
              )
          `
          const expectedSpfTag = await expectedCursor.next()

          const loader = loadSpfGuidanceTagByTagId({
            query,
            i18n,
            language: 'fr',
          })
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
              RETURN MERGE(
                {
                  _id: tag._id,
                  _key: tag._key,
                  _rev: tag._rev,
                  _type: "guidanceTag",
                  id: tag._key,
                  tagId: tag._key
                },
                TRANSLATE("fr", tag)
              )
          `

          while (expectedCursor.hasMore) {
            const tempSpf = await expectedCursor.next()
            spfTagKeys.push(tempSpf._key)
            expectedSpfTags.push(tempSpf)
          }

          const loader = loadSpfGuidanceTagByTagId({
            query,
            i18n,
            language: 'fr',
          })
          const spfTags = await loader.loadMany(spfTagKeys)
          expect(spfTags).toEqual(expectedSpfTags)
        })
      })
    })
  })

  describe('given an unsuccessful load', () => {
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
          const loader = loadSpfGuidanceTagByTagId({
            query: jest
              .fn()
              .mockRejectedValue(new Error('Database error occurred.')),
            userKey: '1234',
            i18n,
          })

          try {
            await loader.load('1')
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'Unable to find SPF guidance tag(s). Please try again.',
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
          const mockedCursor = {
            forEach() {
              throw new Error('Cursor error occurred.')
            },
          }
          const loader = loadSpfGuidanceTagByTagId({
            query: jest.fn().mockReturnValue(mockedCursor),
            userKey: '1234',
            i18n,
          })

          try {
            await loader.load('1')
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'Unable to find SPF guidance tag(s). Please try again.',
              ),
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
          const loader = loadSpfGuidanceTagByTagId({
            query: jest
              .fn()
              .mockRejectedValue(new Error('Database error occurred.')),
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
          const mockedCursor = {
            forEach() {
              throw new Error('Cursor error occurred.')
            },
          }
          const loader = loadSpfGuidanceTagByTagId({
            query: jest.fn().mockReturnValue(mockedCursor),
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
})
