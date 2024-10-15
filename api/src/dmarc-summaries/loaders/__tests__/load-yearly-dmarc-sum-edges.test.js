import { dbNameFromFile } from 'arango-tools'
import { ensureDatabase as ensure } from '../../../testUtilities'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { loadDmarcYearlySumEdge } from '../index'
import dbschema from '../../../../database.json'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the loadDmarcYearlySumEdge loader', () => {
  let query, drop, truncate, collections, i18n, user, dmarcSummary1, dmarcSummary2, dmarcSummary3

  const consoleOutput = []
  const mockedError = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)

  beforeAll(() => {
    console.error = mockedError
    console.warn = mockedWarn
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
      user = await collections.users.save({
        userName: 'test.account@istio.actually.exists',
        displayName: 'Test Account',
        tfaValidated: false,
        emailValidated: false,
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
      })
      dmarcSummary3 = await collections.dmarcSummaries.save({
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

      await collections.domainsToDmarcSummaries.save({
        _from: 'domains/1',
        _to: dmarcSummary1._id,
        startDate: '2021-01-01',
      })
      await collections.domainsToDmarcSummaries.save({
        _from: 'domains/1',
        _to: dmarcSummary2._id,
        startDate: '2020-12-01',
      })
      await collections.domainsToDmarcSummaries.save({
        _from: 'domains/1',
        _to: dmarcSummary3._id,
        startDate: '2020-11-01',
      })
    })
    afterEach(async () => {
      await truncate()
    })
    afterAll(async () => {
      await drop()
    })
    it('returns all the edges', async () => {
      const expectedEdgesCursor = await query`
        FOR edge IN domainsToDmarcSummaries
          RETURN edge
      `
      const expectedEdges = await expectedEdgesCursor.all()

      const loader = loadDmarcYearlySumEdge({ query, userKey: user._key, i18n })

      const dmarcEdges = await loader({
        domainId: 'domains/1',
      })

      expect(dmarcEdges).toEqual(expectedEdges)
    })
  })
  describe('given an unsuccessful load', () => {
    describe('given the users language is set to english', () => {
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
        it('throws an error', async () => {
          const mockedQuery = jest.fn().mockRejectedValue(new Error('Database error occurred'))

          const loader = loadDmarcYearlySumEdge({
            query: mockedQuery,
            userKey: user._key,
            i18n,
          })

          try {
            await loader({
              domainId: 'domains/1',
              startDate: 'thirtyDays',
            })
          } catch (err) {
            expect(err).toEqual(new Error('Unable to load DMARC summary data. Please try again.'))
          }

          expect(consoleOutput).toEqual([
            `Database error occurred when user: ${user._key} attempted to load yearly dmarc summaries for domain: domains/1, Error: Database error occurred`,
          ])
        })
      })
      describe('given a cursor error', () => {
        it('throws an error', async () => {
          const cursor = {
            all() {
              throw new Error('Cursor error occurred.')
            },
          }
          const mockedQuery = jest.fn().mockReturnValueOnce(cursor)

          const loader = loadDmarcYearlySumEdge({
            query: mockedQuery,
            userKey: user._key,
            i18n,
          })

          try {
            await loader({
              domainId: 'domains/1',
              startDate: 'thirtyDays',
            })
          } catch (err) {
            expect(err).toEqual(new Error('Unable to load DMARC summary data. Please try again.'))
          }

          expect(consoleOutput).toEqual([
            `Cursor error occurred when user: ${user._key} attempted to load yearly dmarc summaries for domain: domains/1, Error: Cursor error occurred.`,
          ])
        })
      })
    })
    describe('given the users language is set to french', () => {
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
        it('throws an error', async () => {
          const mockedQuery = jest.fn().mockRejectedValue(new Error('Database error occurred'))

          const loader = loadDmarcYearlySumEdge({
            query: mockedQuery,
            userKey: user._key,
            i18n,
          })

          try {
            await loader({
              domainId: 'domains/1',
              startDate: 'thirtyDays',
            })
          } catch (err) {
            expect(err).toEqual(new Error('Impossible de charger les données de synthèse DMARC. Veuillez réessayer.'))
          }

          expect(consoleOutput).toEqual([
            `Database error occurred when user: ${user._key} attempted to load yearly dmarc summaries for domain: domains/1, Error: Database error occurred`,
          ])
        })
      })
      describe('given a cursor error', () => {
        it('throws an error', async () => {
          const cursor = {
            all() {
              throw new Error('Cursor error occurred.')
            },
          }
          const mockedQuery = jest.fn().mockReturnValueOnce(cursor)

          const loader = loadDmarcYearlySumEdge({
            query: mockedQuery,
            userKey: user._key,
            i18n,
          })

          try {
            await loader({
              domainId: 'domains/1',
              startDate: 'thirtyDays',
            })
          } catch (err) {
            expect(err).toEqual(new Error('Impossible de charger les données de synthèse DMARC. Veuillez réessayer.'))
          }

          expect(consoleOutput).toEqual([
            `Cursor error occurred when user: ${user._key} attempted to load yearly dmarc summaries for domain: domains/1, Error: Cursor error occurred.`,
          ])
        })
      })
    })
  })
})
