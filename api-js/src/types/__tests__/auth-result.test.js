const { ArangoTools, dbNameFromFile } = require('arango-tools')
const bcrypt = require('bcrypt')
const { graphql, GraphQLSchema } = require('graphql')
const { toGlobalId } = require('graphql-relay')
const request = require('supertest')

const { makeMigrations } = require('../../../migrations')
const { createQuerySchema } = require('../../queries')
const { createMutationSchema } = require('../../mutations')
const { cleanseInput } = require('../../validators')
const { userLoaderByUserName } = require('../../loaders')

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the auth result gql object', () => {
  let query, drop, truncate, migrate, schema, tokenize

  beforeAll(async () => {
    schema = new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createMutationSchema(),
    })

    tokenize = jest.fn().mockReturnValue('token')
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
    ;({ query, drop, truncate } = await migrate(
      makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
    ))
    await truncate()
  })

  afterEach(() => {
    consoleOutput = []
  })

  afterEach(async () => {
    await drop()
  })

  describe('querying all the fields', () => {
    it('resolves all fields', async () => {
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
                authToken
                user {
                  id
                }
              }
            }
          }
        `,
        null,
        {
          request,
          query,
          auth: {
            bcrypt,
            tokenize,
          },
          validators: {
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
      const users = await cursor.all()

      const expectedResult = {
        data: {
          signUp: {
            authResult: {
              authToken: 'token',
              user: {
                id: `${toGlobalId('users', users[0]._key)}`,
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
