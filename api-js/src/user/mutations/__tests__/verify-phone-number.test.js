import { ensure, dbNameFromFile } from 'arango-tools'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { databaseOptions } from '../../../../database-options'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { loadUserByKey } from '../../loaders'
import { userRequired } from '../../../auth'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('user send password reset email', () => {
  const originalInfo = console.info
  afterEach(() => (console.info = originalInfo))

  let query, drop, truncate, collections, schema, i18n, user

  beforeAll(async () => {
    ;({ query, drop, truncate, collections } = await ensure({
      type: 'database',
      name: dbNameFromFile(__filename),
      url,
      rootPassword: rootPass,
      options: databaseOptions({ rootPass }),
    }))
    schema = new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createMutationSchema(),
    })
  })

  const consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  const mockedError = (output) => consoleOutput.push(output)
  beforeEach(async () => {
    console.info = mockedInfo
    console.warn = mockedWarn
    console.error = mockedError

    user = await collections.users.save({
      userName: 'test.account@istio.actually.exists',
      displayName: 'Test Account',
      preferredLang: 'french',
      tfaValidated: false,
      emailValidated: false,
      tfaCode: 123456,
    })
  })

  afterEach(async () => {
    consoleOutput.length = 0
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
    describe('successfully verify phone number', () => {
      it('returns a successful status message', async () => {
        const response = await graphql(
          schema,
          `
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
          null,
          {
            i18n,
            userKey: user._key,
            query,
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
        )

        const expectedResult = {
          data: {
            verifyPhoneNumber: {
              result: {
                user: {
                  displayName: 'Test Account',
                },
                status:
                  'Successfully verified phone number, and set TFA send method to text.',
              },
            },
          },
        }

        expect(response).toEqual(expectedResult)
        expect(consoleOutput).toEqual([
          `User: ${user._key} successfully two factor authenticated their account.`,
        ])
      })
      it('updates the user phoneValidated to true', async () => {
        await graphql(
          schema,
          `
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
          null,
          {
            i18n,
            userKey: user._key,
            query,
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
        )

        const cursor = await query`
          FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
        `
        user = await cursor.next()

        expect(user.phoneValidated).toEqual(true)
        expect(consoleOutput).toEqual([
          `User: ${user._key} successfully two factor authenticated their account.`,
        ])
      })
    })
    describe('unsuccessful verifying of phone number', () => {
      describe('the two factor code is not 6 digits long', () => {
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
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
            null,
            {
              i18n,
              userKey: user._key,
              query,
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
          )

          const error = {
            data: {
              verifyPhoneNumber: {
                result: {
                  code: 400,
                  description:
                    'Two factor code length is incorrect. Please try again.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to two factor authenticate, however the code they submitted does not have 6 digits.`,
          ])
        })
      })
      describe('tfa codes do not match', () => {
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
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
            null,
            {
              i18n,
              userKey: user._key,
              query,
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
          )

          const error = {
            data: {
              verifyPhoneNumber: {
                result: {
                  code: 400,
                  description:
                    'Two factor code is incorrect. Please try again.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to two factor authenticate, however the tfa codes do not match.`,
          ])
        })
      })
      describe('database error occurs on upsert', () => {
        it('returns an error message', async () => {
          const mockedQuery = jest
            .fn()
            .mockRejectedValue(new Error('Database error occurred.'))

          const response = await graphql(
            schema,
            `
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
            null,
            {
              i18n,
              userKey: user._key,
              query: mockedQuery,
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
          )

          const error = [
            new GraphQLError(
              'Unable to two factor authenticate. Please try again.',
            ),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Database error occurred when upserting the tfaValidate field for ${user._key}: Error: Database error occurred.`,
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
    describe('successfully verify phone number', () => {
      it('returns a successful status message', async () => {
        const response = await graphql(
          schema,
          `
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
          null,
          {
            i18n,
            userKey: user._key,
            query,
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
        )

        const expectedResult = {
          data: {
            verifyPhoneNumber: {
              result: {
                user: {
                  displayName: 'Test Account',
                },
                status: 'todo',
              },
            },
          },
        }

        expect(response).toEqual(expectedResult)
        expect(consoleOutput).toEqual([
          `User: ${user._key} successfully two factor authenticated their account.`,
        ])
      })
      it('updates the user phoneValidated to true', async () => {
        await graphql(
          schema,
          `
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
          null,
          {
            i18n,
            userKey: user._key,
            query,
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
        )

        const cursor = await query`
          FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
        `
        user = await cursor.next()

        expect(user.phoneValidated).toEqual(true)
        expect(consoleOutput).toEqual([
          `User: ${user._key} successfully two factor authenticated their account.`,
        ])
      })
    })
    describe('unsuccessful verifying of phone number', () => {
      describe('the two factor code is not 6 digits long', () => {
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
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
            null,
            {
              i18n,
              userKey: user._key,
              query,
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
          )

          const error = {
            data: {
              verifyPhoneNumber: {
                result: {
                  code: 400,
                  description: 'todo',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to two factor authenticate, however the code they submitted does not have 6 digits.`,
          ])
        })
      })
      describe('tfa codes do not match', () => {
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
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
            null,
            {
              i18n,
              userKey: user._key,
              query,
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
          )

          const error = {
            data: {
              verifyPhoneNumber: {
                result: {
                  code: 400,
                  description: 'todo',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to two factor authenticate, however the tfa codes do not match.`,
          ])
        })
      })
      describe('database error occurs on upsert', () => {
        it('returns an error message', async () => {
          const mockedQuery = jest
            .fn()
            .mockRejectedValue(new Error('Database error occurred.'))

          const response = await graphql(
            schema,
            `
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
            null,
            {
              i18n,
              userKey: user._key,
              query: mockedQuery,
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
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Database error occurred when upserting the tfaValidate field for ${user._key}: Error: Database error occurred.`,
          ])
        })
      })
    })
  })
})
