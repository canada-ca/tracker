import { ArangoTools, dbNameFromFile } from 'arango-tools'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { makeMigrations } from '../../../../migrations'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { cleanseInput } from '../../../validators'
import { tokenize, verifyToken } from '../../../auth'
import { userLoaderByKey } from '../../loaders'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('user send password reset email', () => {
  const originalInfo = console.info
  afterEach(() => (console.info = originalInfo))

  let query, drop, truncate, migrate, collections, schema, request, i18n

  beforeAll(async () => {
    ;({ migrate } = await ArangoTools({ rootPass, url }))
    ;({ query, drop, truncate, collections } = await migrate(
      makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
    ))
    schema = new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createMutationSchema(),
    })
    request = {
      protocol: 'https',
      get: (text) => text,
    }
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
    describe('given successful validation', () => {
      beforeEach(async () => {
        await collections.users.save({
          userName: 'test.account@istio.actually.exists',
          displayName: 'Test Account',
          preferredLang: 'english',
          tfaValidated: false,
          emailValidated: false,
        })
      })
      it('returns a successful status message', async () => {
        let cursor = await query`
            FOR user IN users
                FILTER user.userName == "test.account@istio.actually.exists"
                RETURN user
          `
        let user = await cursor.next()

        const token = tokenize({ parameters: { userKey: user._key } })

        const response = await graphql(
          schema,
          `
            mutation {
              verifyAccount(input: { verifyTokenString: "${token}" }) {
                status
              }
            }
          `,
          null,
          {
            i18n,
            request,
            userKey: user._key,
            query,
            auth: {
              verifyToken: verifyToken({}),
            },
            validators: {
              cleanseInput,
            },
            loaders: {
              userLoaderByKey: userLoaderByKey(query),
            },
          },
        )

        const expectedResult = {
          data: {
            verifyAccount: {
              status:
                'Successfully email verified account, and set TFA send method to email.',
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
        expect(user.emailValidated).toEqual(true)
        expect(consoleOutput).toEqual([
          `User: ${user._key} successfully email validated their account.`,
        ])
      })
    })
    describe('given an unsuccessful validation', () => {
      describe('userKey is undefined', () => {
        it('returns an error message', async () => {
          const token = tokenize({
            parameters: { userKey: 1 },
          })

          const response = await graphql(
            schema,
            `
                mutation {
                  verifyAccount(input: { verifyTokenString: "${token}" }) {
                    status
                  }
                }
              `,
            null,
            {
              i18n,
              request,
              userKey: undefined,
              query,
              auth: {
                verifyToken: verifyToken({}),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const error = [
            new GraphQLError('Unable to verify account. Please try again.'),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User attempted to verify their account, but the userKey is undefined.`,
          ])
        })
      })
      describe('user cannot be found in db', () => {
        it('returns an error message', async () => {
          const token = tokenize({
            parameters: { userKey: 1 },
          })
          const response = await graphql(
            schema,
            `
                mutation {
                  verifyAccount(input: { verifyTokenString: "${token}" }) {
                    status
                  }
                }
              `,
            null,
            {
              i18n,
              request,
              userKey: 1,
              query,
              auth: {
                verifyToken: verifyToken({}),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const error = [
            new GraphQLError('Unable to verify account. Please try again.'),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 1 attempted to verify account, however no account is associated with this id.`,
          ])
        })
      })
      describe('userKey cannot be found in token parameters', () => {
        beforeEach(async () => {
          await collections.users.save({
            userName: 'test.account@istio.actually.exists',
            displayName: 'Test Account',
            preferredLang: 'english',
            tfaValidated: false,
            emailValidated: false,
          })
        })
        it('returns an error message', async () => {
          const cursor = await query`
                FOR user IN users
                    FILTER user.userName == "test.account@istio.actually.exists"
                    RETURN user
              `
          const user = await cursor.next()

          const token = tokenize({
            parameters: {},
          })

          const response = await graphql(
            schema,
            `
                mutation {
                  verifyAccount(input: { verifyTokenString: "${token}" }) {
                    status
                  }
                }
              `,
            null,
            {
              i18n,
              request,
              userKey: user._key,
              query,
              auth: {
                verifyToken: verifyToken({}),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const error = [
            new GraphQLError(
              'Unable to verify account. Please request a new email.',
            ),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `When validating account user: ${user._key} attempted to verify account, but userKey is not located in the token parameters.`,
          ])
        })
      })
      describe('userKey in token is undefined', () => {
        beforeEach(async () => {
          await collections.users.save({
            userName: 'test.account@istio.actually.exists',
            displayName: 'Test Account',
            preferredLang: 'english',
            tfaValidated: false,
            emailValidated: false,
          })
        })
        it('returns an error message', async () => {
          const cursor = await query`
                FOR user IN users
                    FILTER user.userName == "test.account@istio.actually.exists"
                    RETURN user
              `
          const user = await cursor.next()

          const token = tokenize({
            parameters: { userKey: undefined },
          })

          const response = await graphql(
            schema,
            `
                mutation {
                  verifyAccount(input: { verifyTokenString: "${token}" }) {
                    status
                  }
                }
              `,
            null,
            {
              i18n,
              request,
              userKey: user._key,
              query,
              auth: {
                verifyToken: verifyToken({}),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const error = [
            new GraphQLError(
              'Unable to verify account. Please request a new email.',
            ),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `When validating account user: ${user._key} attempted to verify account, but userKey is not located in the token parameters.`,
          ])
        })
      })
      describe('userKey in token does not match users key in db', () => {
        beforeEach(async () => {
          await collections.users.save({
            userName: 'test.account@istio.actually.exists',
            displayName: 'Test Account',
            preferredLang: 'english',
            tfaValidated: false,
            emailValidated: false,
          })
        })
        it('returns an error message', async () => {
          const cursor = await query`
                FOR user IN users
                    FILTER user.userName == "test.account@istio.actually.exists"
                    RETURN user
              `
          const user = await cursor.next()

          const token = tokenize({
            parameters: { userKey: 1 },
          })

          const response = await graphql(
            schema,
            `
                mutation {
                  verifyAccount(input: { verifyTokenString: "${token}" }) {
                    status
                  }
                }
              `,
            null,
            {
              i18n,
              request,
              userKey: user._key,
              query,
              auth: {
                verifyToken: verifyToken({}),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const error = [
            new GraphQLError(
              'Unable to verify account. Please request a new email.',
            ),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to verify their account, but the user id's do not match.`,
          ])
        })
      })
      describe('database error occurs when upserting validation', () => {
        beforeEach(async () => {
          await collections.users.save({
            userName: 'test.account@istio.actually.exists',
            displayName: 'Test Account',
            preferredLang: 'english',
            tfaValidated: false,
            emailValidated: false,
          })
        })
        it('returns an error message', async () => {
          const cursor = await query`
                FOR user IN users
                    FILTER user.userName == "test.account@istio.actually.exists"
                    RETURN user
              `
          const user = await cursor.next()

          const token = tokenize({
            parameters: { userKey: user._key },
          })

          const loader = userLoaderByKey(query)

          const mockedQuery = jest
            .fn()
            .mockRejectedValue(new Error('Database error occurred.'))

          const response = await graphql(
            schema,
            `
                mutation {
                  verifyAccount(input: { verifyTokenString: "${token}" }) {
                    status
                  }
                }
              `,
            null,
            {
              i18n,
              request,
              userKey: user._key,
              query: mockedQuery,
              auth: {
                verifyToken: verifyToken({}),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByKey: loader,
              },
            },
          )

          const error = [
            new GraphQLError('Unable to verify account. Please try again.'),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Database error occurred when upserting email validation for user: ${user._key}: Error: Database error occurred.`,
          ])
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
    describe('given successful validation', () => {
      beforeEach(async () => {
        await collections.users.save({
          userName: 'test.account@istio.actually.exists',
          displayName: 'Test Account',
          preferredLang: 'english',
          tfaValidated: false,
          emailValidated: false,
        })
      })
      it('returns a successful status message', async () => {
        let cursor = await query`
            FOR user IN users
                FILTER user.userName == "test.account@istio.actually.exists"
                RETURN user
          `
        let user = await cursor.next()

        const token = tokenize({ parameters: { userKey: user._key } })

        const response = await graphql(
          schema,
          `
            mutation {
              verifyAccount(input: { verifyTokenString: "${token}" }) {
                status
              }
            }
          `,
          null,
          {
            i18n,
            request,
            userKey: user._key,
            query,
            auth: {
              verifyToken: verifyToken({}),
            },
            validators: {
              cleanseInput,
            },
            loaders: {
              userLoaderByKey: userLoaderByKey(query),
            },
          },
        )

        const expectedResult = {
          data: {
            verifyAccount: {
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
        expect(user.emailValidated).toEqual(true)
        expect(consoleOutput).toEqual([
          `User: ${user._key} successfully email validated their account.`,
        ])
      })
    })
    describe('given an unsuccessful validation', () => {
      describe('userKey is undefined', () => {
        it('returns an error message', async () => {
          const token = tokenize({
            parameters: { userKey: 1 },
          })

          const response = await graphql(
            schema,
            `
                mutation {
                  verifyAccount(input: { verifyTokenString: "${token}" }) {
                    status
                  }
                }
              `,
            null,
            {
              i18n,
              request,
              userKey: undefined,
              query,
              auth: {
                verifyToken: verifyToken({}),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User attempted to verify their account, but the userKey is undefined.`,
          ])
        })
      })
      describe('user cannot be found in db', () => {
        it('returns an error message', async () => {
          const token = tokenize({
            parameters: { userKey: 1 },
          })
          const response = await graphql(
            schema,
            `
                mutation {
                  verifyAccount(input: { verifyTokenString: "${token}" }) {
                    status
                  }
                }
              `,
            null,
            {
              i18n,
              request,
              userKey: 1,
              query,
              auth: {
                verifyToken: verifyToken({}),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 1 attempted to verify account, however no account is associated with this id.`,
          ])
        })
      })
      describe('userKey cannot be found in token parameters', () => {
        beforeEach(async () => {
          await collections.users.save({
            userName: 'test.account@istio.actually.exists',
            displayName: 'Test Account',
            preferredLang: 'english',
            tfaValidated: false,
            emailValidated: false,
          })
        })
        it('returns an error message', async () => {
          const cursor = await query`
                FOR user IN users
                    FILTER user.userName == "test.account@istio.actually.exists"
                    RETURN user
              `
          const user = await cursor.next()

          const token = tokenize({
            parameters: {},
          })

          const response = await graphql(
            schema,
            `
                mutation {
                  verifyAccount(input: { verifyTokenString: "${token}" }) {
                    status
                  }
                }
              `,
            null,
            {
              i18n,
              request,
              userKey: user._key,
              query,
              auth: {
                verifyToken: verifyToken({}),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `When validating account user: ${user._key} attempted to verify account, but userKey is not located in the token parameters.`,
          ])
        })
      })
      describe('userKey in token is undefined', () => {
        beforeEach(async () => {
          await collections.users.save({
            userName: 'test.account@istio.actually.exists',
            displayName: 'Test Account',
            preferredLang: 'english',
            tfaValidated: false,
            emailValidated: false,
          })
        })
        it('returns an error message', async () => {
          const cursor = await query`
                FOR user IN users
                    FILTER user.userName == "test.account@istio.actually.exists"
                    RETURN user
              `
          const user = await cursor.next()

          const token = tokenize({
            parameters: { userKey: undefined },
          })

          const response = await graphql(
            schema,
            `
                mutation {
                  verifyAccount(input: { verifyTokenString: "${token}" }) {
                    status
                  }
                }
              `,
            null,
            {
              i18n,
              request,
              userKey: user._key,
              query,
              auth: {
                verifyToken: verifyToken({}),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `When validating account user: ${user._key} attempted to verify account, but userKey is not located in the token parameters.`,
          ])
        })
      })
      describe('userKey in token does not match users key in db', () => {
        beforeEach(async () => {
          await collections.users.save({
            userName: 'test.account@istio.actually.exists',
            displayName: 'Test Account',
            preferredLang: 'english',
            tfaValidated: false,
            emailValidated: false,
          })
        })
        it('returns an error message', async () => {
          const cursor = await query`
                FOR user IN users
                    FILTER user.userName == "test.account@istio.actually.exists"
                    RETURN user
              `
          const user = await cursor.next()

          const token = tokenize({
            parameters: { userKey: 1 },
          })

          const response = await graphql(
            schema,
            `
                mutation {
                  verifyAccount(input: { verifyTokenString: "${token}" }) {
                    status
                  }
                }
              `,
            null,
            {
              i18n,
              request,
              userKey: user._key,
              query,
              auth: {
                verifyToken: verifyToken({}),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to verify their account, but the user id's do not match.`,
          ])
        })
      })
      describe('database error occurs when upserting validation', () => {
        beforeEach(async () => {
          await collections.users.save({
            userName: 'test.account@istio.actually.exists',
            displayName: 'Test Account',
            preferredLang: 'english',
            tfaValidated: false,
            emailValidated: false,
          })
        })
        it('returns an error message', async () => {
          const cursor = await query`
                FOR user IN users
                    FILTER user.userName == "test.account@istio.actually.exists"
                    RETURN user
              `
          const user = await cursor.next()

          const token = tokenize({
            parameters: { userKey: user._key },
          })

          const loader = userLoaderByKey(query)

          const mockedQuery = jest
            .fn()
            .mockRejectedValue(new Error('Database error occurred.'))

          const response = await graphql(
            schema,
            `
                mutation {
                  verifyAccount(input: { verifyTokenString: "${token}" }) {
                    status
                  }
                }
              `,
            null,
            {
              i18n,
              request,
              userKey: user._key,
              query: mockedQuery,
              auth: {
                verifyToken: verifyToken({}),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByKey: loader,
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Database error occurred when upserting email validation for user: ${user._key}: Error: Database error occurred.`,
          ])
        })
      })
    })
  })
})
