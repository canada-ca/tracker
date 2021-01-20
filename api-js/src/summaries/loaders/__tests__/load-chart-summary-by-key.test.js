import { ArangoTools, dbNameFromFile } from 'arango-tools'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { makeMigrations } from '../../../../migrations'
import { chartSummaryLoaderByKey } from '../../index'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the chartSummaryLoaderByKey function', () => {
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
    await collections.chartSummaries.save({
      _key: 'web',
      total: 1000,
      fail: 500,
      pass: 500,
    })
    await collections.chartSummaries.save({
      _key: 'mail',
      total: 1000,
      fail: 500,
      pass: 500,
    })
  })

  afterAll(async () => {
    await drop()
  })

  describe('given a single id', () => {
    it('returns a single summary', async () => {
      const expectedCursor = await query`
        FOR summary IN chartSummaries
          FILTER summary._key == "web"
          RETURN MERGE({ id: summary._key }, summary)
      `
      const expectedSummary = await expectedCursor.next()

      const loader = chartSummaryLoaderByKey(query, i18n)
      const webSummary = await loader.load('web')

      expect(webSummary).toEqual(expectedSummary)
    })
  })
  describe('given multiple ids', () => {
    it('returns multiple dkim scans', async () => {
      const summaryKeys = []
      const expectedSummaries = []
      const expectedCursor = await query`
        FOR summary IN chartSummaries
          RETURN MERGE({ id: summary._key }, summary)
      `

      while (expectedCursor.hasNext()) {
        const tempSummary = await expectedCursor.next()
        summaryKeys.push(tempSummary._key)
        expectedSummaries.push(tempSummary)
      }

      const loader = chartSummaryLoaderByKey(query, i18n)
      const chartSummaries = await loader.loadMany(summaryKeys)
      expect(chartSummaries).toEqual(expectedSummaries)
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
        const loader = chartSummaryLoaderByKey(query, '1234', i18n)

        try {
          await loader.load('1')
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to find summary. Please try again.'),
          )
        }

        expect(consoleErrorOutput).toEqual([
          `Database error occurred when user: 1234 running chartSummaryLoaderByKey: Error: Database error occurred.`,
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
        const loader = chartSummaryLoaderByKey(query, '1234', i18n)

        try {
          await loader.load('1')
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to find summary. Please try again.'),
          )
        }

        expect(consoleErrorOutput).toEqual([
          `Cursor error occurred when user: 1234 running chartSummaryLoaderByKey: Error: Cursor error occurred.`,
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
        const loader = chartSummaryLoaderByKey(query, '1234', i18n)

        try {
          await loader.load('1')
        } catch (err) {
          expect(err).toEqual(new Error('todo'))
        }

        expect(consoleErrorOutput).toEqual([
          `Database error occurred when user: 1234 running chartSummaryLoaderByKey: Error: Database error occurred.`,
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
        const loader = chartSummaryLoaderByKey(query, '1234', i18n)

        try {
          await loader.load('1')
        } catch (err) {
          expect(err).toEqual(new Error('todo'))
        }

        expect(consoleErrorOutput).toEqual([
          `Cursor error occurred when user: 1234 running chartSummaryLoaderByKey: Error: Cursor error occurred.`,
        ])
      })
    })
  })
})
