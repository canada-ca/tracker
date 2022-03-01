import { ensure, dbNameFromFile } from 'arango-tools'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { loadHttpsGuidanceTagByTagId } from '../index'
import dbschema from '../../../../database.json'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the loadHttpsGuidanceTagByTagId function', () => {
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
      await collections.httpsGuidanceTags.save({
        _key: 'https1',
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
      await collections.httpsGuidanceTags.save({
        _key: 'https2',
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
        it('returns a single https guidance tag', async () => {
          // Get https tag from db
          const expectedCursor = await query`
            FOR tag IN httpsGuidanceTags
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
          const expectedHttpsTag = await expectedCursor.next()

          const loader = loadHttpsGuidanceTagByTagId({
            query,
            i18n,
            language: 'en',
          })
          const httpsTag = await loader.load(expectedHttpsTag._key)

          expect(httpsTag).toEqual(expectedHttpsTag)
        })
      })
      describe('given multiple ids', () => {
        it('returns multiple https guidance tags', async () => {
          const httpsTagKeys = []
          const expectedHttpsTags = []
          const expectedCursor = await query`
            FOR tag IN httpsGuidanceTags
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
            const tempHttps = await expectedCursor.next()
            httpsTagKeys.push(tempHttps._key)
            expectedHttpsTags.push(tempHttps)
          }

          const loader = loadHttpsGuidanceTagByTagId({
            query,
            i18n,
            language: 'en',
          })
          const httpsTags = await loader.loadMany(httpsTagKeys)
          expect(httpsTags).toEqual(expectedHttpsTags)
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
        it('returns a single https guidance tag', async () => {
          // Get https tag from db
          const expectedCursor = await query`
            FOR tag IN httpsGuidanceTags
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
          const expectedHttpsTag = await expectedCursor.next()

          const loader = loadHttpsGuidanceTagByTagId({
            query,
            i18n,
            language: 'fr',
          })
          const httpsTag = await loader.load(expectedHttpsTag._key)

          expect(httpsTag).toEqual(expectedHttpsTag)
        })
      })
      describe('given multiple ids', () => {
        it('returns multiple https guidance tags', async () => {
          const httpsTagKeys = []
          const expectedHttpsTags = []
          const expectedCursor = await query`
            FOR tag IN httpsGuidanceTags
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
            const tempHttps = await expectedCursor.next()
            httpsTagKeys.push(tempHttps._key)
            expectedHttpsTags.push(tempHttps)
          }

          const loader = loadHttpsGuidanceTagByTagId({
            query,
            i18n,
            language: 'fr',
          })
          const httpsTags = await loader.loadMany(httpsTagKeys)
          expect(httpsTags).toEqual(expectedHttpsTags)
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
          const loader = loadHttpsGuidanceTagByTagId({
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
                'Unable to find HTTPS guidance tag(s). Please try again.',
              ),
            )
          }

          expect(consoleErrorOutput).toEqual([
            `Database error occurred when user: 1234 running loadHttpsGuidanceTagByTagId: Error: Database error occurred.`,
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
          const loader = loadHttpsGuidanceTagByTagId({
            query: jest.fn().mockReturnValue(mockedCursor),
            userKey: '1234',
            i18n,
          })

          try {
            await loader.load('1')
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'Unable to find HTTPS guidance tag(s). Please try again.',
              ),
            )
          }

          expect(consoleErrorOutput).toEqual([
            `Cursor error occurred when user: 1234 running loadHttpsGuidanceTagByTagId: Error: Cursor error occurred.`,
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
          const loader = loadHttpsGuidanceTagByTagId({
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
                "Impossible de trouver la ou les balises d'orientation HTTPS. Veuillez réessayer.",
              ),
            )
          }

          expect(consoleErrorOutput).toEqual([
            `Database error occurred when user: 1234 running loadHttpsGuidanceTagByTagId: Error: Database error occurred.`,
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
          const loader = loadHttpsGuidanceTagByTagId({
            query: jest.fn().mockReturnValue(mockedCursor),
            userKey: '1234',
            i18n,
          })

          try {
            await loader.load('1')
          } catch (err) {
            expect(err).toEqual(
              new Error(
                "Impossible de trouver la ou les balises d'orientation HTTPS. Veuillez réessayer.",
              ),
            )
          }

          expect(consoleErrorOutput).toEqual([
            `Cursor error occurred when user: 1234 running loadHttpsGuidanceTagByTagId: Error: Cursor error occurred.`,
          ])
        })
      })
    })
  })
})
