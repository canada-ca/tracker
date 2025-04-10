import { dbNameFromFile } from 'arango-tools'
import { ensureDatabase as ensure } from '../../../testUtilities'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { loadTagByTagId } from '../index'
import dbschema from '../../../../database.json'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given a loadTagByTagId dataloader', () => {
  let query, drop, truncate, collections, i18n

  const consoleOutput = []
  const mockedError = (output) => consoleOutput.push(output)
  beforeAll(() => {
    console.error = mockedError
  })
  afterEach(() => {
    consoleOutput.length = 0
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
      await collections.tags.save({
        tagId: 'web',
        label: { en: 'Web', fr: 'Web' },
        description: { en: '', fr: '' },
        visible: false,
        ownership: 'global',
      })
      await collections.tags.save({
        tagId: 'new',
        label: { en: 'New', fr: 'Nouveau' },
        description: { en: '', fr: '' },
        visible: true,
        ownership: 'global',
      })
    })
    afterEach(async () => {
      await truncate()
    })
    afterAll(async () => {
      await drop()
    })
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
    describe('provided a single id', () => {
      it('returns a single tag', async () => {
        // Get User From db
        const expectedCursor = await query`
            FOR tag IN tags
              FILTER tag.tagId == 'new'
              RETURN {
                _type: "tag",
                "tagId": tag.tagId,
                "label": TRANSLATE('en', tag.label),
                "description": TRANSLATE('en', tag.description),
                "visible": tag.visible,
                "ownership": tag.ownership,
                "organizations": tag.organizations,
              }
          `
        const expectedTag = await expectedCursor.next()

        const loader = loadTagByTagId({ query, language: 'en', i18n })
        const tag = await loader.load(expectedTag.tagId)

        expect(tag).toEqual(expectedTag)
      })
    })
    describe('given a list of ids', () => {
      it('returns a list of tags', async () => {
        const tagIds = []
        const expectedTags = []
        const expectedCursor = await query`
            FOR tag IN tags
              RETURN {
                _type: "tag",
                "tagId": tag.tagId,
                "label": TRANSLATE('en', tag.label),
                "description": TRANSLATE('en', tag.description),
                "visible": tag.visible,
            }
          `

        while (expectedCursor.hasMore) {
          const tempTag = await expectedCursor.next()
          tagIds.push(tempTag.tagId)
          expectedTags.push(tempTag)
        }

        const loader = loadTagByTagId({ query, language: 'en', i18n })
        const tags = await loader.loadMany(tagIds)
        expect(tags).toEqual(expectedTags)
      })
    })
  })
  describe('given an unsuccessful load', () => {
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
    describe('database error is raised', () => {
      it('returns an error', async () => {
        const mockedQuery = jest.fn().mockRejectedValue(new Error('Database error occurred.'))
        const loader = loadTagByTagId({
          query: mockedQuery,
          language: 'en',
          userKey: '1234',
          i18n,
        })

        try {
          await loader.load('1')
        } catch (err) {
          expect(err).toEqual(new Error('Unable to load tag(s). Please try again.'))
        }

        expect(consoleOutput).toEqual([
          `Database error occurred when user: 1234 running loadTagByTagId: Error: Database error occurred.`,
        ])
      })
    })
    describe('cursor error is raised', () => {
      it('returns an error', async () => {
        const cursor = {
          forEach() {
            throw new Error('Cursor error occurred.')
          },
        }
        const mockedQuery = jest.fn().mockReturnValue(cursor)
        const loader = loadTagByTagId({
          query: mockedQuery,
          language: 'en',
          userKey: '1234',
          i18n,
        })

        try {
          await loader.load('1')
        } catch (err) {
          expect(err).toEqual(new Error('Unable to load tag(s). Please try again.'))
        }

        expect(consoleOutput).toEqual([
          `Cursor error occurred when user: 1234 during loadTagByTagId: Error: Cursor error occurred.`,
        ])
      })
    })
  })
})
