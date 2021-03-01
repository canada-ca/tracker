import moment from 'moment'
import { ensure, dbNameFromFile } from 'arango-tools'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { toGlobalId } from 'graphql-relay'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { databaseOptions } from '../../../../database-options'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { cleanseInput } from '../../../validators'
import { checkSuperAdmin, userRequired } from '../../../auth'
import { dmarcSumLoaderConnectionsByUserId } from '../../loaders'
import { userLoaderByKey } from '../../../user/loaders'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the findMyDmarcSummaries query', () => {
  let query,
    drop,
    truncate,
    schema,
    collections,
    org,
    i18n,
    user,
    domain,
    dmarcSummary1

  beforeAll(async () => {
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
    // Create GQL Schema
    schema = new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createMutationSchema(),
    })
    // Generate DB Items
    ;({ query, drop, truncate, collections } = await ensure({
      type: 'database',
      name: dbNameFromFile(__filename),
      url,
      rootPassword: rootPass,
      options: databaseOptions({ rootPass }),
    }))
  })

  const consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  const mockedError = (output) => consoleOutput.push(output)

  beforeEach(async () => {
    console.info = mockedInfo
    console.warn = mockedWarn
    console.error = mockedError
    consoleOutput.length = 0

    user = await collections.users.save({
      displayName: 'Test Account',
      userName: 'test.account@istio.actually.exists',
      preferredLang: 'english',
    })

    org = await collections.organizations.save({
      orgDetails: {
        en: {
          slug: 'treasury-board-secretariat',
          acronym: 'TBS',
          name: 'Treasury Board of Canada Secretariat',
          zone: 'FED',
          sector: 'TBS',
          country: 'Canada',
          province: 'Ontario',
          city: 'Ottawa',
        },
        fr: {
          slug: 'secretariat-conseil-tresor',
          acronym: 'SCT',
          name: 'Secrétariat du Conseil Trésor du Canada',
          zone: 'FED',
          sector: 'TBS',
          country: 'Canada',
          province: 'Ontario',
          city: 'Ottawa',
        },
      },
    })

    domain = await collections.domains.save({
      domain: 'test.gc.ca',
    })

    await collections.ownership.save({
      _to: domain._id,
      _from: org._id,
    })

    await collections.affiliations.save({
      _from: org._id,
      _to: user._id,
      permission: 'user',
    })

    dmarcSummary1 = await collections.dmarcSummaries.save({
      detailTables: {
        dkimFailure: [],
        dmarcFailure: [],
        fullPass: [],
        spfFailure: [],
      },
      categoryTotals: {
        pass: 1,
        fail: 1,
        passDkimOnly: 1,
        passSpfOnly: 1,
      },
      categoryPercentages: {
        pass: 1,
        fail: 1,
        passDkimOnly: 1,
        passSpfOnly: 1,
      },
      totalMessages: 4,
    })

    await collections.domainsToDmarcSummaries.save({
      _from: domain._id,
      _to: dmarcSummary1._id,
      startDate: '2021-01-01',
    })
  })

  afterEach(async () => {
    await truncate()
  })

  afterAll(async () => {
    await drop()
  })

  describe('given a successful query', () => {
    let mockedStartDateLoader
    beforeEach(() => {
      mockedStartDateLoader = jest.fn().mockReturnValue('2021-01-01')
    })
    it('returns my dmarc summaries', async () => {
      const response = await graphql(
        schema,
        `
          query {
            findMyDmarcSummaries(first: 5, month: JANUARY, year: "2021") {
              edges {
                cursor
                node {
                  id
                  month
                  year
                }
              }
              totalCount
              pageInfo {
                hasNextPage
                hasPreviousPage
                startCursor
                endCursor
              }
            }
          }
        `,
        null,
        {
          i18n,
          moment,
          userKey: user._key,
          auth: {
            checkSuperAdmin: checkSuperAdmin({
              i18n,
              userKey: user._key,
              query,
            }),
            userRequired: userRequired({
              i18n,
              userKey: user._key,
              userLoaderByKey: userLoaderByKey(query, user._key, i18n),
            }),
          },
          loaders: {
            dmarcSumLoaderConnectionsByUserId: dmarcSumLoaderConnectionsByUserId(
              query,
              user._key,
              cleanseInput,
              i18n,
              mockedStartDateLoader,
            ),
          },
        },
      )

      const expectedResponse = {
        data: {
          findMyDmarcSummaries: {
            edges: [
              {
                cursor: toGlobalId('dmarcSummaries', dmarcSummary1._key),
                node: {
                  id: toGlobalId('dmarcSummaries', dmarcSummary1._key),
                  month: 'JANUARY',
                  year: '2021',
                },
              },
            ],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: toGlobalId('dmarcSummaries', dmarcSummary1._key),
              endCursor: toGlobalId('dmarcSummaries', dmarcSummary1._key),
            },
            totalCount: 1,
          },
        },
      }

      expect(response).toEqual(expectedResponse)
      expect(consoleOutput).toEqual([
        `User ${user._key} successfully retrieved their dmarc summaries`,
      ])
    })
  })
  describe('given a unsuccessful query', () => {
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
      describe('given the user is undefined', () => {
        it('returns an error', async () => {
          const response = await graphql(
            schema,
            `
              query {
                findMyDmarcSummaries(first: 5, month: JANUARY, year: "2021") {
                  edges {
                    cursor
                    node {
                      id
                      month
                      year
                    }
                  }
                  totalCount
                  pageInfo {
                    hasNextPage
                    hasPreviousPage
                    startCursor
                    endCursor
                  }
                }
              }
            `,
            null,
            {
              i18n,
              moment,
              userKey: undefined,
              auth: {
                checkSuperAdmin: jest.fn(),
                userRequired: userRequired({
                  i18n,
                  userKey: undefined,
                  userLoaderByKey: userLoaderByKey(query, user._key, i18n),
                }),
              },
              loaders: {
                dmarcSumLoaderConnectionsByUserId: dmarcSumLoaderConnectionsByUserId(
                  query,
                  user._key,
                  cleanseInput,
                  i18n,
                  jest.fn(),
                ),
              },
            },
          )
          const error = [
            new GraphQLError(`Authentication error. Please sign in.`),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User attempted to access controlled content, but userKey was undefined.`,
          ])
        })
      })
      describe('given a loader error', () => {
        it('returns an error', async () => {
          const response = await graphql(
            schema,
            `
              query {
                findMyDmarcSummaries(first: 5, month: JANUARY, year: "2021") {
                  edges {
                    cursor
                    node {
                      id
                      month
                      year
                    }
                  }
                  totalCount
                  pageInfo {
                    hasNextPage
                    hasPreviousPage
                    startCursor
                    endCursor
                  }
                }
              }
            `,
            null,
            {
              i18n,
              moment,
              userKey: user._key,
              auth: {
                checkSuperAdmin: jest.fn(),
                userRequired: userRequired({
                  i18n,
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query, user._key, i18n),
                }),
              },
              loaders: {
                dmarcSumLoaderConnectionsByUserId: dmarcSumLoaderConnectionsByUserId(
                  jest
                    .fn()
                    .mockRejectedValue(new Error('Database error occurred.')),
                  user._key,
                  cleanseInput,
                  i18n,
                  jest.fn(),
                ),
              },
            },
          )
          const error = [
            new GraphQLError(
              `Unable to load dmarc summaries. Please try again.`,
            ),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Database error occurred while user: ${user._key} was trying to gather dmarc summaries in dmarcSumLoaderConnectionsByUserId, error: Error: Database error occurred.`,
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
      describe('given the user is undefined', () => {
        it('returns an error', async () => {
          const response = await graphql(
            schema,
            `
              query {
                findMyDmarcSummaries(first: 5, month: JANUARY, year: "2021") {
                  edges {
                    cursor
                    node {
                      id
                      month
                      year
                    }
                  }
                  totalCount
                  pageInfo {
                    hasNextPage
                    hasPreviousPage
                    startCursor
                    endCursor
                  }
                }
              }
            `,
            null,
            {
              i18n,
              moment,
              userKey: undefined,
              auth: {
                checkSuperAdmin: jest.fn(),
                userRequired: userRequired({
                  i18n,
                  userKey: undefined,
                  userLoaderByKey: userLoaderByKey(query, user._key, i18n),
                }),
              },
              loaders: {
                dmarcSumLoaderConnectionsByUserId: dmarcSumLoaderConnectionsByUserId(
                  query,
                  user._key,
                  cleanseInput,
                  i18n,
                  jest.fn(),
                ),
              },
            },
          )
          const error = [new GraphQLError(`todo`)]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User attempted to access controlled content, but userKey was undefined.`,
          ])
        })
      })
      describe('given a loader error', () => {
        it('returns an error', async () => {
          const response = await graphql(
            schema,
            `
              query {
                findMyDmarcSummaries(first: 5, month: JANUARY, year: "2021") {
                  edges {
                    cursor
                    node {
                      id
                      month
                      year
                    }
                  }
                  totalCount
                  pageInfo {
                    hasNextPage
                    hasPreviousPage
                    startCursor
                    endCursor
                  }
                }
              }
            `,
            null,
            {
              i18n,
              moment,
              userKey: user._key,
              auth: {
                checkSuperAdmin: jest.fn(),
                userRequired: userRequired({
                  i18n,
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query, user._key, i18n),
                }),
              },
              loaders: {
                dmarcSumLoaderConnectionsByUserId: dmarcSumLoaderConnectionsByUserId(
                  jest
                    .fn()
                    .mockRejectedValue(new Error('Database error occurred.')),
                  user._key,
                  cleanseInput,
                  i18n,
                  jest.fn(),
                ),
              },
            },
          )
          const error = [new GraphQLError(`todo`)]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Database error occurred while user: ${user._key} was trying to gather dmarc summaries in dmarcSumLoaderConnectionsByUserId, error: Error: Database error occurred.`,
          ])
        })
      })
    })
  })
})
