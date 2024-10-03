import moment from 'moment'
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
import { checkSuperAdmin, userRequired, verifiedRequired } from '../../../auth'
import { loadDmarcSummaryConnectionsByUserId } from '../../loaders'
import { loadUserByKey } from '../../../user/loaders'
import dbschema from '../../../../database.json'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the findMyDmarcSummaries query', () => {
  let query, drop, truncate, schema, collections, org, i18n, user, domain, dmarcSummary1

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
  })

  describe('given a successful query', () => {
    let mockedStartDateLoader
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
      mockedStartDateLoader = jest.fn().mockReturnValue('2021-01-01')
      user = await collections.users.save({
        displayName: 'Test Account',
        userName: 'test.account@istio.actually.exists',
        emailValidated: true,
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
    it('returns my dmarc summaries', async () => {
      const response = await graphql({
        schema,
        source: `
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
        rootValue: null,
        contextValue: {
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
              loadUserByKey: loadUserByKey({ query, userKey: user._key, i18n }),
            }),
            verifiedRequired: verifiedRequired({ i18n }),
          },
          loaders: {
            loadDmarcSummaryConnectionsByUserId: loadDmarcSummaryConnectionsByUserId({
              query,
              userKey: user._key,
              cleanseInput,
              auth: { loginRequired: true },
              i18n,
              loadStartDateFromPeriod: mockedStartDateLoader,
            }),
          },
        },
      })

      const expectedResponse = {
        data: {
          findMyDmarcSummaries: {
            edges: [
              {
                cursor: toGlobalId('dmarcSummary', dmarcSummary1._key),
                node: {
                  id: toGlobalId('dmarcSummary', dmarcSummary1._key),
                  month: 'JANUARY',
                  year: '2021',
                },
              },
            ],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: toGlobalId('dmarcSummary', dmarcSummary1._key),
              endCursor: toGlobalId('dmarcSummary', dmarcSummary1._key),
            },
            totalCount: 1,
          },
        },
      }

      expect(response).toEqual(expectedResponse)
      expect(consoleOutput).toEqual([`User ${user._key} successfully retrieved their dmarc summaries`])
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
          const response = await graphql({
            schema,
            source: `
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
            rootValue: null,
            contextValue: {
              i18n,
              moment,
              userKey: undefined,
              auth: {
                checkSuperAdmin: jest.fn(),
                userRequired: userRequired({
                  i18n,
                  userKey: undefined,
                  loadUserByKey: {
                    load: jest.fn(),
                  },
                }),
                verifiedRequired: verifiedRequired({ i18n }),
                loginRequiredBool: true,
              },
              loaders: {
                loadDmarcSummaryConnectionsByUserId: jest.fn(),
              },
            },
          })
          const error = [new GraphQLError(`Authentication error. Please sign in.`)]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([`User attempted to access controlled content, but userKey was undefined.`])
        })
      })
      describe('given a loader error', () => {
        it('returns an error', async () => {
          const response = await graphql({
            schema,
            source: `
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
            rootValue: null,
            contextValue: {
              i18n,
              moment,
              userKey: user._key,
              auth: {
                checkSuperAdmin: jest.fn(),
                userRequired: jest.fn().mockReturnValue({}),
                verifiedRequired: jest.fn(),
              },
              loaders: {
                loadDmarcSummaryConnectionsByUserId: loadDmarcSummaryConnectionsByUserId({
                  query: jest.fn().mockRejectedValue(new Error('Database error occurred.')),
                  userKey: user._key,
                  cleanseInput,
                  auth: { loginRequired: true },
                  i18n,
                  loadStartDateFromPeriod: jest.fn(),
                }),
              },
            },
          })
          const error = [new GraphQLError(`Unable to load DMARC summary data. Please try again.`)]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Database error occurred while user: ${user._key} was trying to gather dmarc summaries in loadDmarcSummaryConnectionsByUserId, error: Error: Database error occurred.`,
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
          const response = await graphql({
            schema,
            source: `
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
            rootValue: null,
            contextValue: {
              i18n,
              moment,
              userKey: undefined,
              auth: {
                checkSuperAdmin: jest.fn(),
                userRequired: userRequired({
                  i18n,
                  userKey: undefined,
                  loadUserByKey: {
                    load: jest.fn(),
                  },
                }),
                loginRequiredBool: true,
                verifiedRequired: verifiedRequired({ i18n }),
              },
              loaders: {
                loadDmarcSummaryConnectionsByUserId: jest.fn(),
              },
            },
          })
          const error = [new GraphQLError("Erreur d'authentification. Veuillez vous connecter.")]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([`User attempted to access controlled content, but userKey was undefined.`])
        })
      })
      describe('given a loader error', () => {
        it('returns an error', async () => {
          const response = await graphql({
            schema,
            source: `
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
            rootValue: null,
            contextValue: {
              i18n,
              moment,
              userKey: user._key,
              auth: {
                checkSuperAdmin: jest.fn(),
                userRequired: jest.fn().mockReturnValue({}),
                verifiedRequired: jest.fn(),
              },
              loaders: {
                loadDmarcSummaryConnectionsByUserId: loadDmarcSummaryConnectionsByUserId({
                  query: jest.fn().mockRejectedValue(new Error('Database error occurred.')),
                  userKey: user._key,
                  cleanseInput,
                  auth: { loginRequired: true },
                  i18n,
                  loadStartDateFromPeriod: jest.fn(),
                }),
              },
            },
          })
          const error = [new GraphQLError('Impossible de charger les données de synthèse DMARC. Veuillez réessayer.')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Database error occurred while user: ${user._key} was trying to gather dmarc summaries in loadDmarcSummaryConnectionsByUserId, error: Error: Database error occurred.`,
          ])
        })
      })
    })
  })
})
