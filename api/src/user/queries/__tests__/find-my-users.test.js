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
import { checkSuperAdmin, superAdminRequired, userRequired, verifiedRequired } from '../../../auth'
import { loadUserByKey, loadUserConnectionsByUserId } from '../../loaders'
import dbschema from '../../../../database.json'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given findMyUsersQuery', () => {
  let query, drop, truncate, schema, collections, saOrg, orgOne, orgTwo, i18n, superAdmin, user1, user2

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
      superAdmin = await collections.users.save({
        displayName: 'Super Admin',
        userName: 'super.admin@istio.actually.exists',
        emailValidated: true,
      })

      user1 = await collections.users.save({
        displayName: 'Test Account',
        userName: 'test.account@istio.actually.exists',
        emailValidated: true,
      })

      user2 = await collections.users.save({
        displayName: 'Real User',
        userName: 'real.user@istio.actually.exists',
        emailValidated: true,
      })

      saOrg = await collections.organizations.save({
        orgDetails: {
          en: {
            slug: 'super-admin',
            acronym: 'SA',
            name: 'Super Admin',
            zone: 'FED',
            sector: 'SA',
            country: 'Canada',
            province: 'Ontario',
            city: 'Ottawa',
          },
          fr: {
            slug: 'super-admin',
            acronym: 'SA',
            name: 'Super Admin',
            zone: 'FED',
            sector: 'SA',
            country: 'Canada',
            province: 'Ontario',
            city: 'Ottawa',
          },
        },
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
          _from: saOrg._id,
          _to: superAdmin._id,
          permission: 'super_admin',
        })
        await collections.affiliations.save({
          _from: orgOne._id,
          _to: user1._id,
          permission: 'user',
        })
        await collections.affiliations.save({
          _from: orgTwo._id,
          _to: user1._id,
          permission: 'user',
        })
        await collections.affiliations.save({
          _from: orgTwo._id,
          _to: user2._id,
          permission: 'admin',
        })
      })
      describe('given successful retrieval of domains', () => {
        describe('super admin queries for their users', () => {
          describe('in english', () => {
            it('returns users with affiliations', async () => {
              const response = await graphql({
                schema,
                source: `
                  query {
                    findMyUsers(first: 10) {
                      edges {
                        cursor
                        node {
                          id
                          userName
                          displayName
                          emailValidated
                        }
                      }
                      pageInfo {
                        hasNextPage
                        endCursor
                        hasPreviousPage
                        startCursor
                      }
                    }
                  }
                `,
                rootValue: null,
                contextValue: {
                  i18n,
                  userKey: superAdmin._key,
                  auth: {
                    checkSuperAdmin: checkSuperAdmin({
                      i18n,
                      userKey: superAdmin._key,
                      query,
                    }),
                    userRequired: userRequired({
                      i18n,
                      userKey: superAdmin._key,
                      loadUserByKey: loadUserByKey({
                        query,
                        userKey: superAdmin._key,
                        i18n,
                      }),
                    }),
                    verifiedRequired: verifiedRequired({}),
                    superAdminRequired: superAdminRequired({}),
                  },
                  loaders: {
                    loadUserConnectionsByUserId: loadUserConnectionsByUserId({
                      query,
                      userKey: superAdmin._key,
                      cleanseInput,
                      auth: { loginRequired: true },
                      language: 'en',
                    }),
                  },
                },
              })

              const expectedResponse = {
                data: {
                  findMyUsers: {
                    edges: [
                      {
                        cursor: toGlobalId('user', superAdmin._key),
                        node: {
                          id: toGlobalId('user', superAdmin._key),
                          displayName: 'Super Admin',
                          userName: 'super.admin@istio.actually.exists',
                          emailValidated: true,
                        },
                      },
                      {
                        cursor: toGlobalId('user', user1._key),
                        node: {
                          id: toGlobalId('user', user1._key),
                          displayName: 'Test Account',
                          userName: 'test.account@istio.actually.exists',
                          emailValidated: true,
                        },
                      },
                      {
                        cursor: toGlobalId('user', user2._key),
                        node: {
                          id: toGlobalId('user', user2._key),
                          displayName: 'Real User',
                          userName: 'real.user@istio.actually.exists',
                          emailValidated: true,
                        },
                      },
                    ],
                    pageInfo: {
                      endCursor: toGlobalId('user', user2._key),
                      hasNextPage: false,
                      hasPreviousPage: false,
                      startCursor: toGlobalId('user', superAdmin._key),
                    },
                  },
                },
              }
              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([`User: ${superAdmin._key} successfully retrieved their users.`])
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
                  findMyUsers(first: 10) {
                    edges {
                      cursor
                      node {
                        id
                        userName
                        displayName
                        emailValidated
                      }
                    }
                    pageInfo {
                      hasNextPage
                      endCursor
                      hasPreviousPage
                      startCursor
                    }
                  }
                }
              `,
              rootValue: null,
              contextValue: {
                i18n,
                userKey: superAdmin._key,
                auth: {
                  checkSuperAdmin: jest.fn(),
                  userRequired: jest.fn().mockReturnValue({}),
                  verifiedRequired: jest.fn(),
                  superAdminRequired: jest.fn(),
                },
                loaders: {
                  loadUserConnectionsByUserId: loadUserConnectionsByUserId({
                    query: mockedQuery,
                    userKey: superAdmin._key,
                    cleanseInput,
                    auth: { loginRequired: true },
                    language: 'en',
                    i18n,
                  }),
                },
              },
            })

            const error = [new GraphQLError('Unable to query user(s). Please try again.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Database error occurred while user: ${superAdmin._key} was trying to query users in loadUserConnectionsByUserId, error: Error: Database error occurred.`,
            ])
          })
        })
      })
    })
  })
})
