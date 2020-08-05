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
const { tokenize, verifyToken } = require('../auth')
const { userLoaderByUserName, userLoaderById } = require('../loaders')

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('reset users passsword', () => {
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

  describe('user successfully resets their password', () => {
    it('returns a successful status message', async () => {
      const userCursor = await query`
        FOR user IN users
          FILTER user.userName == "test.account@istio.actually.exists"
          RETURN user
      `
      const user = await userCursor.next()

      const resetToken = tokenize({
        parameters: { userId: user._key, currentPassword: user.password },
      })

      const response = await graphql(
        schema,
        `
          mutation {
            resetPassword (
              input: {
                password: "newpassword123"
                confirmPassword: "newpassword123"
                resetToken: "${resetToken}"
              }
            ) {
              status
            }
          }
        `,
        null,
        {
          query,
          auth: {
            bcrypt,
            tokenize,
            verifyToken,
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
          resetPassword: {
            status: 'Password was successfully reset.',
          },
        },
      }

      expect(response).toEqual(expectedResponse)
      expect(consoleOutput).toEqual([
        `User: ${user._key} successfully reset their password.`,
      ])

      consoleOutput = []

      const testSignIn = await graphql(
        schema,
        `
          mutation {
            authenticate(
              input: {
                userName: "test.account@istio.actually.exists"
                password: "newpassword123"
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

      const expectedtestSignIn = {
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

      expect(testSignIn).toEqual(expectedtestSignIn)
      expect(consoleOutput).toEqual([
        `User: ${user._key} successfully authenticated their account.`,
      ])
    })
  })
  describe('user does not successfully reset their password', () => {
    describe('user cannot be found', () => {
      it('returns an error message', async () => {
        const resetToken = tokenize({
          parameters: { userId: 1, currentPassword: 'secretPassword' },
        })

        const response = await graphql(
          schema,
          `
          mutation {
            resetPassword (
              input: {
                password: "newpassword123"
                confirmPassword: "newpassword123"
                resetToken: "${resetToken}"
              }
            ) {
              status
            }
          }
        `,
          null,
          {
            query,
            auth: {
              bcrypt,
              tokenize,
              verifyToken,
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
          new GraphQLError('Unable to reset password. Please try again.'),
        ]

        expect(response.errors).toEqual(error)
        expect(consoleOutput).toEqual([
          `A user attempted to reset the password for 1, however there is no associated account.`,
        ])
      })
    })
    describe('password in token does not match users current password', () => {
      it('returns an error message', async () => {
        const userCursor = await query`
          FOR user IN users
            FILTER user.userName == "test.account@istio.actually.exists"
            RETURN user
        `
        const user = await userCursor.next()

        const resetToken = tokenize({
          parameters: { userId: user._key, currentPassword: 'secretPassword' },
        })

        const response = await graphql(
          schema,
          `
          mutation {
            resetPassword (
              input: {
                password: "newpassword123"
                confirmPassword: "newpassword123"
                resetToken: "${resetToken}"
              }
            ) {
              status
            }
          }
        `,
          null,
          {
            query,
            auth: {
              bcrypt,
              tokenize,
              verifyToken,
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
          new GraphQLError('Unable to reset password. Please try again.'),
        ]

        expect(response.errors).toEqual(error)
        expect(consoleOutput).toEqual([
          `User: ${user._key} attempted to reset password, however the current password does not match the current hashed password in the db.`,
        ])
      })
    })
    describe('new passwords do not match', () => {
      it('returns an error message', async () => {
        const userCursor = await query`
          FOR user IN users
            FILTER user.userName == "test.account@istio.actually.exists"
            RETURN user
        `
        const user = await userCursor.next()

        const resetToken = tokenize({
          parameters: { userId: user._key, currentPassword: user.password },
        })

        const response = await graphql(
          schema,
          `
          mutation {
            resetPassword (
              input: {
                password: "newpassword123"
                confirmPassword: "testpassword123"
                resetToken: "${resetToken}"
              }
            ) {
              status
            }
          }
        `,
          null,
          {
            query,
            auth: {
              bcrypt,
              tokenize,
              verifyToken,
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
          new GraphQLError('New passwords do not match. Please try again.'),
        ]

        expect(response.errors).toEqual(error)
        expect(consoleOutput).toEqual([
          `User: ${user._key} attempted to reset their password, however the submitted passwords do not match.`,
        ])
      })
    })
    describe('new passwords do not meet GoC requirements', () => {
      it('returns an error message', async () => {
        const userCursor = await query`
          FOR user IN users
            FILTER user.userName == "test.account@istio.actually.exists"
            RETURN user
        `
        const user = await userCursor.next()

        const resetToken = tokenize({
          parameters: { userId: user._key, currentPassword: user.password },
        })

        const response = await graphql(
          schema,
          `
          mutation {
            resetPassword (
              input: {
                password: "password"
                confirmPassword: "password"
                resetToken: "${resetToken}"
              }
            ) {
              status
            }
          }
        `,
          null,
          {
            query,
            auth: {
              bcrypt,
              tokenize,
              verifyToken,
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
          new GraphQLError('Password is not strong enough. Please try again.'),
        ]

        expect(response.errors).toEqual(error)
        expect(consoleOutput).toEqual([
          `User: ${user._key} attempted to reset their password, however the submitted password is not long enough.`,
        ])
      })
    })
    describe('Token is not valid', () => {
      it('returns an error message', async () => {
        const userCursor = await query`
          FOR user IN users
            FILTER user.userName == "test.account@istio.actually.exists"
            RETURN user
        `
        const user = await userCursor.next()

        const userNameLoader = userLoaderByUserName(query)
        const userIdLoader = userLoaderById(query)

        const resetToken = tokenize({
          parameters: { userId: user._key, currentPassword: user.password },
          secret: 'superSecret',
        })

        const response = await graphql(
          schema,
          `
          mutation {
            resetPassword (
              input: {
                password: "testpassword123"
                confirmPassword: "testpassword123"
                resetToken: "${resetToken}"
              }
            ) {
              status
            }
          }
        `,
          null,
          {
            query,
            auth: {
              bcrypt,
              tokenize,
              verifyToken,
            },
            functions: {
              cleanseInput,
            },
            loaders: {
              userLoaderByUserName: userNameLoader,
              userLoaderById: userIdLoader,
            },
          },
        )

        const error = [
          new GraphQLError('Invalid token, please request a new one.'),
        ]

        expect(response.errors).toEqual(error)
        expect(consoleOutput).toEqual([
          `JWT was attempted to be verified but secret was incorrect.`,
        ])
      })
    })
    describe('database error occurs when updating user password', () => {
      it('returns an error message', async () => {
        const userCursor = await query`
          FOR user IN users
            FILTER user.userName == "test.account@istio.actually.exists"
            RETURN user
        `
        const user = await userCursor.next()

        const userNameLoader = userLoaderByUserName(query)
        const userIdLoader = userLoaderById(query)

        const resetToken = tokenize({
          parameters: { userId: user._key, currentPassword: user.password },
        })

        query = jest.fn().mockRejectedValue(new Error('Database error occurred.'))

        const response = await graphql(
          schema,
          `
          mutation {
            resetPassword (
              input: {
                password: "testpassword123"
                confirmPassword: "testpassword123"
                resetToken: "${resetToken}"
              }
            ) {
              status
            }
          }
        `,
          null,
          {
            query,
            auth: {
              bcrypt,
              tokenize,
              verifyToken,
            },
            functions: {
              cleanseInput,
            },
            loaders: {
              userLoaderByUserName: userNameLoader,
              userLoaderById: userIdLoader,
            },
          },
        )

        const error = [
          new GraphQLError('Unable to reset password. Please try again.'),
        ]

        expect(response.errors).toEqual(error)
        expect(consoleOutput).toEqual([
          `Database error ocurred when user: ${user._key} attempted to reset their password: Error: Database error occurred.`,
        ])
      })
    })
  })
})
