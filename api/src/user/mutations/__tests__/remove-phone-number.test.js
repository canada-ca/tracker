import { dbNameFromFile } from 'arango-tools'
import { ensureDatabase as ensure } from '../../../testUtilities'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { userRequired } from '../../../auth'
import { loadUserByKey } from '../../loaders'
import dbschema from '../../../../database.json'
import { collectionNames } from '../../../collection-names'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('testing the removePhoneNumber mutation', () => {
  let query, drop, truncate, schema, i18n, collections, transaction, user

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
  })

  afterEach(() => {
    consoleOutput.length = 0
  })

  describe('given a successful removal', () => {
    beforeAll(async () => {
      // Generate DB Items
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
      describe('user is email validated', () => {
        beforeEach(async () => {
          user = await collections.users.save({
            userName: 'john.doe@test.email.ca',
            emailValidated: true,
            phoneValidated: true,
            phoneDetails: {
              iv: 'iv',
              cipher: 'cipher',
              phoneNumber: 'phoneNumber',
            },
            tfaSendMethod: 'phone',
          })
        })
        it('executes mutation successfully', async () => {
          const response = await graphql({
            schema,
            source: `
              mutation {
                removePhoneNumber(input: {}) {
                  result {
                    ... on RemovePhoneNumberResult {
                      status
                    }
                    ... on RemovePhoneNumberError {
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
              collections: collectionNames,
              query,
              transaction,
              auth: {
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query, userKey: user._key }),
                }),
              },
            },
          })

          const expectedResponse = {
            data: {
              removePhoneNumber: {
                result: {
                  status: 'Phone number has been successfully removed.',
                },
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([`User: ${user._key} successfully removed their phone number.`])
        })
        it('sets phoneDetails to null', async () => {
          await graphql({
            schema,
            source: `
              mutation {
                removePhoneNumber(input: {}) {
                  result {
                    ... on RemovePhoneNumberResult {
                      status
                    }
                    ... on RemovePhoneNumberError {
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
              collections: collectionNames,
              query,
              transaction,
              auth: {
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query, userKey: user._key }),
                }),
              },
            },
          })

          user = await loadUserByKey({ query, userKey: user._key }).load(user._key)

          expect(user.phoneDetails).toEqual(null)
        })
        it('sets phoneValidated to false', async () => {
          await graphql({
            schema,
            source: `
              mutation {
                removePhoneNumber(input: {}) {
                  result {
                    ... on RemovePhoneNumberResult {
                      status
                    }
                    ... on RemovePhoneNumberError {
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
              collections: collectionNames,
              query,
              transaction,
              auth: {
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query, userKey: user._key }),
                }),
              },
            },
          })

          user = await loadUserByKey({ query, userKey: user._key }).load(user._key)

          expect(user.phoneValidated).toEqual(false)
        })
        it('changes tfaSendMethod to email', async () => {
          await graphql({
            schema,
            source: `
              mutation {
                removePhoneNumber(input: {}) {
                  result {
                    ... on RemovePhoneNumberResult {
                      status
                    }
                    ... on RemovePhoneNumberError {
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
              collections: collectionNames,
              query,
              transaction,
              auth: {
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query, userKey: user._key }),
                }),
              },
            },
          })

          user = await loadUserByKey({ query, userKey: user._key }).load(user._key)

          expect(user.tfaSendMethod).toEqual('email')
        })
      })
      describe('user is not email validated', () => {
        beforeEach(async () => {
          user = await collections.users.save({
            userName: 'john.doe@test.email.ca',
            emailValidated: false,
            phoneValidated: true,
            phoneDetails: {
              iv: '',
              cipher: '',
              phoneNumber: '',
            },
            tfaSendMethod: 'phone',
          })
        })
        it('executes mutation successfully', async () => {
          const response = await graphql({
            schema,
            source: `
              mutation {
                removePhoneNumber(input: {}) {
                  result {
                    ... on RemovePhoneNumberResult {
                      status
                    }
                    ... on RemovePhoneNumberError {
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
              collections: collectionNames,
              query,
              transaction,
              auth: {
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query, userKey: user._key }),
                }),
              },
            },
          })

          const expectedResponse = {
            data: {
              removePhoneNumber: {
                result: {
                  status: 'Phone number has been successfully removed.',
                },
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([`User: ${user._key} successfully removed their phone number.`])
        })
        it('sets phoneDetails to null', async () => {
          await graphql({
            schema,
            source: `
              mutation {
                removePhoneNumber(input: {}) {
                  result {
                    ... on RemovePhoneNumberResult {
                      status
                    }
                    ... on RemovePhoneNumberError {
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
              collections: collectionNames,
              query,
              transaction,
              auth: {
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query, userKey: user._key }),
                }),
              },
            },
          })

          user = await loadUserByKey({ query, userKey: user._key }).load(user._key)

          expect(user.phoneDetails).toEqual(null)
        })
        it('sets phoneValidated to false', async () => {
          await graphql({
            schema,
            source: `
              mutation {
                removePhoneNumber(input: {}) {
                  result {
                    ... on RemovePhoneNumberResult {
                      status
                    }
                    ... on RemovePhoneNumberError {
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
              collections: collectionNames,
              query,
              transaction,
              auth: {
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query, userKey: user._key }),
                }),
              },
            },
          })

          user = await loadUserByKey({ query, userKey: user._key }).load(user._key)

          expect(user.phoneValidated).toEqual(false)
        })
        it('changes tfaSendMethod to email', async () => {
          await graphql({
            schema,
            source: `
              mutation {
                removePhoneNumber(input: {}) {
                  result {
                    ... on RemovePhoneNumberResult {
                      status
                    }
                    ... on RemovePhoneNumberError {
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
              collections: collectionNames,
              query,
              transaction,
              auth: {
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query, userKey: user._key }),
                }),
              },
            },
          })

          user = await loadUserByKey({ query, userKey: user._key }).load(user._key)

          expect(user.tfaSendMethod).toEqual('none')
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
      describe('user is email validated', () => {
        beforeEach(async () => {
          user = await collections.users.save({
            userName: 'john.doe@test.email.ca',
            emailValidated: true,
            phoneValidated: true,
            phoneDetails: {
              iv: 'iv',
              cipher: 'cipher',
              phoneNumber: 'phoneNumber',
            },
            tfaSendMethod: 'phone',
          })
        })
        it('executes mutation successfully', async () => {
          const response = await graphql({
            schema,
            source: `
              mutation {
                removePhoneNumber(input: {}) {
                  result {
                    ... on RemovePhoneNumberResult {
                      status
                    }
                    ... on RemovePhoneNumberError {
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
              collections: collectionNames,
              query,
              transaction,
              auth: {
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query, userKey: user._key }),
                }),
              },
            },
          })

          const expectedResponse = {
            data: {
              removePhoneNumber: {
                result: {
                  status: 'Le numéro de téléphone a été supprimé avec succès.',
                },
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([`User: ${user._key} successfully removed their phone number.`])
        })
        it('sets phoneDetails to null', async () => {
          await graphql({
            schema,
            source: `
              mutation {
                removePhoneNumber(input: {}) {
                  result {
                    ... on RemovePhoneNumberResult {
                      status
                    }
                    ... on RemovePhoneNumberError {
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
              collections: collectionNames,
              query,
              transaction,
              auth: {
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query, userKey: user._key }),
                }),
              },
            },
          })

          user = await loadUserByKey({ query, userKey: user._key }).load(user._key)

          expect(user.phoneDetails).toEqual(null)
        })
        it('sets phoneValidated to false', async () => {
          await graphql({
            schema,
            source: `
              mutation {
                removePhoneNumber(input: {}) {
                  result {
                    ... on RemovePhoneNumberResult {
                      status
                    }
                    ... on RemovePhoneNumberError {
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
              collections: collectionNames,
              query,
              transaction,
              auth: {
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query, userKey: user._key }),
                }),
              },
            },
          })

          user = await loadUserByKey({ query, userKey: user._key }).load(user._key)

          expect(user.phoneValidated).toEqual(false)
        })
        it('changes tfaSendMethod to email', async () => {
          await graphql({
            schema,
            source: `
              mutation {
                removePhoneNumber(input: {}) {
                  result {
                    ... on RemovePhoneNumberResult {
                      status
                    }
                    ... on RemovePhoneNumberError {
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
              collections: collectionNames,
              query,
              transaction,
              auth: {
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query, userKey: user._key }),
                }),
              },
            },
          })

          user = await loadUserByKey({ query, userKey: user._key }).load(user._key)

          expect(user.tfaSendMethod).toEqual('email')
        })
      })
      describe('user is not email validated', () => {
        beforeEach(async () => {
          user = await collections.users.save({
            userName: 'john.doe@test.email.ca',
            emailValidated: false,
            phoneValidated: true,
            phoneDetails: {
              iv: '',
              cipher: '',
              phoneNumber: '',
            },
            tfaSendMethod: 'phone',
          })
        })
        it('executes mutation successfully', async () => {
          const response = await graphql({
            schema,
            source: `
              mutation {
                removePhoneNumber(input: {}) {
                  result {
                    ... on RemovePhoneNumberResult {
                      status
                    }
                    ... on RemovePhoneNumberError {
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
              collections: collectionNames,
              query,
              transaction,
              auth: {
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query, userKey: user._key }),
                }),
              },
            },
          })

          const expectedResponse = {
            data: {
              removePhoneNumber: {
                result: {
                  status: 'Le numéro de téléphone a été supprimé avec succès.',
                },
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([`User: ${user._key} successfully removed their phone number.`])
        })
        it('sets phoneDetails to null', async () => {
          await graphql({
            schema,
            source: `
              mutation {
                removePhoneNumber(input: {}) {
                  result {
                    ... on RemovePhoneNumberResult {
                      status
                    }
                    ... on RemovePhoneNumberError {
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
              collections: collectionNames,
              query,
              transaction,
              auth: {
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query, userKey: user._key }),
                }),
              },
            },
          })

          user = await loadUserByKey({ query, userKey: user._key }).load(user._key)

          expect(user.phoneDetails).toEqual(null)
        })
        it('sets phoneValidated to false', async () => {
          await graphql({
            schema,
            source: `
              mutation {
                removePhoneNumber(input: {}) {
                  result {
                    ... on RemovePhoneNumberResult {
                      status
                    }
                    ... on RemovePhoneNumberError {
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
              collections: collectionNames,
              query,
              transaction,
              auth: {
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query, userKey: user._key }),
                }),
              },
            },
          })

          user = await loadUserByKey({ query, userKey: user._key }).load(user._key)

          expect(user.phoneValidated).toEqual(false)
        })
        it('changes tfaSendMethod to email', async () => {
          await graphql({
            schema,
            source: `
              mutation {
                removePhoneNumber(input: {}) {
                  result {
                    ... on RemovePhoneNumberResult {
                      status
                    }
                    ... on RemovePhoneNumberError {
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
              collections: collectionNames,
              query,
              transaction,
              auth: {
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query, userKey: user._key }),
                }),
              },
            },
          })

          user = await loadUserByKey({ query, userKey: user._key }).load(user._key)

          expect(user.tfaSendMethod).toEqual('none')
        })
      })
    })
  })

  describe('given an unsuccessful removal', () => {
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
      describe('step error occurs', () => {
        describe('when running upsert', () => {
          it('throws an error', async () => {
            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest.fn().mockRejectedValue(new Error('transaction step error occurred.')),
              abort: jest.fn(),
            })

            const response = await graphql({
              schema,
              source: `
                mutation {
                  removePhoneNumber(input: {}) {
                    result {
                      ... on RemovePhoneNumberResult {
                        status
                      }
                      ... on RemovePhoneNumberError {
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
                collections: collectionNames,
                query,
                transaction: mockedTransaction,
                auth: {
                  userRequired: jest.fn().mockReturnValue({ _key: 123 }),
                },
              },
            })

            const error = [new GraphQLError('Unable to remove phone number. Please try again.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred well removing phone number for user: 123: Error: transaction step error occurred.`,
            ])
          })
        })
      })
      describe('commit error occurs', () => {
        describe('when committing upsert', () => {
          it('throws an error', async () => {
            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest.fn(),
              commit: jest.fn().mockRejectedValue(new Error('transaction step error occurred.')),
              abort: jest.fn(),
            })

            const response = await graphql({
              schema,
              source: `
                mutation {
                  removePhoneNumber(input: {}) {
                    result {
                      ... on RemovePhoneNumberResult {
                        status
                      }
                      ... on RemovePhoneNumberError {
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
                collections: collectionNames,
                query,
                transaction: mockedTransaction,
                auth: {
                  userRequired: jest.fn().mockReturnValue({ _key: 123 }),
                },
              },
            })

            const error = [new GraphQLError('Unable to remove phone number. Please try again.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx commit error occurred well removing phone number for user: 123: Error: transaction step error occurred.`,
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
      describe('step error occurs', () => {
        describe('when running upsert', () => {
          it('throws an error', async () => {
            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest.fn().mockRejectedValue(new Error('transaction step error occurred.')),
              abort: jest.fn(),
            })

            const response = await graphql({
              schema,
              source: `
                mutation {
                  removePhoneNumber(input: {}) {
                    result {
                      ... on RemovePhoneNumberResult {
                        status
                      }
                      ... on RemovePhoneNumberError {
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
                collections: collectionNames,
                query,
                transaction: mockedTransaction,
                auth: {
                  userRequired: jest.fn().mockReturnValue({ _key: 123 }),
                },
              },
            })

            const error = [new GraphQLError('Impossible de supprimer le numéro de téléphone. Veuillez réessayer.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred well removing phone number for user: 123: Error: transaction step error occurred.`,
            ])
          })
        })
      })
      describe('commit error occurs', () => {
        describe('when committing upsert', () => {
          it('throws an error', async () => {
            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest.fn(),
              commit: jest.fn().mockRejectedValue(new Error('transaction step error occurred.')),
              abort: jest.fn(),
            })

            const response = await graphql({
              schema,
              source: `
                mutation {
                  removePhoneNumber(input: {}) {
                    result {
                      ... on RemovePhoneNumberResult {
                        status
                      }
                      ... on RemovePhoneNumberError {
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
                collections: collectionNames,
                query,
                transaction: mockedTransaction,
                auth: {
                  userRequired: jest.fn().mockReturnValue({ _key: 123 }),
                },
              },
            })

            const error = [new GraphQLError('Impossible de supprimer le numéro de téléphone. Veuillez réessayer.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx commit error occurred well removing phone number for user: 123: Error: transaction step error occurred.`,
            ])
          })
        })
      })
    })
  })
})
