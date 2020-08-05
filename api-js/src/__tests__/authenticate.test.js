const dotenv = require('dotenv-safe')
dotenv.config()

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { graphql, GraphQLSchema } = require('graphql')
const { toGlobalId } = require('graphql-relay')
const { makeMigrations } = require('../../migrations')
const { createQuerySchema } = require('../queries')
const { createMutationSchema } = require('../mutations')

const { cleanseInput } = require('../validators')
const { tokenize } = require('../auth')
const { userLoaderByUserName } = require('../loaders')

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('authenticate user account', () => {
  const originalInfo = console.info
  afterEach(() => (console.info = originalInfo))

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

  afterAll(async () => {
    await drop()
  })

  describe('given successful authentication', () => {
    it('returns users information and JWT', async () => {
      const response = await graphql(
        schema,
        `
          mutation {
            authenticate(
              input: {
                userName: "test.account@istio.actually.exists"
                password: "testpassword123"
              }
            ) {
              authResult {
                authToken
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

      const cursor = await query`
              FOR user IN users
                FILTER user.userName == "test.account@istio.actually.exists"
                RETURN user
          `
      const user = await cursor.next()

      const expectedResult = {
        data: {
          authenticate: {
            authResult: {
              authToken: tokenize({ parameters: { userId: user._key } }),
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

      expect(response).toEqual(expectedResult)
      expect(consoleOutput).toEqual([
        `User: ${user._key} successfully authenticated their account.`,
      ])
    })
    describe('after an unsuccessful login, user enters correct details', () => {
      it('resets the failed login attempt counter', async () => {
        const userCursor = await query`
          FOR user IN users
            FILTER user.userName == "test.account@istio.actually.exists"
            RETURN user
        `
        const user = await userCursor.next()

        await query`
          FOR user IN users
            UPDATE ${user._key} WITH { failedLoginAttempts: 5 } IN users
        `

        await graphql(
          schema,
          `
            mutation {
              authenticate(
                input: {
                  userName: "test.account@istio.actually.exists"
                  password: "testpassword123"
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

        const updateCursor = await query`
            FOR user IN users
            FILTER user.userName == "test.account@istio.actually.exists"
            RETURN user
        `
        const checkUser = await updateCursor.next()

        expect(checkUser.failedLoginAttempts).toEqual(0)
      })
    })
    describe('Database error occurs after successful login when failed logins is being reset', () => {
      it('throws an error', async () => {
        const userCursor = await query`
          FOR user IN users
            FILTER user.userName == "test.account@istio.actually.exists"
            RETURN user
        `
        const user = await userCursor.next()

        const loader = userLoaderByUserName(query)

        query = jest
          .fn()
          .mockRejectedValue(new Error('Database error occurred.'))

        try {
          await graphql(
            schema,
            `
              mutation {
                authenticate(
                  input: {
                    userName: "test.account@istio.actually.exists"
                    password: "testpassword123"
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
                tokenize,
              },
              functions: {
                cleanseInput,
              },
              loaders: {
                userLoaderByUserName: loader,
              },
            },
          )
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to authenticate, please try again.'),
          )
        }

        expect(consoleOutput).toEqual([
          `Database error ocurred when resetting failed attempts for user: ${user._key} during authentication: Error: Database error occurred.`,
        ])
      })
    })
  })

  describe('given successful authentication', () => {
    describe('when login credentials are invalid', () => {
      it('returns an authentication error', async () => {
        const response = await graphql(
          schema,
          `
            mutation {
              authenticate(
                input: {
                  userName: "test.account@istio.actually.exists"
                  password: "123"
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

        const cursor = await query`
              FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
        const user = await cursor.next()

        expect(response).toMatchObject({
          errors: [{ message: 'Unable to authenticate, please try again.' }],
        })
        expect(consoleOutput).toEqual([
          `User attempted to authenticate: ${user._key} with invalid credentials.`,
        ])
      })
      it('increases the failed attempt counter', async () => {
        await graphql(
          schema,
          `
            mutation {
              authenticate(
                input: {
                  userName: "test.account@istio.actually.exists"
                  password: "123"
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

        const cursor = await query`
              FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
        const user = await cursor.next()

        expect(user.failedLoginAttempts).toEqual(1)
      })
    })
    describe('user has reached maximum amount of login attempts', () => {
      it('returns a too many login attempts error message', async () => {
        const userCursor = await query`
          FOR user IN users
            FILTER user.userName == "test.account@istio.actually.exists"
            RETURN user
        `
        const user = await userCursor.next()

        await query`
          FOR user IN users
            UPDATE ${user._key} WITH { failedLoginAttempts: 10 } IN users
        `

        const response = await graphql(
          schema,
          `
            mutation {
              authenticate(
                input: {
                  userName: "test.account@istio.actually.exists"
                  password: "password123"
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

        expect(response).toMatchObject({
          errors: [
            {
              message:
                'Too many failed login attempts, please reset your password, and try again.',
            },
          ],
        })
        expect(consoleOutput).toEqual([
          `User: ${user._key} tried to authenticate, but has too many login attempts.`,
        ])
      })
    })
    describe("user attempts to login into an account that doesn't exist", () => {
      it('returns a generic error message', async () => {
        const response = await graphql(
          schema,
          `
            mutation {
              authenticate(
                input: {
                  userName: "test.account@istio.does.not.actually.exists"
                  password: "password123"
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

        expect(response).toMatchObject({
          errors: [{ message: 'Unable to authenticate, please try again.' }],
        })
        expect(consoleOutput).toEqual([
          `User: test.account@istio.does.not.actually.exists attempted to authenticate, no account is associated with this email.`,
        ])
      })
    })
    describe('Database error occurs when failed logins are being incremented ', () => {
      it('throws an error', async () => {
        const userCursor = await query`
          FOR user IN users
            FILTER user.userName == "test.account@istio.actually.exists"
            RETURN user
        `
        const user = await userCursor.next()

        const loader = userLoaderByUserName(query)

        query = jest
          .fn()
          .mockRejectedValue(new Error('Database error occurred.'))

        try {
          await graphql(
            schema,
            `
              mutation {
                authenticate(
                  input: {
                    userName: "test.account@istio.actually.exists"
                    password: "321password"
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
                tokenize,
              },
              functions: {
                cleanseInput,
              },
              loaders: {
                userLoaderByUserName: loader,
              },
            },
          )
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to authenticate, please try again.'),
          )
        }

        expect(consoleOutput).toEqual([
          `Database error ocurred when incrementing user: ${user._key} failed login attempts: Error: Database error occurred.`,
        ])
      })
    })
  })
})
