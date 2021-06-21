import { ensure, dbNameFromFile } from 'arango-tools'
import bcrypt from 'bcryptjs'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { setupI18n } from '@lingui/core'
import { v4 as uuidv4 } from 'uuid'
import jwt from 'jsonwebtoken'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { databaseOptions } from '../../../../database-options'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { cleanseInput } from '../../../validators'
import { tokenize, verifyToken } from '../../../auth'
import { loadUserByUserName, loadUserByKey } from '../../loaders'

const { DB_PASS: rootPass, DB_URL: url } = process.env

const mockNotify = jest.fn()

describe('reset users password', () => {
  let query, drop, truncate, schema, i18n, collections, transaction

  const consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  const mockedError = (output) => consoleOutput.push(output)
  beforeAll(async () => {
    console.info = mockedInfo
    console.warn = mockedWarn
    console.error = mockedError
    // Create GQL Schema
    schema = new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createMutationSchema(),
    })
    // Generate DB Items
    ;({ query, drop, truncate, collections, transaction } = await ensure({
      type: 'database',
      name: dbNameFromFile(__filename),
      url,
      rootPassword: rootPass,
      options: databaseOptions({ rootPass }),
    }))
  })

  beforeEach(async () => {
    await graphql(
      schema,
      `
        mutation {
          signUp(
            input: {
              displayName: "Test Account"
              userName: "test.account@istio.actually.exists"
              password: "testpassword123"
              confirmPassword: "testpassword123"
              preferredLang: FRENCH
            }
          ) {
            result {
              ... on AuthResult {
                user {
                  id
                }
              }
            }
          }
        }
      `,
      null,
      {
        query,
        collections,
        transaction,
        jwt,
        uuidv4,
        auth: {
          bcrypt,
          tokenize,
        },
        validators: {
          cleanseInput,
        },
        loaders: {
          loadUserByUserName: loadUserByUserName({ query }),
        },
        notify: {
          sendVerificationEmail: jest.fn(),
        },
        request: {
          protocol: 'https',
          get: (text) => text,
        },
      },
    )
    consoleOutput.length = 0
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
    describe('user successfully resets their password', () => {
      it('returns a successful status message', async () => {
        const userCursor = await query`
          FOR user IN users
            FILTER user.userName == "test.account@istio.actually.exists"
            RETURN user
        `
        const user = await userCursor.next()

        const resetToken = tokenize({
          parameters: { userKey: user._key, currentPassword: user.password },
        })

        const response = await graphql(
          schema,
          `
            mutation {
              resetPassword (
                input: {
                  password: "newpassword123"
                  confirmPassword: "newpassword123"
                  resetToken: "${resetToken}"
                }
              ) {
                result {
                  ... on ResetPasswordError {
                    code
                    description
                  }
                  ... on ResetPasswordResult {
                    status
                  }
                }
              }
            }
          `,
          null,
          {
            i18n,
            query,
            auth: {
              bcrypt,
              tokenize,
              verifyToken: verifyToken({}),
            },
            validators: {
              cleanseInput,
            },
            loaders: {
              loadUserByUserName: loadUserByUserName({ query }),
              loadUserByKey: loadUserByKey({ query }),
            },
          },
        )

        const expectedResponse = {
          data: {
            resetPassword: {
              result: {
                status: 'Password was successfully reset.',
              },
            },
          },
        }

        expect(response).toEqual(expectedResponse)
        expect(consoleOutput).toEqual([
          `User: ${user._key} successfully reset their password.`,
        ])

        consoleOutput.length = 0

        const testSignIn = await graphql(
          schema,
          `
            mutation {
              signIn(
                input: {
                  userName: "test.account@istio.actually.exists"
                  password: "newpassword123"
                }
              ) {
                result {
                  ... on TFASignInResult {
                    authenticateToken
                    sendMethod
                  }
                  ... on AuthResult {
                    authToken
                  }
                }
              }
            }
          `,
          null,
          {
            i18n,
            query,
            jwt,
            uuidv4,
            auth: {
              bcrypt,
              tokenize: jest.fn().mockReturnValue('token'),
            },
            validators: {
              cleanseInput,
            },
            loaders: {
              loadUserByUserName: loadUserByUserName({ query }),
            },
            notify: {
              sendAuthEmail: mockNotify,
            },
          },
        )

        const expectedTestSignIn = {
          data: {
            signIn: {
              result: {
                authToken: 'token',
              },
            },
          },
        }

        expect(testSignIn).toEqual(expectedTestSignIn)
        expect(consoleOutput).toEqual([
          `User: ${user._key} successfully signed in, and sent auth msg.`,
        ])
      })
      it('resets failed login attempts', async () => {
        const userCursor = await query`
          FOR user IN users
            FILTER user.userName == "test.account@istio.actually.exists"
            UPDATE user._key WITH { failedLoginAttempts: 5 } IN users
            RETURN user
        `
        const user = await userCursor.next()

        const resetToken = tokenize({
          parameters: { userKey: user._key, currentPassword: user.password },
        })

        await graphql(
          schema,
          `
            mutation {
              resetPassword (
                input: {
                  password: "newpassword123"
                  confirmPassword: "newpassword123"
                  resetToken: "${resetToken}"
                }
              ) {
                result {
                  ... on ResetPasswordError {
                    code
                    description
                  }
                  ... on ResetPasswordResult {
                    status
                  }
                }
              }
            }
          `,
          null,
          {
            i18n,
            query,
            auth: {
              bcrypt,
              tokenize,
              verifyToken: verifyToken({}),
            },
            validators: {
              cleanseInput,
            },
            loaders: {
              loadUserByUserName: loadUserByUserName({ query }),
              loadUserByKey: loadUserByKey({ query }),
            },
          },
        )

        const checkCursor = await query`
          FOR user IN users
            FILTER user.userName == "test.account@istio.actually.exists"
            RETURN user
        `
        const checkUser = await checkCursor.next()

        expect(checkUser.failedLoginAttempts).toEqual(0)
      })
    })
    describe('user does not successfully reset their password', () => {
      describe('userKey cannot be found in token parameters', () => {
        it('returns an error message', async () => {
          const resetToken = tokenize({
            parameters: {},
          })

          const response = await graphql(
            schema,
            `
            mutation {
              resetPassword (
                input: {
                  password: "newpassword123"
                  confirmPassword: "newpassword123"
                  resetToken: "${resetToken}"
                }
              ) {
                result {
                  ... on ResetPasswordError {
                    code
                    description
                  }
                  ... on ResetPasswordResult {
                    status
                  }
                }
              }
            }
              `,
            null,
            {
              i18n,
              query,
              auth: {
                bcrypt,
                tokenize,
                verifyToken: verifyToken({}),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadUserByUserName: loadUserByUserName({ query }),
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const error = {
            data: {
              resetPassword: {
                result: {
                  code: 400,
                  description:
                    'Incorrect token value. Please request a new email.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `When resetting password user attempted to verify account, but userKey is not located in the token parameters.`,
          ])
        })
      })
      describe('userKey in token is undefined', () => {
        it('returns an error message', async () => {
          const resetToken = tokenize({
            parameters: { userKey: undefined },
          })

          const response = await graphql(
            schema,
            `
            mutation {
              resetPassword (
                input: {
                  password: "newpassword123"
                  confirmPassword: "newpassword123"
                  resetToken: "${resetToken}"
                }
              ) {
                result {
                  ... on ResetPasswordError {
                    code
                    description
                  }
                  ... on ResetPasswordResult {
                    status
                  }
                }
              }
            }
              `,
            null,
            {
              i18n,
              query,
              auth: {
                bcrypt,
                tokenize,
                verifyToken: verifyToken({}),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadUserByUserName: loadUserByUserName({ query }),
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const error = {
            data: {
              resetPassword: {
                result: {
                  code: 400,
                  description:
                    'Incorrect token value. Please request a new email.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `When resetting password user attempted to verify account, but userKey is not located in the token parameters.`,
          ])
        })
      })
      describe('user cannot be found', () => {
        it('returns an error message', async () => {
          const resetToken = tokenize({
            parameters: { userKey: 1, currentPassword: 'secretPassword' },
          })

          const response = await graphql(
            schema,
            `
            mutation {
              resetPassword (
                input: {
                  password: "newpassword123"
                  confirmPassword: "newpassword123"
                  resetToken: "${resetToken}"
                }
              ) {
                result {
                  ... on ResetPasswordError {
                    code
                    description
                  }
                  ... on ResetPasswordResult {
                    status
                  }
                }
              }
            }
          `,
            null,
            {
              i18n,
              query,
              auth: {
                bcrypt,
                tokenize,
                verifyToken: verifyToken({}),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadUserByUserName: loadUserByUserName({ query }),
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const error = {
            data: {
              resetPassword: {
                result: {
                  code: 400,
                  description: 'Unable to reset password. Please try again.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `A user attempted to reset the password for 1, however there is no associated account.`,
          ])
        })
      })
      describe('password in token does not match users current password', () => {
        it('returns an error message', async () => {
          const userCursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
          const user = await userCursor.next()

          const resetToken = tokenize({
            parameters: {
              userKey: user._key,
              currentPassword: 'secretPassword',
            },
          })

          const response = await graphql(
            schema,
            `
            mutation {
              resetPassword (
                input: {
                  password: "newpassword123"
                  confirmPassword: "newpassword123"
                  resetToken: "${resetToken}"
                }
              ) {
                result {
                  ... on ResetPasswordError {
                    code
                    description
                  }
                  ... on ResetPasswordResult {
                    status
                  }
                }
              }
            }
          `,
            null,
            {
              i18n,
              query,
              auth: {
                bcrypt,
                tokenize,
                verifyToken: verifyToken({}),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadUserByUserName: loadUserByUserName({ query }),
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const error = {
            data: {
              resetPassword: {
                result: {
                  code: 400,
                  description:
                    'Unable to reset password. Please request a new email.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to reset password, however the current password does not match the current hashed password in the db.`,
          ])
        })
      })
      describe('new passwords do not match', () => {
        it('returns an error message', async () => {
          const userCursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
          const user = await userCursor.next()

          const resetToken = tokenize({
            parameters: { userKey: user._key, currentPassword: user.password },
          })

          const response = await graphql(
            schema,
            `
            mutation {
              resetPassword (
                input: {
                  password: "newpassword123"
                  confirmPassword: "testpassword123"
                  resetToken: "${resetToken}"
                }
              ) {
                result {
                  ... on ResetPasswordError {
                    code
                    description
                  }
                  ... on ResetPasswordResult {
                    status
                  }
                }
              }
            }
          `,
            null,
            {
              i18n,
              query,
              auth: {
                bcrypt,
                tokenize,
                verifyToken: verifyToken({}),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadUserByUserName: loadUserByUserName({ query }),
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const error = {
            data: {
              resetPassword: {
                result: {
                  code: 400,
                  description: 'New passwords do not match.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to reset their password, however the submitted passwords do not match.`,
          ])
        })
      })
      describe('new passwords do not meet GoC requirements', () => {
        it('returns an error message', async () => {
          const userCursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
          const user = await userCursor.next()

          const resetToken = tokenize({
            parameters: { userKey: user._key, currentPassword: user.password },
          })

          const response = await graphql(
            schema,
            `
            mutation {
              resetPassword (
                input: {
                  password: "password"
                  confirmPassword: "password"
                  resetToken: "${resetToken}"
                }
              ) {
                result {
                  ... on ResetPasswordError {
                    code
                    description
                  }
                  ... on ResetPasswordResult {
                    status
                  }
                }
              }
            }
          `,
            null,
            {
              i18n,
              query,
              auth: {
                bcrypt,
                tokenize,
                verifyToken: verifyToken({}),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadUserByUserName: loadUserByUserName({ query }),
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const error = {
            data: {
              resetPassword: {
                result: {
                  code: 400,
                  description: 'Password does not meet requirements.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to reset their password, however the submitted password is not long enough.`,
          ])
        })
      })
      describe('Token is not valid', () => {
        it('returns an error message', async () => {
          const userCursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
          const user = await userCursor.next()

          const userNameLoader = loadUserByUserName({ query })
          const userKeyLoader = loadUserByKey({ query })

          const resetToken = tokenize({
            parameters: { userKey: user._key, currentPassword: user.password },
            secret: 'superSecret',
          })

          const response = await graphql(
            schema,
            `
            mutation {
              resetPassword (
                input: {
                  password: "testpassword123"
                  confirmPassword: "testpassword123"
                  resetToken: "${resetToken}"
                }
              ) {
                result {
                  ... on ResetPasswordError {
                    code
                    description
                  }
                  ... on ResetPasswordResult {
                    status
                  }
                }
              }
            }
          `,
            null,
            {
              i18n,
              query,
              auth: {
                bcrypt,
                tokenize,
                verifyToken: verifyToken({ i18n }),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadUserByUserName: userNameLoader,
                loadUserByKey: userKeyLoader,
              },
            },
          )

          const error = [new GraphQLError('Invalid token, please sign in.')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `JWT was attempted to be verified but secret was incorrect.`,
          ])
        })
      })
      describe('database error occurs when updating user password', () => {
        it('returns an error message', async () => {
          const userCursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
          const user = await userCursor.next()

          const userNameLoader = loadUserByUserName({ query })
          const userKeyLoader = loadUserByKey({ query })

          const resetToken = tokenize({
            parameters: { userKey: user._key, currentPassword: user.password },
          })

          const mockedQuery = jest
            .fn()
            .mockRejectedValue(new Error('Database error occurred.'))

          const response = await graphql(
            schema,
            `
            mutation {
              resetPassword (
                input: {
                  password: "testpassword123"
                  confirmPassword: "testpassword123"
                  resetToken: "${resetToken}"
                }
              ) {
                result {
                  ... on ResetPasswordError {
                    code
                    description
                  }
                  ... on ResetPasswordResult {
                    status
                  }
                }
              }
            }
          `,
            null,
            {
              i18n,
              query: mockedQuery,
              auth: {
                bcrypt,
                tokenize,
                verifyToken: verifyToken({}),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadUserByUserName: userNameLoader,
                loadUserByKey: userKeyLoader,
              },
            },
          )

          const error = [
            new GraphQLError('Unable to reset password. Please try again.'),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Database error ocurred when user: ${user._key} attempted to reset their password: Error: Database error occurred.`,
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
    describe('user successfully resets their password', () => {
      it('returns a successful status message', async () => {
        const userCursor = await query`
          FOR user IN users
            FILTER user.userName == "test.account@istio.actually.exists"
            RETURN user
        `
        const user = await userCursor.next()

        const resetToken = tokenize({
          parameters: { userKey: user._key, currentPassword: user.password },
        })

        const response = await graphql(
          schema,
          `
            mutation {
              resetPassword (
                input: {
                  password: "newpassword123"
                  confirmPassword: "newpassword123"
                  resetToken: "${resetToken}"
                }
              ) {
                result {
                  ... on ResetPasswordError {
                    code
                    description
                  }
                  ... on ResetPasswordResult {
                    status
                  }
                }
              }
            }
          `,
          null,
          {
            i18n,
            query,
            auth: {
              bcrypt,
              tokenize,
              verifyToken: verifyToken({}),
            },
            validators: {
              cleanseInput,
            },
            loaders: {
              loadUserByUserName: loadUserByUserName({ query }),
              loadUserByKey: loadUserByKey({ query }),
            },
          },
        )

        const expectedResponse = {
          data: {
            resetPassword: {
              result: {
                status: 'Le mot de passe a été réinitialisé avec succès.',
              },
            },
          },
        }

        expect(response).toEqual(expectedResponse)
        expect(consoleOutput).toEqual([
          `User: ${user._key} successfully reset their password.`,
        ])

        consoleOutput.length = 0

        const testSignIn = await graphql(
          schema,
          `
            mutation {
              signIn(
                input: {
                  userName: "test.account@istio.actually.exists"
                  password: "newpassword123"
                }
              ) {
                result {
                  ... on TFASignInResult {
                    authenticateToken
                    sendMethod
                  }
                  ... on AuthResult {
                    authToken
                  }
                }
              }
            }
          `,
          null,
          {
            i18n,
            query,
            uuidv4,
            jwt,
            auth: {
              bcrypt,
              tokenize: jest.fn().mockReturnValue('token'),
            },
            validators: {
              cleanseInput,
            },
            loaders: {
              loadUserByUserName: loadUserByUserName({ query }),
            },
            notify: {
              sendAuthEmail: mockNotify,
            },
          },
        )

        const expectedTestSignIn = {
          data: {
            signIn: {
              result: {
                authToken: 'token',
              },
            },
          },
        }

        expect(testSignIn).toEqual(expectedTestSignIn)
        expect(consoleOutput).toEqual([
          `User: ${user._key} successfully signed in, and sent auth msg.`,
        ])
      })
    })
    describe('user does not successfully reset their password', () => {
      describe('userKey cannot be found in token parameters', () => {
        it('returns an error message', async () => {
          const resetToken = tokenize({
            parameters: {},
          })

          const response = await graphql(
            schema,
            `
            mutation {
              resetPassword (
                input: {
                  password: "newpassword123"
                  confirmPassword: "newpassword123"
                  resetToken: "${resetToken}"
                }
              ) {
                result {
                  ... on ResetPasswordError {
                    code
                    description
                  }
                  ... on ResetPasswordResult {
                    status
                  }
                }
              }
            }
              `,
            null,
            {
              i18n,
              query,
              auth: {
                bcrypt,
                tokenize,
                verifyToken: verifyToken({}),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadUserByUserName: loadUserByUserName({ query }),
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const error = {
            data: {
              resetPassword: {
                result: {
                  code: 400,
                  description:
                    'La valeur du jeton est incorrecte. Veuillez demander un nouvel e-mail.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `When resetting password user attempted to verify account, but userKey is not located in the token parameters.`,
          ])
        })
      })
      describe('userKey in token is undefined', () => {
        it('returns an error message', async () => {
          const resetToken = tokenize({
            parameters: { userKey: undefined },
          })

          const response = await graphql(
            schema,
            `
            mutation {
              resetPassword (
                input: {
                  password: "newpassword123"
                  confirmPassword: "newpassword123"
                  resetToken: "${resetToken}"
                }
              ) {
                result {
                  ... on ResetPasswordError {
                    code
                    description
                  }
                  ... on ResetPasswordResult {
                    status
                  }
                }
              }
            }
              `,
            null,
            {
              i18n,
              query,
              auth: {
                bcrypt,
                tokenize,
                verifyToken: verifyToken({}),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadUserByUserName: loadUserByUserName({ query }),
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const error = {
            data: {
              resetPassword: {
                result: {
                  code: 400,
                  description:
                    'La valeur du jeton est incorrecte. Veuillez demander un nouvel e-mail.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `When resetting password user attempted to verify account, but userKey is not located in the token parameters.`,
          ])
        })
      })
      describe('user cannot be found', () => {
        it('returns an error message', async () => {
          const resetToken = tokenize({
            parameters: { userKey: 1, currentPassword: 'secretPassword' },
          })

          const response = await graphql(
            schema,
            `
            mutation {
              resetPassword (
                input: {
                  password: "newpassword123"
                  confirmPassword: "newpassword123"
                  resetToken: "${resetToken}"
                }
              ) {
                result {
                  ... on ResetPasswordError {
                    code
                    description
                  }
                  ... on ResetPasswordResult {
                    status
                  }
                }
              }
            }
          `,
            null,
            {
              i18n,
              query,
              auth: {
                bcrypt,
                tokenize,
                verifyToken: verifyToken({}),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadUserByUserName: loadUserByUserName({ query }),
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const error = {
            data: {
              resetPassword: {
                result: {
                  code: 400,
                  description:
                    'Impossible de réinitialiser le mot de passe. Veuillez réessayer.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `A user attempted to reset the password for 1, however there is no associated account.`,
          ])
        })
      })
      describe('password in token does not match users current password', () => {
        it('returns an error message', async () => {
          const userCursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
          const user = await userCursor.next()

          const resetToken = tokenize({
            parameters: {
              userKey: user._key,
              currentPassword: 'secretPassword',
            },
          })

          const response = await graphql(
            schema,
            `
            mutation {
              resetPassword (
                input: {
                  password: "newpassword123"
                  confirmPassword: "newpassword123"
                  resetToken: "${resetToken}"
                }
              ) {
                result {
                  ... on ResetPasswordError {
                    code
                    description
                  }
                  ... on ResetPasswordResult {
                    status
                  }
                }
              }
            }
          `,
            null,
            {
              i18n,
              query,
              auth: {
                bcrypt,
                tokenize,
                verifyToken: verifyToken({}),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadUserByUserName: loadUserByUserName({ query }),
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const error = {
            data: {
              resetPassword: {
                result: {
                  code: 400,
                  description:
                    'Impossible de réinitialiser le mot de passe. Veuillez demander un nouvel e-mail.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to reset password, however the current password does not match the current hashed password in the db.`,
          ])
        })
      })
      describe('new passwords do not match', () => {
        it('returns an error message', async () => {
          const userCursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
          const user = await userCursor.next()

          const resetToken = tokenize({
            parameters: { userKey: user._key, currentPassword: user.password },
          })

          const response = await graphql(
            schema,
            `
            mutation {
              resetPassword (
                input: {
                  password: "newpassword123"
                  confirmPassword: "testpassword123"
                  resetToken: "${resetToken}"
                }
              ) {
                result {
                  ... on ResetPasswordError {
                    code
                    description
                  }
                  ... on ResetPasswordResult {
                    status
                  }
                }
              }
            }
          `,
            null,
            {
              i18n,
              query,
              auth: {
                bcrypt,
                tokenize,
                verifyToken: verifyToken({}),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadUserByUserName: loadUserByUserName({ query }),
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const error = {
            data: {
              resetPassword: {
                result: {
                  code: 400,
                  description:
                    'Les nouveaux mots de passe ne correspondent pas.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to reset their password, however the submitted passwords do not match.`,
          ])
        })
      })
      describe('new passwords do not meet GoC requirements', () => {
        it('returns an error message', async () => {
          const userCursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
          const user = await userCursor.next()

          const resetToken = tokenize({
            parameters: { userKey: user._key, currentPassword: user.password },
          })

          const response = await graphql(
            schema,
            `
            mutation {
              resetPassword (
                input: {
                  password: "password"
                  confirmPassword: "password"
                  resetToken: "${resetToken}"
                }
              ) {
                result {
                  ... on ResetPasswordError {
                    code
                    description
                  }
                  ... on ResetPasswordResult {
                    status
                  }
                }
              }
            }
          `,
            null,
            {
              i18n,
              query,
              auth: {
                bcrypt,
                tokenize,
                verifyToken: verifyToken({}),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadUserByUserName: loadUserByUserName({ query }),
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const error = {
            data: {
              resetPassword: {
                result: {
                  code: 400,
                  description: 'Le mot de passe ne répond pas aux exigences.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to reset their password, however the submitted password is not long enough.`,
          ])
        })
      })
      describe('Token is not valid', () => {
        it('returns an error message', async () => {
          const userCursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
          const user = await userCursor.next()

          const userNameLoader = loadUserByUserName({ query })
          const userKeyLoader = loadUserByKey({ query })

          const resetToken = tokenize({
            parameters: { userKey: user._key, currentPassword: user.password },
            secret: 'superSecret',
          })

          const response = await graphql(
            schema,
            `
            mutation {
              resetPassword (
                input: {
                  password: "testpassword123"
                  confirmPassword: "testpassword123"
                  resetToken: "${resetToken}"
                }
              ) {
                result {
                  ... on ResetPasswordError {
                    code
                    description
                  }
                  ... on ResetPasswordResult {
                    status
                  }
                }
              }
            }
          `,
            null,
            {
              i18n,
              query,
              auth: {
                bcrypt,
                tokenize,
                verifyToken: verifyToken({ i18n }),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadUserByUserName: userNameLoader,
                loadUserByKey: userKeyLoader,
              },
            },
          )

          const error = [
            new GraphQLError('Jeton invalide, veuillez vous connecter.'),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `JWT was attempted to be verified but secret was incorrect.`,
          ])
        })
      })
      describe('database error occurs when updating user password', () => {
        it('returns an error message', async () => {
          const userCursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
          const user = await userCursor.next()

          const userNameLoader = loadUserByUserName({ query })
          const userKeyLoader = loadUserByKey({ query })

          const resetToken = tokenize({
            parameters: { userKey: user._key, currentPassword: user.password },
          })

          const mockedQuery = jest
            .fn()
            .mockRejectedValue(new Error('Database error occurred.'))

          const response = await graphql(
            schema,
            `
            mutation {
              resetPassword (
                input: {
                  password: "testpassword123"
                  confirmPassword: "testpassword123"
                  resetToken: "${resetToken}"
                }
              ) {
                result {
                  ... on ResetPasswordError {
                    code
                    description
                  }
                  ... on ResetPasswordResult {
                    status
                  }
                }
              }
            }
          `,
            null,
            {
              i18n,
              query: mockedQuery,
              auth: {
                bcrypt,
                tokenize,
                verifyToken: verifyToken({}),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadUserByUserName: userNameLoader,
                loadUserByKey: userKeyLoader,
              },
            },
          )

          const error = [
            new GraphQLError(
              'Impossible de réinitialiser le mot de passe. Veuillez réessayer.',
            ),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Database error ocurred when user: ${user._key} attempted to reset their password: Error: Database error occurred.`,
          ])
        })
      })
    })
  })
})
