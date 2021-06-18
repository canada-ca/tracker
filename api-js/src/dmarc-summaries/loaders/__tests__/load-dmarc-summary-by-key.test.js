import { ensure, dbNameFromFile } from 'arango-tools'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { databaseOptions } from '../../../../database-options'
import { loadDmarcSummaryByKey } from '../index'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the loadDmarcSummaryByKey dataloader', () => {
  let query,
    drop,
    truncate,
    collections,
    i18n,
    domain,
    dmarcSummary1,
    dmarcSummary2

  const consoleOutput = []
  const mockedError = (output) => consoleOutput.push(output)
  beforeAll(async () => {
    console.error = mockedError
    ;({ query, drop, truncate, collections } = await ensure({
      type: 'database',
      name: dbNameFromFile(__filename),
      url,
      rootPassword: rootPass,
      options: databaseOptions({ rootPass }),
    }))
  })

  beforeEach(async () => {
    domain = await collections.domains.save({
      domain: 'domain.ca',
    })
    dmarcSummary1 = await collections.dmarcSummaries.save({
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
      categoryPercentages: {
        pass: 0,
        fail: 0,
        passDkimOnly: 0,
        passSpfOnly: 0,
      },
      totalMessages: 0,
    })
    dmarcSummary2 = await collections.dmarcSummaries.save({
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
      categoryPercentages: {
        pass: 0,
        fail: 0,
        passDkimOnly: 0,
        passSpfOnly: 0,
      },
      totalMessages: 0,
    })
    await collections.domainsToDmarcSummaries.save({
      _to: dmarcSummary1._id,
      _from: domain._id,
      startDate: '2021-01-01',
    })
    await collections.domainsToDmarcSummaries.save({
      _to: dmarcSummary2._id,
      _from: domain._id,
      startDate: 'thirtyDays',
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
          LET edge = (
            FOR v, e IN 1..1 ANY summary._id domainsToDmarcSummaries
              RETURN e
          )

          RETURN {
            _id: summary._id,
            _key: summary._key,
            _rev: summary._rev,
            _type: "dmarcSummary",
            id: summary._key,
            startDate: FIRST(edge).startDate,
            domainKey: PARSE_IDENTIFIER(FIRST(edge)._from).key,
            categoryTotals: summary.categoryTotals,
            categoryPercentages: summary.categoryPercentages,
            totalMessages: summary.totalMessages
          }
      `
      const expectedSummary = await expectedCursor.next()
      expectedSummary.domainKey = domain._key

      const summary = await loadDmarcSummaryByKey({ query }).load(
        expectedSummary._key,
      )

      expect(summary).toEqual(expectedSummary)
    })
  })
  describe('given a list of keys', () => {
    it('returns a list of dmarc summaries', async () => {
      const summaryKeys = []
      const expectedSummaries = []
      const expectedCursor = await query`
        FOR summary IN dmarcSummaries
          LET edge = (
            FOR v, e IN 1..1 ANY summary._id domainsToDmarcSummaries
              RETURN e
          )

          RETURN {
            _id: summary._id,
            _key: summary._key,
            _rev: summary._rev,
            _type: "dmarcSummary",
            id: summary._key,
            startDate: FIRST(edge).startDate,
            domainKey: PARSE_IDENTIFIER(FIRST(edge)._from).key,
            categoryTotals: summary.categoryTotals,
            categoryPercentages: summary.categoryPercentages,
            totalMessages: summary.totalMessages
          }
      `

      while (expectedCursor.hasMore) {
        const temp = await expectedCursor.next()
        summaryKeys.push(temp._key)
        expectedSummaries.push(temp)
      }

      const summaries = await loadDmarcSummaryByKey({ query }).loadMany(
        summaryKeys,
      )

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

        try {
          await loadDmarcSummaryByKey({ query, userKey: '1234', i18n }).load(
            '1234',
          )
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to find DMARC summary data. Please try again.'),
          )
        }
        expect(consoleOutput).toEqual([
          `Database error occurred when user: 1234 running loadDmarcSummaryByKey: Error: Database error occurred.`,
        ])
      })
    })
    describe('cursor error occurs', () => {
      it('throws an error', async () => {
        const cursor = {
          forEach() {
            throw new Error('Cursor error occurred.')
          },
        }
        query = jest.fn().mockReturnValue(cursor)

        try {
          await loadDmarcSummaryByKey({ query, userKey: '1234', i18n }).load(
            '1234',
          )
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to find DMARC summary data. Please try again.'),
          )
        }

        expect(consoleOutput).toEqual([
          `Cursor error occurred when user: 1234 running loadDmarcSummaryByKey: Error: Cursor error occurred.`,
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

        try {
          await loadDmarcSummaryByKey({ query, userKey: '1234', i18n }).load(
            '1234',
          )
        } catch (err) {
          expect(err).toEqual(
            new Error(
              'Impossible de trouver les données de synthèse DMARC. Veuillez réessayer.',
            ),
          )
        }
        expect(consoleOutput).toEqual([
          `Database error occurred when user: 1234 running loadDmarcSummaryByKey: Error: Database error occurred.`,
        ])
      })
    })
    describe('cursor error occurs', () => {
      it('throws an error', async () => {
        const cursor = {
          forEach() {
            throw new Error('Cursor error occurred.')
          },
        }
        query = jest.fn().mockReturnValue(cursor)

        try {
          await loadDmarcSummaryByKey({ query, userKey: '1234', i18n }).load(
            '1234',
          )
        } catch (err) {
          expect(err).toEqual(
            new Error(
              'Impossible de trouver les données de synthèse DMARC. Veuillez réessayer.',
            ),
          )
        }

        expect(consoleOutput).toEqual([
          `Cursor error occurred when user: 1234 running loadDmarcSummaryByKey: Error: Cursor error occurred.`,
        ])
      })
    })
  })
})
