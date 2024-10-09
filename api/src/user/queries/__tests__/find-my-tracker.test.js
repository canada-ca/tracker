import { dbNameFromFile } from 'arango-tools'
import { ensureDatabase as ensure } from '../../../testUtilities'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { cleanseInput } from '../../../validators'
import { userRequired, verifiedRequired } from '../../../auth'
import { loadUserByKey, loadMyTrackerByUserId } from '../../loaders'
import { loadDomainConnectionsByUserId } from '../../../domain/loaders'
import dbschema from '../../../../database.json'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given findMyTracker query', () => {
  let query, drop, truncate, schema, collections, orgOne, orgTwo, i18n, user

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

      orgOne = await collections.organizations.save({
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
      orgTwo = await collections.organizations.save({
        orgDetails: {
          en: {
            slug: 'not-treasury-board-secretariat',
            acronym: 'NTBS',
            name: 'Not Treasury Board of Canada Secretariat',
            zone: 'NFED',
            sector: 'NTBS',
            country: 'Canada',
            province: 'Ontario',
            city: 'Ottawa',
          },
          fr: {
            slug: 'ne-pas-secretariat-conseil-tresor',
            acronym: 'NPSCT',
            name: 'Ne Pas Secrétariat du Conseil Trésor du Canada',
            zone: 'NPFED',
            sector: 'NPTBS',
            country: 'Canada',
            province: 'Ontario',
            city: 'Ottawa',
          },
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
      beforeEach(async () => {
        await collections.affiliations.save({
          _from: orgOne._id,
          _to: user._id,
          permission: 'user',
        })
        await collections.affiliations.save({
          _from: orgTwo._id,
          _to: user._id,
          permission: 'user',
        })
      })
      describe('given successful retrieval of domains', () => {
        describe('user queries for myTracker', () => {
          describe('in english', () => {
            it('returns myTracker results', async () => {
              const response = await graphql({
                schema,
                source: `
                  query {
                    findMyTracker {
                      summaries {
                        https {
                          categories {
                            name
                            count
                            percentage
                          }
                          total
                        }
                        dmarcPhase {
                          categories {
                            name
                            count
                            percentage
                          }
                          total
                        }
                      }
                      domainCount
                      domains(first: 10) {
                        pageInfo {
                          hasNextPage
                          hasPreviousPage
                          startCursor
                          endCursor
                        }
                        totalCount
                        edges {
                          node {
                            id
                            domain
                            hasDMARCReport
                            status {
                              ciphers
                              curves
                              dkim
                              dmarc
                              hsts
                              https
                              policy
                              protocols
                              spf
                              ssl
                            }
                          }
                          cursor
                        }
                      }
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
                    loadMyTrackerByUserId: loadMyTrackerByUserId({
                      query,
                      userKey: user._key,
                      cleanseInput,
                      language: 'en',
                    }),
                    loadDomainConnectionsByUserId: loadDomainConnectionsByUserId({
                      query,
                      userKey: user._key,
                      cleanseInput,
                      language: 'en',
                      auth: { loginRequiredBool: true },
                    }),
                  },
                },
              })

              const expectedResponse = {
                data: {
                  findMyTracker: {
                    summaries: {
                      https: {
                        categories: [
                          {
                            name: 'pass',
                            count: 0,
                            percentage: 0,
                          },
                          {
                            name: 'fail',
                            count: 0,
                            percentage: 0,
                          },
                        ],
                        total: 0,
                      },
                      dmarcPhase: {
                        categories: [
                          {
                            name: 'not implemented',
                            count: 0,
                            percentage: 0,
                          },
                          {
                            name: 'assess',
                            count: 0,
                            percentage: 0,
                          },
                          {
                            name: 'deploy',
                            count: 0,
                            percentage: 0,
                          },
                          {
                            name: 'enforce',
                            count: 0,
                            percentage: 0,
                          },
                          {
                            name: 'maintain',
                            count: 0,
                            percentage: 0,
                          },
                        ],
                        total: 0,
                      },
                    },
                    domainCount: 0,
                    domains: {
                      pageInfo: {
                        hasNextPage: false,
                        hasPreviousPage: false,
                        startCursor: '',
                        endCursor: '',
                      },
                      totalCount: 0,
                      edges: [],
                    },
                  },
                },
              }
              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([`User ${user._key} successfully retrieved personal domains.`])
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
                findMyTracker {
                  summaries {
                    https {
                      categories {
                        name
                        count
                        percentage
                      }
                      total
                    }
                    dmarcPhase {
                      categories {
                        name
                        count
                        percentage
                      }
                      total
                    }
                  }
                  domainCount
                  domains(first: 10) {
                    pageInfo {
                      hasNextPage
                      hasPreviousPage
                      startCursor
                      endCursor
                    }
                    totalCount
                    edges {
                      node {
                        id
                        domain
                        hasDMARCReport
                        status {
                          ciphers
                          curves
                          dkim
                          dmarc
                          hsts
                          https
                          policy
                          protocols
                          spf
                          ssl
                        }
                      }
                      cursor
                    }
                  }
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
                loadMyTrackerByUserId: loadMyTrackerByUserId({
                  query: mockedQuery,
                  userKey: user._key,
                  cleanseInput,
                  language: 'en',
                  i18n,
                }),
              },
            },
          })

          const error = [new GraphQLError('Unable to query domain(s). Please try again.')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Database error occurred while user: ${user._key} was trying to query domains in loadDomainsByUser, error: Error: Database error occurred.`,
          ])
        })
      })
    })
  })
})
