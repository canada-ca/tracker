import { dbNameFromFile } from 'arango-tools'
import { ensureDatabase as ensure } from '../../../testUtilities'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { setupI18n } from '@lingui/core'
import { v4 as uuidv4 } from 'uuid'
import jwt from 'jsonwebtoken'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { cleanseInput } from '../../../validators'
import { loadUserByKey } from '../../loaders'
import { tokenize } from '../../../auth'
import dbschema from '../../../../database.json'
import { collectionNames } from '../../../collection-names'
import ms from 'ms'

const {
  DB_PASS: rootPass,
  DB_URL: url,
  REFRESH_KEY,
  REFRESH_TOKEN_EXPIRY,
  AUTH_TOKEN_EXPIRY,
  SIGN_IN_KEY,
} = process.env

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
  })
  afterEach(() => {
    consoleOutput.length = 0
  })

  describe('given a successful refresh', () => {
    beforeAll(async () => {
      ;({ query, drop, truncate, collections, transaction } = await ensure({
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
    afterEach(async () => {
      await truncate()
    })
    afterAll(async () => {
      await drop()
    })
    describe('user has rememberMe disabled', () => {
      beforeEach(async () => {
        user = await collections.users.save({
          userName: 'test.account@istio.actually.exists',
          displayName: 'Test Account',
          phoneValidated: false,
          emailValidated: false,
          tfaCode: null,
          refreshInfo: {
            refreshId: '1234',
            expiresAt: '2021-07-01T12:00:00',
            rememberMe: false,
          },
        })
      })
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

        const response = await graphql({
          schema,
          source: `
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
          rootValue: null,
          contextValue: {
            query,
            collections: collectionNames,
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
        })

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
          expires: 0,
          sameSite: true,
          secure: true,
        })
        expect(consoleOutput).toEqual([`User: ${user._key} successfully refreshed their tokens.`])
      })
    })
    describe('user has rememberMe enabled', () => {
      beforeEach(async () => {
        user = await collections.users.save({
          userName: 'test.account@istio.actually.exists',
          displayName: 'Test Account',
          phoneValidated: false,
          emailValidated: false,
          tfaCode: null,
          refreshInfo: {
            refreshId: '1234',
            expiresAt: '2021-07-01T12:00:00',
            rememberMe: true,
          },
        })
      })
      it('returns a new auth, and refresh token', async () => {
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

        const authToken = tokenize({
          expiresIn: AUTH_TOKEN_EXPIRY,
          parameters: { userKey: user._key },
          secret: String(SIGN_IN_KEY),
        })
        const refreshToken = tokenize({
          expiresIn: REFRESH_TOKEN_EXPIRY,
          parameters: { userKey: user._key, uuid: '1234' },
          secret: String(REFRESH_KEY),
        })

        const mockedTokenize = jest.fn().mockReturnValueOnce(authToken).mockReturnValueOnce(refreshToken)

        const mockedRequest = { cookies: { refresh_token: refreshToken } }

        const response = await graphql({
          schema,
          source: `
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
          rootValue: null,
          contextValue: {
            query,
            collections: collectionNames,
            transaction,
            uuidv4,
            jwt,
            moment: mockedMoment,
            request: mockedRequest,
            response: mockedResponse,
            auth: {
              tokenize: mockedTokenize,
            },
            validators: {
              cleanseInput,
            },
            loaders: {
              loadUserByKey: loadUserByKey({ query }),
            },
          },
        })

        const expectedResult = {
          data: {
            refreshTokens: {
              result: {
                authToken: authToken,
                user: {
                  displayName: 'Test Account',
                },
              },
            },
          },
        }

        expect(response).toEqual(expectedResult)
        expect(mockedCookie).toHaveBeenCalledWith('refresh_token', refreshToken, {
          httpOnly: true,
          maxAge: ms(REFRESH_TOKEN_EXPIRY),
          sameSite: true,
          secure: true,
        })
        expect(consoleOutput).toEqual([`User: ${user._key} successfully refreshed their tokens.`])
      })
    })
  })
  describe('given an unsuccessful refresh', () => {
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

            const response = await graphql({
              schema,
              source: `
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
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
            })

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
            expect(consoleOutput).toEqual([`User attempted to refresh tokens without refresh_token set.`])
          })
        })
        describe('refresh token is invalid', () => {
          it('returns an error', async () => {
            const refreshToken = tokenize({
              parameters: { userKey: 123, uuid: '1234' },
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

            const response = await graphql({
              schema,
              source: `
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
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
            })

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

            const response = await graphql({
              schema,
              source: `
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
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
                  loadUserByKey: {
                    load: jest.fn().mockReturnValue(undefined),
                  },
                },
              },
            })

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
            expect(consoleOutput).toEqual([`User: 1234 attempted to refresh tokens with an invalid user id.`])
          })
        })
        describe('if the token is expired', () => {
          it('returns an error', async () => {
            const refreshToken = tokenize({
              parameters: { userKey: 123, uuid: '1234' },
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

            const response = await graphql({
              schema,
              source: `
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
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
                  loadUserByKey: {
                    load: jest.fn().mockReturnValue({
                      refreshInfo: {
                        expiresAt: '',
                      },
                    }),
                  },
                },
              },
            })

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
            expect(consoleOutput).toEqual([`User: 123 attempted to refresh tokens with an expired uuid.`])
          })
        })
        describe('if the uuids do not match', () => {
          it('returns an error', async () => {
            const refreshToken = tokenize({
              parameters: { userKey: 123, uuid: '5678' },
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

            const response = await graphql({
              schema,
              source: `
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
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
                  loadUserByKey: {
                    load: jest.fn().mockReturnValue({
                      refreshInfo: {
                        expiresAt: '',
                      },
                    }),
                  },
                },
              },
            })

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
            expect(consoleOutput).toEqual([`User: 123 attempted to refresh tokens with non matching uuids.`])
          })
        })
      })
      describe('transaction step error occurs', () => {
        describe('when upserting new refreshId', () => {
          it('throws an error', async () => {
            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest.fn().mockRejectedValue(new Error('Transaction step error')),
              abort: jest.fn(),
            })

            const refreshToken = tokenize({
              parameters: { userKey: 123, uuid: '1234' },
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

            const response = await graphql({
              schema,
              source: `
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
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
                  loadUserByKey: {
                    load: jest.fn().mockReturnValue({
                      refreshInfo: {
                        expiresAt: '',
                        refreshId: '1234',
                      },
                    }),
                  },
                },
              },
            })

            const error = [new GraphQLError('Unable to refresh tokens, please sign in.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred when attempting to refresh tokens for user: 123: Error: Transaction step error`,
            ])
          })
        })
      })
      describe('transaction commit error occurs', () => {
        describe('when upserting new refreshId', () => {
          it('throws an error', async () => {
            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest.fn().mockReturnValue({}),
              commit: jest.fn().mockRejectedValue(new Error('Transaction commit error')),
              abort: jest.fn(),
            })

            const refreshToken = tokenize({
              parameters: { userKey: 123, uuid: '1234' },
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

            const response = await graphql({
              schema,
              source: `
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
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
                  loadUserByKey: {
                    load: jest.fn().mockReturnValue({
                      refreshInfo: {
                        expiresAt: '',
                        refreshId: '1234',
                      },
                    }),
                  },
                },
              },
            })

            const error = [new GraphQLError('Unable to refresh tokens, please sign in.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx commit error occurred while user: 123 attempted to refresh tokens: Error: Transaction commit error`,
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

            const response = await graphql({
              schema,
              source: `
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
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
            })

            const expectedResult = {
              data: {
                refreshTokens: {
                  result: {
                    code: 400,
                    description: 'Impossible de rafraîchir les jetons, veuillez vous connecter.',
                  },
                },
              },
            }

            expect(response).toEqual(expectedResult)
            expect(consoleOutput).toEqual([`User attempted to refresh tokens without refresh_token set.`])
          })
        })
        describe('refresh token is invalid', () => {
          it('returns an error', async () => {
            const refreshToken = tokenize({
              parameters: { userKey: 123, uuid: '1234' },
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

            const response = await graphql({
              schema,
              source: `
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
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
            })

            const expectedResult = {
              data: {
                refreshTokens: {
                  result: {
                    code: 400,
                    description: 'Impossible de rafraîchir les jetons, veuillez vous connecter.',
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

            const response = await graphql({
              schema,
              source: `
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
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
                  loadUserByKey: {
                    load: jest.fn().mockReturnValue(undefined),
                  },
                },
              },
            })

            const expectedResult = {
              data: {
                refreshTokens: {
                  result: {
                    code: 400,
                    description: 'Impossible de rafraîchir les jetons, veuillez vous connecter.',
                  },
                },
              },
            }

            expect(response).toEqual(expectedResult)
            expect(consoleOutput).toEqual([`User: 1234 attempted to refresh tokens with an invalid user id.`])
          })
        })
        describe('if the token is expired', () => {
          it('returns an error', async () => {
            const refreshToken = tokenize({
              parameters: { userKey: 123, uuid: '1234' },
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

            const response = await graphql({
              schema,
              source: `
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
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
                  loadUserByKey: {
                    load: jest.fn().mockReturnValue({
                      refreshInfo: {
                        expiresAt: '',
                      },
                    }),
                  },
                },
              },
            })

            const expectedResult = {
              data: {
                refreshTokens: {
                  result: {
                    code: 400,
                    description: 'Impossible de rafraîchir les jetons, veuillez vous connecter.',
                  },
                },
              },
            }

            expect(response).toEqual(expectedResult)
            expect(consoleOutput).toEqual([`User: 123 attempted to refresh tokens with an expired uuid.`])
          })
        })
        describe('if the uuids do not match', () => {
          it('returns an error', async () => {
            const refreshToken = tokenize({
              parameters: { userKey: 123, uuid: '5678' },
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

            const response = await graphql({
              schema,
              source: `
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
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
                  loadUserByKey: {
                    load: jest.fn().mockReturnValue({
                      refreshInfo: {
                        expiresAt: '',
                      },
                    }),
                  },
                },
              },
            })

            const expectedResult = {
              data: {
                refreshTokens: {
                  result: {
                    code: 400,
                    description: 'Impossible de rafraîchir les jetons, veuillez vous connecter.',
                  },
                },
              },
            }

            expect(response).toEqual(expectedResult)
            expect(consoleOutput).toEqual([`User: 123 attempted to refresh tokens with non matching uuids.`])
          })
        })
      })
      describe('transaction step error occurs', () => {
        describe('when upserting new refreshId', () => {
          it('throws an error', async () => {
            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest.fn().mockRejectedValue(new Error('Transaction step error')),
              abort: jest.fn(),
            })

            const refreshToken = tokenize({
              parameters: { userKey: 123, uuid: '1234' },
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

            const response = await graphql({
              schema,
              source: `
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
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
                  loadUserByKey: {
                    load: jest.fn().mockReturnValue({
                      refreshInfo: {
                        expiresAt: '',
                        refreshId: '1234',
                      },
                    }),
                  },
                },
              },
            })

            const error = [new GraphQLError('Impossible de rafraîchir les jetons, veuillez vous connecter.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred when attempting to refresh tokens for user: 123: Error: Transaction step error`,
            ])
          })
        })
      })
      describe('transaction commit error occurs', () => {
        describe('when upserting new refreshId', () => {
          it('throws an error', async () => {
            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest.fn().mockReturnValue({}),
              commit: jest.fn().mockRejectedValue(new Error('Transaction commit error')),
              abort: jest.fn(),
            })

            const refreshToken = tokenize({
              parameters: { userKey: 123, uuid: '1234' },
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

            const response = await graphql({
              schema,
              source: `
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
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
                  loadUserByKey: {
                    load: jest.fn().mockReturnValue({
                      refreshInfo: {
                        expiresAt: '',
                        refreshId: '1234',
                      },
                    }),
                  },
                },
              },
            })

            const error = [new GraphQLError('Impossible de rafraîchir les jetons, veuillez vous connecter.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx commit error occurred while user: 123 attempted to refresh tokens: Error: Transaction commit error`,
            ])
          })
        })
      })
    })
  })
})
