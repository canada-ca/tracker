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
    ;({ migrate } = await ArangoTools({ rootPass, url }))
    ;({ query, drop, truncate, collections } = await migrate(
      makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
    ))
    await truncate()
  })

  afterEach(async () => {
    consoleOutput = []
    await drop()
  })


  describe('successfully send a phone code', () => {
    describe('users preferred language is french', () => {
      beforeEach(async () => {
        await truncate()
        await collections.users.save({
          userName: 'test.account@istio.actually.exists',
          displayName: 'Test Account',
          preferredLang: 'french',
          tfaValidated: false,
          emailValidated: false,
        })
      })
      it('returns status text', async () => {
        let cursor = await query`
          FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
        `
        let user = await cursor.next()

        const response = await graphql(
          schema,
          `
            mutation {
              sendPhoneCode(input: { phoneNumber: "+12345678901" }) {
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
              bcrypt,
              tokenize,
            },
            functions: {
              cleanseInput,
            },
            loaders: {
              userLoaderById: userLoaderById(query),
            },
            notify: {
              sendTfaTextMsg: mockNotify,
            },
          },
        )

        const expectedResult = {
          data: {
            sendPhoneCode: {
              status:
                'Two factor code has been successfully sent, you will receive a text message shortly.',
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
        expect(mockNotify).toHaveBeenCalledWith({
          templateId: 'de8433ce-4a0b-48b8-a99f-4fe085127af5',
          phoneNumber: '+12345678901',
          user,
        })
        expect(consoleOutput).toEqual([
          `User: ${user._key} successfully sent tfa code.`,
        ])
      })
    })
    describe('users preferred language is english', () => {
      beforeEach(async () => {
        await truncate()
        await collections.users.save({
          userName: 'test.account@istio.actually.exists',
          displayName: 'Test Account',
          preferredLang: 'english',
          tfaValidated: false,
          emailValidated: false,
        })
      })
      it('returns status text', async () => {
        let cursor = await query`
          FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
        `
        let user = await cursor.next()
        const response = await graphql(
          schema,
          `
            mutation {
              sendPhoneCode(input: { phoneNumber: "+12345678901" }) {
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
              bcrypt,
              tokenize,
            },
            functions: {
              cleanseInput,
            },
            loaders: {
              userLoaderById: userLoaderById(query),
            },
            notify: {
              sendTfaTextMsg: mockNotify,
            },
          },
        )

        const expectedResult = {
          data: {
            sendPhoneCode: {
              status:
                'Two factor code has been successfully sent, you will receive a text message shortly.',
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
        expect(mockNotify).toHaveBeenCalledWith({
          templateId: 'd6846e21-cae7-46e9-9e36-8a3f735c90ee',
          phoneNumber: '+12345678901',
          user,
        })
        expect(consoleOutput).toEqual([
          `User: ${user._key} successfully sent tfa code.`,
        ])
      })
    })
  })
  describe('unsuccessful phone code sending', () => {
    describe('no user associated with account', () => {
      it('returns status text', async () => {
        const response = await graphql(
          schema,
          `
            mutation {
              sendPhoneCode(input: { phoneNumber: "+12345678901" }) {
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
              bcrypt,
              tokenize,
            },
            functions: {
              cleanseInput,
            },
            loaders: {
              userLoaderById: userLoaderById(query),
            },
            notify: {
              sendTfaTextMsg: mockNotify,
            },
          },
        )

        const error = [
          new GraphQLError('Unable to send TFA code, please try again.'),
        ]

        expect(response.errors).toEqual(error)
        expect(consoleOutput).toEqual([
          `User attempted to send TFA text message, however no account is associated with 1.`,
        ])
      })
    })
    describe('userId is undefined', () => {
      it('error message', async () => {
        const response = await graphql(
          schema,
          `
            mutation {
              sendPhoneCode(input: { phoneNumber: "+12345678901" }) {
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
              bcrypt,
              tokenize,
            },
            functions: {
              cleanseInput,
            },
            loaders: {
              userLoaderById: userLoaderById(query),
            },
            notify: {
              sendTfaTextMsg: mockNotify,
            },
          },
        )

        const error = [
          new GraphQLError('Authentication error, please sign in again.'),
        ]

        expect(response.errors).toEqual(error)
        expect(consoleOutput).toEqual([
          `User attempted to send TFA text message, however the userId does not exist.`,
        ])
      })
    })
    describe('database error occurs on tfa code insert', () => {
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
        const loaderById = userLoaderById(query)

        query = jest
          .fn()
          .mockRejectedValue(new Error('Database error occurred.'))

        const response = await graphql(
          schema,
          `
            mutation {
              sendPhoneCode(input: { phoneNumber: "+12345678901" }) {
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
              bcrypt,
              tokenize,
            },
            functions: {
              cleanseInput,
            },
            loaders: {
              userLoaderById: loaderById,
            },
            notify: {
              sendTfaTextMsg: mockNotify,
            },
          },
        )

        const error = [
          new GraphQLError('Unable to send TFA code, please try again.'),
        ]

        expect(response.errors).toEqual(error)
        expect(consoleOutput).toEqual([
          `Database error occurred when inserting ${user._key} TFA code: Error: Database error occurred.`,
        ])
      })
    })
    describe('database error occurs on phone number insert', () => {
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
        const loaderById = userLoaderById(query)

        query = jest
          .fn()
          .mockResolvedValueOnce(query)
          .mockRejectedValue(new Error('Database error occurred.'))

        const response = await graphql(
          schema,
          `
            mutation {
              sendPhoneCode(input: { phoneNumber: "+12345678901" }) {
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
              bcrypt,
              tokenize,
            },
            functions: {
              cleanseInput,
            },
            loaders: {
              userLoaderById: loaderById,
            },
            notify: {
              sendTfaTextMsg: mockNotify,
            },
          },
        )

        const error = [
          new GraphQLError('Unable to send TFA code, please try again.'),
        ]

        expect(response.errors).toEqual(error)
        expect(consoleOutput).toEqual([
          `Database error occurred when inserting ${user._key} phone number: Error: Database error occurred.`,
        ])
      })
    })
  })
})
