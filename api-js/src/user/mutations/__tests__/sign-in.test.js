import { ensure, dbNameFromFile } from 'arango-tools'
import bcrypt from 'bcryptjs'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { databaseOptions } from '../../../../database-options'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { cleanseInput } from '../../../validators'
import { loadUserByUserName } from '../../loaders'

const { SIGN_IN_KEY } = process.env
const { DB_PASS: rootPass, DB_URL: url } = process.env

const mockNotify = jest.fn()

describe('authenticate user account', () => {
  let query, drop, truncate, schema, i18n, tokenize, collections, transaction

  beforeAll(async () => {
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
    tokenize = jest.fn().mockReturnValue('token')
  })

  const consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  const mockedError = (output) => consoleOutput.push(output)

  beforeEach(async () => {
    console.info = mockedInfo
    console.warn = mockedWarn
    console.error = mockedError
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
    describe('given successful sign in', () => {
      describe('user has send method set to phone', () => {
        it('returns sendMethod message and authentication token', async () => {
          let cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN MERGE({ id: user._key, _type: 'user' }, user)
          `
          let user = await cursor.next()

          await query`
            FOR user IN users
              UPDATE ${user._key} WITH { tfaSendMethod: 'phone' } IN users
          `

          const response = await graphql(
            schema,
            `
              mutation {
                signIn(
                  input: {
                    userName: "test.account@istio.actually.exists"
                    password: "testpassword123"
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
                sendAuthTextMsg: mockNotify,
              },
            },
          )

          const expectedResponse = {
            data: {
              signIn: {
                result: {
                  sendMethod: 'text',
                  authenticateToken: 'token',
                },
              },
            },
          }

          cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN MERGE({ id: user._key, _type: 'user' }, user)
          `
          user = await cursor.next()

          expect(response).toEqual(expectedResponse)
          expect(mockNotify).toHaveBeenCalledWith({ user })
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully signed in, and sent auth msg.`,
          ])
        })
      })
      describe('user has send method set to email', () => {
        it('returns sendMethod message and authentication token', async () => {
          let cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN MERGE({ id: user._key, _type: 'user' }, user)
          `
          let user = await cursor.next()

          await query`
            FOR user IN users
              UPDATE ${user._key} WITH { tfaSendMethod: 'email' } IN users
          `

          const response = await graphql(
            schema,
            `
              mutation {
                signIn(
                  input: {
                    userName: "test.account@istio.actually.exists"
                    password: "testpassword123"
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
                sendAuthEmail: mockNotify,
              },
            },
          )

          const expectedResponse = {
            data: {
              signIn: {
                result: {
                  sendMethod: 'email',
                  authenticateToken: 'token',
                },
              },
            },
          }

          cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN MERGE({ id: user._key, _type: 'user' }, user)
          `
          user = await cursor.next()

          expect(response).toEqual(expectedResponse)
          expect(mockNotify).toHaveBeenCalledWith({ user })
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully signed in, and sent auth msg.`,
          ])
        })
      })
      describe('user has send method set to none', () => {
        it('returns an auth result with an auth token', async () => {
          let cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN MERGE({ id: user._key }, user)
          `
          let user = await cursor.next()

          await query`
            FOR user IN users
              UPDATE ${user._key} WITH { tfaSendMethod: 'none' } IN users
          `

          const response = await graphql(
            schema,
            `
              mutation {
                signIn(
                  input: {
                    userName: "test.account@istio.actually.exists"
                    password: "testpassword123"
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
                sendAuthEmail: mockNotify,
              },
            },
          )

          const expectedResponse = {
            data: {
              signIn: {
                result: {
                  authToken: 'token',
                },
              },
            },
          }

          cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN MERGE({ id: user._key }, user)
          `
          user = await cursor.next()

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully signed in, and sent auth msg.`,
          ])
        })
      })
    })
    describe('after one unsuccessful sign in, user enters correct details', () => {
      it('resets the failed login attempt counter', async () => {
        let cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN MERGE({ id: user._key }, user)
          `
        let user = await cursor.next()

        await query`
            FOR user IN users
              UPDATE ${user._key} WITH { phoneValidated: false, failedLoginAttempts: 5 } IN users
          `

        await graphql(
          schema,
          `
            mutation {
              signIn(
                input: {
                  userName: "test.account@istio.actually.exists"
                  password: "testpassword123"
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
              sendAuthEmail: mockNotify,
            },
          },
        )

        cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN MERGE({ id: user._key }, user)
          `
        user = await cursor.next()

        expect(user.failedLoginAttempts).toEqual(0)
      })
    })
    describe('given unsuccessful sign in', () => {
      describe('user cannot be found in database', () => {
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                signIn(
                  input: {
                    userName: "test.account@istio.does.not.actually.exists"
                    password: "testpassword123"
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
                    ... on SignInError {
                      code
                      description
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

          const error = {
            data: {
              signIn: {
                result: {
                  code: 400,
                  description:
                    'Incorrect username or password. Please try again.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: test.account@istio.does.not.actually.exists attempted to sign in, no account is associated with this email.`,
          ])
        })
      })
      describe('login credentials are invalid', () => {
        it('returns an error message', async () => {
          const cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN MERGE({ id: user._key }, user)
          `
          const user = await cursor.next()

          await query`
            FOR user IN users
              UPDATE ${user._key} WITH { phoneValidated: false } IN users
          `

          const response = await graphql(
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
                    ... on SignInError {
                      code
                      description
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

          const error = {
            data: {
              signIn: {
                result: {
                  code: 400,
                  description:
                    'Incorrect username or password. Please try again.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User attempted to authenticate: ${user._key} with invalid credentials.`,
          ])
        })
        it('increases the failed attempt counter', async () => {
          let cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN MERGE({ id: user._key }, user)
          `
          let user = await cursor.next()

          await query`
            FOR user IN users
              UPDATE ${user._key} WITH { phoneValidated: false } IN users
          `

          await graphql(
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
                    ... on SignInError {
                      code
                      description
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

          cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN MERGE({ id: user._key }, user)
          `
          user = await cursor.next()

          expect(user.failedLoginAttempts).toEqual(1)
        })
      })
      describe('user has reached maximum amount of login attempts', () => {
        it('returns an error message', async () => {
          const cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN MERGE({ id: user._key }, user)
          `
          const user = await cursor.next()

          await query`
            FOR user IN users
              UPDATE ${user._key} WITH { failedLoginAttempts: 15 } IN users
          `

          const response = await graphql(
            schema,
            `
              mutation {
                signIn(
                  input: {
                    userName: "test.account@istio.actually.exists"
                    password: "testpassword123"
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
                    ... on SignInError {
                      code
                      description
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
          const error = {
            data: {
              signIn: {
                result: {
                  code: 401,
                  description:
                    'Too many failed login attempts, please reset your password, and try again.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} tried to sign in, but has too many login attempts.`,
          ])
        })
      })
      describe('database error occurs when incrementing failed login attempts', () => {
        it('returns an error message', async () => {
          const cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN MERGE({ id: user._key }, user)
          `
          const user = await cursor.next()

          const userNameLoader = loadUserByUserName({ query })

          const mockedQuery = jest
            .fn()
            .mockRejectedValue(new Error('Database error occurred.'))

          const response = await graphql(
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
                    ... on SignInError {
                      code
                      description
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
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadUserByUserName: userNameLoader,
              },
              notify: {
                sendAuthEmail: mockNotify,
              },
            },
          )
          const error = [
            new GraphQLError('Unable to sign in, please try again.'),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Database error ocurred when incrementing user: ${user._key} failed login attempts: Error: Database error occurred.`,
          ])
        })
      })
      describe('database error occurs when failed logins are being reset', () => {
        it('returns an error message', async () => {
          const cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN MERGE({ id: user._key }, user)
          `
          const user = await cursor.next()

          await query`
            FOR user IN users
              UPDATE ${user._key} WITH { phoneValidated: false } IN users
          `

          const userNameLoader = loadUserByUserName({ query })

          const mockedQuery = jest
            .fn()
            .mockRejectedValue(new Error('Database error occurred.'))

          const response = await graphql(
            schema,
            `
              mutation {
                signIn(
                  input: {
                    userName: "test.account@istio.actually.exists"
                    password: "testpassword123"
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
                    ... on SignInError {
                      code
                      description
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
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadUserByUserName: userNameLoader,
              },
              notify: {
                sendAuthEmail: mockNotify,
              },
            },
          )

          const error = [
            new GraphQLError('Unable to sign in, please try again.'),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Database error ocurred when resetting failed attempts for user: ${user._key} during authentication: Error: Database error occurred.`,
          ])
        })
      })
      describe('database error occurs when setting tfa code', () => {
        it('returns an error message', async () => {
          const cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN MERGE({ id: user._key }, user)
          `
          const user = await cursor.next()

          await query`
            FOR user IN users
              UPDATE ${user._key} WITH { tfaSendMethod: 'email' } IN users
          `

          const userNameLoader = loadUserByUserName({ query })

          const mockedQuery = jest
            .fn()
            .mockResolvedValueOnce(query)
            .mockRejectedValue(new Error('Database error occurred.'))

          const response = await graphql(
            schema,
            `
              mutation {
                signIn(
                  input: {
                    userName: "test.account@istio.actually.exists"
                    password: "testpassword123"
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
                    ... on SignInError {
                      code
                      description
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
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadUserByUserName: userNameLoader,
              },
              notify: {
                sendAuthEmail: mockNotify,
              },
            },
          )

          const error = [
            new GraphQLError('Unable to sign in, please try again.'),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Database error occurred when inserting ${user._key} TFA code: Error: Database error occurred.`,
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
    describe('given successful sign in', () => {
      describe('user has send method set to phone', () => {
        it('returns sendMethod message and authentication token', async () => {
          let cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN MERGE({ id: user._key, _type: 'user' }, user)
          `
          let user = await cursor.next()

          await query`
            FOR user IN users
              UPDATE ${user._key} WITH { tfaSendMethod: 'phone' } IN users
          `

          const response = await graphql(
            schema,
            `
              mutation {
                signIn(
                  input: {
                    userName: "test.account@istio.actually.exists"
                    password: "testpassword123"
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
                    ... on SignInError {
                      code
                      description
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
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadUserByUserName: loadUserByUserName({ query }),
              },
              notify: {
                sendAuthTextMsg: mockNotify,
              },
            },
          )

          const expectedResponse = {
            data: {
              signIn: {
                result: {
                  sendMethod: 'text',
                  authenticateToken: 'token',
                },
              },
            },
          }

          cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN MERGE({ id: user._key, _type: 'user' }, user)
          `
          user = await cursor.next()

          expect(response).toEqual(expectedResponse)
          expect(mockNotify).toHaveBeenCalledWith({ user })
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully signed in, and sent auth msg.`,
          ])
        })
      })
      describe('user has send method set to email', () => {
        it('returns sendMethod message and authentication token', async () => {
          let cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN MERGE({ id: user._key, _type: 'user' }, user)
          `
          let user = await cursor.next()

          await query`
            FOR user IN users
              UPDATE ${user._key} WITH { tfaSendMethod: 'email' } IN users
          `

          const response = await graphql(
            schema,
            `
              mutation {
                signIn(
                  input: {
                    userName: "test.account@istio.actually.exists"
                    password: "testpassword123"
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
                    ... on SignInError {
                      code
                      description
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

          const expectedResponse = {
            data: {
              signIn: {
                result: {
                  sendMethod: 'email',
                  authenticateToken: 'token',
                },
              },
            },
          }

          cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN MERGE({ id: user._key, _type: 'user' }, user)
          `
          user = await cursor.next()

          expect(response).toEqual(expectedResponse)
          expect(mockNotify).toHaveBeenCalledWith({ user })
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully signed in, and sent auth msg.`,
          ])
        })
      })
      describe('user has send method set to none', () => {
        it('returns an auth result with an auth token', async () => {
          let cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN MERGE({ id: user._key }, user)
          `
          let user = await cursor.next()

          await query`
            FOR user IN users
              UPDATE ${user._key} WITH { tfaSendMethod: 'none' } IN users
          `

          const response = await graphql(
            schema,
            `
              mutation {
                signIn(
                  input: {
                    userName: "test.account@istio.actually.exists"
                    password: "testpassword123"
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
                    ... on SignInError {
                      code
                      description
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

          const expectedResponse = {
            data: {
              signIn: {
                result: {
                  authToken: 'token',
                },
              },
            },
          }

          cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN MERGE({ id: user._key }, user)
          `
          user = await cursor.next()

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully signed in, and sent auth msg.`,
          ])
        })
      })
    })
    describe('after one unsuccessful sign in, user enters correct details', () => {
      it('resets the failed login attempt counter', async () => {
        let cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN MERGE({ id: user._key }, user)
          `
        let user = await cursor.next()

        await query`
            FOR user IN users
              UPDATE ${user._key} WITH { phoneValidated: false, failedLoginAttempts: 5 } IN users
          `

        await graphql(
          schema,
          `
            mutation {
              signIn(
                input: {
                  userName: "test.account@istio.actually.exists"
                  password: "testpassword123"
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
                  ... on SignInError {
                    code
                    description
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

        cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN MERGE({ id: user._key }, user)
          `
        user = await cursor.next()

        expect(user.failedLoginAttempts).toEqual(0)
      })
    })
    describe('given unsuccessful sign in', () => {
      describe('user cannot be found in database', () => {
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                signIn(
                  input: {
                    userName: "test.account@istio.does.not.actually.exists"
                    password: "testpassword123"
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
                    ... on SignInError {
                      code
                      description
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

          const error = {
            data: {
              signIn: {
                result: {
                  code: 400,
                  description: 'todo',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: test.account@istio.does.not.actually.exists attempted to sign in, no account is associated with this email.`,
          ])
        })
      })
      describe('login credentials are invalid', () => {
        it('returns an error message', async () => {
          const cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN MERGE({ id: user._key }, user)
          `
          const user = await cursor.next()

          await query`
            FOR user IN users
              UPDATE ${user._key} WITH { phoneValidated: false } IN users
          `

          const response = await graphql(
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
                    ... on SignInError {
                      code
                      description
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

          const error = {
            data: {
              signIn: {
                result: {
                  code: 400,
                  description: 'todo',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User attempted to authenticate: ${user._key} with invalid credentials.`,
          ])
        })
        it('increases the failed attempt counter', async () => {
          let cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN MERGE({ id: user._key }, user)
          `
          let user = await cursor.next()

          await query`
            FOR user IN users
              UPDATE ${user._key} WITH { phoneValidated: false } IN users
          `

          await graphql(
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
                    ... on SignInError {
                      code
                      description
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

          cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN MERGE({ id: user._key }, user)
          `
          user = await cursor.next()

          expect(user.failedLoginAttempts).toEqual(1)
        })
      })
      describe('user has reached maximum amount of login attempts', () => {
        it('returns an error message', async () => {
          const cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN MERGE({ id: user._key }, user)
          `
          const user = await cursor.next()

          await query`
            FOR user IN users
              UPDATE ${user._key} WITH { failedLoginAttempts: 15 } IN users
          `

          const response = await graphql(
            schema,
            `
              mutation {
                signIn(
                  input: {
                    userName: "test.account@istio.actually.exists"
                    password: "testpassword123"
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
                    ... on SignInError {
                      code
                      description
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

          const error = {
            data: {
              signIn: {
                result: {
                  code: 401,
                  description: 'todo',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} tried to sign in, but has too many login attempts.`,
          ])
        })
      })
      describe('database error occurs when incrementing failed login attempts', () => {
        it('returns an error message', async () => {
          const cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN MERGE({ id: user._key }, user)
          `
          const user = await cursor.next()

          const userNameLoader = loadUserByUserName({ query })

          const mockedQuery = jest
            .fn()
            .mockRejectedValue(new Error('Database error occurred.'))

          const response = await graphql(
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
                    ... on SignInError {
                      code
                      description
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
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadUserByUserName: userNameLoader,
              },
              notify: {
                sendAuthEmail: mockNotify,
              },
            },
          )
          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Database error ocurred when incrementing user: ${user._key} failed login attempts: Error: Database error occurred.`,
          ])
        })
      })
      describe('database error occurs when failed logins are being reset', () => {
        it('returns an error message', async () => {
          const cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN MERGE({ id: user._key }, user)
          `
          const user = await cursor.next()

          await query`
            FOR user IN users
              UPDATE ${user._key} WITH { phoneValidated: false } IN users
          `

          const userNameLoader = loadUserByUserName({ query })

          const mockedQuery = jest
            .fn()
            .mockRejectedValue(new Error('Database error occurred.'))

          const response = await graphql(
            schema,
            `
              mutation {
                signIn(
                  input: {
                    userName: "test.account@istio.actually.exists"
                    password: "testpassword123"
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
                    ... on SignInError {
                      code
                      description
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
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadUserByUserName: userNameLoader,
              },
              notify: {
                sendAuthEmail: mockNotify,
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Database error ocurred when resetting failed attempts for user: ${user._key} during authentication: Error: Database error occurred.`,
          ])
        })
      })
      describe('database error occurs when setting tfa code', () => {
        it('returns an error message', async () => {
          const cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN MERGE({ id: user._key }, user)
          `
          const user = await cursor.next()

          await query`
            FOR user IN users
              UPDATE ${user._key} WITH { tfaSendMethod: 'email' } IN users
          `

          const userNameLoader = loadUserByUserName({ query })

          const mockedQuery = jest
            .fn()
            .mockResolvedValueOnce(query)
            .mockRejectedValue(new Error('Database error occurred.'))

          const response = await graphql(
            schema,
            `
              mutation {
                signIn(
                  input: {
                    userName: "test.account@istio.actually.exists"
                    password: "testpassword123"
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
                    ... on SignInError {
                      code
                      description
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
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadUserByUserName: userNameLoader,
              },
              notify: {
                sendAuthEmail: mockNotify,
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Database error occurred when inserting ${user._key} TFA code: Error: Database error occurred.`,
          ])
        })
      })
    })
  })
})
