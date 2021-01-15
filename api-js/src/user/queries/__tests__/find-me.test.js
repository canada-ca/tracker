import { ArangoTools, dbNameFromFile } from 'arango-tools'
import { graphql, GraphQLSchema } from 'graphql'
import { toGlobalId } from 'graphql-relay'

import { makeMigrations } from '../../../../migrations'
import { userRequired } from '../../../auth'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { affiliationLoaderByUserId } from '../../../affiliation/loaders'
import { userLoaderByKey } from '../../loaders'
import { cleanseInput } from '../../../validators'

const { DB_PASS: rootPass, DB_URL: url } = process.env

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
            }
          }
        `,
        null,
        {
          auth: {
            userRequired: userRequired({
              userKey: user._key,
              userLoaderByKey: userLoaderByKey(query),
            }),
          },
          loaders: {
            affiliationLoaderByUserId: affiliationLoaderByUserId(
              query,
              user._key,
              cleanseInput,
            ),
          },
        },
      )

      const expectedResponse = {
        data: {
          findMe: {
            id: toGlobalId('users', user._key),
          },
        },
      }
      expect(response).toEqual(expectedResponse)
    })
  })
})
