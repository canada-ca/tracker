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
  let query, drop, truncate, schema, collections, transaction, user

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
    ;({ query, drop, truncate, collections, transaction } = await ensure({
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
      refreshInfo: {
        refreshId: '1234',
        expiresAt: '2021-07-01T12:00:00',
      },
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
      const refreshToken = tokenize({
        parameters: { userKey: user._key, uuid: '1234' },
        expPeriod: 168,
        secret: String(REFRESH_KEY),
      })
      const mockedRequest = { cookies: { refresh_token: refreshToken } }

      const mockedFormat = jest
        .fn()
        .mockReturnValueOnce('2021-06-30T12:00:00')
        .mockReturnValueOnce('2021-07-01T12:00:00')
      const mockedMoment = jest.fn().mockReturnValue({
        format: mockedFormat,
        isAfter: jest.fn().mockReturnValue(false),
      })

      const mockedCookie = jest.fn()
      const mockedResponse = { cookie: mockedCookie }

      const response = await graphql(
        schema,
        `
          mutation {
            refreshTokens(input: {}) {
              result {
                ... on AuthResult {
                  authToken
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
          collections,
          transaction,
          uuidv4,
          jwt,
          moment: mockedMoment,
          request: mockedRequest,
          response: mockedResponse,
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
              user: {
                displayName: 'Test Account',
              },
            },
          },
        },
      }

      expect(response).toEqual(expectedResult)
      expect(mockedCookie).toHaveBeenCalledWith('refresh_token', 'token', {
        httpOnly: true,
        maxAge: 86400000,
        sameSite: true,
        secure: false,
      })
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
      describe('refresh token is undefined', () => {
        it('returns an error', async () => {
          const mockedRequest = { cookies: {} }
          const mockedFormat = jest
            .fn()
            .mockReturnValueOnce('2021-06-30T12:00:00')
            .mockReturnValueOnce('2021-07-01T12:00:00')
          const mockedMoment = jest.fn().mockReturnValue({
            format: mockedFormat,
            isAfter: jest.fn().mockReturnValue(false),
          })

          const response = await graphql(
            schema,
            `
              mutation {
                refreshTokens(input: {}) {
                  result {
                    ... on AuthResult {
                      authToken
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
              collections,
              transaction,
              uuidv4,
              jwt,
              moment: mockedMoment,
              request: mockedRequest,
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
            `User attempted to refresh tokens without refresh_token set.`,
          ])
        })
      })
      describe('refresh token is invalid', () => {
        it('returns an error', async () => {
          const refreshToken = tokenize({
            parameters: { userKey: user._key, uuid: '1234' },
            expPeriod: 168,
            secret: 'invalid-token',
          })
          const mockedRequest = { cookies: { refresh_token: refreshToken } }
          const mockedFormat = jest
            .fn()
            .mockReturnValueOnce('2021-06-30T12:00:00')
            .mockReturnValueOnce('2021-07-01T12:00:00')
          const mockedMoment = jest.fn().mockReturnValue({
            format: mockedFormat,
            isAfter: jest.fn().mockReturnValue(false),
          })

          const response = await graphql(
            schema,
            `
              mutation {
                refreshTokens(input: {}) {
                  result {
                    ... on AuthResult {
                      authToken
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
              collections,
              transaction,
              uuidv4,
              jwt,
              moment: mockedMoment,
              request: mockedRequest,
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
            `User attempted to verify refresh token, however the token is invalid: JsonWebTokenError: invalid signature`,
          ])
        })
      })
      describe('user is undefined', () => {
        it('returns an error', async () => {
          const refreshToken = tokenize({
            parameters: { userKey: '1234', uuid: '1234' },
            expPeriod: 168,
            secret: String(REFRESH_KEY),
          })
          const mockedRequest = { cookies: { refresh_token: refreshToken } }
          const mockedFormat = jest
            .fn()
            .mockReturnValueOnce('2021-06-30T12:00:00')
            .mockReturnValueOnce('2021-07-01T12:00:00')
          const mockedMoment = jest.fn().mockReturnValue({
            format: mockedFormat,
            isAfter: jest.fn().mockReturnValue(false),
          })

          const response = await graphql(
            schema,
            `
              mutation {
                refreshTokens(input: {}) {
                  result {
                    ... on AuthResult {
                      authToken
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
              collections,
              transaction,
              uuidv4,
              jwt,
              moment: mockedMoment,
              request: mockedRequest,
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
            `User: 1234 attempted to refresh tokens with an invalid user id.`,
          ])
        })
      })
      describe('if the token is expired', () => {
        it('returns an error', async () => {
          const refreshToken = tokenize({
            parameters: { userKey: user._key, uuid: '1234' },
            expPeriod: 168,
            secret: String(REFRESH_KEY),
          })
          const mockedRequest = { cookies: { refresh_token: refreshToken } }
          const mockedFormat = jest
            .fn()
            .mockReturnValueOnce('2021-06-30T12:00:00')
            .mockReturnValueOnce('2021-07-01T12:00:00')
          const mockedMoment = jest.fn().mockReturnValue({
            format: mockedFormat,
            isAfter: jest.fn().mockReturnValue(true),
          })

          const response = await graphql(
            schema,
            `
              mutation {
                refreshTokens(input: {}) {
                  result {
                    ... on AuthResult {
                      authToken
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
              collections,
              transaction,
              uuidv4,
              jwt,
              moment: mockedMoment,
              request: mockedRequest,
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
            `User: ${user._key} attempted to refresh tokens with an expired uuid.`,
          ])
        })
      })
      describe('if the uuids do not match', () => {
        it('returns an error', async () => {
          const refreshToken = tokenize({
            parameters: { userKey: user._key, uuid: '5678' },
            expPeriod: 168,
            secret: String(REFRESH_KEY),
          })
          const mockedRequest = { cookies: { refresh_token: refreshToken } }
          const mockedFormat = jest
            .fn()
            .mockReturnValueOnce('2021-06-30T12:00:00')
            .mockReturnValueOnce('2021-07-01T12:00:00')
          const mockedMoment = jest.fn().mockReturnValue({
            format: mockedFormat,
            isAfter: jest.fn().mockReturnValue(false),
          })

          const response = await graphql(
            schema,
            `
              mutation {
                refreshTokens(input: {}) {
                  result {
                    ... on AuthResult {
                      authToken
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
              collections,
              transaction,
              uuidv4,
              jwt,
              moment: mockedMoment,
              request: mockedRequest,
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
            `User: ${user._key} attempted to refresh tokens with non matching uuids.`,
          ])
        })
      })
    })
    describe('transaction step error occurs', () => {
      describe('when upserting new refreshId', () => {
        it('throws an error', async () => {
          const mockedTransaction = jest.fn().mockReturnValue({
            step: jest
              .fn()
              .mockRejectedValue(new Error('Transaction step error')),
          })

          const refreshToken = tokenize({
            parameters: { userKey: user._key, uuid: '1234' },
            expPeriod: 168,
            secret: String(REFRESH_KEY),
          })
          const mockedRequest = { cookies: { refresh_token: refreshToken } }
          const mockedFormat = jest
            .fn()
            .mockReturnValueOnce('2021-06-30T12:00:00')
            .mockReturnValueOnce('2021-07-01T12:00:00')
          const mockedMoment = jest.fn().mockReturnValue({
            format: mockedFormat,
            isAfter: jest.fn().mockReturnValue(false),
          })

          const response = await graphql(
            schema,
            `
              mutation {
                refreshTokens(input: {}) {
                  result {
                    ... on AuthResult {
                      authToken
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
              collections,
              transaction: mockedTransaction,
              uuidv4,
              jwt,
              moment: mockedMoment,
              request: mockedRequest,
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
            `Trx step error occurred when attempting to refresh tokens for user: ${user._key}: Error: Transaction step error`,
          ])
        })
      })
    })
    describe('transaction commit error occurs', () => {
      describe('when upserting new refreshId', () => {
        it('throws an error', async () => {
          const mockedTransaction = jest.fn().mockReturnValue({
            step: jest.fn().mockReturnValue({}),
            commit: jest
              .fn()
              .mockRejectedValue(new Error('Transaction commit error')),
          })

          const refreshToken = tokenize({
            parameters: { userKey: user._key, uuid: '1234' },
            expPeriod: 168,
            secret: String(REFRESH_KEY),
          })
          const mockedRequest = { cookies: { refresh_token: refreshToken } }

          const mockedFormat = jest
            .fn()
            .mockReturnValueOnce('2021-06-30T12:00:00')
            .mockReturnValueOnce('2021-07-01T12:00:00')
          const mockedMoment = jest.fn().mockReturnValue({
            format: mockedFormat,
            isAfter: jest.fn().mockReturnValue(false),
          })

          const response = await graphql(
            schema,
            `
              mutation {
                refreshTokens(input: {}) {
                  result {
                    ... on AuthResult {
                      authToken
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
              collections,
              transaction: mockedTransaction,
              uuidv4,
              jwt,
              moment: mockedMoment,
              request: mockedRequest,
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
            `Trx commit error occurred while user: ${user._key} attempted to refresh tokens: Error: Transaction commit error`,
          ])
        })
      })
    })
  })
  describe('users language is set to french', () => {
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
      describe('refresh token is undefined', () => {
        it('returns an error', async () => {
          const mockedRequest = { cookies: {} }
          const mockedFormat = jest
            .fn()
            .mockReturnValueOnce('2021-06-30T12:00:00')
            .mockReturnValueOnce('2021-07-01T12:00:00')
          const mockedMoment = jest.fn().mockReturnValue({
            format: mockedFormat,
            isAfter: jest.fn().mockReturnValue(false),
          })

          const response = await graphql(
            schema,
            `
              mutation {
                refreshTokens(input: {}) {
                  result {
                    ... on AuthResult {
                      authToken
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
              collections,
              transaction,
              uuidv4,
              jwt,
              moment: mockedMoment,
              request: mockedRequest,
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
                  description:
                    'Impossible de rafraîchir les jetons, veuillez vous connecter.',
                },
              },
            },
          }

          expect(response).toEqual(expectedResult)
          expect(consoleOutput).toEqual([
            `User attempted to refresh tokens without refresh_token set.`,
          ])
        })
      })
      describe('refresh token is invalid', () => {
        it('returns an error', async () => {
          const refreshToken = tokenize({
            parameters: { userKey: user._key, uuid: '1234' },
            expPeriod: 168,
            secret: 'invalid-token',
          })
          const mockedRequest = { cookies: { refresh_token: refreshToken } }
          const mockedFormat = jest
            .fn()
            .mockReturnValueOnce('2021-06-30T12:00:00')
            .mockReturnValueOnce('2021-07-01T12:00:00')
          const mockedMoment = jest.fn().mockReturnValue({
            format: mockedFormat,
            isAfter: jest.fn().mockReturnValue(false),
          })

          const response = await graphql(
            schema,
            `
              mutation {
                refreshTokens(input: {}) {
                  result {
                    ... on AuthResult {
                      authToken
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
              collections,
              transaction,
              uuidv4,
              jwt,
              moment: mockedMoment,
              request: mockedRequest,
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
                  description:
                    'Impossible de rafraîchir les jetons, veuillez vous connecter.',
                },
              },
            },
          }

          expect(response).toEqual(expectedResult)
          expect(consoleOutput).toEqual([
            `User attempted to verify refresh token, however the token is invalid: JsonWebTokenError: invalid signature`,
          ])
        })
      })
      describe('user is undefined', () => {
        it('returns an error', async () => {
          const refreshToken = tokenize({
            parameters: { userKey: '1234', uuid: '1234' },
            expPeriod: 168,
            secret: String(REFRESH_KEY),
          })
          const mockedRequest = { cookies: { refresh_token: refreshToken } }
          const mockedFormat = jest
            .fn()
            .mockReturnValueOnce('2021-06-30T12:00:00')
            .mockReturnValueOnce('2021-07-01T12:00:00')
          const mockedMoment = jest.fn().mockReturnValue({
            format: mockedFormat,
            isAfter: jest.fn().mockReturnValue(false),
          })

          const response = await graphql(
            schema,
            `
              mutation {
                refreshTokens(input: {}) {
                  result {
                    ... on AuthResult {
                      authToken
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
              collections,
              transaction,
              uuidv4,
              jwt,
              moment: mockedMoment,
              request: mockedRequest,
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
                  description:
                    'Impossible de rafraîchir les jetons, veuillez vous connecter.',
                },
              },
            },
          }

          expect(response).toEqual(expectedResult)
          expect(consoleOutput).toEqual([
            `User: 1234 attempted to refresh tokens with an invalid user id.`,
          ])
        })
      })
      describe('if the token is expired', () => {
        it('returns an error', async () => {
          const refreshToken = tokenize({
            parameters: { userKey: user._key, uuid: '1234' },
            expPeriod: 168,
            secret: String(REFRESH_KEY),
          })
          const mockedRequest = { cookies: { refresh_token: refreshToken } }
          const mockedFormat = jest
            .fn()
            .mockReturnValueOnce('2021-06-30T12:00:00')
            .mockReturnValueOnce('2021-07-01T12:00:00')
          const mockedMoment = jest.fn().mockReturnValue({
            format: mockedFormat,
            isAfter: jest.fn().mockReturnValue(true),
          })

          const response = await graphql(
            schema,
            `
              mutation {
                refreshTokens(input: {}) {
                  result {
                    ... on AuthResult {
                      authToken
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
              collections,
              transaction,
              uuidv4,
              jwt,
              moment: mockedMoment,
              request: mockedRequest,
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
                  description:
                    'Impossible de rafraîchir les jetons, veuillez vous connecter.',
                },
              },
            },
          }

          expect(response).toEqual(expectedResult)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to refresh tokens with an expired uuid.`,
          ])
        })
      })
      describe('if the uuids do not match', () => {
        it('returns an error', async () => {
          const refreshToken = tokenize({
            parameters: { userKey: user._key, uuid: '5678' },
            expPeriod: 168,
            secret: String(REFRESH_KEY),
          })
          const mockedRequest = { cookies: { refresh_token: refreshToken } }
          const mockedFormat = jest
            .fn()
            .mockReturnValueOnce('2021-06-30T12:00:00')
            .mockReturnValueOnce('2021-07-01T12:00:00')
          const mockedMoment = jest.fn().mockReturnValue({
            format: mockedFormat,
            isAfter: jest.fn().mockReturnValue(false),
          })

          const response = await graphql(
            schema,
            `
              mutation {
                refreshTokens(input: {}) {
                  result {
                    ... on AuthResult {
                      authToken
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
              collections,
              transaction,
              uuidv4,
              jwt,
              moment: mockedMoment,
              request: mockedRequest,
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
                  description:
                    'Impossible de rafraîchir les jetons, veuillez vous connecter.',
                },
              },
            },
          }

          expect(response).toEqual(expectedResult)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to refresh tokens with non matching uuids.`,
          ])
        })
      })
    })
    describe('transaction step error occurs', () => {
      describe('when upserting new refreshId', () => {
        it('throws an error', async () => {
          const mockedTransaction = jest.fn().mockReturnValue({
            step: jest
              .fn()
              .mockRejectedValue(new Error('Transaction step error')),
          })

          const refreshToken = tokenize({
            parameters: { userKey: user._key, uuid: '1234' },
            expPeriod: 168,
            secret: String(REFRESH_KEY),
          })
          const mockedRequest = { cookies: { refresh_token: refreshToken } }
          const mockedFormat = jest
            .fn()
            .mockReturnValueOnce('2021-06-30T12:00:00')
            .mockReturnValueOnce('2021-07-01T12:00:00')
          const mockedMoment = jest.fn().mockReturnValue({
            format: mockedFormat,
            isAfter: jest.fn().mockReturnValue(false),
          })

          const response = await graphql(
            schema,
            `
              mutation {
                refreshTokens(input: {}) {
                  result {
                    ... on AuthResult {
                      authToken
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
              collections,
              transaction: mockedTransaction,
              uuidv4,
              jwt,
              moment: mockedMoment,
              request: mockedRequest,
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
            new GraphQLError(
              'Impossible de rafraîchir les jetons, veuillez vous connecter.',
            ),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Trx step error occurred when attempting to refresh tokens for user: ${user._key}: Error: Transaction step error`,
          ])
        })
      })
    })
    describe('transaction commit error occurs', () => {
      describe('when upserting new refreshId', () => {
        it('throws an error', async () => {
          const mockedTransaction = jest.fn().mockReturnValue({
            step: jest.fn().mockReturnValue({}),
            commit: jest
              .fn()
              .mockRejectedValue(new Error('Transaction commit error')),
          })

          const refreshToken = tokenize({
            parameters: { userKey: user._key, uuid: '1234' },
            expPeriod: 168,
            secret: String(REFRESH_KEY),
          })
          const mockedRequest = { cookies: { refresh_token: refreshToken } }

          const mockedFormat = jest
            .fn()
            .mockReturnValueOnce('2021-06-30T12:00:00')
            .mockReturnValueOnce('2021-07-01T12:00:00')
          const mockedMoment = jest.fn().mockReturnValue({
            format: mockedFormat,
            isAfter: jest.fn().mockReturnValue(false),
          })

          const response = await graphql(
            schema,
            `
              mutation {
                refreshTokens(input: {}) {
                  result {
                    ... on AuthResult {
                      authToken
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
              collections,
              transaction: mockedTransaction,
              uuidv4,
              jwt,
              moment: mockedMoment,
              request: mockedRequest,
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
            new GraphQLError(
              'Impossible de rafraîchir les jetons, veuillez vous connecter.',
            ),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Trx commit error occurred while user: ${user._key} attempted to refresh tokens: Error: Transaction commit error`,
          ])
        })
      })
    })
  })
})
