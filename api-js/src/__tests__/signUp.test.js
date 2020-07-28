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

describe('user sign up', () => {
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
  })

  afterEach(() => {
    consoleOutput = []
  })

  afterAll(async () => {
    await drop()
  })

  describe('given successful sign up', () => {
    describe('when the users preferred language is english', () => {
      it('returns auth result with user info', async () => {
        const response = await graphql(
          schema,
          `
            mutation {
              signUp(
                input: {
                  displayName: "Test Account"
                  userName: "test.account@istio.actually.exists"
                  password: "testpassword123"
                  confirmPassword: "testpassword123"
                  preferredLang: ENGLISH
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

        const cursor = await query`
                    FOR user IN users
                        FILTER user.userName == "test.account@istio.actually.exists"
                        RETURN user
                `
        const users = await cursor.all()

        expectedResult = {
          data: {
            signUp: {
              authResult: {
                user: {
                  id: `${toGlobalId('users', users[0]._key)}`,
                  userName: 'test.account@istio.actually.exists',
                  displayName: 'Test Account',
                  preferredLanguage: 'ENGLISH',
                  tfaValidated: false,
                  emailValidated: false,
                },
              },
            },
          },
        }

        expect(response).toEqual(expectedResult)
        expect(consoleOutput).toEqual([
          'User: test.account@istio.actually.exists successfully created a new account.',
        ])
      })
    })

    describe('when the users preferred language is french', () => {
      it('returns auth result with user info', async () => {
        const response = await graphql(
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

        const cursor = await query`
                    FOR user IN users
                        FILTER user.userName == "test.account@istio.actually.exists"
                        RETURN user
                `
        const user = await cursor.next()

        expectedResult = {
          data: {
            signUp: {
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
          'User: test.account@istio.actually.exists successfully created a new account.',
        ])
      })
    })
  })
  describe('given unsuccessful sign up', () => {
    describe('when the password is not strong enough', () => {
      it('returns a password too short error', async () => {
        const response = await graphql(
          schema,
          `
            mutation {
              signUp(
                input: {
                  displayName: "Test Account"
                  userName: "test.account@istio.actually.exists"
                  password: "123"
                  confirmPassword: "123"
                  preferredLang: FRENCH
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

        const error = [new GraphQLError('Password is too short.')]

        expect(response.errors).toEqual(error)
        expect(consoleOutput).toEqual([
          'User: test.account@istio.actually.exists tried to sign up but did not meet requirements.',
        ])
      })
    })
    describe('when the passwords do not match', () => {
      it('returns a password not matching error', async () => {
        const response = await graphql(
          schema,
          `
            mutation {
              signUp(
                input: {
                  displayName: "Test Account"
                  userName: "test.account@istio.actually.exists"
                  password: "password123"
                  confirmPassword: "321drowssap"
                  preferredLang: FRENCH
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

        const error = [new GraphQLError('Passwords do not match.')]

        expect(response.errors).toEqual(error)
        expect(consoleOutput).toEqual([
          'User: test.account@istio.actually.exists tried to sign up but passwords do not match.',
        ])
      })
    })
    describe('when the user name already in use', () => {
      beforeEach(async () => {
        await collections.users.save({
          userName: 'test.account@istio.actually.exists',
          displayName: 'Test Account',
          preferredLanguage: 'FRENCH',
          tfaValidated: false,
          emailValidated: false,
        })
      })

      it('returns a user name already in use error', async () => {
        const response = await graphql(
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

        const error = [new GraphQLError('Username already in use.')]

        expect(response.errors).toEqual(error)
        expect(consoleOutput).toEqual([
          'User: test.account@istio.actually.exists tried to sign up, however there is already an account in use with that username.',
        ])
      })
    })
  })
})
