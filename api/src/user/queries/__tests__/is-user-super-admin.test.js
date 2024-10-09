import { setupI18n } from '@lingui/core'
import { dbNameFromFile } from 'arango-tools'
import { ensureDatabase as ensure } from '../../../testUtilities'
import { graphql, GraphQLError, GraphQLSchema } from 'graphql'

import { checkPermission, userRequired } from '../../../auth'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { loadUserByKey } from '../../loaders'
import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import dbschema from '../../../../database.json'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the isUserSuperAdmin query', () => {
  let query, drop, truncate, schema, collections, org, i18n, user
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
      await collections.users.save({
        userName: 'test.account@istio.actually.exists',
        displayName: 'Test Account',
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
      const userCursor = await query`
        FOR user IN users
          FILTER user.userName == "test.account@istio.actually.exists"
          RETURN user
      `
      user = await userCursor.next()
    })
    afterEach(async () => {
      await truncate()
    })
    afterAll(async () => {
      await drop()
    })
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
      it('will return true', async () => {
        const response = await graphql({
          schema,
          source: `
            query {
              isUserSuperAdmin
            }
          `,
          rootValue: null,
          contextValue: {
            userKey: user._key,
            query: query,
            auth: {
              checkPermission: checkPermission({ userKey: user._key, query }),
              userRequired: userRequired({
                userKey: user._key,
                loadUserByKey: loadUserByKey({ query }),
              }),
            },
            loaders: {
              loadUserByKey: loadUserByKey({ query }),
            },
          },
        })

        const expectedResponse = {
          data: {
            isUserSuperAdmin: true,
          },
        }
        expect(response).toEqual(expectedResponse)
      })
    })
    describe('if the user is an admin for an organization', () => {
      beforeEach(async () => {
        await query`
          INSERT {
            _from: ${org._id},
            _to: ${user._id},
            permission: "admin"
          } INTO affiliations
        `
      })
      it('will return false', async () => {
        const response = await graphql({
          schema,
          source: `
            query {
              isUserSuperAdmin
            }
          `,
          rootValue: null,
          contextValue: {
            userKey: user._key,
            query: query,
            auth: {
              checkPermission: checkPermission({ userKey: user._key, query }),
              userRequired: userRequired({
                userKey: user._key,
                loadUserByKey: loadUserByKey({ query }),
              }),
            },
            loaders: {
              loadUserByKey: loadUserByKey({ query }),
            },
          },
        })

        const expectedResponse = {
          data: {
            isUserSuperAdmin: false,
          },
        }
        expect(response).toEqual(expectedResponse)
      })
    })
    describe('if the user is only a user for their organization(s)', () => {
      beforeEach(async () => {
        await query`
          INSERT {
            _from: ${org._id},
            _to: ${user._id},
            permission: "user"
          } INTO affiliations
        `
      })
      it('will return false', async () => {
        const response = await graphql({
          schema,
          source: `
            query {
              isUserSuperAdmin
            }
          `,
          rootValue: null,
          contextValue: {
            userKey: user._key,
            query: query,
            auth: {
              checkPermission: checkPermission({ userKey: user._key, query }),
              userRequired: userRequired({
                userKey: user._key,
                loadUserByKey: loadUserByKey({ query }),
              }),
            },
            loaders: {
              loadUserByKey: loadUserByKey({ query }),
            },
          },
        })

        const expectedResponse = {
          data: {
            isUserSuperAdmin: false,
          },
        }
        expect(response).toEqual(expectedResponse)
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
      describe('database error occurs', () => {
        it('returns an error message', async () => {
          const response = await graphql({
            schema,
            source: `
              query {
                isUserSuperAdmin
              }
            `,
            rootValue: null,
            contextValue: {
              i18n,
              userKey: 123,
              query: jest.fn().mockRejectedValue(new Error('Database error occurred.')),
              auth: {
                checkPermission: jest.fn(),
                userRequired: jest.fn().mockReturnValue({
                  _id: 'users/123',
                  _key: 123,
                }),
              },
            },
          })

          const error = [new GraphQLError(`Unable to verify if user is a super admin, please try again.`)]
          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Database error occurred when user: 123 was seeing if they were a super admin, err: Error: Database error occurred.`,
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
          const response = await graphql({
            schema,
            source: `
              query {
                isUserSuperAdmin
              }
            `,
            rootValue: null,
            contextValue: {
              i18n,
              userKey: 123,
              query: jest.fn().mockRejectedValue(new Error('Database error occurred.')),
              auth: {
                checkPermission: jest.fn(),
                userRequired: jest.fn().mockReturnValue({
                  _id: 'users/123',
                  _key: 123,
                }),
              },
            },
          })

          const error = [
            new GraphQLError(
              `Impossible de vérifier si l'utilisateur est un super administrateur, veuillez réessayer.`,
            ),
          ]
          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Database error occurred when user: 123 was seeing if they were a super admin, err: Error: Database error occurred.`,
          ])
        })
      })
    })
  })
})
