import { dbNameFromFile } from 'arango-tools'
import { ensureDatabase as ensure } from '../../../testUtilities'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { loadChartSummaryByKey } from '../../loaders'
import dbschema from '../../../../database.json'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given dmarcPhaseSummary query', () => {
  let query, drop, truncate, schema, collections, i18n

  const consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  const mockedError = (output) => consoleOutput.push(output)
  beforeAll(async () => {
    console.info = mockedInfo
    console.warn = mockedWarn
    console.error = mockedError
    // Create GQL Schema
    schema = new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createMutationSchema(),
    })
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

  beforeEach(() => {
    consoleOutput.length = 0
  })

  describe('given successful dmarc phase summary retrieval', () => {
    beforeAll(async () => {
      // Generate DB Items
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
      await collections.chartSummaries.save({
        date: '2021-01-01',
        dmarc_phase: {
          assess: 200,
          deploy: 200,
          enforce: 200,
          maintain: 200,
          total: 800,
        },
      })
    })
    afterEach(async () => {
      await truncate()
    })
    afterAll(async () => {
      await drop()
    })
    it('returns dmarc phase summary', async () => {
      const response = await graphql({
        schema,
        source: `
          query {
            dmarcPhaseSummary {
              total
              categories {
                name
                count
                percentage
              }
            }
          }
        `,
        rootValue: null,
        contextValue: {
          i18n,
          loaders: {
            loadChartSummaryByKey: loadChartSummaryByKey({ query }),
          },
        },
      })

      const expectedResponse = {
        data: {
          dmarcPhaseSummary: {
            total: 800,
            categories: [
              {
                name: 'assess',
                count: 200,
                percentage: 25,
              },
              {
                name: 'deploy',
                count: 200,
                percentage: 25,
              },
              {
                name: 'enforce',
                count: 200,
                percentage: 25,
              },
              {
                name: 'maintain',
                count: 200,
                percentage: 25,
              },
            ],
          },
        },
      }
      expect(response).toEqual(expectedResponse)
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
    describe('given unsuccessful dmarc phase summary retrieval', () => {
      describe('summary cannot be found', () => {
        it('returns an appropriate error message', async () => {
          const response = await graphql({
            schema,
            source: `
              query {
                dmarcPhaseSummary {
                  total
                  categories {
                    name
                    count
                    percentage
                  }
                }
              }
            `,
            rootValue: null,
            contextValue: {
              i18n,
              loaders: {
                loadChartSummaryByKey: {
                  load: jest.fn().mockReturnValue(undefined),
                },
              },
            },
          })

          const error = [new GraphQLError(`Unable to load DMARC phase summary. Please try again.`)]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([`User could not retrieve DMARC phase summary.`])
        })
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
    describe('given unsuccessful dmarc phase summary retrieval', () => {
      describe('summary cannot be found', () => {
        it('returns an appropriate error message', async () => {
          const response = await graphql({
            schema,
            source: `
              query {
                dmarcPhaseSummary {
                  total
                  categories {
                    name
                    count
                    percentage
                  }
                }
              }
            `,
            rootValue: null,
            contextValue: {
              i18n,
              loaders: {
                loadChartSummaryByKey: {
                  load: jest.fn().mockReturnValue(undefined),
                },
              },
            },
          })

          const error = [new GraphQLError('Impossible de charger le résumé DMARC. Veuillez réessayer.')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([`User could not retrieve DMARC phase summary.`])
        })
      })
    })
  })
})
