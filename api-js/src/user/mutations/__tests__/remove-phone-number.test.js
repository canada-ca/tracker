import { ensure, dbNameFromFile } from 'arango-tools'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { databaseOptions } from '../../../../database-options'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { userRequired } from '../../../auth'
import { loadUserByKey } from '../../loaders'

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
    // Generate DB Items
    ;({ query, drop, truncate, collections, transaction } = await ensure({
      type: 'database',
      name: dbNameFromFile(__filename),
      url,
      rootPassword: rootPass,
      options: databaseOptions({ rootPass }),
    }))
  })

  beforeEach(async () => {
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
    describe('given a successful removal', () => {
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
          const response = await graphql(
            schema,
            `
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
            null,
            {
              i18n,
              collections,
              query,
              transaction,
              auth: {
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query, userKey: user._key }),
                }),
              },
            },
          )

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
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully removed their phone number.`,
          ])
        })
        it('sets phoneDetails to null', async () => {
          await graphql(
            schema,
            `
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
            null,
            {
              i18n,
              collections,
              query,
              transaction,
              auth: {
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query, userKey: user._key }),
                }),
              },
            },
          )

          user = await loadUserByKey({ query, userKey: user._key }).load(
            user._key,
          )

          expect(user.phoneDetails).toEqual(null)
        })
        it('sets phoneValidated to false', async () => {
          await graphql(
            schema,
            `
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
            null,
            {
              i18n,
              collections,
              query,
              transaction,
              auth: {
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query, userKey: user._key }),
                }),
              },
            },
          )

          user = await loadUserByKey({ query, userKey: user._key }).load(
            user._key,
          )

          expect(user.phoneValidated).toEqual(false)
        })
        it('changes tfaSendMethod to email', async () => {
          await graphql(
            schema,
            `
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
            null,
            {
              i18n,
              collections,
              query,
              transaction,
              auth: {
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query, userKey: user._key }),
                }),
              },
            },
          )

          user = await loadUserByKey({ query, userKey: user._key }).load(
            user._key,
          )

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
          const response = await graphql(
            schema,
            `
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
            null,
            {
              i18n,
              collections,
              query,
              transaction,
              auth: {
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query, userKey: user._key }),
                }),
              },
            },
          )

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
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully removed their phone number.`,
          ])
        })
        it('sets phoneDetails to null', async () => {
          await graphql(
            schema,
            `
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
            null,
            {
              i18n,
              collections,
              query,
              transaction,
              auth: {
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query, userKey: user._key }),
                }),
              },
            },
          )

          user = await loadUserByKey({ query, userKey: user._key }).load(
            user._key,
          )

          expect(user.phoneDetails).toEqual(null)
        })
        it('sets phoneValidated to false', async () => {
          await graphql(
            schema,
            `
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
            null,
            {
              i18n,
              collections,
              query,
              transaction,
              auth: {
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query, userKey: user._key }),
                }),
              },
            },
          )

          user = await loadUserByKey({ query, userKey: user._key }).load(
            user._key,
          )

          expect(user.phoneValidated).toEqual(false)
        })
        it('changes tfaSendMethod to email', async () => {
          await graphql(
            schema,
            `
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
            null,
            {
              i18n,
              collections,
              query,
              transaction,
              auth: {
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query, userKey: user._key }),
                }),
              },
            },
          )

          user = await loadUserByKey({ query, userKey: user._key }).load(
            user._key,
          )

          expect(user.tfaSendMethod).toEqual('none')
        })
      })
    })
    describe('given a transaction error', () => {
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
      describe('step error occurs', () => {
        describe('when running upsert', () => {
          it('throws an error', async () => {
            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest
                .fn()
                .mockRejectedValue(
                  new Error('transaction step error occurred.'),
                ),
            })

            const response = await graphql(
              schema,
              `
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
              null,
              {
                i18n,
                collections,
                query,
                transaction: mockedTransaction,
                auth: {
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query, userKey: user._key }),
                  }),
                },
              },
            )

            const error = [
              new GraphQLError(
                'Unable to remove phone number. Please try again.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred well removing phone number for user: ${user._key}: Error: transaction step error occurred.`,
            ])
          })
        })
      })
      describe('commit error occurs', () => {
        describe('when committing upsert', () => {
          it('throws an error', async () => {
            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest.fn(),
              commit: jest
                .fn()
                .mockRejectedValue(
                  new Error('transaction step error occurred.'),
                ),
            })

            const response = await graphql(
              schema,
              `
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
              null,
              {
                i18n,
                collections,
                query,
                transaction: mockedTransaction,
                auth: {
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query, userKey: user._key }),
                  }),
                },
              },
            )

            const error = [
              new GraphQLError(
                'Unable to remove phone number. Please try again.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx commit error occurred well removing phone number for user: ${user._key}: Error: transaction step error occurred.`,
            ])
          })
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
    describe('given a successful removal', () => {
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
          const response = await graphql(
            schema,
            `
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
            null,
            {
              i18n,
              collections,
              query,
              transaction,
              auth: {
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query, userKey: user._key }),
                }),
              },
            },
          )

          const expectedResponse = {
            data: {
              removePhoneNumber: {
                result: {
                  status: 'todo',
                },
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully removed their phone number.`,
          ])
        })
        it('sets phoneDetails to null', async () => {
          await graphql(
            schema,
            `
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
            null,
            {
              i18n,
              collections,
              query,
              transaction,
              auth: {
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query, userKey: user._key }),
                }),
              },
            },
          )

          user = await loadUserByKey({ query, userKey: user._key }).load(
            user._key,
          )

          expect(user.phoneDetails).toEqual(null)
        })
        it('sets phoneValidated to false', async () => {
          await graphql(
            schema,
            `
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
            null,
            {
              i18n,
              collections,
              query,
              transaction,
              auth: {
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query, userKey: user._key }),
                }),
              },
            },
          )

          user = await loadUserByKey({ query, userKey: user._key }).load(
            user._key,
          )

          expect(user.phoneValidated).toEqual(false)
        })
        it('changes tfaSendMethod to email', async () => {
          await graphql(
            schema,
            `
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
            null,
            {
              i18n,
              collections,
              query,
              transaction,
              auth: {
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query, userKey: user._key }),
                }),
              },
            },
          )

          user = await loadUserByKey({ query, userKey: user._key }).load(
            user._key,
          )

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
          const response = await graphql(
            schema,
            `
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
            null,
            {
              i18n,
              collections,
              query,
              transaction,
              auth: {
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query, userKey: user._key }),
                }),
              },
            },
          )

          const expectedResponse = {
            data: {
              removePhoneNumber: {
                result: {
                  status: 'todo',
                },
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully removed their phone number.`,
          ])
        })
        it('sets phoneDetails to null', async () => {
          await graphql(
            schema,
            `
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
            null,
            {
              i18n,
              collections,
              query,
              transaction,
              auth: {
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query, userKey: user._key }),
                }),
              },
            },
          )

          user = await loadUserByKey({ query, userKey: user._key }).load(
            user._key,
          )

          expect(user.phoneDetails).toEqual(null)
        })
        it('sets phoneValidated to false', async () => {
          await graphql(
            schema,
            `
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
            null,
            {
              i18n,
              collections,
              query,
              transaction,
              auth: {
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query, userKey: user._key }),
                }),
              },
            },
          )

          user = await loadUserByKey({ query, userKey: user._key }).load(
            user._key,
          )

          expect(user.phoneValidated).toEqual(false)
        })
        it('changes tfaSendMethod to email', async () => {
          await graphql(
            schema,
            `
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
            null,
            {
              i18n,
              collections,
              query,
              transaction,
              auth: {
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query, userKey: user._key }),
                }),
              },
            },
          )

          user = await loadUserByKey({ query, userKey: user._key }).load(
            user._key,
          )

          expect(user.tfaSendMethod).toEqual('none')
        })
      })
    })
    describe('given a transaction error', () => {
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
      describe('step error occurs', () => {
        describe('when running upsert', () => {
          it('throws an error', async () => {
            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest
                .fn()
                .mockRejectedValue(
                  new Error('transaction step error occurred.'),
                ),
            })

            const response = await graphql(
              schema,
              `
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
              null,
              {
                i18n,
                collections,
                query,
                transaction: mockedTransaction,
                auth: {
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query, userKey: user._key }),
                  }),
                },
              },
            )

            const error = [new GraphQLError('todo')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred well removing phone number for user: ${user._key}: Error: transaction step error occurred.`,
            ])
          })
        })
      })
      describe('commit error occurs', () => {
        describe('when committing upsert', () => {
          it('throws an error', async () => {
            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest.fn(),
              commit: jest
                .fn()
                .mockRejectedValue(
                  new Error('transaction step error occurred.'),
                ),
            })

            const response = await graphql(
              schema,
              `
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
              null,
              {
                i18n,
                collections,
                query,
                transaction: mockedTransaction,
                auth: {
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query, userKey: user._key }),
                  }),
                },
              },
            )

            const error = [new GraphQLError('todo')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx commit error occurred well removing phone number for user: ${user._key}: Error: transaction step error occurred.`,
            ])
          })
        })
      })
    })
  })
})
