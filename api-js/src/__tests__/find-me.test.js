const dotenv = require('dotenv-safe')
dotenv.config()
const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { graphql, GraphQLSchema } = require('graphql')
const { toGlobalId } = require('graphql-relay')
const { makeMigrations } = require('../../migrations')
const { userRequired } = require('../auth')
const { createQuerySchema } = require('../queries')
const { createMutationSchema } = require('../mutations')
const { userLoaderByKey } = require('../loaders')

describe('given the findMe query', () => {
  let query, drop, truncate, migrate, schema, collections, user

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
    user = await collections.users.save({
      userName: 'test.account@istio.actually.exists',
      displayName: 'Test Account',
      preferredLang: 'french',
      tfaValidated: false,
      emailValidated: false,
    })
    consoleOutput = []
  })

  afterEach(async () => {
    await drop()
  })

  describe('users successfully performs query', () => {
    it('will return specified user', async () => {
      const response = await graphql(
        schema,
        `
          query {
            findMe {
              id
              userName
              displayName
              preferredLang
              tfaValidated
              emailValidated
            }
          }
        `,
        null,
        {
          auth: {
            userRequired: userRequired({
              userId: user._key,
              userLoaderByKey: userLoaderByKey(query),
            }),
          },
        },
      )

      const expectedResponse = {
        data: {
          findMe: {
            id: toGlobalId('users', user._key),
            displayName: 'Test Account',
            emailValidated: false,
            preferredLang: 'FRENCH',
            tfaValidated: false,
            userName: 'test.account@istio.actually.exists',
          },
        },
      }
      expect(response).toEqual(expectedResponse)
    })
  })
})
