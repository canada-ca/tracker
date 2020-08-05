const dotenv = require('dotenv-safe')
dotenv.config()

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { graphql, GraphQLSchema, GraphQLError } = require('graphql')
const { toGlobalId } = require('graphql-relay')
const { makeMigrations } = require('../../migrations')
const { createQuerySchema } = require('../queries')
const { createMutationSchema } = require('../mutations')

const bcrypt = require('bcrypt')
const { cleanseInput } = require('../validators')
const { tokenize } = require('../auth')
const { userLoaderByUserName, userLoaderById } = require('../loaders')

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('authenticate user account', () => {
  let query, drop, truncate, migrate, schema

  beforeAll(async () => {
    // Create GQL Schema
    schema = new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createMutationSchema(),
    })
  })

  let consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  const mockedError = (output) => consoleOutput.push(output)
  beforeEach(async () => {
    console.info = mockedInfo
    console.warn = mockedWarn
    console.error = mockedError
    // Generate DB Items
    ;({ migrate } = await ArangoTools({ rootPass, url }))
    ;({ query, drop, truncate } = await migrate(
      makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
    ))
    await truncate()
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
        functions: {
          cleanseInput,
        },
        loaders: {
          userLoaderByUserName: userLoaderByUserName(query),
        },
      },
    )
    consoleOutput = []
  })

  afterEach(async () => {
    await drop()
  })

  describe('given successful update of users password', () => {
    it('returns a successful status message', async () => {
      const cursor = await query`
        FOR user IN users
          FILTER user.userName == "test.account@istio.actually.exists"
          RETURN user
      `
      const user = await cursor.next()

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
          query,
          userId: user._key,
          auth: {
            bcrypt,
            tokenize,
          },
          functions: {
            cleanseInput,
          },
          loaders: {
            userLoaderByUserName: userLoaderByUserName(query),
            userLoaderById: userLoaderById(query),
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

      consoleOutput = []

      const authenticateResponse = await graphql(
        schema,
        `
          mutation {
            authenticate(
              input: {
                userName: "test.account@istio.actually.exists"
                password: "newtestpassword123"
              }
            ) {
              authResult {
                user {
                  id
                  userName
                  displayName
                  preferredLang
                  tfaValidated
                  emailValidated
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
          functions: {
            cleanseInput,
          },
          loaders: {
            userLoaderByUserName: userLoaderByUserName(query),
          },
        },
      )

      const expectedAuthResponse = {
        data: {
          authenticate: {
            authResult: {
              user: {
                id: `${toGlobalId('users', user._key)}`,
                userName: 'test.account@istio.actually.exists',
                displayName: 'Test Account',
                preferredLang: 'FRENCH',
                tfaValidated: false,
                emailValidated: false,
              },
            },
          },
        },
      }

      expect(authenticateResponse).toEqual(expectedAuthResponse)
      expect(consoleOutput).toEqual([
        `User: ${user._key} successfully authenticated their account.`,
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
            query,
            userId: undefined,
            auth: {
              bcrypt,
              tokenize,
            },
            functions: {
              cleanseInput,
            },
            loaders: {
              userLoaderByUserName: userLoaderByUserName(query),
              userLoaderById: userLoaderById(query),
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
            query,
            userId: 1,
            auth: {
              bcrypt,
              tokenize,
            },
            functions: {
              cleanseInput,
            },
            loaders: {
              userLoaderByUserName: userLoaderByUserName(query),
              userLoaderById: userLoaderById(query),
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
        const cursor = await query`
          FOR user IN users
            FILTER user.userName == "test.account@istio.actually.exists"
            RETURN user
        `
        const user = await cursor.next()

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
            query,
            userId: user._key,
            auth: {
              bcrypt,
              tokenize,
            },
            functions: {
              cleanseInput,
            },
            loaders: {
              userLoaderByUserName: userLoaderByUserName(query),
              userLoaderById: userLoaderById(query),
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
        const cursor = await query`
          FOR user IN users
            FILTER user.userName == "test.account@istio.actually.exists"
            RETURN user
        `
        const user = await cursor.next()

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
            query,
            userId: user._key,
            auth: {
              bcrypt,
              tokenize,
            },
            functions: {
              cleanseInput,
            },
            loaders: {
              userLoaderByUserName: userLoaderByUserName(query),
              userLoaderById: userLoaderById(query),
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
        const cursor = await query`
          FOR user IN users
            FILTER user.userName == "test.account@istio.actually.exists"
            RETURN user
        `
        const user = await cursor.next()

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
            query,
            userId: user._key,
            auth: {
              bcrypt,
              tokenize,
            },
            functions: {
              cleanseInput,
            },
            loaders: {
              userLoaderByUserName: userLoaderByUserName(query),
              userLoaderById: userLoaderById(query),
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
        const cursor = await query`
          FOR user IN users
            FILTER user.userName == "test.account@istio.actually.exists"
            RETURN user
        `
        const user = await cursor.next()

        const userNameLoader = userLoaderByUserName(query)
        const idLoader = userLoaderById(query)

        query = jest
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
            query,
            userId: user._key,
            auth: {
              bcrypt,
              tokenize,
            },
            functions: {
              cleanseInput,
            },
            loaders: {
              userLoaderByUserName: userNameLoader,
              userLoaderById: idLoader,
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
