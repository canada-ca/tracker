import { dbNameFromFile } from 'arango-tools'
import { ensureDatabase as ensure } from '../../../testUtilities'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { loadTagsByOrg } from '../index'
import dbschema from '../../../../database.json'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given a loadTagsByOrg dataloader', () => {
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
        ownership: 'pending',
        organizations: ['test'],
      })
      await collections.tags.save({
        tagId: 'test',
        label: { en: 'Test', fr: 'Test' },
        description: { en: '', fr: '' },
        visible: true,
        ownership: 'org',
        organizations: ['test'],
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
    it('returns only org tags', async () => {
      // Get User From db
      const expectedCursor = await query`
            FOR tag IN tags
              FILTER 'test' IN tag.organizations
              FILTER tag.ownership != 'pending'
              FILTER tag.ownership != "global"
              LET label = TRANSLATE('en', tag.label)
              SORT label ASC
              RETURN {
                "tagId": tag.tagId,
                "label": label,
                "description": TRANSLATE('en', tag.description),
                "visible": tag.visible,
                "ownership": tag.ownership,
                "organizations": tag.organizations,
              }
          `
      const expectedTags = await expectedCursor.all()

      const loader = loadTagsByOrg({ query, language: 'en', i18n })
      const tags = await loader({
        orgId: 'test',
        includeGlobal: false,
        includePending: false,
        sortDirection: 'ASC',
      })

      expect(tags).toEqual(expectedTags)
    })
    it('returns pending tags', async () => {
      const expectedCursor = await query`
            FOR tag IN tags
              FILTER 'test' IN tag.organizations
              FILTER tag.ownership != "global"
              LET label = TRANSLATE('en', tag.label)
              SORT label ASC
              RETURN {
                "tagId": tag.tagId,
                "label": label,
                "description": TRANSLATE('en', tag.description),
                "visible": tag.visible,
                "ownership": tag.ownership,
                "organizations": tag.organizations,
              }
          `
      const expectedTags = await expectedCursor.all()

      const loader = loadTagsByOrg({ query, language: 'en', i18n })
      const tags = await loader({ orgId: 'test', includePending: true, sortDirection: 'ASC' })

      expect(tags).toEqual(expectedTags)
    })
    it('returns global tags', async () => {
      const expectedCursor = await query`
            FOR tag IN tags
              FILTER 'test' IN tag.organizations
              FILTER tag.ownership != 'pending'
              LET label = TRANSLATE('en', tag.label)
              SORT label ASC
              RETURN {
                "tagId": tag.tagId,
                "label": label,
                "description": TRANSLATE('en', tag.description),
                "visible": tag.visible,
                "ownership": tag.ownership,
                "organizations": tag.organizations,
              }
          `
      const expectedTags = await expectedCursor.all()

      const loader = loadTagsByOrg({ query, language: 'en', i18n })
      const tags = await loader({ orgId: 'test', includeGlobal: true, sortDirection: 'ASC' })

      expect(tags).toEqual(expectedTags)
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
        const loader = loadTagsByOrg({
          query: mockedQuery,
          language: 'en',
          userKey: '1234',
          i18n,
        })

        try {
          await loader({ isVisible: false })
        } catch (err) {
          expect(err).toEqual(new Error('Unable to load tag(s). Please try again.'))
        }

        expect(consoleOutput).toEqual([
          `Database error occurred while user: 1234 was trying to query tags in loadTagsByOrg, Error: Database error occurred.`,
        ])
      })
    })
    describe('cursor error is raised', () => {
      it('returns an error', async () => {
        const cursor = {
          all() {
            throw new Error('Cursor error occurred.')
          },
        }
        const mockedQuery = jest.fn().mockReturnValue(cursor)
        const loader = loadTagsByOrg({
          query: mockedQuery,
          language: 'en',
          userKey: '1234',
          i18n,
        })

        try {
          await loader({ isVisible: false })
        } catch (err) {
          expect(err).toEqual(new Error('Unable to load tag(s). Please try again.'))
        }

        expect(consoleOutput).toEqual([
          `Cursor error occurred while user: 1234 was trying to gather tags in loadTagsByOrg, Error: Cursor error occurred.`,
        ])
      })
    })
  })
})
