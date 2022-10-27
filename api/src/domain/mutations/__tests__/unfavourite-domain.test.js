import { ensure, dbNameFromFile } from 'arango-tools'
import { graphql, GraphQLSchema } from 'graphql'
import { toGlobalId } from 'graphql-relay'
import { setupI18n } from '@lingui/core'

import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { cleanseInput } from '../../../validators'
import { userRequired, verifiedRequired } from '../../../auth'
import { loadDomainByKey } from '../../loaders'
import { loadUserByKey } from '../../../user/loaders'
import dbschema from '../../../../database.json'
import { collectionNames } from '../../../collection-names'

const { DB_PASS: rootPass, DB_URL: url, HASHING_SECRET } = process.env

describe('favourite a domain', () => {
  let query,
    drop,
    i18n,
    truncate,
    schema,
    collections,
    transaction,
    user,
    domain1,
    favourite1

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
  describe('given a successful domain creation', () => {
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
    })
    afterEach(async () => {
      await truncate()
      await drop()
    })
    describe('user is logged in and verified', () => {
      beforeEach(async () => {
        domain1 = await collections.domains.save({
          domain: 'test.gc.ca',
        })
        favourite1 = await collections.favourites.save({
          _to: domain1._id,
          _from: user._id,
        })
      })
      describe('user unfavourites a domain', () => {
        beforeAll(() => {
          i18n = setupI18n({
            locale: 'en',
            localeData: {
              en: { plurals: {} },
              fr: { plurals: {} },
            },
            locales: ['en', 'fr'],
            messages: {
              en: englishMessages.messages,
              fr: frenchMessages.messages,
            },
          })
        })
        it('returns the success status', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                unfavouriteDomain(input: { domainId: "${toGlobalId(
                  'domain',
                  domain1._key,
                )}" }) {
                  result {
                    ... on DomainResult {
                      status
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
              i18n,
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

          const expectedResponse = {
            data: {
              unfavouriteDomain: {
                result: {
                  status:
                    'Successfully removed domain: test.gc.ca from favourites.',
                },
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(favourite1).not.toEqual(null)

          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully removed domain test.gc.ca from favourites.`,
          ])
        })
      })
    })
  })
})
