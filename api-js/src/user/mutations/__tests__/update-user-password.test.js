import { ArangoTools, dbNameFromFile } from 'arango-tools'
import bcrypt from 'bcrypt'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { makeMigrations } from '../../../../migrations'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { cleanseInput } from '../../../validators'
import { tokenize } from '../../../auth'
import { userLoaderByUserName, userLoaderByKey } from '../../loaders'

const { DB_PASS: rootPass, DB_URL: url } = process.env

const mockNotfiy = jest.fn()

describe('authenticate user account', () => {
  let query, drop, truncate, migrate, schema, i18n, user

  beforeAll(async () => {
    // Create GQL Schema
    schema = new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createMutationSchema(),
    })
    // Generate DB Items
    ;({ migrate } = await ArangoTools({ rootPass, url }))
    ;({ query, drop, truncate } = await migrate(
      makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
    ))
  })

  const consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  const mockedError = (output) => consoleOutput.push(output)

  beforeEach(async () => {
    console.info = mockedInfo
    console.warn = mockedWarn
    console.error = mockedError
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
            authResult {
              user {
                id
              }
            }
          }
        }
      `,
      null,
      {
        query,
        auth: {
          bcrypt,
          tokenize,
        },
        validators: {
          cleanseInput,
        },
        loaders: {
          userLoaderByUserName: userLoaderByUserName(query),
        },
      },
    )
    const userCursor = await query`
      FOR user IN users
        FILTER user.userName == "test.account@istio.actually.exists"
        UPDATE { _key: user._key, tfaSendMethod: 'email' } IN users
        RETURN user
    `
    user = await userCursor.next()
    consoleOutput.length = 0
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
    describe('given successful update of users password', () => {
      it('returns a successful status message', async () => {
        const response = await graphql(
          schema,
          `
            mutation {
              updateUserPassword(
                input: {
                  currentPassword: "testpassword123"
                  updatedPassword: "newtestpassword123"
                  updatedPasswordConfirm: "newtestpassword123"
                }
              ) {
                status
              }
            }
          `,
          null,
          {
            i18n,
            query,
            userKey: user._key,
            auth: {
              bcrypt,
              tokenize,
            },
            validators: {
              cleanseInput,
            },
            loaders: {
              userLoaderByUserName: userLoaderByUserName(query),
              userLoaderByKey: userLoaderByKey(query),
            },
          },
        )

        const expectedResponse = {
          data: {
            updateUserPassword: {
              status: 'Password was successfully updated.',
            },
          },
        }

        expect(response).toEqual(expectedResponse)
        expect(consoleOutput).toEqual([
          `User: ${user._key} successfully updated their password.`,
        ])

        consoleOutput.length = 0

        const authenticateResponse = await graphql(
          schema,
          `
            mutation {
              signIn(
                input: {
                  userName: "test.account@istio.actually.exists"
                  password: "newtestpassword123"
                }
              ) {
                result {
                  ... on TFASignInResult {
                    sendMethod
                  }
                }
              }
            }
          `,
          null,
          {
            i18n,
            query,
            auth: {
              bcrypt,
              tokenize,
            },
            validators: {
              cleanseInput,
            },
            loaders: {
              userLoaderByUserName: userLoaderByUserName(query),
            },
            notify: {
              sendAuthEmail: mockNotfiy,
            },
          },
        )

        const expectedAuthResponse = {
          data: {
            signIn: {
              result: {
                sendMethod: 'email',
              },
            },
          },
        }

        expect(authenticateResponse).toEqual(expectedAuthResponse)
        expect(consoleOutput).toEqual([
          `User: ${user._key} successfully signed in, and sent auth msg.`,
        ])
      })
    })
    describe('given unsuccessful update of users password', () => {
      describe('user id is undefined', () => {
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                updateUserPassword(
                  input: {
                    currentPassword: "testpassword123"
                    updatedPassword: "newtestpassword123"
                    updatedPasswordConfirm: "newtestpassword123"
                  }
                ) {
                  status
                }
              }
            `,
            null,
            {
              i18n,
              query,
              userKey: undefined,
              auth: {
                bcrypt,
                tokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByUserName: userLoaderByUserName(query),
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const error = [
            new GraphQLError('Authentication error, please sign in again.'),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            'User attempted to update password, but the user id is undefined.',
          ])
        })
      })
      describe('user cannot be found in the database', () => {
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                updateUserPassword(
                  input: {
                    currentPassword: "testpassword123"
                    updatedPassword: "newtestpassword123"
                    updatedPasswordConfirm: "newtestpassword123"
                  }
                ) {
                  status
                }
              }
            `,
            null,
            {
              i18n,
              query,
              userKey: 1,
              auth: {
                bcrypt,
                tokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByUserName: userLoaderByUserName(query),
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const error = [
            new GraphQLError('Unable to update password. Please try again.'),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 1 attempted to update their password, but no account is associated with that id.`,
          ])
        })
      })
      describe('the current password does not match the password in the database', () => {
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                updateUserPassword(
                  input: {
                    currentPassword: "randompassword"
                    updatedPassword: "newtestpassword123"
                    updatedPasswordConfirm: "newtestpassword123"
                  }
                ) {
                  status
                }
              }
            `,
            null,
            {
              i18n,
              query,
              userKey: user._key,
              auth: {
                bcrypt,
                tokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByUserName: userLoaderByUserName(query),
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const error = [
            new GraphQLError(
              'Unable to update password, current password does not match. Please try again.',
            ),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to update their password, however they did not enter the current password correctly.`,
          ])
        })
      })
      describe('the new password does not match the new password confirmation', () => {
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                updateUserPassword(
                  input: {
                    currentPassword: "testpassword123"
                    updatedPassword: "newtestpassword123"
                    updatedPasswordConfirm: "oldtestpassword123"
                  }
                ) {
                  status
                }
              }
            `,
            null,
            {
              i18n,
              query,
              userKey: user._key,
              auth: {
                bcrypt,
                tokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByUserName: userLoaderByUserName(query),
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const error = [
            new GraphQLError(
              'Unable to update password, new passwords do not match. Please try again.',
            ),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to update their password, however the new passwords do not match.`,
          ])
        })
      })
      describe('the new password does not meet GoC requirements', () => {
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                updateUserPassword(
                  input: {
                    currentPassword: "testpassword123"
                    updatedPassword: "password"
                    updatedPasswordConfirm: "password"
                  }
                ) {
                  status
                }
              }
            `,
            null,
            {
              i18n,
              query,
              userKey: user._key,
              auth: {
                bcrypt,
                tokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByUserName: userLoaderByUserName(query),
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const error = [
            new GraphQLError(
              'Unable to update password, passwords are required to be 12 characters or longer. Please try again.',
            ),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to update their password, however the new password does not meet GoC requirements.`,
          ])
        })
      })
      describe('database error occurs when updating password', () => {
        it('returns an error message', async () => {
          const userNameLoader = userLoaderByUserName(query)
          const idLoader = userLoaderByKey(query)

          const mockedQuery = jest
            .fn()
            .mockRejectedValue(new Error('Database error occurred.'))

          const response = await graphql(
            schema,
            `
              mutation {
                updateUserPassword(
                  input: {
                    currentPassword: "testpassword123"
                    updatedPassword: "newtestpassword123"
                    updatedPasswordConfirm: "newtestpassword123"
                  }
                ) {
                  status
                }
              }
            `,
            null,
            {
              i18n,
              query: mockedQuery,
              userKey: user._key,
              auth: {
                bcrypt,
                tokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByUserName: userNameLoader,
                userLoaderByKey: idLoader,
              },
            },
          )

          const error = [
            new GraphQLError('Unable to update password. Please try again.'),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Database error ocurred when user: ${user._key} attempted to update their password: Error: Database error occurred.`,
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
    describe('given successful update of users password', () => {
      it('returns a successful status message', async () => {
        const response = await graphql(
          schema,
          `
            mutation {
              updateUserPassword(
                input: {
                  currentPassword: "testpassword123"
                  updatedPassword: "newtestpassword123"
                  updatedPasswordConfirm: "newtestpassword123"
                }
              ) {
                status
              }
            }
          `,
          null,
          {
            i18n,
            query,
            userKey: user._key,
            auth: {
              bcrypt,
              tokenize,
            },
            validators: {
              cleanseInput,
            },
            loaders: {
              userLoaderByUserName: userLoaderByUserName(query),
              userLoaderByKey: userLoaderByKey(query),
            },
          },
        )

        const expectedResponse = {
          data: {
            updateUserPassword: {
              status: 'todo',
            },
          },
        }

        expect(response).toEqual(expectedResponse)
        expect(consoleOutput).toEqual([
          `User: ${user._key} successfully updated their password.`,
        ])

        consoleOutput.length = 0

        const authenticateResponse = await graphql(
          schema,
          `
            mutation {
              signIn(
                input: {
                  userName: "test.account@istio.actually.exists"
                  password: "newtestpassword123"
                }
              ) {
                result {
                  ... on TFASignInResult {
                    sendMethod
                  }
                }
              }
            }
          `,
          null,
          {
            i18n,
            query,
            auth: {
              bcrypt,
              tokenize,
            },
            validators: {
              cleanseInput,
            },
            loaders: {
              userLoaderByUserName: userLoaderByUserName(query),
            },
            notify: {
              sendAuthEmail: mockNotfiy,
            },
          },
        )

        const expectedAuthResponse = {
          data: {
            signIn: {
              result: {
                sendMethod: 'email',
              },
            },
          },
        }

        expect(authenticateResponse).toEqual(expectedAuthResponse)
        expect(consoleOutput).toEqual([
          `User: ${user._key} successfully signed in, and sent auth msg.`,
        ])
      })
    })
    describe('given unsuccessful update of users password', () => {
      describe('user id is undefined', () => {
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                updateUserPassword(
                  input: {
                    currentPassword: "testpassword123"
                    updatedPassword: "newtestpassword123"
                    updatedPasswordConfirm: "newtestpassword123"
                  }
                ) {
                  status
                }
              }
            `,
            null,
            {
              i18n,
              query,
              userKey: undefined,
              auth: {
                bcrypt,
                tokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByUserName: userLoaderByUserName(query),
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            'User attempted to update password, but the user id is undefined.',
          ])
        })
      })
      describe('user cannot be found in the database', () => {
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                updateUserPassword(
                  input: {
                    currentPassword: "testpassword123"
                    updatedPassword: "newtestpassword123"
                    updatedPasswordConfirm: "newtestpassword123"
                  }
                ) {
                  status
                }
              }
            `,
            null,
            {
              i18n,
              query,
              userKey: 1,
              auth: {
                bcrypt,
                tokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByUserName: userLoaderByUserName(query),
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 1 attempted to update their password, but no account is associated with that id.`,
          ])
        })
      })
      describe('the current password does not match the password in the database', () => {
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                updateUserPassword(
                  input: {
                    currentPassword: "randompassword"
                    updatedPassword: "newtestpassword123"
                    updatedPasswordConfirm: "newtestpassword123"
                  }
                ) {
                  status
                }
              }
            `,
            null,
            {
              i18n,
              query,
              userKey: user._key,
              auth: {
                bcrypt,
                tokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByUserName: userLoaderByUserName(query),
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to update their password, however they did not enter the current password correctly.`,
          ])
        })
      })
      describe('the new password does not match the new password confirmation', () => {
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                updateUserPassword(
                  input: {
                    currentPassword: "testpassword123"
                    updatedPassword: "newtestpassword123"
                    updatedPasswordConfirm: "oldtestpassword123"
                  }
                ) {
                  status
                }
              }
            `,
            null,
            {
              i18n,
              query,
              userKey: user._key,
              auth: {
                bcrypt,
                tokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByUserName: userLoaderByUserName(query),
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to update their password, however the new passwords do not match.`,
          ])
        })
      })
      describe('the new password does not meet GoC requirements', () => {
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                updateUserPassword(
                  input: {
                    currentPassword: "testpassword123"
                    updatedPassword: "password"
                    updatedPasswordConfirm: "password"
                  }
                ) {
                  status
                }
              }
            `,
            null,
            {
              i18n,
              query,
              userKey: user._key,
              auth: {
                bcrypt,
                tokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByUserName: userLoaderByUserName(query),
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to update their password, however the new password does not meet GoC requirements.`,
          ])
        })
      })
      describe('database error occurs when updating password', () => {
        it('returns an error message', async () => {
          const userNameLoader = userLoaderByUserName(query)
          const idLoader = userLoaderByKey(query)

          const mockedQuery = jest
            .fn()
            .mockRejectedValue(new Error('Database error occurred.'))

          const response = await graphql(
            schema,
            `
              mutation {
                updateUserPassword(
                  input: {
                    currentPassword: "testpassword123"
                    updatedPassword: "newtestpassword123"
                    updatedPasswordConfirm: "newtestpassword123"
                  }
                ) {
                  status
                }
              }
            `,
            null,
            {
              i18n,
              query: mockedQuery,
              userKey: user._key,
              auth: {
                bcrypt,
                tokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByUserName: userNameLoader,
                userLoaderByKey: idLoader,
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Database error ocurred when user: ${user._key} attempted to update their password: Error: Database error occurred.`,
          ])
        })
      })
    })
  })
})
