const dotenv = require('dotenv-safe')
dotenv.config()

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { graphql, GraphQLSchema, GraphQLError } = require('graphql')
const { toGlobalId } = require('graphql-relay')
const { makeMigrations } = require('../../migrations')
const { createQuerySchema } = require('../queries')
const { createMutationSchema } = require('../mutations')
const { cleanseInput } = require('../validators')

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('authenticate user account', () => {
  const originalInfo = console.info
  afterEach(() => (console.info = originalInfo))

  let query, drop, truncate, migrate, collections, schema

  beforeAll(async () => {
    ;({ migrate } = await ArangoTools({ rootPass, url }))
    ;({ query, drop, truncate, collections } = await migrate(
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
                  authenticate (
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
                          preferredLanguage
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
                functions: {
                  cleanseInput,
                },
              },
          )

          const cursor = await query
          `
              FOR user IN users
                FILTER user.userName == "test.account@istio.actually.exists"
                RETURN user
          `
          const user = await cursor.next()

          expectedResult = {
            data: {
              authenticate: {
                authResult: {
                  user: {
                    id: `${toGlobalId('users', user._key)}`,
                    userName: 'test.account@istio.actually.exists',
                    displayName: 'Test Account',
                    preferredLanguage: 'FRENCH',
                    tfaValidated: false,
                    emailValidated: false,
                  },
                },
              },
            },
          }

          expect(response).toEqual(expectedResult)
          expect(consoleOutput).toEqual([
              `User: ${user._key} successfully authenticated their account.`
          ])
      })
  })

  describe('given unsecessful authenticatation', () => {
      describe('when login credentials are invalid', () => {
        
        it('returns an authentication error', async () => {
            const response = await graphql(
                schema,
                `
                mutation {
                    authenticate (
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
                            preferredLanguage
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
                    functions: {
                    cleanseInput,
                    },
                },
            )
    
            const cursor = await query
            `
                FOR user IN users
                FILTER user.userName == "test.account@istio.actually.exists"
                RETURN user
            `
            const user = await cursor.next()

            expect(response).toMatchObject({errors: [{message: 'Unable to authenticate, please try again.'}]})
            expect(consoleOutput).toEqual([
                `User attempted to authenticate: ${user._key} with invalid credentials.`
            ])
          })
        it('increases the failed attempt counter', async () => {
            const response = await graphql(
                schema,
                `
                mutation {
                    authenticate (
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
                            preferredLanguage
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
                    functions: {
                    cleanseInput,
                    },
                },
            )
    
            const cursor = await query
            `
                FOR user IN users
                FILTER user.userName == "test.account@istio.actually.exists"
                RETURN user
            `
            const user = await cursor.next()
            
            expect(user.failedLoginAttempts).toEqual(1)
        })
      })
  })
})