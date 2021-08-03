import { ensure, dbNameFromFile } from 'arango-tools'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { databaseOptions } from '../../../../database-options'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { loadChartSummaryByKey } from '../../loaders'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given webSummary query', () => {
  let query, drop, truncate, schema, collections, i18n

  const consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  const mockedError = (output) => consoleOutput.push(output)
  beforeAll(() => {
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
  afterEach(() => {
    consoleOutput.length = 0
  })

  describe('given successful web summary retrieval', () => {
    beforeAll(async () => {
      // Generate DB Items
      ;({ query, drop, truncate, collections } = await ensure({
        type: 'database',
        name: dbNameFromFile(__filename),
        url,
        rootPassword: rootPass,
        options: databaseOptions({ rootPass }),
      }))
    })
    beforeEach(async () => {
      await collections.chartSummaries.save({
        _key: 'web',
        total: 1000,
        fail: 500,
        pass: 500,
      })
    })
    afterEach(async () => {
      await truncate()
    })
    afterAll(async () => {
      await drop()
    })
    it('returns web summary', async () => {
      const response = await graphql(
        schema,
        `
          query {
            webSummary {
              total
              categories {
                name
                count
                percentage
              }
            }
          }
        `,
        null,
        {
          i18n,
          loaders: {
            loadChartSummaryByKey: loadChartSummaryByKey({ query }),
          },
        },
      )

      const expectedResponse = {
        data: {
          webSummary: {
            total: 1000,
            categories: [
              {
                name: 'pass',
                count: 500,
                percentage: 50,
              },
              {
                name: 'fail',
                count: 500,
                percentage: 50,
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
    describe('given unsuccessful web summary retrieval', () => {
      describe('summary cannot be found', () => {
        it('returns an appropriate error message', async () => {
          const response = await graphql(
            schema,
            `
              query {
                webSummary {
                  total
                  categories {
                    name
                    count
                    percentage
                  }
                }
              }
            `,
            null,
            {
              i18n,
              loaders: {
                loadChartSummaryByKey: {
                  load: jest.fn().mockReturnValue(undefined),
                },
              },
            },
          )

          const error = [
            new GraphQLError(`Unable to load web summary. Please try again.`),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User could not retrieve web summary.`,
          ])
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
    describe('given unsuccessful web summary retrieval', () => {
      describe('summary cannot be found', () => {
        it('returns an appropriate error message', async () => {
          const response = await graphql(
            schema,
            `
              query {
                webSummary {
                  total
                  categories {
                    name
                    count
                    percentage
                  }
                }
              }
            `,
            null,
            {
              i18n,
              loaders: {
                loadChartSummaryByKey: {
                  load: jest.fn().mockReturnValue(undefined),
                },
              },
            },
          )

          const error = [
            new GraphQLError(
              'Impossible de charger le résumé web. Veuillez réessayer.',
            ),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User could not retrieve web summary.`,
          ])
        })
      })
    })
  })
})
