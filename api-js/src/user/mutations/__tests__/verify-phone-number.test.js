import { ArangoTools, dbNameFromFile } from 'arango-tools'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { makeMigrations } from '../../../../migrations'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { userLoaderByKey } from '../../loaders'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('user send password reset email', () => {
  const originalInfo = console.info
  afterEach(() => (console.info = originalInfo))

  let query, drop, truncate, migrate, collections, schema, i18n

  beforeAll(async () => {
    ;({ migrate } = await ArangoTools({ rootPass, url }))
    ;({ query, drop, truncate, collections } = await migrate(
      makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
    ))
    schema = new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createMutationSchema(),
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
  })

  afterEach(() => {
    consoleOutput = []
  })

  afterAll(async () => {
    await drop()
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
    describe('successfully verify phone number', () => {
      it('returns a successful status message', async () => {
        await collections.users.save({
          userName: 'test.account@istio.actually.exists',
          displayName: 'Test Account',
          preferredLang: 'french',
          tfaValidated: false,
          emailValidated: false,
          tfaCode: 123456,
        })

        let cursor = await query`
          FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
        `
        let user = await cursor.next()

        const response = await graphql(
          schema,
          `
            mutation {
              verifyPhoneNumber(input: { twoFactorCode: 123456 }) {
                status
              }
            }
          `,
          null,
          {
            i18n,
            userKey: user._key,
            query,
            loaders: {
              userLoaderByKey: userLoaderByKey(query),
            },
          },
        )

        const expectedResult = {
          data: {
            verifyPhoneNumber: {
              status:
                'Successfully verified phone number, and set TFA send method to text.',
            },
          },
        }

        cursor = await query`
          FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
        `
        user = await cursor.next()

        expect(response).toEqual(expectedResult)
        expect(user.phoneValidated).toEqual(true)
        expect(consoleOutput).toEqual([
          `User: ${user._key} successfully two factor authenticated their account.`,
        ])
      })
    })
    describe('unsuccessful verifying of phone number', () => {
      describe('user id is undefined', () => {
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                verifyPhoneNumber(input: { twoFactorCode: 123456 }) {
                  status
                }
              }
            `,
            null,
            {
              i18n,
              userKey: undefined,
              query,
              loaders: {
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const error = [
            new GraphQLError('Authentication error, please sign in again.'),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User attempted to two factor authenticate, however the userKey is undefined.`,
          ])
        })
      })
      describe('the requesting user does not exist', () => {
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                verifyPhoneNumber(input: { twoFactorCode: 123456 }) {
                  status
                }
              }
            `,
            null,
            {
              i18n,
              userKey: 1,
              query,
              loaders: {
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const error = [
            new GraphQLError(
              'Unable to two factor authenticate. Please try again.',
            ),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 1 attempted to two factor authenticate, however no account is associated with that id.`,
          ])
        })
      })
      describe('the two factor code is not 6 digits long', () => {
        it('returns an error message', async () => {
          await collections.users.save({
            userName: 'test.account@istio.actually.exists',
            displayName: 'Test Account',
            preferredLang: 'french',
            tfaValidated: false,
            emailValidated: false,
            tfaCode: 123456,
          })

          const cursor = await query`
            FOR user IN users
                FILTER user.userName == "test.account@istio.actually.exists"
                RETURN user
          `
          const user = await cursor.next()

          const response = await graphql(
            schema,
            `
              mutation {
                verifyPhoneNumber(input: { twoFactorCode: 123 }) {
                  status
                }
              }
            `,
            null,
            {
              i18n,
              userKey: user._key,
              query,
              loaders: {
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const error = [
            new GraphQLError(
              'Unable to two factor authenticate. Please try again.',
            ),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to two factor authenticate, however the code they submitted does not have 6 digits.`,
          ])
        })
      })
      describe('tfa codes do not match', () => {
        it('returns an error message', async () => {
          await collections.users.save({
            userName: 'test.account@istio.actually.exists',
            displayName: 'Test Account',
            preferredLang: 'french',
            tfaValidated: false,
            emailValidated: false,
            tfaCode: 123456,
          })

          const cursor = await query`
            FOR user IN users
                FILTER user.userName == "test.account@istio.actually.exists"
                RETURN user
          `
          const user = await cursor.next()

          const response = await graphql(
            schema,
            `
              mutation {
                verifyPhoneNumber(input: { twoFactorCode: 654321 }) {
                  status
                }
              }
            `,
            null,
            {
              i18n,
              userKey: user._key,
              query,
              loaders: {
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const error = [
            new GraphQLError(
              'Unable to two factor authenticate. Please try again.',
            ),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to two factor authenticate, however the tfa codes do not match.`,
          ])
        })
      })
      describe('database error occurs on upsert', () => {
        it('returns an error message', async () => {
          await collections.users.save({
            userName: 'test.account@istio.actually.exists',
            displayName: 'Test Account',
            preferredLang: 'french',
            tfaValidated: false,
            emailValidated: false,
            tfaCode: 123456,
          })

          const cursor = await query`
            FOR user IN users
                FILTER user.userName == "test.account@istio.actually.exists"
                RETURN user
          `
          const user = await cursor.next()

          const idLoader = userLoaderByKey(query)

          const mockedQuery = jest
            .fn()
            .mockRejectedValue(new Error('Database error occurred.'))

          const response = await graphql(
            schema,
            `
              mutation {
                verifyPhoneNumber(input: { twoFactorCode: 123456 }) {
                  status
                }
              }
            `,
            null,
            {
              i18n,
              userKey: user._key,
              query: mockedQuery,
              loaders: {
                userLoaderByKey: idLoader,
              },
            },
          )

          const error = [
            new GraphQLError(
              'Unable to two factor authenticate. Please try again.',
            ),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Database error occurred when upserting the tfaValidate field for ${user._key}: Error: Database error occurred.`,
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
    describe('successfully verify phone number', () => {
      it('returns a successful status message', async () => {
        await collections.users.save({
          userName: 'test.account@istio.actually.exists',
          displayName: 'Test Account',
          preferredLang: 'french',
          tfaValidated: false,
          emailValidated: false,
          tfaCode: 123456,
        })

        let cursor = await query`
          FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
        `
        let user = await cursor.next()

        const response = await graphql(
          schema,
          `
            mutation {
              verifyPhoneNumber(input: { twoFactorCode: 123456 }) {
                status
              }
            }
          `,
          null,
          {
            i18n,
            userKey: user._key,
            query,
            loaders: {
              userLoaderByKey: userLoaderByKey(query),
            },
          },
        )

        const expectedResult = {
          data: {
            verifyPhoneNumber: {
              status: 'todo',
            },
          },
        }

        cursor = await query`
          FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
        `
        user = await cursor.next()

        expect(response).toEqual(expectedResult)
        expect(user.phoneValidated).toEqual(true)
        expect(consoleOutput).toEqual([
          `User: ${user._key} successfully two factor authenticated their account.`,
        ])
      })
    })
    describe('unsuccessful verifying of phone number', () => {
      describe('user id is undefined', () => {
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                verifyPhoneNumber(input: { twoFactorCode: 123456 }) {
                  status
                }
              }
            `,
            null,
            {
              i18n,
              userKey: undefined,
              query,
              loaders: {
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User attempted to two factor authenticate, however the userKey is undefined.`,
          ])
        })
      })
      describe('the requesting user does not exist', () => {
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                verifyPhoneNumber(input: { twoFactorCode: 123456 }) {
                  status
                }
              }
            `,
            null,
            {
              i18n,
              userKey: 1,
              query,
              loaders: {
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 1 attempted to two factor authenticate, however no account is associated with that id.`,
          ])
        })
      })
      describe('the two factor code is not 6 digits long', () => {
        it('returns an error message', async () => {
          await collections.users.save({
            userName: 'test.account@istio.actually.exists',
            displayName: 'Test Account',
            preferredLang: 'french',
            tfaValidated: false,
            emailValidated: false,
            tfaCode: 123456,
          })

          const cursor = await query`
            FOR user IN users
                FILTER user.userName == "test.account@istio.actually.exists"
                RETURN user
          `
          const user = await cursor.next()

          const response = await graphql(
            schema,
            `
              mutation {
                verifyPhoneNumber(input: { twoFactorCode: 123 }) {
                  status
                }
              }
            `,
            null,
            {
              i18n,
              userKey: user._key,
              query,
              loaders: {
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to two factor authenticate, however the code they submitted does not have 6 digits.`,
          ])
        })
      })
      describe('tfa codes do not match', () => {
        it('returns an error message', async () => {
          await collections.users.save({
            userName: 'test.account@istio.actually.exists',
            displayName: 'Test Account',
            preferredLang: 'french',
            tfaValidated: false,
            emailValidated: false,
            tfaCode: 123456,
          })

          const cursor = await query`
            FOR user IN users
                FILTER user.userName == "test.account@istio.actually.exists"
                RETURN user
          `
          const user = await cursor.next()

          const response = await graphql(
            schema,
            `
              mutation {
                verifyPhoneNumber(input: { twoFactorCode: 654321 }) {
                  status
                }
              }
            `,
            null,
            {
              i18n,
              userKey: user._key,
              query,
              loaders: {
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to two factor authenticate, however the tfa codes do not match.`,
          ])
        })
      })
      describe('database error occurs on upsert', () => {
        it('returns an error message', async () => {
          await collections.users.save({
            userName: 'test.account@istio.actually.exists',
            displayName: 'Test Account',
            preferredLang: 'french',
            tfaValidated: false,
            emailValidated: false,
            tfaCode: 123456,
          })

          const cursor = await query`
            FOR user IN users
                FILTER user.userName == "test.account@istio.actually.exists"
                RETURN user
          `
          const user = await cursor.next()

          const idLoader = userLoaderByKey(query)

          const mockedQuery = jest
            .fn()
            .mockRejectedValue(new Error('Database error occurred.'))

          const response = await graphql(
            schema,
            `
              mutation {
                verifyPhoneNumber(input: { twoFactorCode: 123456 }) {
                  status
                }
              }
            `,
            null,
            {
              i18n,
              userKey: user._key,
              query: mockedQuery,
              loaders: {
                userLoaderByKey: idLoader,
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Database error occurred when upserting the tfaValidate field for ${user._key}: Error: Database error occurred.`,
          ])
        })
      })
    })
  })
})
