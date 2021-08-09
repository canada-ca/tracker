import { ensure, dbNameFromFile } from 'arango-tools'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { databaseOptions } from '../../../../database-options'
import { loadDkimGuidanceTagByTagId } from '../index'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the loadDkimGuidanceTagByTagId function', () => {
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
      await collections.dkimGuidanceTags.save({
        _key: 'dkim1',
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
      await collections.dkimGuidanceTags.save({
        _key: 'dkim2',
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
        it('returns a single dkim guidance tag', async () => {
          // Get dkim tag from db
          const expectedCursor = await query`
            FOR tag IN dkimGuidanceTags
              SORT tag._key ASC LIMIT 1
              RETURN MERGE(
                { 
                  _id: tag._id,
                  _key: tag._key,
                  _rev: tag._rev,
                  _type: "guidanceTag",
                  tagId: tag._key,
                  id: tag._key
                },
                TRANSLATE("en", tag)
              )
          `
          const expectedDkimTag = await expectedCursor.next()

          const loader = loadDkimGuidanceTagByTagId({
            query,
            i18n,
            language: 'en',
          })
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
              RETURN MERGE(
                { 
                  _id: tag._id,
                  _key: tag._key,
                  _rev: tag._rev,
                  _type: "guidanceTag",
                  tagId: tag._key,
                  id: tag._key
                },
                TRANSLATE("en", tag)
              )
          `

          while (expectedCursor.hasMore) {
            const tempDkim = await expectedCursor.next()
            dkimTagKeys.push(tempDkim._key)
            expectedDkimTags.push(tempDkim)
          }

          const loader = loadDkimGuidanceTagByTagId({
            query,
            i18n,
            language: 'en',
          })
          const dkimTags = await loader.loadMany(dkimTagKeys)
          expect(dkimTags).toEqual(expectedDkimTags)
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
      describe('given a single id', () => {
        it('returns a single dkim guidance tag', async () => {
          // Get dkim tag from db
          const expectedCursor = await query`
            FOR tag IN dkimGuidanceTags
              SORT tag._key ASC LIMIT 1
              RETURN MERGE(
                { 
                  _id: tag._id,
                  _key: tag._key,
                  _rev: tag._rev,
                  _type: "guidanceTag",
                  tagId: tag._key,
                  id: tag._key
                },
                TRANSLATE("fr", tag)
              )
          `
          const expectedDkimTag = await expectedCursor.next()

          const loader = loadDkimGuidanceTagByTagId({
            query,
            i18n,
            language: 'fr',
          })
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
              RETURN MERGE(
                { 
                  _id: tag._id,
                  _key: tag._key,
                  _rev: tag._rev,
                  _type: "guidanceTag",
                  tagId: tag._key,
                  id: tag._key
                },
                TRANSLATE("fr", tag)
              )
          `

          while (expectedCursor.hasMore) {
            const tempDkim = await expectedCursor.next()
            dkimTagKeys.push(tempDkim._key)
            expectedDkimTags.push(tempDkim)
          }

          const loader = loadDkimGuidanceTagByTagId({
            query,
            i18n,
            language: 'fr',
          })
          const dkimTags = await loader.loadMany(dkimTagKeys)
          expect(dkimTags).toEqual(expectedDkimTags)
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
          const loader = loadDkimGuidanceTagByTagId({
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
                'Unable to find DKIM guidance tag(s). Please try again.',
              ),
            )
          }

          expect(consoleErrorOutput).toEqual([
            `Database error occurred when user: 1234 running loadDkimGuidanceTagByTagId: Error: Database error occurred.`,
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
          const loader = loadDkimGuidanceTagByTagId({
            query: jest.fn().mockReturnValue(mockedCursor),
            userKey: '1234',
            i18n,
          })

          try {
            await loader.load('1')
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'Unable to find DKIM guidance tag(s). Please try again.',
              ),
            )
          }

          expect(consoleErrorOutput).toEqual([
            `Cursor error occurred when user: 1234 running loadDkimGuidanceTagByTagId: Error: Cursor error occurred.`,
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
          const loader = loadDkimGuidanceTagByTagId({
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
                "Impossible de trouver le(s) tag(s) d'orientation DKIM. Veuillez réessayer.",
              ),
            )
          }

          expect(consoleErrorOutput).toEqual([
            `Database error occurred when user: 1234 running loadDkimGuidanceTagByTagId: Error: Database error occurred.`,
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
          const loader = loadDkimGuidanceTagByTagId({
            query: jest.fn().mockReturnValue(mockedCursor),
            userKey: '1234',
            i18n,
          })

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
            `Cursor error occurred when user: 1234 running loadDkimGuidanceTagByTagId: Error: Cursor error occurred.`,
          ])
        })
      })
    })
  })
})
