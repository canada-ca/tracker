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

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('authenticate user account', () => {
  const originalInfo = console.info
  afterEach(() => (console.info = originalInfo))

  let query, drop, truncate, migrate, schema

  beforeAll(async () => {
    ;({ migrate } = await ArangoTools({ rootPass, url }))
    ;({ query, drop, truncate } = await migrate(
      makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
    ))
    schema = new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createMutationSchema(),
    })
  })

  let consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  beforeEach(async () => {
    console.info = mockedInfo
    console.warn = mockedWarn
    await truncate()
    await graphql(
      schema,
      `
        mutation {
          signUp(
            input: {
              displayName: "Test Account"
              userName: "test.account@istio.actually.exists"
              password: "password123"
              confirmPassword: "password123"
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
        tokenize,
        functions: {
          cleanseInput,
        },
      },
    )
    consoleOutput = []
  })

  afterAll(async () => {
    await drop()
  })

  describe('given succesful authentication', () => {
    it('returns users information and JWT', async () => {
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
          tokenize,
          functions: {
            cleanseInput,
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
    describe('after an unseccessful login, user enters correct details', () => {
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
            tokenize,
            functions: {
              cleanseInput,
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
  })

  describe('given unsecessful authenticatation', () => {
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
            tokenize,
            functions: {
              cleanseInput,
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
            tokenize,
            functions: {
              cleanseInput,
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
            tokenize,
            functions: {
              cleanseInput,
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
            tokenize,
            functions: {
              cleanseInput,
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
  })
})
