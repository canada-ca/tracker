import { dbNameFromFile } from 'arango-tools'
import { ensureDatabase as ensure } from '../../../testUtilities'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { loadUserByKey } from '../../loaders'
import { userRequired } from '../../../auth'
import dbschema from '../../../../database.json'
import { collectionNames } from '../../../collection-names'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('user send password reset email', () => {
  let query, drop, truncate, collections, transaction, schema, i18n, user
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
  })
  afterEach(() => {
    consoleOutput.length = 0
  })

  describe('given a successful phone number verification', () => {
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
    beforeEach(async () => {
      user = await collections.users.save({
        userName: 'test.account@istio.actually.exists',
        displayName: 'Test Account',
        tfaValidated: false,
        emailValidated: false,
        tfaCode: 123456,
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
      it('returns a successful status message', async () => {
        const response = await graphql({
          schema,
          source: `
            mutation {
              verifyPhoneNumber(input: { twoFactorCode: 123456 }) {
                result {
                  ... on VerifyPhoneNumberResult {
                    status
                    user {
                      displayName
                    }
                  }
                  ... on VerifyPhoneNumberError {
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
            userKey: user._key,
            query,
            collections: collectionNames,
            transaction,
            auth: {
              userRequired: userRequired({
                userKey: user._key,
                loadUserByKey: loadUserByKey({ query }),
              }),
            },
            loaders: {
              loadUserByKey: loadUserByKey({ query }),
            },
          },
        })

        const expectedResult = {
          data: {
            verifyPhoneNumber: {
              result: {
                user: {
                  displayName: 'Test Account',
                },
                status: 'Successfully verified phone number, and set TFA send method to text.',
              },
            },
          },
        }

        expect(response).toEqual(expectedResult)
        expect(consoleOutput).toEqual([`User: ${user._key} successfully two factor authenticated their account.`])
      })
      it('updates the user phoneValidated to true', async () => {
        await graphql({
          schema,
          source: `
            mutation {
              verifyPhoneNumber(input: { twoFactorCode: 123456 }) {
                result {
                  ... on VerifyPhoneNumberResult {
                    status
                    user {
                      displayName
                    }
                  }
                  ... on VerifyPhoneNumberError {
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
            userKey: user._key,
            query,
            collections: collectionNames,
            transaction,
            auth: {
              userRequired: userRequired({
                userKey: user._key,
                loadUserByKey: loadUserByKey({ query }),
              }),
            },
            loaders: {
              loadUserByKey: loadUserByKey({ query }),
            },
          },
        })

        const cursor = await query`
          FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
        `
        user = await cursor.next()

        expect(user.phoneValidated).toEqual(true)
        expect(consoleOutput).toEqual([`User: ${user._key} successfully two factor authenticated their account.`])
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
      it('returns a successful status message', async () => {
        const response = await graphql({
          schema,
          source: `
            mutation {
              verifyPhoneNumber(input: { twoFactorCode: 123456 }) {
                result {
                  ... on VerifyPhoneNumberResult {
                    status
                    user {
                      displayName
                    }
                  }
                  ... on VerifyPhoneNumberError {
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
            userKey: user._key,
            query,
            collections: collectionNames,
            transaction,
            auth: {
              userRequired: userRequired({
                userKey: user._key,
                loadUserByKey: loadUserByKey({ query }),
              }),
            },
            loaders: {
              loadUserByKey: loadUserByKey({ query }),
            },
          },
        })

        const expectedResult = {
          data: {
            verifyPhoneNumber: {
              result: {
                user: {
                  displayName: 'Test Account',
                },
                status:
                  "Le numéro de téléphone a été vérifié avec succès, et la méthode d'envoi de la TFA a été réglée sur le texte.",
              },
            },
          },
        }

        expect(response).toEqual(expectedResult)
        expect(consoleOutput).toEqual([`User: ${user._key} successfully two factor authenticated their account.`])
      })
      it('updates the user phoneValidated to true', async () => {
        await graphql({
          schema,
          source: `
            mutation {
              verifyPhoneNumber(input: { twoFactorCode: 123456 }) {
                result {
                  ... on VerifyPhoneNumberResult {
                    status
                    user {
                      displayName
                    }
                  }
                  ... on VerifyPhoneNumberError {
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
            userKey: user._key,
            query,
            collections: collectionNames,
            transaction,
            auth: {
              userRequired: userRequired({
                userKey: user._key,
                loadUserByKey: loadUserByKey({ query }),
              }),
            },
            loaders: {
              loadUserByKey: loadUserByKey({ query }),
            },
          },
        })

        const cursor = await query`
          FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
        `
        user = await cursor.next()

        expect(user.phoneValidated).toEqual(true)
        expect(consoleOutput).toEqual([`User: ${user._key} successfully two factor authenticated their account.`])
      })
    })
  })
  describe('given an unsuccessful phone number verification', () => {
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
      describe('the two factor code is not 6 digits long', () => {
        it('returns an error message', async () => {
          const response = await graphql({
            schema,
            source: `
              mutation {
                verifyPhoneNumber(input: { twoFactorCode: 123 }) {
                  result {
                    ... on VerifyPhoneNumberResult {
                      status
                      user {
                        displayName
                      }
                    }
                    ... on VerifyPhoneNumberError {
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
              userKey: 123,
              query,
              collections: collectionNames,
              transaction,
              auth: {
                userRequired: jest.fn().mockReturnValue({
                  _key: 123,
                }),
              },
              loaders: {
                loadUserByKey: {
                  load: jest.fn(),
                },
              },
            },
          })

          const error = {
            data: {
              verifyPhoneNumber: {
                result: {
                  code: 400,
                  description: 'Two factor code length is incorrect. Please try again.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to two factor authenticate, however the code they submitted does not have 6 digits.`,
          ])
        })
      })
      describe('tfa codes do not match', () => {
        it('returns an error message', async () => {
          const response = await graphql({
            schema,
            source: `
              mutation {
                verifyPhoneNumber(input: { twoFactorCode: 654321 }) {
                  result {
                    ... on VerifyPhoneNumberResult {
                      status
                      user {
                        displayName
                      }
                    }
                    ... on VerifyPhoneNumberError {
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
              userKey: 123,
              query,
              collections: collectionNames,
              transaction,
              auth: {
                userRequired: jest.fn().mockReturnValue({
                  _key: 123,
                  tfaCode: 123456,
                }),
              },
              loaders: {
                loadUserByKey: {
                  load: jest.fn(),
                },
              },
            },
          })

          const error = {
            data: {
              verifyPhoneNumber: {
                result: {
                  code: 400,
                  description: 'Two factor code is incorrect. Please try again.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to two factor authenticate, however the tfa codes do not match.`,
          ])
        })
      })
      describe('given a transaction step error', () => {
        describe('when upserting users phone validation status', () => {
          it('throws an error', async () => {
            const response = await graphql({
              schema,
              source: `
                mutation {
                  verifyPhoneNumber(input: { twoFactorCode: 123456 }) {
                    result {
                      ... on VerifyPhoneNumberResult {
                        status
                        user {
                          displayName
                        }
                      }
                      ... on VerifyPhoneNumberError {
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
                userKey: 123,
                query,
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn().mockRejectedValue(new Error('Transaction step error')),
                  abort: jest.fn(),
                }),
                auth: {
                  userRequired: jest.fn().mockReturnValue({
                    _key: 123,
                    tfaCode: 123456,
                  }),
                },
                loaders: {
                  loadUserByKey: {
                    load: jest.fn(),
                  },
                },
              },
            })

            const error = [new GraphQLError('Unable to two factor authenticate. Please try again.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred when upserting the tfaValidate field for 123: Error: Transaction step error`,
            ])
          })
        })
      })
      describe('given a transaction commit error', () => {
        describe('when committing changes', () => {
          it('throws an error', async () => {
            const response = await graphql({
              schema,
              source: `
                mutation {
                  verifyPhoneNumber(input: { twoFactorCode: 123456 }) {
                    result {
                      ... on VerifyPhoneNumberResult {
                        status
                        user {
                          displayName
                        }
                      }
                      ... on VerifyPhoneNumberError {
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
                userKey: 123,
                query,
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn().mockReturnValue({}),
                  commit: jest.fn().mockRejectedValue(new Error('Transaction commit error')),
                  abort: jest.fn(),
                }),
                auth: {
                  userRequired: jest.fn().mockReturnValue({
                    _key: 123,
                    tfaCode: 123456,
                  }),
                },
                loaders: {
                  loadUserByKey: {
                    load: jest.fn(),
                  },
                },
              },
            })

            const error = [new GraphQLError('Unable to two factor authenticate. Please try again.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx commit error occurred when upserting the tfaValidate field for 123: Error: Transaction commit error`,
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
      describe('the two factor code is not 6 digits long', () => {
        it('returns an error message', async () => {
          const response = await graphql({
            schema,
            source: `
              mutation {
                verifyPhoneNumber(input: { twoFactorCode: 123 }) {
                  result {
                    ... on VerifyPhoneNumberResult {
                      status
                      user {
                        displayName
                      }
                    }
                    ... on VerifyPhoneNumberError {
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
              userKey: 123,
              query,
              collections: collectionNames,
              transaction,
              auth: {
                userRequired: jest.fn().mockReturnValue({
                  _key: 123,
                }),
              },
              loaders: {
                loadUserByKey: {
                  load: jest.fn(),
                },
              },
            },
          })

          const error = {
            data: {
              verifyPhoneNumber: {
                result: {
                  code: 400,
                  description: 'La longueur du code à deux facteurs est incorrecte. Veuillez réessayer.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to two factor authenticate, however the code they submitted does not have 6 digits.`,
          ])
        })
      })
      describe('tfa codes do not match', () => {
        it('returns an error message', async () => {
          const response = await graphql({
            schema,
            source: `
              mutation {
                verifyPhoneNumber(input: { twoFactorCode: 654321 }) {
                  result {
                    ... on VerifyPhoneNumberResult {
                      status
                      user {
                        displayName
                      }
                    }
                    ... on VerifyPhoneNumberError {
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
              userKey: 123,
              query,
              collections: collectionNames,
              transaction,
              auth: {
                userRequired: jest.fn().mockReturnValue({
                  _key: 123,
                  tfaCode: 123456,
                }),
              },
              loaders: {
                loadUserByKey: {
                  load: jest.fn(),
                },
              },
            },
          })

          const error = {
            data: {
              verifyPhoneNumber: {
                result: {
                  code: 400,
                  description: 'Le code à deux facteurs est incorrect. Veuillez réessayer.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to two factor authenticate, however the tfa codes do not match.`,
          ])
        })
      })
      describe('given a transaction step error', () => {
        describe('when upserting users phone validation status', () => {
          it('throws an error', async () => {
            const response = await graphql({
              schema,
              source: `
                mutation {
                  verifyPhoneNumber(input: { twoFactorCode: 123456 }) {
                    result {
                      ... on VerifyPhoneNumberResult {
                        status
                        user {
                          displayName
                        }
                      }
                      ... on VerifyPhoneNumberError {
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
                userKey: 123,
                query,
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn().mockRejectedValue(new Error('Transaction step error')),
                  abort: jest.fn(),
                }),
                auth: {
                  userRequired: jest.fn().mockReturnValue({
                    _key: 123,
                    tfaCode: 123456,
                  }),
                },
                loaders: {
                  loadUserByKey: {
                    load: jest.fn(),
                  },
                },
              },
            })

            const error = [new GraphQLError("Impossible de s'authentifier par deux facteurs. Veuillez réessayer.")]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred when upserting the tfaValidate field for 123: Error: Transaction step error`,
            ])
          })
        })
      })
      describe('given a transaction commit error', () => {
        describe('when committing changes', () => {
          it('throws an error', async () => {
            const response = await graphql({
              schema,
              source: `
                mutation {
                  verifyPhoneNumber(input: { twoFactorCode: 123456 }) {
                    result {
                      ... on VerifyPhoneNumberResult {
                        status
                        user {
                          displayName
                        }
                      }
                      ... on VerifyPhoneNumberError {
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
                userKey: 123,
                query,
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn().mockReturnValue({}),
                  commit: jest.fn().mockRejectedValue(new Error('Transaction commit error')),
                  abort: jest.fn(),
                }),
                auth: {
                  userRequired: jest.fn().mockReturnValue({
                    _key: 123,
                    tfaCode: 123456,
                  }),
                },
                loaders: {
                  loadUserByKey: {
                    load: jest.fn(),
                  },
                },
              },
            })

            const error = [new GraphQLError("Impossible de s'authentifier par deux facteurs. Veuillez réessayer.")]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx commit error occurred when upserting the tfaValidate field for 123: Error: Transaction commit error`,
            ])
          })
        })
      })
    })
  })
})
