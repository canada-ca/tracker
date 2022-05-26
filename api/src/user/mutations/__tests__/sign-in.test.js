import { ensure, dbNameFromFile } from 'arango-tools'
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

const { DB_PASS: rootPass, DB_URL: url, REFRESH_TOKEN_EXPIRY } = process.env

const collectionNames = [
  'users',
  'organizations',
  'domains',
  'dkim',
  'dkimResults',
  'dmarc',
  'spf',
  'https',
  'ssl',
  'dkimGuidanceTags',
  'dmarcGuidanceTags',
  'spfGuidanceTags',
  'httpsGuidanceTags',
  'sslGuidanceTags',
  'chartSummaries',
  'dmarcSummaries',
  'aggregateGuidanceTags',
  'scanSummaryCriteria',
  'chartSummaryCriteria',
  'scanSummaries',
  'affiliations',
  'claims',
  'domainsDKIM',
  'dkimToDkimResults',
  'domainsDMARC',
  'domainsSPF',
  'domainsHTTPS',
  'domainsSSL',
  'ownership',
  'domainsToDmarcSummaries',
]

const mockNotify = jest.fn()

describe('authenticate user account', () => {
  let query, drop, truncate, schema, i18n, tokenize, transaction
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
    tokenize = jest.fn().mockReturnValue('token')
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
      tokenize = jest.fn().mockReturnValue('token')
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
          },
        },
      )
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
                collections: collectionNames,
                transaction,
                response: mockedResponse,
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
            expect(mockedCookie).toHaveBeenCalledWith(
              'refresh_token',
              'token',
              {
                httpOnly: true,
                expires: 0,
                sameSite: true,
                secure: true,
              },
            )
            expect(consoleOutput).toEqual([
              `User: ${user._key} successfully signed in, and sent auth msg.`,
            ])
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

            const response = await graphql(
              schema,
              `
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
              null,
              {
                i18n,
                query,
                collections: collectionNames,
                transaction,
                response: mockedResponse,
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
            expect(mockedCookie).toHaveBeenCalledWith(
              'refresh_token',
              'token',
              {
                httpOnly: true,
                maxAge: REFRESH_TOKEN_EXPIRY * 60 * 24 * 60 * 1000,
                sameSite: true,
                secure: true,
              },
            )
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
                collections: collectionNames,
                transaction,
                response: mockedResponse,
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
            expect(mockedCookie).toHaveBeenCalledWith(
              'refresh_token',
              'token',
              {
                httpOnly: true,
                expires: 0,
                sameSite: true,
                secure: true,
              },
            )
            expect(consoleOutput).toEqual([
              `User: ${user._key} successfully signed in, and sent auth msg.`,
            ])
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

            const response = await graphql(
              schema,
              `
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
              null,
              {
                i18n,
                query,
                collections: collectionNames,
                transaction,
                response: mockedResponse,
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
            expect(mockedCookie).toHaveBeenCalledWith(
              'refresh_token',
              'token',
              {
                httpOnly: true,
                maxAge: REFRESH_TOKEN_EXPIRY * 60 * 24 * 60 * 1000,
                sameSite: true,
                secure: true,
              },
            )
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
              collections: collectionNames,
              transaction: jest
                .fn()
                .mockReturnValue({ step: jest.fn(), commit: jest.fn() }),
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
            `User attempted to authenticate: 123 with invalid credentials.`,
          ])
        })
        it('increases the failed attempt counter', async () => {
          const user = {
            userName: 'userName@email.ca',
            password: 'password',
            _key: 123,
            failedLoginAttempts: 0,
          }

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
              query: jest.fn(),
              collections: collectionNames,
              transaction: jest
                .fn()
                .mockReturnValue({ step: jest.fn(), commit: jest.fn() }),
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
          )

          expect(user.failedLoginAttempts).toEqual(1)
        })
      })
      describe('user has reached maximum amount of login attempts', () => {
        it('returns an error message', async () => {
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
              collections: collectionNames,
              transaction: jest
                .fn()
                .mockReturnValue({ step: jest.fn(), commit: jest.fn() }),
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
            `User: 123 tried to sign in, but has too many login attempts.`,
          ])
        })
      })
      describe('transaction step error occurs', () => {
        describe('when resetting failed login attempts', () => {
          it('throws an error', async () => {
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
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest
                    .fn()
                    .mockRejectedValue(new Error('Transaction Step Error')),
                  commit: jest.fn(),
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
            )

            const error = [
              new GraphQLError('Unable to sign in, please try again.'),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred when resetting failed login attempts for user: 123: Error: Transaction Step Error`,
            ])
          })
        })
        describe('when inserting tfa code', () => {
          it('throws an error', async () => {
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
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest
                    .fn()
                    .mockReturnValueOnce()
                    .mockRejectedValue(new Error('Transaction Step Error')),
                  commit: jest.fn(),
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
            )

            const error = [
              new GraphQLError('Unable to sign in, please try again.'),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred when inserting TFA code for user: 123: Error: Transaction Step Error`,
            ])
          })
        })
        describe('when setting refresh id', () => {
          it('throws an error', async () => {
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
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest
                    .fn()
                    .mockReturnValueOnce()
                    .mockRejectedValue(new Error('Transaction Step Error')),
                  commit: jest.fn(),
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
            )

            const error = [
              new GraphQLError('Unable to sign in, please try again.'),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred when attempting to setting refresh tokens for user: 123 during sign in: Error: Transaction Step Error`,
            ])
          })
        })
        describe('when incrementing failed login attempts', () => {
          it('throws an error', async () => {
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
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest
                    .fn()
                    .mockRejectedValue(new Error('Transaction Step Error')),
                  commit: jest.fn(),
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
            )
            const error = [
              new GraphQLError('Unable to sign in, please try again.'),
            ]

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
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn(),
                  commit: jest
                    .fn()
                    .mockRejectedValue(new Error('Transaction Commit Error')),
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
            )

            const error = [
              new GraphQLError('Unable to sign in, please try again.'),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx commit error occurred while user: 123 attempted to tfa sign in: Error: Transaction Commit Error`,
            ])
          })
        })
        describe('during regular sign in', () => {
          it('throws an error', async () => {
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
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn(),
                  commit: jest
                    .fn()
                    .mockRejectedValue(new Error('Transaction Commit Error')),
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
            )

            const error = [
              new GraphQLError('Unable to sign in, please try again.'),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx commit error occurred while user: 123 attempted a regular sign in: Error: Transaction Commit Error`,
            ])
          })
        })
        describe('during failed login', () => {
          it('throws an error', async () => {
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
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn(),
                  commit: jest
                    .fn()
                    .mockRejectedValue(new Error('Transaction Commit Error')),
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
            )
            const error = [
              new GraphQLError('Unable to sign in, please try again.'),
            ]

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
          )

          const error = {
            data: {
              signIn: {
                result: {
                  code: 400,
                  description:
                    "Le nom d'utilisateur ou le mot de passe est incorrect. Veuillez réessayer.",
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
              collections: collectionNames,
              transaction: jest
                .fn()
                .mockReturnValue({ step: jest.fn(), commit: jest.fn() }),
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
          )

          const error = {
            data: {
              signIn: {
                result: {
                  code: 400,
                  description:
                    "Le nom d'utilisateur ou le mot de passe est incorrect. Veuillez réessayer.",
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User attempted to authenticate: 123 with invalid credentials.`,
          ])
        })
        it('increases the failed attempt counter', async () => {
          const user = {
            userName: 'userName@email.ca',
            password: 'password',
            _key: 123,
            failedLoginAttempts: 0,
          }

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
              query: jest.fn(),
              collections: collectionNames,
              transaction: jest
                .fn()
                .mockReturnValue({ step: jest.fn(), commit: jest.fn() }),
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
          )

          expect(user.failedLoginAttempts).toEqual(1)
        })
      })
      describe('user has reached maximum amount of login attempts', () => {
        it('returns an error message', async () => {
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
              collections: collectionNames,
              transaction: jest
                .fn()
                .mockReturnValue({ step: jest.fn(), commit: jest.fn() }),
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
          )

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
          expect(consoleOutput).toEqual([
            `User: 123 tried to sign in, but has too many login attempts.`,
          ])
        })
      })
      describe('transaction step error occurs', () => {
        describe('when resetting failed login attempts', () => {
          it('throws an error', async () => {
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
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest
                    .fn()
                    .mockRejectedValue(new Error('Transaction Step Error')),
                  commit: jest.fn(),
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
            )

            const error = [
              new GraphQLError(
                'Impossible de se connecter, veuillez réessayer.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred when resetting failed login attempts for user: 123: Error: Transaction Step Error`,
            ])
          })
        })
        describe('when inserting tfa code', () => {
          it('throws an error', async () => {
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
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest
                    .fn()
                    .mockReturnValueOnce()
                    .mockRejectedValue(new Error('Transaction Step Error')),
                  commit: jest.fn(),
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
            )

            const error = [
              new GraphQLError(
                'Impossible de se connecter, veuillez réessayer.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred when inserting TFA code for user: 123: Error: Transaction Step Error`,
            ])
          })
        })
        describe('when setting refresh id', () => {
          it('throws an error', async () => {
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
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest
                    .fn()
                    .mockReturnValueOnce()
                    .mockRejectedValue(new Error('Transaction Step Error')),
                  commit: jest.fn(),
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
            )

            const error = [
              new GraphQLError(
                'Impossible de se connecter, veuillez réessayer.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred when attempting to setting refresh tokens for user: 123 during sign in: Error: Transaction Step Error`,
            ])
          })
        })
        describe('when incrementing failed login attempts', () => {
          it('throws an error', async () => {
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
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest
                    .fn()
                    .mockRejectedValue(new Error('Transaction Step Error')),
                  commit: jest.fn(),
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
            )
            const error = [
              new GraphQLError(
                'Impossible de se connecter, veuillez réessayer.',
              ),
            ]

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
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn(),
                  commit: jest
                    .fn()
                    .mockRejectedValue(new Error('Transaction Commit Error')),
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
            )

            const error = [
              new GraphQLError(
                'Impossible de se connecter, veuillez réessayer.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx commit error occurred while user: 123 attempted to tfa sign in: Error: Transaction Commit Error`,
            ])
          })
        })
        describe('during regular sign in', () => {
          it('throws an error', async () => {
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
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn(),
                  commit: jest
                    .fn()
                    .mockRejectedValue(new Error('Transaction Commit Error')),
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
            )

            const error = [
              new GraphQLError(
                'Impossible de se connecter, veuillez réessayer.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx commit error occurred while user: 123 attempted a regular sign in: Error: Transaction Commit Error`,
            ])
          })
        })
        describe('during failed login', () => {
          it('throws an error', async () => {
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
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn(),
                  commit: jest
                    .fn()
                    .mockRejectedValue(new Error('Transaction Commit Error')),
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
            )
            const error = [
              new GraphQLError(
                'Impossible de se connecter, veuillez réessayer.',
              ),
            ]

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
