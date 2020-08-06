const dotenv = require('dotenv-safe')
dotenv.config()

const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { graphql, GraphQLSchema, GraphQLError } = require('graphql')
const { makeMigrations } = require('../../migrations')
const { createQuerySchema } = require('../queries')
const { createMutationSchema } = require('../mutations')

const bcrypt = require('bcrypt')
const { cleanseInput } = require('../validators')
const { tokenize } = require('../auth')
const { userLoaderById } = require('../loaders')

const mockNotify = jest.fn()

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

  describe('successfully two factor authentication', () => {
    it('returns a successful status message', async () => {
      await collections.users.save({
        userName: 'test.account@istio.actually.exists',
        displayName: 'Test Account',
        preferredLang: 'french',
        tfaValidated: false,
        emailValidated: false,
        tfaCode: 123456,
      })

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
            verifyTwoFactorAuthentication(input: { twoFactorCode: 123456 }) {
              status
            }
          }
        `,
        null,
        {
          userId: user._key,
          query,
          loaders: {
            userLoaderById: userLoaderById(query),
          },
        },
      )

      const expectedResult = {
        data: {
          verifyTwoFactorAuthentication: {
            status: 'Successfully two factor authenticated.',
          },
        },
      }
      expect(response).toEqual(expectedResult)
      expect(consoleOutput).toEqual([
        `User: ${user._key} successfully two factor authenticated their account.`,
      ])
    })
  })
  describe('unsuccessful two two factor authentication', () => {
    describe('user id is undefined', () => {
      it('returns an error message', async () => {
        const response = await graphql(
          schema,
          `
            mutation {
              verifyTwoFactorAuthentication(input: { twoFactorCode: 123456 }) {
                status
              }
            }
          `,
          null,
          {
            userId: undefined,
            query,
            loaders: {
              userLoaderById: userLoaderById(query),
            },
          },
        )

        const error = [
          new GraphQLError('Authentication error, please sign in again.'),
        ]

        expect(response.errors).toEqual(error)
        expect(consoleOutput).toEqual([
          `User attempted to two factor authenticate, however the userId is undefined.`,
        ])
      })
    })
    describe('the requesting user does not exist', () => {
      it('returns an error message', async () => {
        const response = await graphql(
          schema,
          `
            mutation {
              verifyTwoFactorAuthentication(input: { twoFactorCode: 123456 }) {
                status
              }
            }
          `,
          null,
          {
            userId: 1,
            query,
            loaders: {
              userLoaderById: userLoaderById(query),
            },
          },
        )

        const error = [
          new GraphQLError('Unable to two factor authenticate. Please try again.'),
        ]

        expect(response.errors).toEqual(error)
        expect(consoleOutput).toEqual([
          `User: 1 attempted to two factor authenticate, however no account is associated with that id.`,
        ])
      })
    })
    describe('the two factor code is not 6 digits long', () => {
      it('returns an error message', async () => {
        await collections.users.save({
          userName: 'test.account@istio.actually.exists',
          displayName: 'Test Account',
          preferredLang: 'french',
          tfaValidated: false,
          emailValidated: false,
          tfaCode: 123456,
        })
  
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
              verifyTwoFactorAuthentication(input: { twoFactorCode: 123 }) {
                status
              }
            }
          `,
          null,
          {
            userId: user._key,
            query,
            loaders: {
              userLoaderById: userLoaderById(query),
            },
          },
        )
  
        const error = [
          new GraphQLError('Unable to two factor authenticate. Please try again.'),
        ]

        expect(response.errors).toEqual(error)
        expect(consoleOutput).toEqual([
          `User: ${user._key} attempted to two factor authenticate, however the code they submitted does not have 6 digits.`,
        ])
      })
    })
    describe('tfa codes do not match', () => {
      it('returns an error message', async () => {
        await collections.users.save({
          userName: 'test.account@istio.actually.exists',
          displayName: 'Test Account',
          preferredLang: 'french',
          tfaValidated: false,
          emailValidated: false,
          tfaCode: 123456,
        })
  
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
              verifyTwoFactorAuthentication(input: { twoFactorCode: 654321 }) {
                status
              }
            }
          `,
          null,
          {
            userId: user._key,
            query,
            loaders: {
              userLoaderById: userLoaderById(query),
            },
          },
        )
  
        const error = [
          new GraphQLError('Unable to two factor authenticate. Please try again.'),
        ]

        expect(response.errors).toEqual(error)
        expect(consoleOutput).toEqual([
          `User: ${user._key} attempted to two factor authenticate, however the tfa codes do not match.`,
        ])
      })
    })
    describe('database error occurs on upsert', () => {
      it('returns an error message', async () => {
        await collections.users.save({
          userName: 'test.account@istio.actually.exists',
          displayName: 'Test Account',
          preferredLang: 'french',
          tfaValidated: false,
          emailValidated: false,
          tfaCode: 123456,
        })
  
        const cursor = await query`
          FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
        `
        const user = await cursor.next()
  
        const idLoader = userLoaderById(query)

        query = jest
        .fn()
        .mockRejectedValue(new Error('Database error occurred.'))

        const response = await graphql(
          schema,
          `
            mutation {
              verifyTwoFactorAuthentication(input: { twoFactorCode: 123456 }) {
                status
              }
            }
          `,
          null,
          {
            userId: user._key,
            query,
            loaders: {
              userLoaderById: idLoader,
            },
          },
        )
  
        const error = [
          new GraphQLError('Unable to two factor authenticate. Please try again.'),
        ]

        expect(response.errors).toEqual(error)
        expect(consoleOutput).toEqual([
          `Database error occurred when upserting the tfaValidate field for ${user._key}: Error: Database error occurred.`,
        ])
      })
    })
  })
})
