const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { graphql, GraphQLSchema, GraphQLError } = require('graphql')
const { setupI18n } = require('@lingui/core')

const englishMessages = require('../../../locale/en/messages')
const frenchMessages = require('../../../locale/fr/messages')
const { makeMigrations } = require('../../../../migrations')
const { createQuerySchema } = require('../..')
const { createMutationSchema } = require('../../../mutations')
const { chartSummaryLoaderByKey } = require('../../../loaders')
const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given mailSummary query', () => {
  let query, drop, truncate, migrate, schema, collections, i18n

  beforeAll(async () => {
    // Create GQL Schema
    schema = new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createMutationSchema(),
    })
    // Generate DB Items
    ;({ migrate } = await ArangoTools({ rootPass, url }))
    ;({ query, drop, truncate, collections } = await migrate(
      makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
    ))
    i18n = setupI18n({
      language: 'en',
      locales: ['en', 'fr'],
      missing: 'Traduction manquante',
      catalogs: {
        en: englishMessages,
        fr: frenchMessages,
      },
    })
  })

  let consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  const mockedError = (output) => consoleOutput.push(output)

  beforeEach(async () => {
    console.info = mockedInfo
    console.warn = mockedWarn
    console.error = mockedError
    await truncate()
    consoleOutput = []
  })

  afterAll(async () => {
    await drop()
  })

  describe('given successful mail summary retrieval', () => {
    beforeEach(async () => {
      await collections.chartSummaries.save({
        _key: 'mail',
        total: 1000,
        fail: 500,
        pass: 500,
      })
    })
    it('returns mail summary', async () => {
      const response = await graphql(
        schema,
        `
          query {
            mailSummary {
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
            chartSummaryLoaderByKey: chartSummaryLoaderByKey(query),
          },
        },
      )

      const expectedResponse = {
        data: {
          mailSummary: {
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
        language: 'en',
        locales: ['en', 'fr'],
        missing: 'Traduction manquante',
        catalogs: {
          en: englishMessages,
          fr: frenchMessages,
        },
      })
    })
    describe('given unsuccessful mail summary retrieval', () => {
      describe('summary cannot be found', () => {
        it('returns an appropriate error message', async () => {
          await truncate()

          const response = await graphql(
            schema,
            `
              query {
                mailSummary {
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
                chartSummaryLoaderByKey: chartSummaryLoaderByKey(
                  query,
                  '1234',
                  i18n,
                ),
              },
            },
          )

          const error = [
            new GraphQLError(`Unable to load mail summary. Please try again.`),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User could not retrieve mail summary.`,
          ])
        })
      })
    })
  })
  describe('users language is set to french', () => {
    beforeAll(() => {
      i18n = setupI18n({
        language: 'fr',
        locales: ['en', 'fr'],
        missing: 'Traduction manquante',
        catalogs: {
          en: englishMessages,
          fr: frenchMessages,
        },
      })
    })
    describe('given unsuccessful mail summary retrieval', () => {
      describe('summary cannot be found', () => {
        it('returns an appropriate error message', async () => {
          await truncate()

          const response = await graphql(
            schema,
            `
              query {
                mailSummary {
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
                chartSummaryLoaderByKey: chartSummaryLoaderByKey(
                  query,
                  '1234',
                  i18n,
                ),
              },
            },
          )

          const error = [new GraphQLError(`todo`)]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User could not retrieve mail summary.`,
          ])
        })
      })
    })
  })
})
