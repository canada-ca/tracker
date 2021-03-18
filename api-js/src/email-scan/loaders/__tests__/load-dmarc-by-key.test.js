import { ensure, dbNameFromFile } from 'arango-tools'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { databaseOptions } from '../../../../database-options'
import { dmarcLoaderByKey } from '../index'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the dmarcLoaderByKey function', () => {
  let query, drop, truncate, collections, i18n

  const consoleErrorOutput = []
  const mockedError = (output) => consoleErrorOutput.push(output)

  beforeAll(async () => {
    ;({ query, drop, truncate, collections } = await ensure({
      type: 'database',
      name: dbNameFromFile(__filename),
      url,
      rootPassword: rootPass,
      options: databaseOptions({ rootPass }),
    }))
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

  beforeEach(async () => {
    consoleErrorOutput.length = 0

    await truncate()
    await collections.dmarc.save({})
    await collections.dmarc.save({})
  })

  afterAll(async () => {
    await drop()
  })
  describe('given a single id', () => {
    it('returns a single dmarc scan', async () => {
      const expectedCursor = await query`
        FOR dmarcScan IN dmarc
          SORT dmarcScan._key ASC LIMIT 1
          RETURN MERGE({ id: dmarcScan._key, _type: "dmarc" }, dmarcScan)
      `
      const expectedDmarc = await expectedCursor.next()

      const loader = await dmarcLoaderByKey(query, i18n)
      const dmarc = await loader.load(expectedDmarc._key)

      expect(dmarc).toEqual(expectedDmarc)
    })
  })
  describe('given multiple ids', () => {
    it('returns multiple dmarc scans', async () => {
      const dmarcKeys = []
      const expectedDkimScans = []
      const expectedCursor = await query`
      FOR dmarcScan IN dmarc
        RETURN MERGE({ id: dmarcScan._key, _type: "dmarc" }, dmarcScan)
      `

      while (expectedCursor.hasMore) {
        const tempDmarc = await expectedCursor.next()
        dmarcKeys.push(tempDmarc._key)
        expectedDkimScans.push(tempDmarc)
      }

      const loader = await dmarcLoaderByKey(query, i18n)
      const dmarcScans = await loader.loadMany(dmarcKeys)

      expect(dmarcScans).toEqual(expectedDkimScans)
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
        const loader = dmarcLoaderByKey(query, '1234', i18n)

        try {
          await loader.load('1')
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to find DMARC scan(s). Please try again.'),
          )
        }

        expect(consoleErrorOutput).toEqual([
          `Database error occurred when user: 1234 running dmarcLoaderByKey: Error: Database error occurred.`,
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
        const loader = dmarcLoaderByKey(query, '1234', i18n)

        try {
          await loader.load('1')
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to find DMARC scan(s). Please try again.'),
          )
        }

        expect(consoleErrorOutput).toEqual([
          `Cursor error occurred when user: 1234 running dmarcLoaderByKey: Error: Cursor error occurred.`,
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
        const loader = dmarcLoaderByKey(query, '1234', i18n)

        try {
          await loader.load('1')
        } catch (err) {
          expect(err).toEqual(new Error('todo'))
        }

        expect(consoleErrorOutput).toEqual([
          `Database error occurred when user: 1234 running dmarcLoaderByKey: Error: Database error occurred.`,
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
        const loader = dmarcLoaderByKey(query, '1234', i18n)

        try {
          await loader.load('1')
        } catch (err) {
          expect(err).toEqual(new Error('todo'))
        }

        expect(consoleErrorOutput).toEqual([
          `Cursor error occurred when user: 1234 running dmarcLoaderByKey: Error: Cursor error occurred.`,
        ])
      })
    })
  })
})
