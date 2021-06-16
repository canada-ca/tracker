import { ensure, dbNameFromFile } from 'arango-tools'
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
import { loadUserByKey } from '../../loaders'
import { tokenize } from '../../../auth'

const { DB_PASS: rootPass, DB_URL: url, REFRESH_KEY } = process.env

describe('refresh users tokens', () => {
  let query, drop, truncate, schema, collections, user

  const consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  const mockedError = (output) => consoleOutput.push(output)

  beforeAll(async () => {
    console.info = mockedInfo
    console.warn = mockedWarn
    console.error = mockedError

    schema = new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createMutationSchema(),
    })
    ;({ query, drop, truncate, collections } = await ensure({
      type: 'database',
      name: dbNameFromFile(__filename),
      url,
      rootPassword: rootPass,
      options: databaseOptions({ rootPass }),
    }))
  })

  beforeEach(async () => {
    user = await collections.users.save({
      userName: 'test.account@istio.actually.exists',
      displayName: 'Test Account',
      preferredLang: 'english',
      phoneValidated: false,
      emailValidated: false,
      tfaCode: null,
      refreshId: '1234',
    })
  })

  afterEach(async () => {
    consoleOutput.length = 0
    await truncate()
  })

  afterAll(async () => {
    await drop()
  })

  describe('given a successful refresh', () => {
    it('returns a new auth, and refresh token', async () => {
      const authToken = tokenize({ parameters: { userKey: user._key } })
      const refreshToken = tokenize({
        parameters: { userKey: user._key, uuid: '1234' },
        expPeriod: 168,
        secret: String(REFRESH_KEY),
      })

      const response = await graphql(
        schema,
        `
          mutation {
            refreshTokens (
              input: {
                authToken: "${authToken}"
                refreshToken: "${refreshToken}"
              }
            ) {
              result {
                ... on AuthResult {
                  authToken
                  refreshToken
                  user {
                    displayName
                  }
                }
                ... on AuthenticateError {
                  code
                  description
                }
              }
            }
          }
        `,
        null,
        {
          query,
          uuidv4,
          jwt,
          auth: {
            tokenize: jest.fn().mockReturnValue('token'),
          },
          validators: {
            cleanseInput,
          },
          loaders: {
            loadUserByKey: loadUserByKey({ query }),
          },
        },
      )

      const expectedResult = {
        data: {
          refreshTokens: {
            result: {
              authToken: 'token',
              refreshToken: 'token',
              user: {
                displayName: 'Test Account',
              },
            },
          },
        },
      }

      expect(response).toEqual(expectedResult)
      expect(consoleOutput).toEqual([
        `User: ${user._key} successfully refreshed their tokens.`,
      ])
    })
  })
  describe('users language is set to english', () => {
    let i18n
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
    describe('given an unsuccessful refresh', () => {
      describe('auth token is invalid', () => {
        it('returns an error', async () => {
          const authToken = tokenize({
            parameters: { userKey: user._key },
            secret: 'invalid-token',
          })
          const refreshToken = tokenize({
            parameters: { userKey: user._key, uuid: '1234' },
            expPeriod: 168,
            secret: String(REFRESH_KEY),
          })

          const response = await graphql(
            schema,
            `
              mutation {
                refreshTokens (
                  input: {
                    authToken: "${authToken}"
                    refreshToken: "${refreshToken}"
                  }
                ) {
                  result {
                    ... on AuthResult {
                      authToken
                      refreshToken
                      user {
                        displayName
                      }
                    }
                    ... on AuthenticateError {
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
              uuidv4,
              jwt,
              auth: {
                tokenize: jest.fn().mockReturnValue('token'),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const expectedResult = {
            data: {
              refreshTokens: {
                result: {
                  code: 400,
                  description: 'Unable to refresh tokens, please sign in.',
                },
              },
            },
          }

          expect(response).toEqual(expectedResult)
          expect(consoleOutput).toEqual([
            `User attempted to verify auth token to refresh it, however secret was incorrect: JsonWebTokenError: invalid signature`,
          ])
        })
      })
      describe('refresh token is invalid', () => {
        it('returns an error', async () => {
          const authToken = tokenize({
            parameters: { userKey: user._key },
          })
          const refreshToken = tokenize({
            parameters: { userKey: user._key, uuid: '1234' },
            expPeriod: 168,
            secret: 'invalid-token',
          })

          const response = await graphql(
            schema,
            `
              mutation {
                refreshTokens (
                  input: {
                    authToken: "${authToken}"
                    refreshToken: "${refreshToken}"
                  }
                ) {
                  result {
                    ... on AuthResult {
                      authToken
                      refreshToken
                      user {
                        displayName
                      }
                    }
                    ... on AuthenticateError {
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
              uuidv4,
              jwt,
              auth: {
                tokenize: jest.fn().mockReturnValue('token'),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const expectedResult = {
            data: {
              refreshTokens: {
                result: {
                  code: 400,
                  description: 'Unable to refresh tokens, please sign in.',
                },
              },
            },
          }

          expect(response).toEqual(expectedResult)
          expect(consoleOutput).toEqual([
            `User attempted to verify refresh token, however it is invalid: JsonWebTokenError: invalid signature`,
          ])
        })
      })
      describe('user keys do not match', () => {
        it('returns an error', async () => {
          const authToken = tokenize({ parameters: { userKey: user._key } })
          const refreshToken = tokenize({
            parameters: { userKey: '1234', uuid: '1234' },
            expPeriod: 168,
            secret: String(REFRESH_KEY),
          })

          const response = await graphql(
            schema,
            `
              mutation {
                refreshTokens (
                  input: {
                    authToken: "${authToken}"
                    refreshToken: "${refreshToken}"
                  }
                ) {
                  result {
                    ... on AuthResult {
                      authToken
                      refreshToken
                      user {
                        displayName
                      }
                    }
                    ... on AuthenticateError {
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
              uuidv4,
              jwt,
              auth: {
                tokenize: jest.fn().mockReturnValue('token'),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const expectedResult = {
            data: {
              refreshTokens: {
                result: {
                  code: 400,
                  description: 'Unable to refresh tokens, please sign in.',
                },
              },
            },
          }

          expect(response).toEqual(expectedResult)
          expect(consoleOutput).toEqual([
            `User attempted to refresh their tokens however there was a mismatch with user keys authUserKey: ${user._key} !== refreshUserKey: 1234`,
          ])
        })
      })
      describe('refreshIds do not match', () => {
        it('returns an error', async () => {
          const authToken = tokenize({ parameters: { userKey: user._key } })
          const refreshToken = tokenize({
            parameters: { userKey: user._key, uuid: '5678' },
            expPeriod: 168,
            secret: String(REFRESH_KEY),
          })

          const response = await graphql(
            schema,
            `
              mutation {
                refreshTokens (
                  input: {
                    authToken: "${authToken}"
                    refreshToken: "${refreshToken}"
                  }
                ) {
                  result {
                    ... on AuthResult {
                      authToken
                      refreshToken
                      user {
                        displayName
                      }
                    }
                    ... on AuthenticateError {
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
              uuidv4,
              jwt,
              auth: {
                tokenize: jest.fn().mockReturnValue('token'),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const expectedResult = {
            data: {
              refreshTokens: {
                result: {
                  code: 400,
                  description: 'Unable to refresh tokens, please sign in.',
                },
              },
            },
          }

          expect(response).toEqual(expectedResult)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to refresh tokens with an old refresh token.`,
          ])
        })
      })
    })
    describe('database error occurs', () => {
      describe('when upserting new refreshId', () => {
        it('throws an error', async () => {
          const mockedQuery = jest
            .fn()
            .mockRejectedValue(new Error('Database error occurred.'))

          const authToken = tokenize({ parameters: { userKey: user._key } })
          const refreshToken = tokenize({
            parameters: { userKey: user._key, uuid: '1234' },
            expPeriod: 168,
            secret: String(REFRESH_KEY),
          })

          const response = await graphql(
            schema,
            `
              mutation {
                refreshTokens (
                  input: {
                    authToken: "${authToken}"
                    refreshToken: "${refreshToken}"
                  }
                ) {
                  result {
                    ... on AuthResult {
                      authToken
                      refreshToken
                      user {
                        displayName
                      }
                    }
                    ... on AuthenticateError {
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
              uuidv4,
              jwt,
              auth: {
                tokenize: jest.fn().mockReturnValue('token'),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const error = [
            new GraphQLError('Unable to refresh tokens, please sign in.'),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Database error occurred when attempting to refresh tokens for user: ${user._key}: Error: Database error occurred.`,
          ])
        })
      })
    })
  })
  describe('users language is set to english', () => {
    let i18n
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
    describe('given an unsuccessful refresh', () => {
      describe('auth token is invalid', () => {
        it('returns an error', async () => {
          const authToken = tokenize({
            parameters: { userKey: user._key },
            secret: 'invalid-token',
          })
          const refreshToken = tokenize({
            parameters: { userKey: user._key, uuid: '1234' },
            expPeriod: 168,
            secret: String(REFRESH_KEY),
          })

          const response = await graphql(
            schema,
            `
              mutation {
                refreshTokens (
                  input: {
                    authToken: "${authToken}"
                    refreshToken: "${refreshToken}"
                  }
                ) {
                  result {
                    ... on AuthResult {
                      authToken
                      refreshToken
                      user {
                        displayName
                      }
                    }
                    ... on AuthenticateError {
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
              uuidv4,
              jwt,
              auth: {
                tokenize: jest.fn().mockReturnValue('token'),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const expectedResult = {
            data: {
              refreshTokens: {
                result: {
                  code: 400,
                  description: 'todo',
                },
              },
            },
          }

          expect(response).toEqual(expectedResult)
          expect(consoleOutput).toEqual([
            `User attempted to verify auth token to refresh it, however secret was incorrect: JsonWebTokenError: invalid signature`,
          ])
        })
      })
      describe('refresh token is invalid', () => {
        it('returns an error', async () => {
          const authToken = tokenize({
            parameters: { userKey: user._key },
          })
          const refreshToken = tokenize({
            parameters: { userKey: user._key, uuid: '1234' },
            expPeriod: 168,
            secret: 'invalid-token',
          })

          const response = await graphql(
            schema,
            `
              mutation {
                refreshTokens (
                  input: {
                    authToken: "${authToken}"
                    refreshToken: "${refreshToken}"
                  }
                ) {
                  result {
                    ... on AuthResult {
                      authToken
                      refreshToken
                      user {
                        displayName
                      }
                    }
                    ... on AuthenticateError {
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
              uuidv4,
              jwt,
              auth: {
                tokenize: jest.fn().mockReturnValue('token'),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const expectedResult = {
            data: {
              refreshTokens: {
                result: {
                  code: 400,
                  description: 'todo',
                },
              },
            },
          }

          expect(response).toEqual(expectedResult)
          expect(consoleOutput).toEqual([
            `User attempted to verify refresh token, however it is invalid: JsonWebTokenError: invalid signature`,
          ])
        })
      })
      describe('user keys do not match', () => {
        it('returns an error', async () => {
          const authToken = tokenize({ parameters: { userKey: user._key } })
          const refreshToken = tokenize({
            parameters: { userKey: '1234', uuid: '1234' },
            expPeriod: 168,
            secret: String(REFRESH_KEY),
          })

          const response = await graphql(
            schema,
            `
              mutation {
                refreshTokens (
                  input: {
                    authToken: "${authToken}"
                    refreshToken: "${refreshToken}"
                  }
                ) {
                  result {
                    ... on AuthResult {
                      authToken
                      refreshToken
                      user {
                        displayName
                      }
                    }
                    ... on AuthenticateError {
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
              uuidv4,
              jwt,
              auth: {
                tokenize: jest.fn().mockReturnValue('token'),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const expectedResult = {
            data: {
              refreshTokens: {
                result: {
                  code: 400,
                  description: 'todo',
                },
              },
            },
          }

          expect(response).toEqual(expectedResult)
          expect(consoleOutput).toEqual([
            `User attempted to refresh their tokens however there was a mismatch with user keys authUserKey: ${user._key} !== refreshUserKey: 1234`,
          ])
        })
      })
      describe('refreshIds do not match', () => {
        it('returns an error', async () => {
          const authToken = tokenize({ parameters: { userKey: user._key } })
          const refreshToken = tokenize({
            parameters: { userKey: user._key, uuid: '5678' },
            expPeriod: 168,
            secret: String(REFRESH_KEY),
          })

          const response = await graphql(
            schema,
            `
              mutation {
                refreshTokens (
                  input: {
                    authToken: "${authToken}"
                    refreshToken: "${refreshToken}"
                  }
                ) {
                  result {
                    ... on AuthResult {
                      authToken
                      refreshToken
                      user {
                        displayName
                      }
                    }
                    ... on AuthenticateError {
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
              uuidv4,
              jwt,
              auth: {
                tokenize: jest.fn().mockReturnValue('token'),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const expectedResult = {
            data: {
              refreshTokens: {
                result: {
                  code: 400,
                  description: 'todo',
                },
              },
            },
          }

          expect(response).toEqual(expectedResult)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to refresh tokens with an old refresh token.`,
          ])
        })
      })
    })
    describe('database error occurs', () => {
      describe('when upserting new refreshId', () => {
        it('throws an error', async () => {
          const mockedQuery = jest
            .fn()
            .mockRejectedValue(new Error('Database error occurred.'))

          const authToken = tokenize({ parameters: { userKey: user._key } })
          const refreshToken = tokenize({
            parameters: { userKey: user._key, uuid: '1234' },
            expPeriod: 168,
            secret: String(REFRESH_KEY),
          })

          const response = await graphql(
            schema,
            `
              mutation {
                refreshTokens (
                  input: {
                    authToken: "${authToken}"
                    refreshToken: "${refreshToken}"
                  }
                ) {
                  result {
                    ... on AuthResult {
                      authToken
                      refreshToken
                      user {
                        displayName
                      }
                    }
                    ... on AuthenticateError {
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
              uuidv4,
              jwt,
              auth: {
                tokenize: jest.fn().mockReturnValue('token'),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const error = [
            new GraphQLError('todo'),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Database error occurred when attempting to refresh tokens for user: ${user._key}: Error: Database error occurred.`,
          ])
        })
      })
    })
  })
})
