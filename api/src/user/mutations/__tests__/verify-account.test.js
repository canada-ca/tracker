import { dbNameFromFile } from 'arango-tools'
import { ensureDatabase as ensure } from '../../../testUtilities'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { cleanseInput } from '../../../validators'
import { tokenize, verifyToken } from '../../../auth'
import { loadUserByKey, loadUserByUserName } from '../../loaders'
import dbschema from '../../../../database.json'
import { collectionNames } from '../../../collection-names'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('user send password reset email', () => {
  let query, drop, truncate, collections, transaction, schema, request, i18n
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
    request = {
      protocol: 'https',
      get: (text) => text,
    }
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
    consoleOutput.length = 0
    await truncate()
  })
  afterAll(async () => {
    await drop()
  })

  describe('given a successful validation', () => {
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
      beforeEach(async () => {
        await collections.users.save({
          userName: 'test.account@istio.actually.exists',
          displayName: 'Test Account',
          tfaValidated: false,
          emailValidated: false,
        })
      })
      it('returns a successful status message and update username', async () => {
        const previousUserName = 'test.account@istio.actually.exists'
        let cursor = await query`
            FOR user IN users
                FILTER user.userName == ${previousUserName}
                RETURN user
          `
        let user = await cursor.next()

        const newUserName = 'john.doe@istio.actually.works'

        const token = tokenize({ parameters: { userKey: user._key, userName: newUserName } })

        const sendUpdatedUserNameEmail = jest.fn()

        const response = await graphql({
          schema,
          source: `
            mutation {
              verifyAccount(input: { verifyTokenString: "${token}" }) {
                result {
                  ... on VerifyAccountResult {
                    status
                  }
                  ... on VerifyAccountError {
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
            request,
            userKey: user._key,
            query,
            collections: collectionNames,
            transaction,
            auth: {
              verifyToken: verifyToken({}),
            },
            validators: {
              cleanseInput,
            },
            loaders: {
              loadUserByKey: loadUserByKey({ query }),
              loadUserByUserName: loadUserByUserName({ query }),
            },
            notify: { sendUpdatedUserNameEmail },
          },
        })

        const expectedResult = {
          data: {
            verifyAccount: {
              result: {
                status: 'Successfully email verified account.',
              },
            },
          },
        }

        expect(sendUpdatedUserNameEmail).toHaveBeenCalledWith({
          previousUserName: previousUserName,
          newUserName: newUserName,
          displayName: user.displayName,
          userKey: user._key,
        })

        cursor = await query`
            FOR user IN users
                FILTER user.userName == ${newUserName}
                RETURN user
          `
        user = await cursor.next()

        expect(user.emailValidated).toEqual(true)

        expect(response).toEqual(expectedResult)
        expect(consoleOutput).toEqual([`User: ${user._key} successfully email validated their account.`])
      })
    })
  })
  describe('given an unsuccessful validation', () => {
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
      describe('userKey cannot be found in token parameters', () => {
        it('returns an error message', async () => {
          const token = tokenize({
            parameters: {},
          })

          const response = await graphql({
            schema,
            source: `
                mutation {
                  verifyAccount(input: { verifyTokenString: "${token}" }) {
                    result {
                      ... on VerifyAccountResult {
                        status
                      }
                      ... on VerifyAccountError {
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
              request,
              userKey: 123,
              query,
              collections: collectionNames,
              transaction,
              auth: {
                verifyToken: verifyToken({}),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadUserByKey: {
                  load: jest.fn().mockReturnValue({
                    userName: 'test.account@istio.actually.exists',
                    displayName: 'Test Account',
                    tfaValidated: false,
                    emailValidated: false,
                  }),
                },
                loadUserByUserName: loadUserByUserName({ query }),
              },
              notify: { sendUpdatedUserNameEmail: jest.fn() },
            },
          })

          const error = {
            data: {
              verifyAccount: {
                result: {
                  code: 400,
                  description: 'Unable to verify account. Please request a new email.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `When validating account, user attempted to verify account, but userKey is not located in the token parameters.`,
          ])
        })
      })
      describe('userKey in token is undefined', () => {
        it('returns an error message', async () => {
          const token = tokenize({
            parameters: { userKey: undefined },
          })

          const response = await graphql({
            schema,
            source: `
                mutation {
                  verifyAccount(input: { verifyTokenString: "${token}" }) {
                    result {
                      ... on VerifyAccountResult {
                        status
                      }
                      ... on VerifyAccountError {
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
              request,
              userKey: 123,
              query,
              collections: collectionNames,
              transaction,
              auth: {
                verifyToken: verifyToken({}),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadUserByKey: {
                  load: jest.fn().mockReturnValue({
                    userName: 'test.account@istio.actually.exists',
                    displayName: 'Test Account',
                    tfaValidated: false,
                    emailValidated: false,
                  }),
                },
                loadUserByUserName: loadUserByUserName({ query }),
              },
              notify: { sendUpdatedUserNameEmail: jest.fn() },
            },
          })

          const error = {
            data: {
              verifyAccount: {
                result: {
                  code: 400,
                  description: 'Unable to verify account. Please request a new email.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `When validating account, user attempted to verify account, but userKey is not located in the token parameters.`,
          ])
        })
      })
      describe('user cannot be found in db', () => {
        it('returns an error message', async () => {
          const token = tokenize({
            parameters: { userKey: 1, userName: 'john.doe@istio.actually.exists' },
          })
          const response = await graphql({
            schema,
            source: `
                mutation {
                  verifyAccount(input: { verifyTokenString: "${token}" }) {
                    result {
                      ... on VerifyAccountResult {
                        status
                      }
                      ... on VerifyAccountError {
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
              request,
              userKey: 1,
              query,
              collections: collectionNames,
              transaction,
              auth: {
                verifyToken: verifyToken({}),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadUserByKey: {
                  load: jest.fn().mockReturnValue(undefined),
                },
                loadUserByUserName: loadUserByUserName({ query }),
              },
              notify: { sendUpdatedUserNameEmail: jest.fn() },
            },
          })

          const error = {
            data: {
              verifyAccount: {
                result: {
                  code: 400,
                  description: 'Unable to verify account. Please request a new email.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 1 attempted to verify account, however no account is associated with this id.`,
          ])
        })
      })
      describe('transaction step error occurs', () => {
        describe('when upserting validation', () => {
          it('throws an error', async () => {
            const token = tokenize({
              parameters: { userKey: 123, userName: 'john.doe@istio.actually.exists' },
            })

            const response = await graphql({
              schema,
              source: `
                mutation {
                  verifyAccount(input: { verifyTokenString: "${token}" }) {
                    result {
                      ... on VerifyAccountResult {
                        status
                      }
                      ... on VerifyAccountError {
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
                request,
                userKey: 123,
                query,
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn().mockRejectedValue(new Error('Transaction step error occurred.')),
                  abort: jest.fn(),
                }),
                auth: {
                  verifyToken: verifyToken({}),
                },
                validators: {
                  cleanseInput,
                },
                loaders: {
                  loadUserByKey: {
                    load: jest.fn().mockReturnValue({
                      _key: 123,
                      userName: 'test.account@istio.actually.exists',
                      displayName: 'Test Account',
                      tfaValidated: false,
                      emailValidated: false,
                    }),
                  },
                  loadUserByUserName: loadUserByUserName({ query, userKey: 123, i18n }),
                },
                notify: { sendUpdatedUserNameEmail: jest.fn() },
              },
            })

            const error = [new GraphQLError('Unable to verify account. Please try again.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred when upserting email validation for user: 123: Error: Transaction step error occurred.`,
            ])
          })
        })
      })
      describe('transaction commit error occurs', () => {
        describe('when upserting validation', () => {
          it('throws an error', async () => {
            const token = tokenize({
              parameters: { userKey: 123, userName: 'john.doe@istio.actually.exists' },
            })

            const response = await graphql({
              schema,
              source: `
                mutation {
                  verifyAccount(input: { verifyTokenString: "${token}" }) {
                    result {
                      ... on VerifyAccountResult {
                        status
                      }
                      ... on VerifyAccountError {
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
                request,
                userKey: 123,
                query,
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn().mockReturnValue({}),
                  commit: jest.fn().mockRejectedValue(new Error('Transaction commit error occurred.')),
                  abort: jest.fn(),
                }),
                auth: {
                  verifyToken: verifyToken({}),
                },
                validators: {
                  cleanseInput,
                },
                loaders: {
                  loadUserByKey: {
                    load: jest.fn().mockReturnValue({
                      _key: 123,
                      userName: 'test.account@istio.actually.exists',
                      displayName: 'Test Account',
                      tfaValidated: false,
                      emailValidated: false,
                    }),
                  },
                  loadUserByUserName: loadUserByUserName({ query, userKey: 123, i18n }),
                },
                notify: { sendUpdatedUserNameEmail: jest.fn() },
              },
            })

            const error = [new GraphQLError('Unable to verify account. Please try again.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx commit error occurred when upserting email validation for user: 123: Error: Transaction commit error occurred.`,
            ])
          })
        })
      })
    })
  })
})
