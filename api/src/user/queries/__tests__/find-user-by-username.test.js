import { setupI18n } from '@lingui/core'
import { dbNameFromFile } from 'arango-tools'
import { ensureDatabase as ensure } from '../../../testUtilities'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { toGlobalId } from 'graphql-relay'

import { userRequired, checkUserIsAdminForUser } from '../../../auth'
import { createQuerySchema } from '../../../query'
import { cleanseInput } from '../../../validators'
import { createMutationSchema } from '../../../mutation'
import { loadUserByKey, loadUserByUserName } from '../../loaders'
import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import dbschema from '../../../../database.json'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the findUserByUsername query', () => {
  let query, drop, truncate, schema, collections, org, i18n, user, userTwo

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
  })
  afterEach(() => {
    consoleOutput.length = 0
  })

  describe('given a successful query', () => {
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
        userName: 'test.account@istio.actually.exists',
        displayName: 'Test Account',
        tfaValidated: false,
        emailValidated: false,
      })
      userTwo = await collections.users.save({
        userName: 'test.accounttwo@istio.actually.exists',
        displayName: 'Test Account Two',
        tfaValidated: false,
        emailValidated: false,
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
      describe('user queries for another user', () => {
        describe('if the user is a super admin for an organization', () => {
          beforeEach(async () => {
            await query`
              INSERT {
                _from: ${org._id},
                _to: ${user._id},
                permission: "super_admin"
              } INTO affiliations
            `
          })
          it('will return specified user', async () => {
            const response = await graphql({
              schema,
              source: `
                query {
                  findUserByUsername(
                    userName: "test.accounttwo@istio.actually.exists"
                  ) {
                    id
                    userName
                  }
                }
              `,
              rootValue: null,
              contextValue: {
                i18n,
                userKey: user._key,
                query: query,
                auth: {
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                  checkUserIsAdminForUser: checkUserIsAdminForUser({
                    userKey: user._key,
                    query,
                  }),
                },
                loaders: {
                  loadUserByUserName: loadUserByUserName({ query }),
                },
                validators: {
                  cleanseInput,
                },
              },
            })

            const expectedResponse = {
              data: {
                findUserByUsername: {
                  id: toGlobalId('user', userTwo._key),
                  userName: 'test.accounttwo@istio.actually.exists',
                },
              },
            }
            expect(response).toEqual(expectedResponse)
          })
        })
        describe('if the user is an admin for the same organization', () => {
          beforeEach(async () => {
            await collections.affiliations.save({
              _from: org._id,
              _to: user._id,
              permission: 'admin',
            })
            await collections.affiliations.save({
              _from: org._id,
              _to: userTwo._id,
              permission: 'user',
            })
          })
          it('will return specified user', async () => {
            const response = await graphql({
              schema,
              source: `
                query {
                  findUserByUsername(
                    userName: "test.accounttwo@istio.actually.exists"
                  ) {
                    id
                    userName
                  }
                }
              `,
              rootValue: null,
              contextValue: {
                i18n,
                userKey: user._key,
                query: query,
                auth: {
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                  checkUserIsAdminForUser: checkUserIsAdminForUser({
                    userKey: user._key,
                    query,
                  }),
                },
                loaders: {
                  loadUserByUserName: loadUserByUserName({ query }),
                },
                validators: {
                  cleanseInput,
                },
              },
            })

            const expectedResponse = {
              data: {
                findUserByUsername: {
                  id: toGlobalId('user', userTwo._key),
                  userName: 'test.accounttwo@istio.actually.exists',
                },
              },
            }
            expect(response).toEqual(expectedResponse)
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
      describe('user queries for another user', () => {
        describe('if the user is a super admin for an organization', () => {
          beforeEach(async () => {
            await query`
              INSERT {
                _from: ${org._id},
                _to: ${user._id},
                permission: "super_admin"
              } INTO affiliations
            `
          })
          it('will return specified user', async () => {
            const response = await graphql({
              schema,
              source: `
                query {
                  findUserByUsername(
                    userName: "test.accounttwo@istio.actually.exists"
                  ) {
                    id
                    userName
                  }
                }
              `,
              rootValue: null,
              contextValue: {
                i18n,
                userKey: user._key,
                query: query,
                auth: {
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                  checkUserIsAdminForUser: checkUserIsAdminForUser({
                    userKey: user._key,
                    query,
                  }),
                },
                loaders: {
                  loadUserByUserName: loadUserByUserName({ query }),
                },
                validators: {
                  cleanseInput,
                },
              },
            })

            const expectedResponse = {
              data: {
                findUserByUsername: {
                  id: toGlobalId('user', userTwo._key),
                  userName: 'test.accounttwo@istio.actually.exists',
                },
              },
            }
            expect(response).toEqual(expectedResponse)
          })
        })
        describe('if the user is an admin for the same organization', () => {
          beforeEach(async () => {
            await collections.affiliations.save({
              _from: org._id,
              _to: user._id,
              permission: 'admin',
            })
            await collections.affiliations.save({
              _from: org._id,
              _to: userTwo._id,
              permission: 'user',
            })
          })
          it('will return specified user', async () => {
            const response = await graphql({
              schema,
              source: `
                query {
                  findUserByUsername(
                    userName: "test.accounttwo@istio.actually.exists"
                  ) {
                    id
                    userName
                  }
                }
              `,
              rootValue: null,
              contextValue: {
                i18n,
                userKey: user._key,
                query: query,
                auth: {
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                  checkUserIsAdminForUser: checkUserIsAdminForUser({
                    userKey: user._key,
                    query,
                  }),
                },
                loaders: {
                  loadUserByUserName: loadUserByUserName({ query }),
                },
                validators: {
                  cleanseInput,
                },
              },
            })

            const expectedResponse = {
              data: {
                findUserByUsername: {
                  id: toGlobalId('user', userTwo._key),
                  userName: 'test.accounttwo@istio.actually.exists',
                },
              },
            }
            expect(response).toEqual(expectedResponse)
          })
        })
      })
    })
  })
  describe('given an unsuccessful query', () => {
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
      describe('if the user is an admin for a different organization', () => {
        it('will return specified user', async () => {
          const response = await graphql({
            schema,
            source: `
              query {
                findUserByUsername(
                  userName: "test.accounttwo@istio.actually.exists"
                ) {
                  id
                  userName
                }
              }
            `,
            rootValue: null,
            contextValue: {
              i18n,
              userKey: 123,
              query: query,
              auth: {
                userRequired: jest.fn(),
                checkUserIsAdminForUser: jest.fn().mockReturnValue(undefined),
              },
              loaders: {
                loadUserByUserName: {
                  load: jest.fn().mockReturnValue({
                    _key: 123,
                  }),
                },
              },
              validators: {
                cleanseInput,
              },
            },
          })
          expect(response.errors).toEqual([new GraphQLError('User could not be queried.')])
        })
      })
      describe('if the user is only a user for their organization(s)', () => {
        it('will return error', async () => {
          const response = await graphql({
            schema,
            source: `
              query {
                findUserByUsername(
                  userName: "test.accounttwo@istio.actually.exists"
                ) {
                  id
                  userName
                }
              }
            `,
            rootValue: null,
            contextValue: {
              i18n,
              userKey: 123,
              query: query,
              auth: {
                userRequired: jest.fn(),
                checkUserIsAdminForUser: jest.fn().mockReturnValue(false),
              },
              loaders: {
                loadUserByUserName: {
                  load: jest.fn().mockReturnValue({
                    _key: 123,
                  }),
                },
              },
              validators: {
                cleanseInput,
              },
            },
          })

          const error = [new GraphQLError(`User could not be queried.`)]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([`User 123 is not permitted to query users.`])
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
      describe('if the user is an admin for a different organization', () => {
        it('will return specified user', async () => {
          const response = await graphql({
            schema,
            source: `
              query {
                findUserByUsername(
                  userName: "test.accounttwo@istio.actually.exists"
                ) {
                  id
                  userName
                }
              }
            `,
            rootValue: null,
            contextValue: {
              i18n,
              userKey: 123,
              query: query,
              auth: {
                userRequired: jest.fn(),
                checkUserIsAdminForUser: jest.fn().mockReturnValue(undefined),
              },
              loaders: {
                loadUserByUserName: {
                  load: jest.fn().mockReturnValue({
                    _key: 123,
                  }),
                },
              },
              validators: {
                cleanseInput,
              },
            },
          })
          expect(response.errors).toEqual([new GraphQLError(`L'utilisateur n'a pas pu être interrogé.`)])
        })
      })
      describe('if the user is only a user for their organization(s)', () => {
        it('will return error', async () => {
          const response = await graphql({
            schema,
            source: `
              query {
                findUserByUsername(
                  userName: "test.accounttwo@istio.actually.exists"
                ) {
                  id
                  userName
                }
              }
            `,
            rootValue: null,
            contextValue: {
              i18n,
              userKey: 123,
              query: query,
              auth: {
                userRequired: jest.fn(),
                checkUserIsAdminForUser: jest.fn().mockReturnValue(false),
              },
              loaders: {
                loadUserByUserName: {
                  load: jest.fn().mockReturnValue({
                    _key: 123,
                  }),
                },
              },
              validators: {
                cleanseInput,
              },
            },
          })

          const error = [new GraphQLError(`L'utilisateur n'a pas pu être interrogé.`)]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([`User 123 is not permitted to query users.`])
        })
      })
    })
  })
})
