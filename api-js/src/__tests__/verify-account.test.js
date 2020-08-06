const dotenv = require('dotenv-safe')
dotenv.config()

const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { graphql, GraphQLSchema, GraphQLError } = require('graphql')
const { makeMigrations } = require('../../migrations')
const { createQuerySchema } = require('../queries')
const { createMutationSchema } = require('../mutations')

const { cleanseInput } = require('../validators')
const { tokenize, verifyToken } = require('../auth')
const { userLoaderById } = require('../loaders')

describe('user send password reset email', () => {
  const originalInfo = console.info
  afterEach(() => (console.info = originalInfo))

  let query, drop, truncate, migrate, collections, schema, request

  beforeAll(async () => {
    ;({ migrate } = await ArangoTools({ rootPass, url }))
    ;({ query, drop, truncate, collections } = await migrate(
      makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
    ))
    schema = new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createMutationSchema(),
    })
    request = {
      protocol: 'https',
      get: (text) => text,
    }
  })

  let consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  const mockedError = (output) => consoleOutput.push(output)
  beforeEach(async () => {
    console.info = mockedInfo
    console.warn = mockedWarn
    console.error = mockedError
    await truncate()
  })

  afterEach(() => {
    consoleOutput = []
  })

  afterAll(async () => {
    await drop()
  })

  describe('given successful validation', () => {
    beforeEach(async () => {
      await collections.users.save({
        userName: 'test.account@istio.actually.exists',
        displayName: 'Test Account',
        preferredLang: 'english',
        tfaValidated: false,
        emailValidated: false,
      })
    })
    it('returns a successful status message', async () => {
      let cursor = await query`
          FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
        `
      let user = await cursor.next()

      const token = tokenize({ parameters: { userId: user._key } })

      const response = await graphql(
        schema,
        `
          mutation {
            verifyAccount(input: { verifyTokenString: "${token}" }) {
              status
            }
          }
        `,
        null,
        {
          request,
          userId: user._key,
          query,
          auth: {
            verifyToken,
          },
          functions: {
            cleanseInput,
          },
          loaders: {
            userLoaderById: userLoaderById(query),
          },
        },
      )

      const expectedResult = {
        data: {
          verifyAccount: {
            status: 'Successfully verified account.',
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
      expect(user.emailValidated).toEqual(true)
      expect(consoleOutput).toEqual([
        `User: ${user._key} successfully email validated their account.`,
      ])
    })
  })
  describe('given an unsuccessful validation', () => {
    describe('userId is undefined', () => {
      it('returns an error message', async () => {
        const token = tokenize({
          parameters: { userId: 1 },
        })

        const response = await graphql(
          schema,
          `
              mutation {
                verifyAccount(input: { verifyTokenString: "${token}" }) {
                  status
                }
              }
            `,
          null,
          {
            request,
            userId: undefined,
            query,
            auth: {
              verifyToken,
            },
            functions: {
              cleanseInput,
            },
            loaders: {
              userLoaderById: userLoaderById(query),
            },
          },
        )

        const error = [
          new GraphQLError('Unable to verify account. Please try again.'),
        ]

        expect(response.errors).toEqual(error)
        expect(consoleOutput).toEqual([
          `User attempted to verify their account, but the userId is undefined.`,
        ])
      })
    })
    describe('user cannot be found in db', () => {
      it('returns an error message', async () => {
        const token = tokenize({
          parameters: { userId: 1 },
        })
        const response = await graphql(
          schema,
          `
              mutation {
                verifyAccount(input: { verifyTokenString: "${token}" }) {
                  status
                }
              }
            `,
          null,
          {
            request,
            userId: 1,
            query,
            auth: {
              verifyToken,
            },
            functions: {
              cleanseInput,
            },
            loaders: {
              userLoaderById: userLoaderById(query),
            },
          },
        )

        const error = [
          new GraphQLError('Unable to verify account. Please try again.'),
        ]

        expect(response.errors).toEqual(error)
        expect(consoleOutput).toEqual([
          `User: 1 attempted to verify account, however no account is associated with this id.`,
        ])
      })
    })
    describe('userId cannot be found in token parameters', () => {
      beforeEach(async () => {
        await collections.users.save({
          userName: 'test.account@istio.actually.exists',
          displayName: 'Test Account',
          preferredLang: 'english',
          tfaValidated: false,
          emailValidated: false,
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
          parameters: {},
        })

        const response = await graphql(
          schema,
          `
              mutation {
                verifyAccount(input: { verifyTokenString: "${token}" }) {
                  status
                }
              }
            `,
          null,
          {
            request,
            userId: user._key,
            query,
            auth: {
              verifyToken,
            },
            functions: {
              cleanseInput,
            },
            loaders: {
              userLoaderById: userLoaderById(query),
            },
          },
        )

        const error = [
          new GraphQLError(
            'Unable to verify account. Please request a new email.',
          ),
        ]

        expect(response.errors).toEqual(error)
        expect(consoleOutput).toEqual([
          `When validating account user: ${user._key} attempted to verify account, but userId is not located in the token parameters.`,
        ])
      })
    })
    describe('userId in token is undefined', () => {
      beforeEach(async () => {
        await collections.users.save({
          userName: 'test.account@istio.actually.exists',
          displayName: 'Test Account',
          preferredLang: 'english',
          tfaValidated: false,
          emailValidated: false,
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
          parameters: { userId: undefined },
        })

        const response = await graphql(
          schema,
          `
              mutation {
                verifyAccount(input: { verifyTokenString: "${token}" }) {
                  status
                }
              }
            `,
          null,
          {
            request,
            userId: user._key,
            query,
            auth: {
              verifyToken,
            },
            functions: {
              cleanseInput,
            },
            loaders: {
              userLoaderById: userLoaderById(query),
            },
          },
        )

        const error = [
          new GraphQLError(
            'Unable to verify account. Please request a new email.',
          ),
        ]

        expect(response.errors).toEqual(error)
        expect(consoleOutput).toEqual([
          `When validating account user: ${user._key} attempted to verify account, but userId is not located in the token parameters.`,
        ])
      })
    })
    describe('userId in token does not match users key in db', () => {
      beforeEach(async () => {
        await collections.users.save({
          userName: 'test.account@istio.actually.exists',
          displayName: 'Test Account',
          preferredLang: 'english',
          tfaValidated: false,
          emailValidated: false,
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
          parameters: { userId: 1 },
        })

        const response = await graphql(
          schema,
          `
              mutation {
                verifyAccount(input: { verifyTokenString: "${token}" }) {
                  status
                }
              }
            `,
          null,
          {
            request,
            userId: user._key,
            query,
            auth: {
              verifyToken,
            },
            functions: {
              cleanseInput,
            },
            loaders: {
              userLoaderById: userLoaderById(query),
            },
          },
        )

        const error = [
          new GraphQLError(
            'Unable to verify account. Please request a new email.',
          ),
        ]

        expect(response.errors).toEqual(error)
        expect(consoleOutput).toEqual([
          `User: ${user._key} attempted to verify their account, but the user id's do not match.`,
        ])
      })
    })
    describe('database error occurs when upserting validation', () => {
      beforeEach(async () => {
        await collections.users.save({
          userName: 'test.account@istio.actually.exists',
          displayName: 'Test Account',
          preferredLang: 'english',
          tfaValidated: false,
          emailValidated: false,
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
        })

        const loader = userLoaderById(query)

        query = jest
          .fn()
          .mockRejectedValue(new Error('Database error occurred.'))

        const response = await graphql(
          schema,
          `
              mutation {
                verifyAccount(input: { verifyTokenString: "${token}" }) {
                  status
                }
              }
            `,
          null,
          {
            request,
            userId: user._key,
            query,
            auth: {
              verifyToken,
            },
            functions: {
              cleanseInput,
            },
            loaders: {
              userLoaderById: loader,
            },
          },
        )

        const error = [
          new GraphQLError('Unable to verify account. Please try again.'),
        ]

        expect(response.errors).toEqual(error)
        expect(consoleOutput).toEqual([
          `Database error occurred when upserting email validation for user: ${user._key}: Error: Database error occurred.`,
        ])
      })
    })
  })
})
