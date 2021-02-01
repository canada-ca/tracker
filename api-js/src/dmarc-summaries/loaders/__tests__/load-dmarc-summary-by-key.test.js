import { ArangoTools, dbNameFromFile } from 'arango-tools'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { makeMigrations } from '../../../../migrations'
import { dmarcSumLoaderByKey } from '../index'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the dmarcSumLoaderByKey dataloader', () => {
  let query, drop, truncate, migrate, collections, i18n

  const consoleOutput = []
  const mockedError = (output) => consoleOutput.push(output)
  beforeAll(async () => {
    ;({ migrate } = await ArangoTools({ rootPass, url }))
    ;({ query, drop, truncate, collections } = await migrate(
      makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
    ))
    console.error = mockedError
  })

  beforeEach(async () => {
    await collections.dmarcSummaries.save({
      detailTables: {
        dkimFailure: [],
        dmarcFailure: [],
        fullPass: [],
        spfFailure: [],
      },
      categoryTotals: {
        pass: 0,
        fail: 0,
        passDkimOnly: 0,
        passSpfOnly: 0,
      },
    })
    await collections.dmarcSummaries.save({
      detailTables: {
        dkimFailure: [],
        dmarcFailure: [],
        fullPass: [],
        spfFailure: [],
      },
      categoryTotals: {
        pass: 0,
        fail: 0,
        passDkimOnly: 0,
        passSpfOnly: 0,
      },
    })
    consoleOutput.length = 0
  })

  afterEach(async () => {
    await truncate()
  })

  afterAll(async () => {
    await drop()
  })

  describe('given a single key', () => {
    it('returns a single dmarc summary', async () => {
      const expectedCursor = await query`
        FOR summary IN dmarcSummaries
          SORT summary._key ASC 
          LIMIT 1
          RETURN {
            _id: summary._id,
            _key: summary._key,
            _rev: summary._rev,
            _type: "dmarcSummary",
            id: summary._key,
            categoryTotals: summary.categoryTotals
          }
      `
      const expectedSummary = await expectedCursor.next()

      const loader = dmarcSumLoaderByKey(query)
      const summary = await loader.load(expectedSummary._key)

      expect(summary).toEqual(expectedSummary)
    })
  })
  describe('given a list of keys', () => {
    it('returns a list of dmarc summaries', async () => {
      const summaryKeys = []
      const expectedSummaries = []
      const expectedCursor = await query`
        FOR summary IN dmarcSummaries
          RETURN {
            _id: summary._id,
            _key: summary._key,
            _rev: summary._rev,
            _type: "dmarcSummary",
            id: summary._key,
            categoryTotals: summary.categoryTotals
          }
      `

      while (expectedCursor.hasNext()) {
        const temp = await expectedCursor.next()
        summaryKeys.push(temp._key)
        expectedSummaries.push(temp)
      }

      const loader = dmarcSumLoaderByKey(query)
      const summaries = await loader.loadMany(summaryKeys)

      expect(summaries).toEqual(expectedSummaries)
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
    describe('database error occurs', () => {
      it('throws an error', async () => {
        query = jest
          .fn()
          .mockRejectedValue(new Error('Database error occurred.'))
        const loader = dmarcSumLoaderByKey(query, '1234', i18n)

        try {
          await loader.load('1234')
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to find dmarc summary. Please try again.'),
          )
        }
        expect(consoleOutput).toEqual([
          `Database error occurred when user: 1234 running dmarcSumLoaderByKey: Error: Database error occurred.`,
        ])
      })
    })
    describe('cursor error occurs', () => {
      it('throws an error', async () => {
        const cursor = {
          each() {
            throw new Error('Cursor error occurred.')
          },
        }
        query = jest.fn().mockReturnValue(cursor)
        const loader = dmarcSumLoaderByKey(query, '1234', i18n)

        try {
          await loader.load('1234')
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to find dmarc summary. Please try again.'),
          )
        }

        expect(consoleOutput).toEqual([
          `Cursor error occurred when user: 1234 running dmarcSumLoaderByKey: Error: Cursor error occurred.`,
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
    describe('database error occurs', () => {
      it('throws an error', async () => {
        query = jest
          .fn()
          .mockRejectedValue(new Error('Database error occurred.'))
        const loader = dmarcSumLoaderByKey(query, '1234', i18n)

        try {
          await loader.load('1234')
        } catch (err) {
          expect(err).toEqual(new Error('todo'))
        }
        expect(consoleOutput).toEqual([
          `Database error occurred when user: 1234 running dmarcSumLoaderByKey: Error: Database error occurred.`,
        ])
      })
    })
    describe('cursor error occurs', () => {
      it('throws an error', async () => {
        const cursor = {
          each() {
            throw new Error('Cursor error occurred.')
          },
        }
        query = jest.fn().mockReturnValue(cursor)
        const loader = dmarcSumLoaderByKey(query, '1234', i18n)

        try {
          await loader.load('1234')
        } catch (err) {
          expect(err).toEqual(new Error('todo'))
        }

        expect(consoleOutput).toEqual([
          `Cursor error occurred when user: 1234 running dmarcSumLoaderByKey: Error: Cursor error occurred.`,
        ])
      })
    })
  })
})
