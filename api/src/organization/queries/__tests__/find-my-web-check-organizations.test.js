import { ensure, dbNameFromFile } from 'arango-tools'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { toGlobalId } from 'graphql-relay'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { cleanseInput } from '../../../validators'
import { checkSuperAdmin, userRequired, verifiedRequired } from '../../../auth'
import { loadUserByKey } from '../../../user/loaders'
import { loadWebCheckConnectionsByUserId } from '../../loaders'
import dbschema from '../../../../database.json'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given findMyWebCheckOrganizations', () => {
  let query, drop, truncate, schema, collections, orgTwo, domainOne, i18n, user

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
        preferredLang: 'french',
        emailValidated: true,
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
      domainOne = await collections.domains.save({
        domain: 'domain.test',
        lastRan: 'datetime',
        tags: [
          { id: 'CVE-2022-12345', firstDetected: 'datetime', severity: 'high' },
        ],
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
          _from: orgTwo._id,
          _to: user._id,
          permission: 'admin',
        })
        await collections.claims.save({
          _from: orgTwo._id,
          _to: domainOne._id,
        })
      })
      describe('given successful retrieval of domains', () => {
        describe('user queries for their organizations', () => {
          describe('in english', () => {
            it('returns web check organizations', async () => {
              const response = await graphql(
                schema,
                `
                  query {
                    findMyWebCheckOrganizations(first: 5) {
                      totalCount
                      edges {
                        cursor
                        node {
                          id
                          acronym
                          name
                          slug
                          domains {
                            totalCount
                            edges {
                              id
                              domain
                              lastRan
                              tags {
                                edges {
                                  id
                                  firstDetected
                                  severity
                                }
                                totalCount
                              }
                            }
                          }
                        }
                      }
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
                      loadUserByKey: loadUserByKey({
                        query,
                        userKey: user._key,
                        i18n,
                      }),
                    }),
                    verifiedRequired: verifiedRequired({}),
                  },
                  loaders: {
                    loadWebCheckConnectionsByUserId:
                      loadWebCheckConnectionsByUserId({
                        query,
                        userKey: user._key,
                        cleanseInput,
                        language: 'en',
                        i18n,
                      }),
                  },
                },
              )
              const expectedResponse = {
                data: {
                  findMyWebCheckOrganizations: {
                    totalCount: 1,
                    edges: [
                      {
                        cursor: toGlobalId('organization', orgTwo._key),
                        node: {
                          id: toGlobalId('organization', orgTwo._key),
                          acronym: 'NTBS',
                          name: 'Not Treasury Board of Canada Secretariat',
                          slug: 'not-treasury-board-secretariat',
                          domains: {
                            totalCount: 1,
                            edges: [
                              {
                                id: toGlobalId('domain', domainOne._key),
                                domain: 'domain.test',
                                lastRan: 'datetime',
                                tags: {
                                  edges: [
                                    {
                                      id: 'CVE-2022-12345',
                                      firstDetected: 'datetime',
                                      severity: 'HIGH',
                                    },
                                  ],
                                  totalCount: 1,
                                },
                              },
                            ],
                          },
                        },
                      },
                    ],
                    pageInfo: {
                      hasNextPage: false,
                      hasPreviousPage: true,
                      startCursor: toGlobalId('organization', orgTwo._key),
                      endCursor: toGlobalId('organization', orgTwo._key),
                    },
                  },
                },
              }
              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User ${user._key} successfully retrieved their organizations.`,
              ])
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
            const mockedQuery = jest
              .fn()
              .mockRejectedValueOnce(new Error('Database error occurred.'))

            const response = await graphql(
              schema,
              `
                query {
                  findMyWebCheckOrganizations(first: 5) {
                    totalCount
                    edges {
                      cursor
                      node {
                        id
                        acronym
                        name
                        slug
                        tags {
                          edges {
                            id
                            severity
                          }
                          totalCount
                        }
                        domains {
                          totalCount
                          edges {
                            id
                            domain
                            lastRan
                            tags {
                              edges {
                                id
                                firstDetected
                                severity
                              }
                              totalCount
                            }
                          }
                        }
                      }
                    }
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
                userKey: user._key,
                auth: {
                  checkSuperAdmin: jest.fn(),
                  userRequired: jest.fn().mockReturnValue({}),
                  verifiedRequired: jest.fn(),
                },
                loaders: {
                  loadWebCheckConnectionsByUserId:
                    loadWebCheckConnectionsByUserId({
                      query: mockedQuery,
                      userKey: user._key,
                      cleanseInput,
                      language: 'en',
                      i18n,
                    }),
                },
              },
            )

            const error = [
              new GraphQLError(
                'Unable to load organization(s). Please try again.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Database error occurred while user: ${user._key} was trying to gather organizations in loadWebCheckConnectionsByUserId, error: Error: Database error occurred.`,
            ])
          })
        })
      })
    })
  })
})
