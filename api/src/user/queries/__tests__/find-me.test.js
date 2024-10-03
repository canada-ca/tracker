import { dbNameFromFile } from 'arango-tools'
import { ensureDatabase as ensure } from '../../../testUtilities'
import { graphql, GraphQLSchema } from 'graphql'
import { toGlobalId } from 'graphql-relay'

import { userRequired } from '../../../auth'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { loadAffiliationConnectionsByUserId } from '../../../affiliation/loaders'
import { loadUserByKey } from '../../loaders'
import { cleanseInput } from '../../../validators'
import dbschema from '../../../../database.json'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the findMe query', () => {
  let query, drop, truncate, schema, collections, user

  beforeAll(async () => {
    // Create GQL Schema
    schema = new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createMutationSchema(),
    })
    // Generate DB Items
    ;({ query, drop, truncate, collections } = await ensure({
      variables: {
        dbname: dbNameFromFile(__filename),
        username: 'root',
        rootPassword: rootPass,
        password: rootPass,
        url,
      },

      schema: dbschema,
    }))
  })

  let consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  const mockedError = (output) => consoleOutput.push(output)

  beforeEach(async () => {
    console.info = mockedInfo
    console.warn = mockedWarn
    console.error = mockedError

    user = await collections.users.save({
      userName: 'test.account@istio.actually.exists',
      displayName: 'Test Account',
      tfaValidated: false,
      emailValidated: false,
    })
  })

  afterEach(async () => {
    await truncate()
    consoleOutput = []
  })

  afterAll(async () => {
    await drop()
  })

  describe('users successfully performs query', () => {
    it('will return specified user', async () => {
      const response = await graphql({
        schema,
        source: `
          query {
            findMe {
              id
            }
          }
        `,
        rootValue: null,
        contextValue: {
          auth: {
            userRequired: userRequired({
              userKey: user._key,
              loadUserByKey: loadUserByKey({ query }),
            }),
          },
          loaders: {
            loadAffiliationConnectionsByUserId: loadAffiliationConnectionsByUserId({
              query,
              userKey: user._key,
              cleanseInput,
            }),
          },
        },
      })

      const expectedResponse = {
        data: {
          findMe: {
            id: toGlobalId('user', user._key),
          },
        },
      }
      expect(response).toEqual(expectedResponse)
    })
  })
})
