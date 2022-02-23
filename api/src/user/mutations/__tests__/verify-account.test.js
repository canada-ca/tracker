import { ensure, dbNameFromFile } from 'arango-tools'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { cleanseInput } from '../../../validators'
import { tokenize, verifyToken } from '../../../auth'
import { loadUserByKey } from '../../loaders'
import dbschema from '../../../../database.json'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('user send password reset email', () => {
  let query, drop, truncate, collections, transaction, schema, request, i18n
  const consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  const mockedError = (output) => consoleOutput.push(output)

  beforeAll(() => {
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
  })
  afterEach(() => {
    consoleOutput.length = 0
  })

  describe('given a successful validation', () => {
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
          null,
          {
            i18n,
            request,
            userKey: user._key,
            query,
            collections,
            transaction,
            auth: {
              verifyToken: verifyToken({}),
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
            verifyAccount: {
              result: {
                status:
                  'Successfully email verified account, and set TFA send method to email.',
              },
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
        expect(consoleOutput).toEqual([
          `User: ${user._key} successfully email validated their account.`,
        ])
      })
      it('sets emailValidated to true', async () => {
        let cursor = await query`
            FOR user IN users
                FILTER user.userName == "test.account@istio.actually.exists"
                RETURN user
          `
        let user = await cursor.next()

        const token = tokenize({ parameters: { userKey: user._key } })

        await graphql(
          schema,
          `
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
          null,
          {
            i18n,
            request,
            userKey: user._key,
            query,
            collections,
            transaction,
            auth: {
              verifyToken: verifyToken({}),
            },
            validators: {
              cleanseInput,
            },
            loaders: {
              loadUserByKey: loadUserByKey({ query }),
            },
          },
        )

        cursor = await query`
            FOR user IN users
                FILTER user.userName == "test.account@istio.actually.exists"
                RETURN user
          `
        user = await cursor.next()

        expect(user.emailValidated).toEqual(true)
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
          null,
          {
            i18n,
            request,
            userKey: user._key,
            query,
            collections,
            transaction,
            auth: {
              verifyToken: verifyToken({}),
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
            verifyAccount: {
              result: {
                status:
                  "Réussir à envoyer un email au compte vérifié, et définir la méthode d'envoi de la TFA sur email.",
              },
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
      it('sets emailValidated to true', async () => {
        let cursor = await query`
            FOR user IN users
                FILTER user.userName == "test.account@istio.actually.exists"
                RETURN user
          `
        let user = await cursor.next()

        const token = tokenize({ parameters: { userKey: user._key } })

        await graphql(
          schema,
          `
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
          null,
          {
            i18n,
            request,
            userKey: user._key,
            query,
            collections,
            transaction,
            auth: {
              verifyToken: verifyToken({}),
            },
            validators: {
              cleanseInput,
            },
            loaders: {
              loadUserByKey: loadUserByKey({ query }),
            },
          },
        )

        cursor = await query`
            FOR user IN users
                FILTER user.userName == "test.account@istio.actually.exists"
                RETURN user
          `
        user = await cursor.next()

        expect(user.emailValidated).toEqual(true)
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

          const response = await graphql(
            schema,
            `
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
            null,
            {
              i18n,
              request,
              userKey: 123,
              query,
              collections,
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
                    preferredLang: 'english',
                    tfaValidated: false,
                    emailValidated: false,
                  }),
                },
              },
            },
          )

          const error = {
            data: {
              verifyAccount: {
                result: {
                  code: 400,
                  description:
                    'Unable to verify account. Please request a new email.',
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

          const response = await graphql(
            schema,
            `
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
            null,
            {
              i18n,
              request,
              userKey: 123,
              query,
              collections,
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
                    preferredLang: 'english',
                    tfaValidated: false,
                    emailValidated: false,
                  }),
                },
              },
            },
          )

          const error = {
            data: {
              verifyAccount: {
                result: {
                  code: 400,
                  description:
                    'Unable to verify account. Please request a new email.',
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
            parameters: { userKey: 1 },
          })
          const response = await graphql(
            schema,
            `
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
            null,
            {
              i18n,
              request,
              userKey: 1,
              query,
              collections,
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
              },
            },
          )

          const error = {
            data: {
              verifyAccount: {
                result: {
                  code: 400,
                  description:
                    'Unable to verify account. Please request a new email.',
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
              parameters: { userKey: 123 },
            })

            const response = await graphql(
              schema,
              `
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
              null,
              {
                i18n,
                request,
                userKey: 123,
                query,
                collections,
                transaction: jest.fn().mockReturnValue({
                  step: jest
                    .fn()
                    .mockRejectedValue(
                      new Error('Transaction step error occurred.'),
                    ),
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
                      preferredLang: 'english',
                      tfaValidated: false,
                      emailValidated: false,
                    }),
                  },
                },
              },
            )

            const error = [
              new GraphQLError('Unable to verify account. Please try again.'),
            ]

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
              parameters: { userKey: 123 },
            })

            const response = await graphql(
              schema,
              `
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
              null,
              {
                i18n,
                request,
                userKey: 123,
                query,
                collections,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn().mockReturnValue({}),
                  commit: jest
                    .fn()
                    .mockRejectedValue(
                      new Error('Transaction commit error occurred.'),
                    ),
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
                      preferredLang: 'english',
                      tfaValidated: false,
                      emailValidated: false,
                    }),
                  },
                },
              },
            )

            const error = [
              new GraphQLError('Unable to verify account. Please try again.'),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx commit error occurred when upserting email validation for user: 123: Error: Transaction commit error occurred.`,
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
      describe('userKey cannot be found in token parameters', () => {
        it('returns an error message', async () => {
          const token = tokenize({
            parameters: {},
          })

          const response = await graphql(
            schema,
            `
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
            null,
            {
              i18n,
              request,
              userKey: 123,
              query,
              collections,
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
                    preferredLang: 'english',
                    tfaValidated: false,
                    emailValidated: false,
                  }),
                },
              },
            },
          )

          const error = {
            data: {
              verifyAccount: {
                result: {
                  code: 400,
                  description:
                    'Impossible de vérifier le compte. Veuillez demander un nouvel e-mail.',
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

          const response = await graphql(
            schema,
            `
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
            null,
            {
              i18n,
              request,
              userKey: 123,
              query,
              collections,
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
                    preferredLang: 'english',
                    tfaValidated: false,
                    emailValidated: false,
                  }),
                },
              },
            },
          )

          const error = {
            data: {
              verifyAccount: {
                result: {
                  code: 400,
                  description:
                    'Impossible de vérifier le compte. Veuillez demander un nouvel e-mail.',
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
            parameters: { userKey: 1 },
          })
          const response = await graphql(
            schema,
            `
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
            null,
            {
              i18n,
              request,
              userKey: 1,
              query,
              collections,
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
              },
            },
          )

          const error = {
            data: {
              verifyAccount: {
                result: {
                  code: 400,
                  description:
                    'Impossible de vérifier le compte. Veuillez demander un nouvel e-mail.',
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
              parameters: { userKey: 123 },
            })

            const response = await graphql(
              schema,
              `
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
              null,
              {
                i18n,
                request,
                userKey: 123,
                query,
                collections,
                transaction: jest.fn().mockReturnValue({
                  step: jest
                    .fn()
                    .mockRejectedValue(
                      new Error('Transaction step error occurred.'),
                    ),
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
                      preferredLang: 'english',
                      tfaValidated: false,
                      emailValidated: false,
                    }),
                  },
                },
              },
            )

            const error = [
              new GraphQLError(
                'Impossible de vérifier le compte. Veuillez réessayer.',
              ),
            ]

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
              parameters: { userKey: 123 },
            })

            const response = await graphql(
              schema,
              `
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
              null,
              {
                i18n,
                request,
                userKey: 123,
                query,
                collections,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn().mockReturnValue({}),
                  commit: jest
                    .fn()
                    .mockRejectedValue(
                      new Error('Transaction commit error occurred.'),
                    ),
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
                      preferredLang: 'english',
                      tfaValidated: false,
                      emailValidated: false,
                    }),
                  },
                },
              },
            )

            const error = [
              new GraphQLError(
                'Impossible de vérifier le compte. Veuillez réessayer.',
              ),
            ]

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
