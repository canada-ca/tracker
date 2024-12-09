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
import { loadUserByKey } from '../../../user/loaders'
import { loadOrgConnectionsByUserId } from '../../loaders'
import dbschema from '../../../../database.json'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given findMyOrganizationsQuery', () => {
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
        describe('user queries for their organizations', () => {
          describe('in english', () => {
            it('returns organizations', async () => {
              const response = await graphql({
                schema,
                source: `
                  query {
                    findMyOrganizations(first: 5) {
                      edges {
                        cursor
                        node {
                          id
                          acronym
                          name
                          slug
                          zone
                          sector
                          country
                          province
                          city
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
                    loadOrgConnectionsByUserId: loadOrgConnectionsByUserId({
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
                  findMyOrganizations: {
                    edges: [
                      {
                        cursor: toGlobalId('organization', orgOne._key),
                        node: {
                          id: toGlobalId('organization', orgOne._key),
                          slug: 'treasury-board-secretariat',
                          acronym: 'TBS',
                          name: 'Treasury Board of Canada Secretariat',
                          zone: 'FED',
                          sector: 'TBS',
                          country: 'Canada',
                          province: 'Ontario',
                          city: 'Ottawa',
                        },
                      },
                      {
                        cursor: toGlobalId('organization', orgTwo._key),
                        node: {
                          id: toGlobalId('organization', orgTwo._key),
                          slug: 'not-treasury-board-secretariat',
                          acronym: 'NTBS',
                          name: 'Not Treasury Board of Canada Secretariat',
                          zone: 'NFED',
                          sector: 'NTBS',
                          country: 'Canada',
                          province: 'Ontario',
                          city: 'Ottawa',
                        },
                      },
                    ],
                    totalCount: 2,
                    pageInfo: {
                      endCursor: toGlobalId('organization', orgTwo._key),
                      hasNextPage: false,
                      hasPreviousPage: false,
                      startCursor: toGlobalId('organization', orgOne._key),
                    },
                  },
                },
              }
              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([`User ${user._key} successfully retrieved their organizations.`])
            })
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
        describe('user queries for their organizations', () => {
          describe('in french', () => {
            it('returns organizations', async () => {
              const response = await graphql({
                schema,
                source: `
                  query {
                    findMyOrganizations(first: 5) {
                      edges {
                        cursor
                        node {
                          id
                          acronym
                          name
                          slug
                          zone
                          sector
                          country
                          province
                          city
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
                    loadOrgConnectionsByUserId: loadOrgConnectionsByUserId({
                      query,
                      userKey: user._key,
                      cleanseInput,
                      auth: { loginRequired: true },
                      language: 'fr',
                    }),
                  },
                },
              })

              const expectedResponse = {
                data: {
                  findMyOrganizations: {
                    edges: [
                      {
                        cursor: toGlobalId('organization', orgOne._key),
                        node: {
                          id: toGlobalId('organization', orgOne._key),
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
                      {
                        cursor: toGlobalId('organization', orgTwo._key),
                        node: {
                          id: toGlobalId('organization', orgTwo._key),
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
                    ],
                    totalCount: 2,
                    pageInfo: {
                      endCursor: toGlobalId('organization', orgTwo._key),
                      hasNextPage: false,
                      hasPreviousPage: false,
                      startCursor: toGlobalId('organization', orgOne._key),
                    },
                  },
                },
              }
              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([`User ${user._key} successfully retrieved their organizations.`])
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
                findMyOrganizations(first: 5) {
                  edges {
                    cursor
                    node {
                      id
                      acronym
                      name
                      slug
                      zone
                      sector
                      country
                      province
                      city
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
                loadOrgConnectionsByUserId: loadOrgConnectionsByUserId({
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

          const error = [new GraphQLError('Unable to load organization(s). Please try again.')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Database error occurred while user: ${user._key} was trying to query organizations in loadOrgConnectionsByUserId, error: Error: Database error occurred.`,
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
        it('returns an error message', async () => {
          const mockedQuery = jest.fn().mockRejectedValueOnce(new Error('Database error occurred.'))

          const response = await graphql({
            schema,
            source: `
              query {
                findMyOrganizations(first: 5) {
                  edges {
                    cursor
                    node {
                      id
                      acronym
                      name
                      slug
                      zone
                      sector
                      country
                      province
                      city
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
                loadOrgConnectionsByUserId: loadOrgConnectionsByUserId({
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

          const error = [new GraphQLError("Impossible de charger l'organisation (s). Veuillez réessayer.")]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Database error occurred while user: ${user._key} was trying to query organizations in loadOrgConnectionsByUserId, error: Error: Database error occurred.`,
          ])
        })
      })
    })
  })
})
