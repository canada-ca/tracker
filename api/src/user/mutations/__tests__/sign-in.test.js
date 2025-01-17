import { dbNameFromFile } from 'arango-tools'
import { ensureDatabase as ensure } from '../../../testUtilities'
import bcrypt from 'bcryptjs'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { setupI18n } from '@lingui/core'
import { v4 as uuidv4 } from 'uuid'
import jwt from 'jsonwebtoken'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { cleanseInput } from '../../../validators'
import { loadUserByUserName } from '../../loaders'
import dbschema from '../../../../database.json'
import { collectionNames } from '../../../collection-names'
import { tokenize } from '../../../auth'
import ms from 'ms'

const {
  DB_PASS: rootPass,
  DB_URL: url,
  REFRESH_TOKEN_EXPIRY,
  SIGN_IN_KEY,
  AUTH_TOKEN_EXPIRY,
  REFRESH_KEY,
} = process.env

const mockNotify = jest.fn()

describe('authenticate user account', () => {
  let query, drop, truncate, schema, i18n, transaction
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
  describe('given a successful login', () => {
    beforeAll(async () => {
      // Generate DB Items
      ;({ query, drop, truncate, transaction } = await ensure({
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
      await graphql({
        schema,
        source: `
          mutation {
            signUp(
              input: {
                displayName: "Test Account"
                userName: "test.account@istio.actually.exists"
                password: "testpassword123"
                confirmPassword: "testpassword123"
              }
            ) {
              result {
                ... on TFASignInResult {
                  authenticateToken
                  sendMethod
                }
              }
            }
          }
        `,
        rootValue: null,
        contextValue: {
          query,
          collections: collectionNames,
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
            ip: '127.0.0.1',
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
      describe('user has not logged in in the past 30 days', () => {
        it('returns sendMethod message and authentication token', async () => {
          let cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN MERGE({ id: user._key, _type: 'user' }, user)
          `
          let user = await cursor.next()

          await query`
            FOR user IN users
              UPDATE ${user._key} WITH { tfaSendMethod: 'not_none', lastLogin: ${new Date(
            new Date().setDate(new Date().getDate() - 30),
          ).toISOString()} } IN users
          `

          const authToken = tokenize({
            expiresIn: AUTH_TOKEN_EXPIRY,
            parameters: { userKey: user._key },
            secret: String(SIGN_IN_KEY),
          })

          const mockedTokenize = jest.fn().mockReturnValueOnce(authToken)

          const response = await graphql({
            schema,
            source: `
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
            rootValue: null,
            contextValue: {
              i18n,
              query,
              collections: collectionNames,
              transaction,
              uuidv4,
              request: { ip: '127.0.0.1' },
              auth: {
                bcrypt,
                tokenize: mockedTokenize,
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
          })

          const expectedResponse = {
            data: {
              signIn: {
                result: {
                  sendMethod: 'email',
                  authenticateToken: authToken,
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
          expect(consoleOutput).toEqual([`User: ${user._key} successfully signed in, and sent auth msg.`])
        })
      })
      describe('user has send method set to phone', () => {
        it('returns sendMethod message, authentication token and refresh token', async () => {
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

          const authToken = tokenize({
            expiresIn: AUTH_TOKEN_EXPIRY,
            parameters: { userKey: user._key },
            secret: String(SIGN_IN_KEY),
          })

          const mockedTokenize = jest.fn().mockReturnValueOnce(authToken)

          const response = await graphql({
            schema,
            source: `
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
            rootValue: null,
            contextValue: {
              i18n,
              query,
              collections: collectionNames,
              transaction,
              uuidv4,
              request: { ip: '127.0.0.1' },
              auth: {
                bcrypt,
                tokenize: mockedTokenize,
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
          })

          const expectedResponse = {
            data: {
              signIn: {
                result: {
                  sendMethod: 'text',
                  authenticateToken: authToken,
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

          expect(consoleOutput).toEqual([`User: ${user._key} successfully signed in, and sent auth msg.`])
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

          const authToken = tokenize({
            expiresIn: AUTH_TOKEN_EXPIRY,
            parameters: { userKey: user._key },
            secret: String(SIGN_IN_KEY),
          })

          const mockedTokenize = jest.fn().mockReturnValueOnce(authToken)

          const response = await graphql({
            schema,
            source: `
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
            rootValue: null,
            contextValue: {
              i18n,
              query,
              collections: collectionNames,
              transaction,
              uuidv4,
              request: { ip: '127.0.0.1' },
              auth: {
                bcrypt,
                tokenize: mockedTokenize,
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
          })

          const expectedResponse = {
            data: {
              signIn: {
                result: {
                  sendMethod: 'email',
                  authenticateToken: authToken,
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
          expect(consoleOutput).toEqual([`User: ${user._key} successfully signed in, and sent auth msg.`])
        })
      })
      describe('user has send method set to none', () => {
        describe('user has rememberMe set to false', () => {
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

            const mockedCookie = jest.fn()
            const mockedResponse = { cookie: mockedCookie }

            const authToken = tokenize({
              expiresIn: AUTH_TOKEN_EXPIRY,
              parameters: { userKey: user._key },
              secret: String(SIGN_IN_KEY),
            })
            const refreshToken = tokenize({
              expiresIn: REFRESH_TOKEN_EXPIRY,
              parameters: { userKey: user._key, uuid: '456' },
              secret: String(REFRESH_KEY),
            })

            const mockedTokenize = jest.fn().mockReturnValueOnce(authToken).mockReturnValueOnce(refreshToken)

            const response = await graphql({
              schema,
              source: `
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
                transaction,
                response: mockedResponse,
                uuidv4,
                request: { ip: '127.0.0.1' },
                jwt,
                auth: {
                  bcrypt,
                  tokenize: mockedTokenize,
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
            })

            const expectedResponse = {
              data: {
                signIn: {
                  result: {
                    authToken: authToken,
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
            expect(mockedCookie).toHaveBeenCalledWith('refresh_token', refreshToken, {
              httpOnly: true,
              expires: 0,
              sameSite: true,
              secure: true,
            })
            expect(consoleOutput).toEqual([`User: ${user._key} successfully signed in, and sent auth msg.`])
          })
        })
        describe('user has rememberMe set to true', () => {
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

            const mockedCookie = jest.fn()
            const mockedResponse = { cookie: mockedCookie }

            const authToken = tokenize({
              expiresIn: AUTH_TOKEN_EXPIRY,
              parameters: { userKey: user._key },
              secret: String(SIGN_IN_KEY),
            })
            const refreshToken = tokenize({
              expiresIn: REFRESH_TOKEN_EXPIRY,
              parameters: { userKey: user._key, uuid: '456' },
              secret: String(REFRESH_KEY),
            })

            const mockedTokenize = jest.fn().mockReturnValueOnce(authToken).mockReturnValueOnce(refreshToken)

            const response = await graphql({
              schema,
              source: `
                mutation {
                  signIn(
                    input: {
                      userName: "test.account@istio.actually.exists"
                      password: "testpassword123"
                      rememberMe: true
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
                transaction,
                response: mockedResponse,
                uuidv4,
                request: { ip: '127.0.0.1' },
                jwt,
                auth: {
                  bcrypt,
                  tokenize: mockedTokenize,
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
            })

            const expectedResponse = {
              data: {
                signIn: {
                  result: {
                    authToken: authToken,
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
            expect(mockedCookie).toHaveBeenCalledWith('refresh_token', refreshToken, {
              httpOnly: true,
              maxAge: ms(REFRESH_TOKEN_EXPIRY),
              sameSite: true,
              secure: true,
            })
            expect(consoleOutput).toEqual([`User: ${user._key} successfully signed in, and sent auth msg.`])
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

          await graphql({
            schema,
            source: `
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
            rootValue: null,
            contextValue: {
              i18n,
              query,
              collections: collectionNames,
              transaction,
              uuidv4,
              request: { ip: '127.0.0.1' },
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
          })

          cursor = await query`
              FOR user IN users
                FILTER user.userName == "test.account@istio.actually.exists"
                RETURN MERGE({ id: user._key }, user)
            `
          user = await cursor.next()

          expect(user.failedLoginAttempts).toEqual(0)
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

          const authToken = tokenize({
            expiresIn: AUTH_TOKEN_EXPIRY,
            parameters: { userKey: user._key },
            secret: String(SIGN_IN_KEY),
          })

          const mockedTokenize = jest.fn().mockReturnValueOnce(authToken)

          const response = await graphql({
            schema,
            source: `
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
            rootValue: null,
            contextValue: {
              i18n,
              query,
              collections: collectionNames,
              transaction,
              uuidv4,
              request: { ip: '127.0.0.1' },
              auth: {
                bcrypt,
                tokenize: mockedTokenize,
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
          })

          const expectedResponse = {
            data: {
              signIn: {
                result: {
                  sendMethod: 'text',
                  authenticateToken: authToken,
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
          expect(consoleOutput).toEqual([`User: ${user._key} successfully signed in, and sent auth msg.`])
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

          const authToken = tokenize({
            expiresIn: AUTH_TOKEN_EXPIRY,
            parameters: { userKey: user._key },
            secret: String(SIGN_IN_KEY),
          })

          const mockedTokenize = jest.fn().mockReturnValueOnce(authToken)

          const response = await graphql({
            schema,
            source: `
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
            rootValue: null,
            contextValue: {
              i18n,
              query,
              collections: collectionNames,
              transaction,
              uuidv4,
              request: { ip: '127.0.0.1' },
              auth: {
                bcrypt,
                tokenize: mockedTokenize,
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
          })

          const expectedResponse = {
            data: {
              signIn: {
                result: {
                  sendMethod: 'email',
                  authenticateToken: authToken,
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
          expect(consoleOutput).toEqual([`User: ${user._key} successfully signed in, and sent auth msg.`])
        })
      })
      describe('user has send method set to none', () => {
        describe('user has rememberMe set to false', () => {
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

            const mockedCookie = jest.fn()
            const mockedResponse = { cookie: mockedCookie }

            const authToken = tokenize({
              expiresIn: AUTH_TOKEN_EXPIRY,
              parameters: { userKey: user._key },
              secret: String(SIGN_IN_KEY),
            })
            const refreshToken = tokenize({
              expiresIn: REFRESH_TOKEN_EXPIRY,
              parameters: { userKey: user._key, uuid: '456' },
              secret: String(REFRESH_KEY),
            })

            const mockedTokenize = jest.fn().mockReturnValueOnce(authToken).mockReturnValueOnce(refreshToken)

            const response = await graphql({
              schema,
              source: `
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
                transaction,
                response: mockedResponse,
                uuidv4,
                request: { ip: '127.0.0.1' },
                auth: {
                  bcrypt,
                  tokenize: mockedTokenize,
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
            })

            const expectedResponse = {
              data: {
                signIn: {
                  result: {
                    authToken: authToken,
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
            expect(mockedCookie).toHaveBeenCalledWith('refresh_token', refreshToken, {
              httpOnly: true,
              expires: 0,
              sameSite: true,
              secure: true,
            })
            expect(consoleOutput).toEqual([`User: ${user._key} successfully signed in, and sent auth msg.`])
          })
        })
        describe('user has rememberMe set to true', () => {
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

            const mockedCookie = jest.fn()
            const mockedResponse = { cookie: mockedCookie }

            const authToken = tokenize({
              expiresIn: AUTH_TOKEN_EXPIRY,
              parameters: { userKey: user._key },
              secret: String(SIGN_IN_KEY),
            })
            const refreshToken = tokenize({
              expiresIn: REFRESH_TOKEN_EXPIRY,
              parameters: { userKey: user._key, uuid: '456' },
              secret: String(REFRESH_KEY),
            })

            const mockedTokenize = jest.fn().mockReturnValueOnce(authToken).mockReturnValueOnce(refreshToken)

            const response = await graphql({
              schema,
              source: `
                mutation {
                  signIn(
                    input: {
                      userName: "test.account@istio.actually.exists"
                      password: "testpassword123"
                      rememberMe: true
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
                transaction,
                response: mockedResponse,
                uuidv4,
                request: { ip: '127.0.0.1' },
                jwt,
                auth: {
                  bcrypt,
                  tokenize: mockedTokenize,
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
            })

            const expectedResponse = {
              data: {
                signIn: {
                  result: {
                    authToken: authToken,
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
            expect(mockedCookie).toHaveBeenCalledWith('refresh_token', refreshToken, {
              httpOnly: true,
              maxAge: ms(REFRESH_TOKEN_EXPIRY),
              sameSite: true,
              secure: true,
            })
            expect(consoleOutput).toEqual([`User: ${user._key} successfully signed in, and sent auth msg.`])
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

          await graphql({
            schema,
            source: `
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
            rootValue: null,
            contextValue: {
              i18n,
              query,
              collections: collectionNames,
              transaction,
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
                sendAuthEmail: mockNotify,
              },
            },
          })

          cursor = await query`
              FOR user IN users
                FILTER user.userName == "test.account@istio.actually.exists"
                RETURN MERGE({ id: user._key }, user)
            `
          user = await cursor.next()

          expect(user.failedLoginAttempts).toEqual(0)
        })
      })
    })
  })
  describe('given an unsuccessful login', () => {
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
      describe('user cannot be found in database', () => {
        it('returns an error message', async () => {
          const response = await graphql({
            schema,
            source: `
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
            rootValue: null,
            contextValue: {
              i18n,
              query,
              collections: collectionNames,
              transaction,
              auth: {
                bcrypt,
                tokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadUserByUserName: {
                  load: jest.fn().mockReturnValue(undefined),
                },
              },
              notify: {
                sendAuthEmail: mockNotify,
              },
            },
          })

          const error = {
            data: {
              signIn: {
                result: {
                  code: 400,
                  description: 'Incorrect username or password. Please try again.',
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
          const response = await graphql({
            schema,
            source: `
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
            rootValue: null,
            contextValue: {
              i18n,
              query,
              collections: collectionNames,
              transaction: jest.fn().mockReturnValue({ step: jest.fn(), commit: jest.fn() }),
              uuidv4,
              auth: {
                bcrypt: {
                  compareSync: jest.fn().mockReturnValue(false),
                },
                tokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadUserByUserName: {
                  load: jest.fn().mockReturnValue({
                    userName: 'userName@email.ca',
                    password: 'password',
                    _key: 123,
                  }),
                },
              },
              notify: {
                sendAuthEmail: mockNotify,
              },
            },
          })

          const error = {
            data: {
              signIn: {
                result: {
                  code: 400,
                  description: 'Incorrect username or password. Please try again.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([`User attempted to authenticate: 123 with invalid credentials.`])
        })
        it('increases the failed attempt counter', async () => {
          const user = {
            userName: 'userName@email.ca',
            password: 'password',
            _key: 123,
            failedLoginAttempts: 0,
          }

          await graphql({
            schema,
            source: `
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
            rootValue: null,
            contextValue: {
              i18n,
              query: jest.fn(),
              collections: collectionNames,
              transaction: jest.fn().mockReturnValue({ step: jest.fn(), commit: jest.fn() }),
              uuidv4,
              auth: {
                bcrypt: {
                  compareSync: jest.fn().mockReturnValue(false),
                },
                tokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadUserByUserName: {
                  load: jest.fn().mockReturnValue(user),
                },
              },
              notify: {
                sendAuthEmail: mockNotify,
              },
            },
          })

          expect(user.failedLoginAttempts).toEqual(1)
        })
      })
      describe('user has reached maximum amount of login attempts', () => {
        it('returns an error message', async () => {
          const response = await graphql({
            schema,
            source: `
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
            rootValue: null,
            contextValue: {
              i18n,
              query,
              collections: collectionNames,
              transaction: jest.fn().mockReturnValue({ step: jest.fn(), commit: jest.fn() }),
              uuidv4,
              auth: {
                bcrypt: {
                  compareSync: jest.fn().mockReturnValue(true),
                },
                tokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadUserByUserName: {
                  load: jest.fn().mockReturnValue({
                    userName: 'userName@email.ca',
                    password: 'password',
                    _key: 123,
                    failedLoginAttempts: 10,
                  }),
                },
              },
              notify: {
                sendAuthEmail: mockNotify,
              },
            },
          })

          const error = {
            data: {
              signIn: {
                result: {
                  code: 401,
                  description: 'Too many failed login attempts, please reset your password, and try again.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([`User: 123 tried to sign in, but has too many login attempts.`])
        })
      })
      describe('transaction step error occurs', () => {
        describe('when resetting failed login attempts', () => {
          it('throws an error', async () => {
            const response = await graphql({
              schema,
              source: `
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn().mockRejectedValue(new Error('Transaction Step Error')),
                  commit: jest.fn(),
                  abort: jest.fn(),
                }),
                uuidv4,
                auth: {
                  bcrypt: {
                    compareSync: jest.fn().mockReturnValue(true),
                  },
                  tokenize,
                },
                validators: {
                  cleanseInput,
                },
                loaders: {
                  loadUserByUserName: {
                    load: jest.fn().mockReturnValue({
                      userName: 'userName@email.ca',
                      password: 'password',
                      _key: 123,
                      failedLoginAttempts: 1,
                    }),
                  },
                },
                notify: {
                  sendAuthEmail: mockNotify,
                },
              },
            })

            const error = [new GraphQLError('Unable to sign in, please try again.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred when resetting failed login attempts for user: 123: Error: Transaction Step Error`,
            ])
          })
        })
        describe('when inserting tfa code', () => {
          it('throws an error', async () => {
            const response = await graphql({
              schema,
              source: `
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn().mockReturnValueOnce().mockRejectedValue(new Error('Transaction Step Error')),
                  commit: jest.fn(),
                  abort: jest.fn(),
                }),
                uuidv4,
                auth: {
                  bcrypt: {
                    compareSync: jest.fn().mockReturnValue(true),
                  },
                  tokenize,
                },
                validators: {
                  cleanseInput,
                },
                loaders: {
                  loadUserByUserName: {
                    load: jest.fn().mockReturnValue({
                      userName: 'userName@email.ca',
                      password: 'password',
                      _key: 123,
                      failedLoginAttempts: 1,
                    }),
                  },
                },
                notify: {
                  sendAuthEmail: mockNotify,
                },
              },
            })

            const error = [new GraphQLError('Unable to sign in, please try again.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred when inserting TFA code for user: 123: Error: Transaction Step Error`,
            ])
          })
        })
        describe('when setting refresh id', () => {
          it('throws an error', async () => {
            const response = await graphql({
              schema,
              source: `
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn().mockReturnValueOnce().mockRejectedValue(new Error('Transaction Step Error')),
                  commit: jest.fn(),
                  abort: jest.fn(),
                }),
                uuidv4,
                auth: {
                  bcrypt: {
                    compareSync: jest.fn().mockReturnValue(true),
                  },
                  tokenize,
                },
                validators: {
                  cleanseInput,
                },
                loaders: {
                  loadUserByUserName: {
                    load: jest.fn().mockReturnValue({
                      userName: 'userName@email.ca',
                      password: 'password',
                      _key: 123,
                      failedLoginAttempts: 1,
                      tfaSendMethod: 'none',
                    }),
                  },
                },
                notify: {
                  sendAuthEmail: mockNotify,
                },
              },
            })

            const error = [new GraphQLError('Unable to sign in, please try again.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred when attempting to setting refresh tokens for user: 123 during sign in: Error: Transaction Step Error`,
            ])
          })
        })
        describe('when incrementing failed login attempts', () => {
          it('throws an error', async () => {
            const response = await graphql({
              schema,
              source: `
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn().mockRejectedValue(new Error('Transaction Step Error')),
                  commit: jest.fn(),
                  abort: jest.fn(),
                }),
                uuidv4,
                auth: {
                  bcrypt: {
                    compareSync: jest.fn().mockReturnValue(false),
                  },
                  tokenize,
                },
                validators: {
                  cleanseInput,
                },
                loaders: {
                  loadUserByUserName: {
                    load: jest.fn().mockReturnValue({
                      userName: 'userName@email.ca',
                      password: 'password',
                      _key: 123,
                      failedLoginAttempts: 1,
                      tfaSendMethod: 'none',
                    }),
                  },
                },
                notify: {
                  sendAuthEmail: mockNotify,
                },
              },
            })
            const error = [new GraphQLError('Unable to sign in, please try again.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred when incrementing failed login attempts for user: 123: Error: Transaction Step Error`,
            ])
          })
        })
      })
      describe('transaction commit error occurs', () => {
        describe('during tfa sign in', () => {
          it('throws an error', async () => {
            const response = await graphql({
              schema,
              source: `
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn(),
                  commit: jest.fn().mockRejectedValue(new Error('Transaction Commit Error')),
                  abort: jest.fn(),
                }),
                uuidv4,
                auth: {
                  bcrypt: {
                    compareSync: jest.fn().mockReturnValue(true),
                  },
                  tokenize,
                },
                validators: {
                  cleanseInput,
                },
                loaders: {
                  loadUserByUserName: {
                    load: jest.fn().mockReturnValue({
                      userName: 'userName@email.ca',
                      password: 'password',
                      _key: 123,
                      failedLoginAttempts: 1,
                      tfaSendMethod: 'email',
                    }),
                  },
                },
                notify: {
                  sendAuthEmail: mockNotify,
                },
              },
            })

            const error = [new GraphQLError('Unable to sign in, please try again.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx commit error occurred while user: 123 attempted to tfa sign in: Error: Transaction Commit Error`,
            ])
          })
        })
        describe('during regular sign in', () => {
          it('throws an error', async () => {
            const response = await graphql({
              schema,
              source: `
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn(),
                  commit: jest.fn().mockRejectedValue(new Error('Transaction Commit Error')),
                  abort: jest.fn(),
                }),
                uuidv4,
                auth: {
                  bcrypt: {
                    compareSync: jest.fn().mockReturnValue(true),
                  },
                  tokenize,
                },
                validators: {
                  cleanseInput,
                },
                loaders: {
                  loadUserByUserName: {
                    load: jest.fn().mockReturnValue({
                      userName: 'userName@email.ca',
                      password: 'password',
                      _key: 123,
                      failedLoginAttempts: 1,
                      tfaSendMethod: 'none',
                    }),
                  },
                },
                notify: {
                  sendAuthEmail: mockNotify,
                },
              },
            })

            const error = [new GraphQLError('Unable to sign in, please try again.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx commit error occurred while user: 123 attempted a regular sign in: Error: Transaction Commit Error`,
            ])
          })
        })
        describe('during failed login', () => {
          it('throws an error', async () => {
            const response = await graphql({
              schema,
              source: `
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn(),
                  commit: jest.fn().mockRejectedValue(new Error('Transaction Commit Error')),
                  abort: jest.fn(),
                }),
                uuidv4,
                auth: {
                  bcrypt: {
                    compareSync: jest.fn().mockReturnValue(false),
                  },
                  tokenize,
                },
                validators: {
                  cleanseInput,
                },
                loaders: {
                  loadUserByUserName: {
                    load: jest.fn().mockReturnValue({
                      userName: 'userName@email.ca',
                      password: 'password',
                      _key: 123,
                      failedLoginAttempts: 1,
                      tfaSendMethod: 'none',
                    }),
                  },
                },
                notify: {
                  sendAuthEmail: mockNotify,
                },
              },
            })
            const error = [new GraphQLError('Unable to sign in, please try again.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx commit error occurred while user: 123 failed to sign in: Error: Transaction Commit Error`,
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
      describe('user cannot be found in database', () => {
        it('returns an error message', async () => {
          const response = await graphql({
            schema,
            source: `
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
            rootValue: null,
            contextValue: {
              i18n,
              query,
              collections: collectionNames,
              transaction,
              auth: {
                bcrypt,
                tokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadUserByUserName: {
                  load: jest.fn().mockReturnValue(undefined),
                },
              },
              notify: {
                sendAuthEmail: mockNotify,
              },
            },
          })

          const error = {
            data: {
              signIn: {
                result: {
                  code: 400,
                  description: "Le nom d'utilisateur ou le mot de passe est incorrect. Veuillez réessayer.",
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
          const response = await graphql({
            schema,
            source: `
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
            rootValue: null,
            contextValue: {
              i18n,
              query,
              collections: collectionNames,
              transaction: jest.fn().mockReturnValue({ step: jest.fn(), commit: jest.fn() }),
              uuidv4,
              auth: {
                bcrypt: {
                  compareSync: jest.fn().mockReturnValue(false),
                },
                tokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadUserByUserName: {
                  load: jest.fn().mockReturnValue({
                    userName: 'userName@email.ca',
                    password: 'password',
                    _key: 123,
                  }),
                },
              },
              notify: {
                sendAuthEmail: mockNotify,
              },
            },
          })

          const error = {
            data: {
              signIn: {
                result: {
                  code: 400,
                  description: "Le nom d'utilisateur ou le mot de passe est incorrect. Veuillez réessayer.",
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([`User attempted to authenticate: 123 with invalid credentials.`])
        })
        it('increases the failed attempt counter', async () => {
          const user = {
            userName: 'userName@email.ca',
            password: 'password',
            _key: 123,
            failedLoginAttempts: 0,
          }

          await graphql({
            schema,
            source: `
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
            rootValue: null,
            contextValue: {
              i18n,
              query: jest.fn(),
              collections: collectionNames,
              transaction: jest.fn().mockReturnValue({ step: jest.fn(), commit: jest.fn() }),
              uuidv4,
              auth: {
                bcrypt: {
                  compareSync: jest.fn().mockReturnValue(false),
                },
                tokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadUserByUserName: {
                  load: jest.fn().mockReturnValue(user),
                },
              },
              notify: {
                sendAuthEmail: mockNotify,
              },
            },
          })

          expect(user.failedLoginAttempts).toEqual(1)
        })
      })
      describe('user has reached maximum amount of login attempts', () => {
        it('returns an error message', async () => {
          const response = await graphql({
            schema,
            source: `
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
            rootValue: null,
            contextValue: {
              i18n,
              query,
              collections: collectionNames,
              transaction: jest.fn().mockReturnValue({ step: jest.fn(), commit: jest.fn() }),
              uuidv4,
              auth: {
                bcrypt: {
                  compareSync: jest.fn().mockReturnValue(true),
                },
                tokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadUserByUserName: {
                  load: jest.fn().mockReturnValue({
                    userName: 'userName@email.ca',
                    password: 'password',
                    _key: 123,
                    failedLoginAttempts: 10,
                  }),
                },
              },
              notify: {
                sendAuthEmail: mockNotify,
              },
            },
          })

          const error = {
            data: {
              signIn: {
                result: {
                  code: 401,
                  description:
                    'Trop de tentatives de connexion ont échoué, veuillez réinitialiser votre mot de passe et réessayer.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([`User: 123 tried to sign in, but has too many login attempts.`])
        })
      })
      describe('transaction step error occurs', () => {
        describe('when resetting failed login attempts', () => {
          it('throws an error', async () => {
            const response = await graphql({
              schema,
              source: `
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn().mockRejectedValue(new Error('Transaction Step Error')),
                  commit: jest.fn(),
                  abort: jest.fn(),
                }),
                uuidv4,
                auth: {
                  bcrypt: {
                    compareSync: jest.fn().mockReturnValue(true),
                  },
                  tokenize,
                },
                validators: {
                  cleanseInput,
                },
                loaders: {
                  loadUserByUserName: {
                    load: jest.fn().mockReturnValue({
                      userName: 'userName@email.ca',
                      password: 'password',
                      _key: 123,
                      failedLoginAttempts: 1,
                    }),
                  },
                },
                notify: {
                  sendAuthEmail: mockNotify,
                },
              },
            })

            const error = [new GraphQLError('Impossible de se connecter, veuillez réessayer.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred when resetting failed login attempts for user: 123: Error: Transaction Step Error`,
            ])
          })
        })
        describe('when inserting tfa code', () => {
          it('throws an error', async () => {
            const response = await graphql({
              schema,
              source: `
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn().mockReturnValueOnce().mockRejectedValue(new Error('Transaction Step Error')),
                  commit: jest.fn(),
                  abort: jest.fn(),
                }),
                uuidv4,
                auth: {
                  bcrypt: {
                    compareSync: jest.fn().mockReturnValue(true),
                  },
                  tokenize,
                },
                validators: {
                  cleanseInput,
                },
                loaders: {
                  loadUserByUserName: {
                    load: jest.fn().mockReturnValue({
                      userName: 'userName@email.ca',
                      password: 'password',
                      _key: 123,
                      failedLoginAttempts: 1,
                    }),
                  },
                },
                notify: {
                  sendAuthEmail: mockNotify,
                },
              },
            })

            const error = [new GraphQLError('Impossible de se connecter, veuillez réessayer.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred when inserting TFA code for user: 123: Error: Transaction Step Error`,
            ])
          })
        })
        describe('when setting refresh id', () => {
          it('throws an error', async () => {
            const response = await graphql({
              schema,
              source: `
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn().mockReturnValueOnce().mockRejectedValue(new Error('Transaction Step Error')),
                  commit: jest.fn(),
                  abort: jest.fn(),
                }),
                uuidv4,
                auth: {
                  bcrypt: {
                    compareSync: jest.fn().mockReturnValue(true),
                  },
                  tokenize,
                },
                validators: {
                  cleanseInput,
                },
                loaders: {
                  loadUserByUserName: {
                    load: jest.fn().mockReturnValue({
                      userName: 'userName@email.ca',
                      password: 'password',
                      _key: 123,
                      failedLoginAttempts: 1,
                      tfaSendMethod: 'none',
                    }),
                  },
                },
                notify: {
                  sendAuthEmail: mockNotify,
                },
              },
            })

            const error = [new GraphQLError('Impossible de se connecter, veuillez réessayer.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred when attempting to setting refresh tokens for user: 123 during sign in: Error: Transaction Step Error`,
            ])
          })
        })
        describe('when incrementing failed login attempts', () => {
          it('throws an error', async () => {
            const response = await graphql({
              schema,
              source: `
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn().mockRejectedValue(new Error('Transaction Step Error')),
                  commit: jest.fn(),
                  abort: jest.fn(),
                }),
                uuidv4,
                auth: {
                  bcrypt: {
                    compareSync: jest.fn().mockReturnValue(false),
                  },
                  tokenize,
                },
                validators: {
                  cleanseInput,
                },
                loaders: {
                  loadUserByUserName: {
                    load: jest.fn().mockReturnValue({
                      userName: 'userName@email.ca',
                      password: 'password',
                      _key: 123,
                      failedLoginAttempts: 1,
                      tfaSendMethod: 'none',
                    }),
                  },
                },
                notify: {
                  sendAuthEmail: mockNotify,
                },
              },
            })
            const error = [new GraphQLError('Impossible de se connecter, veuillez réessayer.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred when incrementing failed login attempts for user: 123: Error: Transaction Step Error`,
            ])
          })
        })
      })
      describe('transaction commit error occurs', () => {
        describe('during tfa sign in', () => {
          it('throws an error', async () => {
            const response = await graphql({
              schema,
              source: `
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn(),
                  commit: jest.fn().mockRejectedValue(new Error('Transaction Commit Error')),
                  abort: jest.fn(),
                }),
                uuidv4,
                auth: {
                  bcrypt: {
                    compareSync: jest.fn().mockReturnValue(true),
                  },
                  tokenize,
                },
                validators: {
                  cleanseInput,
                },
                loaders: {
                  loadUserByUserName: {
                    load: jest.fn().mockReturnValue({
                      userName: 'userName@email.ca',
                      password: 'password',
                      _key: 123,
                      failedLoginAttempts: 1,
                      tfaSendMethod: 'email',
                    }),
                  },
                },
                notify: {
                  sendAuthEmail: mockNotify,
                },
              },
            })

            const error = [new GraphQLError('Impossible de se connecter, veuillez réessayer.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx commit error occurred while user: 123 attempted to tfa sign in: Error: Transaction Commit Error`,
            ])
          })
        })
        describe('during regular sign in', () => {
          it('throws an error', async () => {
            const response = await graphql({
              schema,
              source: `
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn(),
                  commit: jest.fn().mockRejectedValue(new Error('Transaction Commit Error')),
                  abort: jest.fn(),
                }),
                uuidv4,
                auth: {
                  bcrypt: {
                    compareSync: jest.fn().mockReturnValue(true),
                  },
                  tokenize,
                },
                validators: {
                  cleanseInput,
                },
                loaders: {
                  loadUserByUserName: {
                    load: jest.fn().mockReturnValue({
                      userName: 'userName@email.ca',
                      password: 'password',
                      _key: 123,
                      failedLoginAttempts: 1,
                      tfaSendMethod: 'none',
                    }),
                  },
                },
                notify: {
                  sendAuthEmail: mockNotify,
                },
              },
            })

            const error = [new GraphQLError('Impossible de se connecter, veuillez réessayer.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx commit error occurred while user: 123 attempted a regular sign in: Error: Transaction Commit Error`,
            ])
          })
        })
        describe('during failed login', () => {
          it('throws an error', async () => {
            const response = await graphql({
              schema,
              source: `
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn(),
                  commit: jest.fn().mockRejectedValue(new Error('Transaction Commit Error')),
                  abort: jest.fn(),
                }),
                uuidv4,
                auth: {
                  bcrypt: {
                    compareSync: jest.fn().mockReturnValue(false),
                  },
                  tokenize,
                },
                validators: {
                  cleanseInput,
                },
                loaders: {
                  loadUserByUserName: {
                    load: jest.fn().mockReturnValue({
                      userName: 'userName@email.ca',
                      password: 'password',
                      _key: 123,
                      failedLoginAttempts: 1,
                      tfaSendMethod: 'none',
                    }),
                  },
                },
                notify: {
                  sendAuthEmail: mockNotify,
                },
              },
            })
            const error = [new GraphQLError('Impossible de se connecter, veuillez réessayer.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx commit error occurred while user: 123 failed to sign in: Error: Transaction Commit Error`,
            ])
          })
        })
      })
    })
  })
})
