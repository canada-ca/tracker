import { ensure, dbNameFromFile } from 'arango-tools'
import { graphql, GraphQLSchema } from 'graphql'
import { toGlobalId } from 'graphql-relay'

import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { cleanseInput } from '../../../validators'
import { userRequired, verifiedRequired } from '../../../auth'
import { loadDomainByKey } from '../../loaders'
import { loadUserByKey } from '../../../user/loaders'
import dbschema from '../../../../database.json'
import { collectionNames } from '../../../collection-names'

const { DB_PASS: rootPass, DB_URL: url, HASHING_SECRET } = process.env

describe('favourite a domain', () => {
  let query, drop, truncate, schema, collections, transaction, user, domain1

  const consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  const mockedError = (output) => consoleOutput.push(output)
  beforeAll(async () => {
    console.info = mockedInfo
    console.warn = mockedWarn
    console.error = mockedError
    // Create GQL Schema
    schema = new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createMutationSchema(),
    })
  })
  afterEach(() => {
    consoleOutput.length = 0
  })
  describe('given a successful domain favourite', () => {
    beforeAll(async () => {
      ;({ query, drop, truncate, collections, transaction } = await ensure({
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
    beforeEach(async () => {
      user = await collections.users.save({
        userName: 'test.account@istio.actually.exists',
        emailValidated: true,
        tfaSendMethod: 'email',
      })
      domain1 = await collections.domains.save({
        domain: 'test.gc.ca',
      })
    })
    afterEach(async () => {
      await truncate()
    })
    afterAll(async () => {
      await drop()
    })
    describe('user is logged in and verified', () => {
      describe('user favourites a domain', () => {
        it('returns the domain', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                favouriteDomain(input: { domainId: "${toGlobalId(
                  'domain',
                  domain1._key,
                )}" }) {
                  result {
                    ... on Domain {
                      domain
                    }
                    ... on DomainError {
                      code
                      description
                    }
                  }
                }
              }
            `,
            null,
            {
              request: {
                language: 'en',
              },
              query,
              collections: collectionNames,
              transaction,
              userKey: user._key,
              auth: {
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({}),
              },
              loaders: {
                loadDomainByKey: loadDomainByKey({
                  query,
                  userKey: user._key,
                }),
              },
              validators: { cleanseInput },
            },
          )

          const domainCursor = await query`
            FOR domain IN domains
              RETURN domain
          `
          const domain = await domainCursor.next()
          const expectedResponse = {
            data: {
              favouriteDomain: {
                result: { domain: 'test.gc.ca' },
              },
            },
          }

          expect(response).toEqual(expectedResponse)

          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully favourited domain ${domain.domain}.`,
          ])
        })
      })
    })
  })
})
