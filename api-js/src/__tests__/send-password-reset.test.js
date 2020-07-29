const dotenv = require('dotenv-safe')
dotenv.config()

const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { graphql, GraphQLSchema, GraphQLError } = require('graphql')
const { toGlobalId } = require('graphql-relay')
const { makeMigrations } = require('../../migrations')
const { createQuerySchema } = require('../queries')
const { createMutationSchema } = require('../mutations')

const { cleanseInput } = require('../validators')
const { tokenize } = require('../auth')
const { userLoaderByUserName } = require('../loaders')

const mockNotify = jest.fn()

describe('user send password reset email', () => {
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

  describe('successfully sends password reset email', () => {
    beforeEach(async () => {
        await collections.users.save({
          userName: 'test.account@istio.actually.exists',
          displayName: 'Test Account',
          preferredLanguage: 'FRENCH',
          tfaValidated: false,
          emailValidated: false,
        })

    })
    it('returns status text', async () => {
        const response = await graphql(
            schema,
            `
            mutation {
                sendPasswordResetLink (
                  input: {
                    userName: "test.account@istio.actually.exists"
                  }
                ) {
                  status
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
              loaders: {
                userLoaderByUserName: userLoaderByUserName()
              },
              notify: {
                sendPasswordResetEmail: mockNotify,
              }
            },
          )

          const expectedResult = {
            data: {
              sendPasswordResetLink: {
                status: 'If an account with this username is found, a password reset link will be found in your inbox.'
              }
            }
          }

          const cursor = await query
          `
            FOR user IN users
                FILTER user.userName == "test.account@istio.actually.exists"
                RETURN user
          `
          const user = await cursor.next()

          expect(response).toEqual(expectedResult)
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully sent a password reset email.`,
          ])
    })
  })
})


// expect(mockNotify).toHaveBeenCalledWith({ templateId: '11aef4a3-b1a3-42b9-8246-7a0aa2bfe805', user:, resetUrl:})
