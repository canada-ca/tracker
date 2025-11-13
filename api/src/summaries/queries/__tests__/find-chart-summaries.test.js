import { dbNameFromFile } from 'arango-tools'
import { ensureDatabase as ensure } from '../../../testUtilities'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { toGlobalId } from 'graphql-relay'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { cleanseInput } from '../../../validators'
import { userRequired, verifiedRequired } from '../../../auth'
import { loadUserByKey } from '../../../user/loaders'
import { loadChartSummariesByPeriod } from '../../loaders'
import dbschema from '../../../../database.json'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given findMyOrganizationsQuery', () => {
  let query, drop, truncate, schema, collections, sum1, sum2, i18n, user

  const consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  const mockedError = (output) => consoleOutput.push(output)
  beforeAll(async () => {
    // Create GQL Schema
    schema = new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createMutationSchema(),
    })
  })
  beforeEach(async () => {
    console.info = mockedInfo
    console.warn = mockedWarn
    console.error = mockedError
    consoleOutput.length = 0
  })
  describe('given a successful load', () => {
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
      user = await collections.users.save({
        displayName: 'Test Account',
        userName: 'test.account@istio.actually.exists',
        emailValidated: true,
      })
      sum1 = await collections.chartSummaries.save({
        date: '2021-01-01',
        https: {
          scan_types: ['https'],
          pass: 1,
          fail: 0,
          total: 1,
        },
        dmarc: {
          scan_types: ['dmarc'],
          pass: 1,
          fail: 0,
          total: 1,
        },
      })
      sum2 = await collections.chartSummaries.save({
        date: '2021-01-02',
        https: {
          scan_types: ['https'],
          pass: 1,
          fail: 1,
          total: 2,
        },
        dmarc: {
          scan_types: ['dmarc'],
          pass: 2,
          fail: 0,
          total: 2,
        },
      })
    })
    afterEach(async () => {
      await truncate()
    })
    afterAll(async () => {
      await drop()
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
      describe('given successful retrieval of domains', () => {
        describe('user queries for their organizations', () => {
          describe('in english', () => {
            it('returns chart summaries from january 2021', async () => {
              const response = await graphql({
                schema,
                source: `
                  query {
                    findChartSummaries(startDate: "2021-01-01", endDate: "2021-01-31", sortDirection: ASC) {
                      date
                      dmarc {
                        categories {
                          count
                          name
                          percentage
                        }
                        total
                      }
                      https {
                        total
                        categories {
                          count
                          name
                          percentage
                        }
                      }
                      id
                    }
                  }
                `,
                rootValue: null,
                contextValue: {
                  i18n,
                  userKey: user._key,
                  auth: {
                    userRequired: userRequired({
                      i18n,
                      userKey: user._key,
                      loadUserByKey: loadUserByKey({
                        query,
                        userKey: user._key,
                        i18n,
                      }),
                    }),
                    verifiedRequired: verifiedRequired({}),
                  },
                  loaders: {
                    loadChartSummariesByPeriod: loadChartSummariesByPeriod({
                      query,
                      userKey: user._key,
                      cleanseInput,
                      auth: { loginRequired: true },
                      language: 'en',
                    }),
                  },
                },
              })

              const expectedResponse = {
                data: {
                  findChartSummaries: [
                    {
                      id: toGlobalId('chartSummary', sum1._key),
                      date: '2021-01-01',
                      https: {
                        total: 1,
                        categories: [
                          {
                            count: 1,
                            name: 'pass',
                            percentage: 100,
                          },
                          {
                            count: 0,
                            name: 'fail',
                            percentage: 0,
                          },
                        ],
                      },
                      dmarc: {
                        total: 1,
                        categories: [
                          {
                            count: 1,
                            name: 'pass',
                            percentage: 100,
                          },
                          {
                            count: 0,
                            name: 'fail',
                            percentage: 0,
                          },
                        ],
                      },
                    },

                    {
                      id: toGlobalId('chartSummary', sum2._key),
                      date: '2021-01-02',
                      https: {
                        total: 2,
                        categories: [
                          {
                            count: 1,
                            name: 'pass',
                            percentage: 50,
                          },
                          {
                            count: 1,
                            name: 'fail',
                            percentage: 50,
                          },
                        ],
                      },
                      dmarc: {
                        total: 2,
                        categories: [
                          {
                            count: 2,
                            name: 'pass',
                            percentage: 100,
                          },
                          {
                            count: 0,
                            name: 'fail',
                            percentage: 0,
                          },
                        ],
                      },
                    },
                  ],
                },
              }
              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([`User: ${user._key} successfully retrieved their chart summaries.`])
            })
          })
        })
      })
    })
  })
  describe('given an unsuccessful load', () => {
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
        it('returns an error message', async () => {
          const mockedQuery = jest.fn().mockRejectedValueOnce(new Error('Database error occurred.'))

          const response = await graphql({
            schema,
            source: `
                  query {
                    findChartSummaries(startDate: "2021-01-01", endDate: "2021-01-31", sortDirection: ASC) {
                      date
                      dmarc {
                        categories {
                          count
                          name
                          percentage
                        }
                        total
                      }
                      https {
                        total
                        categories {
                          count
                          name
                          percentage
                        }
                      }
                      id
                    }
                  }
                `,
            rootValue: null,
            contextValue: {
              i18n,
              userKey: user._key,
              auth: {
                checkSuperAdmin: jest.fn(),
                userRequired: jest.fn().mockReturnValue({}),
                verifiedRequired: jest.fn(),
              },
              loaders: {
                loadChartSummariesByPeriod: loadChartSummariesByPeriod({
                  query: mockedQuery,
                  userKey: user._key,
                  cleanseInput,
                  auth: { loginRequired: true },
                  language: 'en',
                  i18n,
                }),
              },
            },
          })

          const error = [new GraphQLError('Unable to load chart summary data. Please try again.')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Database error occurred while user: ${user._key} was trying to gather chart summaries in loadChartSummariesByPeriod, error: Error: Database error occurred.`,
          ])
        })
      })
    })
  })
})
