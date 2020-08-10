const dotenv = require('dotenv-safe')
dotenv.config()

const { SIGN_IN_KEY } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { graphql, GraphQLSchema, GraphQLError } = require('graphql')
const { toGlobalId } = require('graphql-relay')
const { makeMigrations } = require('../../migrations')
const { createQuerySchema } = require('../queries')
const { createMutationSchema } = require('../mutations')

const bcrypt = require('bcrypt')
const { cleanseInput } = require('../validators')
const { tokenize, verifyToken } = require('../auth')
const { userLoaderById } = require('../loaders')

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('authenticate user account', () => {
  let query, drop, truncate, migrate, schema, collections

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
    ;({ query, drop, truncate, collections } = await migrate(
      makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
    ))
    await truncate()
    consoleOutput = []
  })

  afterEach(async () => {
    await drop()
  })

  describe('given successful authentication', () => {
    beforeEach(async () => {
      await collections.users.save({
        userName: 'test.account@istio.actually.exists',
        displayName: 'Test Account',
        preferredLang: 'french',
        tfaValidated: false,
        emailValidated: false,
        tfaCode: 123456,
      })
    })
    it('returns users information and JWT', async () => {
      let cursor = await query`
        FOR user IN users
          FILTER user.userName == "test.account@istio.actually.exists"
          RETURN user
      `
      let user = await cursor.next()

      const token = tokenize({
        parameters: { userId: user._key },
        secret: String(SIGN_IN_KEY),
      })
      const response = await graphql(
        schema,
        `
          mutation {
            authenticate(
              input: {
                authenticationCode: 123456
                authenticateToken: "${token}"
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
            bcrypt,
            tokenize,
            verifyToken,
          },
          validators: {
            cleanseInput,
          },
          loaders: {
            userLoaderById: userLoaderById(query),
          },
        },
      )

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

      cursor = await query`
        FOR user IN users
          FILTER user.userName == "test.account@istio.actually.exists"
          RETURN user
      `
      user = await cursor.next()

      expect(response).toEqual(expectedResult)
      expect(user.tfaCode).toEqual(null)
      expect(consoleOutput).toEqual([
        `User: ${user._key} successfully authenticated their account.`,
      ])
    })
  })

  describe('given unsuccessful authentication', () => {
    describe('when userId in token is undefined', () => {
      it('returns an error message', async () => {
        const token = tokenize({
          parameters: { userId: undefined },
          secret: String(SIGN_IN_KEY),
        })
        const response = await graphql(
          schema,
          `
            mutation {
              authenticate(
                input: {
                  authenticationCode: 654321
                  authenticateToken: "${token}"
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
              bcrypt,
              tokenize,
              verifyToken,
            },
            validators: {
              cleanseInput,
            },
            loaders: {
              userLoaderById: userLoaderById(query),
            },
          },
        )

        const error = [
          new GraphQLError('Unable to authenticate. Please try again.'),
        ]

        expect(response.errors).toEqual(error)
        expect(consoleOutput).toEqual([
          `Authentication token does not contain the userId`,
        ])
      })
    })
    describe('when userId is not a field in the token parameters', () => {
      it('returns an error message', async () => {
        const token = tokenize({ parameters: {}, secret: String(SIGN_IN_KEY) })
        const response = await graphql(
          schema,
          `
            mutation {
              authenticate(
                input: {
                  authenticationCode: 654321
                  authenticateToken: "${token}"
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
              bcrypt,
              tokenize,
              verifyToken,
            },
            validators: {
              cleanseInput,
            },
            loaders: {
              userLoaderById: userLoaderById(query),
            },
          },
        )

        const error = [
          new GraphQLError('Unable to authenticate. Please try again.'),
        ]

        expect(response.errors).toEqual(error)
        expect(consoleOutput).toEqual([
          `Authentication token does not contain the userId`,
        ])
      })
    })
    describe('when user cannot be found in database', () => {
      it('returns an error message', async () => {
        const token = tokenize({
          parameters: { userId: 1 },
          secret: String(SIGN_IN_KEY),
        })
        const response = await graphql(
          schema,
          `
            mutation {
              authenticate(
                input: {
                  authenticationCode: 654321
                  authenticateToken: "${token}"
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
              bcrypt,
              tokenize,
              verifyToken,
            },
            validators: {
              cleanseInput,
            },
            loaders: {
              userLoaderById: userLoaderById(query),
            },
          },
        )

        const error = [
          new GraphQLError('Unable to authenticate. Please try again.'),
        ]

        expect(response.errors).toEqual(error)
        expect(consoleOutput).toEqual([
          `User: 1 attempted to authenticate, no account is associated with this id.`,
        ])
      })
    })
    describe('when tfa codes do not match', () => {
      beforeEach(async () => {
        await collections.users.save({
          userName: 'test.account@istio.actually.exists',
          displayName: 'Test Account',
          preferredLang: 'french',
          tfaValidated: false,
          emailValidated: false,
          tfaCode: 123456,
        })
      })
      it('returns an error message', async () => {
        const cursor = await query`
          FOR user IN users
            FILTER user.userName == "test.account@istio.actually.exists"
            RETURN user
        `
        const user = await cursor.next()

        const token = tokenize({
          parameters: { userId: user._key },
          secret: String(SIGN_IN_KEY),
        })
        const response = await graphql(
          schema,
          `
            mutation {
              authenticate(
                input: {
                  authenticationCode: 654321
                  authenticateToken: "${token}"
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
              bcrypt,
              tokenize,
              verifyToken,
            },
            validators: {
              cleanseInput,
            },
            loaders: {
              userLoaderById: userLoaderById(query),
            },
          },
        )

        const error = [
          new GraphQLError('Unable to authenticate. Please try again.'),
        ]

        expect(response.errors).toEqual(error)
        expect(consoleOutput).toEqual([
          `User: ${user._key} attempted to authenticate their account, however the tfaCodes did not match.`,
        ])
      })
    })
    describe('database error occurs when setting tfaCode to null', () => {
      beforeEach(async () => {
        await collections.users.save({
          userName: 'test.account@istio.actually.exists',
          displayName: 'Test Account',
          preferredLang: 'french',
          tfaValidated: false,
          emailValidated: false,
          tfaCode: 123456,
        })
      })
      it('returns an error message', async () => {
        const cursor = await query`
          FOR user IN users
            FILTER user.userName == "test.account@istio.actually.exists"
            RETURN user
        `
        const user = await cursor.next()
        const loader = userLoaderById(query)
        const token = tokenize({
          parameters: { userId: user._key },
          secret: String(SIGN_IN_KEY),
        })

        query = jest
          .fn()
          .mockRejectedValue(new Error('Database error occurred.'))

        const response = await graphql(
          schema,
          `
            mutation {
              authenticate(
                input: {
                  authenticationCode: 123456
                  authenticateToken: "${token}"
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
              bcrypt,
              tokenize,
              verifyToken,
            },
            validators: {
              cleanseInput,
            },
            loaders: {
              userLoaderById: loader,
            },
          },
        )

        const error = [
          new GraphQLError('Unable to authenticate. Please try again.'),
        ]

        expect(response.errors).toEqual(error)
        expect(consoleOutput).toEqual([
          `Database error ocurred when resetting failed attempts for user: ${user._key} during authentication: Error: Database error occurred.`,
        ])
      })
    })
  })
})
