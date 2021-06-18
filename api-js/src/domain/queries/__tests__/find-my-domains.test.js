import { ensure, dbNameFromFile } from 'arango-tools'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { toGlobalId } from 'graphql-relay'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { databaseOptions } from '../../../../database-options'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { cleanseInput } from '../../../validators'
import { checkSuperAdmin, userRequired, verifiedRequired } from '../../../auth'
import { loadDomainConnectionsByUserId } from '../../loaders'
import { loadUserByKey } from '../../../user'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given findMyDomainsQuery', () => {
  let query, drop, truncate, schema, collections, org, i18n, user

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
  afterEach(async () => {
    consoleOutput.length = 0
  })
  describe('given successful retrieval of domains', () => {
    let domainOne, domainTwo
    beforeAll(async () => {
      // Generate DB Items
      ;({ query, drop, truncate, collections } = await ensure({
        type: 'database',
        name: dbNameFromFile(__filename),
        url,
        rootPassword: rootPass,
        options: databaseOptions({ rootPass }),
      }))
    })
    beforeEach(async () => {
      user = await collections.users.save({
        displayName: 'Test Account',
        userName: 'test.account@istio.actually.exists',
        preferredLang: 'french',
        emailValidated: true,
      })

      org = await collections.organizations.save({
        orgDetails: {
          en: {
            slug: 'treasury-board-secretariat',
            acronym: 'TBS',
            name: 'Treasury Board of Canada Secretariat',
            zone: 'FED',
            sector: 'TBS',
            country: 'Canada',
            province: 'Ontario',
            city: 'Ottawa',
          },
          fr: {
            slug: 'secretariat-conseil-tresor',
            acronym: 'SCT',
            name: 'Secrétariat du Conseil Trésor du Canada',
            zone: 'FED',
            sector: 'TBS',
            country: 'Canada',
            province: 'Ontario',
            city: 'Ottawa',
          },
        },
      })
      await collections.affiliations.save({
        _from: org._id,
        _to: user._id,
        permission: 'user',
      })
      domainOne = await collections.domains.save({
        domain: 'test1.gc.ca',
        lastRan: null,
        selectors: ['selector1._domainkey', 'selector2._domainkey'],
        status: {
          dkim: 'pass',
          dmarc: 'pass',
          https: 'info',
          spf: 'fail',
          ssl: 'fail',
        },
      })
      domainTwo = await collections.domains.save({
        domain: 'test2.gc.ca',
        lastRan: null,
        selectors: ['selector1._domainkey', 'selector2._domainkey'],
        status: {
          dkim: 'pass',
          dmarc: 'pass',
          https: 'info',
          spf: 'fail',
          ssl: 'fail',
        },
      })
      await collections.claims.save({
        _to: domainOne._id,
        _from: org._id,
      })
      await collections.claims.save({
        _to: domainTwo._id,
        _from: org._id,
      })
    })
    afterEach(async () => {
      await truncate()
    })
    afterAll(async () => {
      await drop()
    })
    describe('user queries for their domains', () => {
      it('returns domains', async () => {
        const response = await graphql(
          schema,
          `
            query {
              findMyDomains(first: 5) {
                edges {
                  cursor
                  node {
                    id
                    domain
                    lastRan
                    selectors
                  }
                }
                pageInfo {
                  hasNextPage
                  hasPreviousPage
                  startCursor
                  endCursor
                }
                totalCount
              }
            }
          `,
          null,
          {
            i18n,
            userKey: user._key,
            auth: {
              checkSuperAdmin: checkSuperAdmin({
                i18n,
                userKey: user._key,
                query,
              }),
              userRequired: userRequired({
                i18n,
                userKey: user._key,
                loadUserByKey: loadUserByKey({
                  query,
                  userKey: user._key,
                  i18n,
                }),
              }),
              verifiedRequired: verifiedRequired({}),
            },
            loaders: {
              loadDomainConnectionsByUserId: loadDomainConnectionsByUserId({
                query,
                userKey: user._key,
                cleanseInput,
              }),
            },
          },
        )

        const expectedResponse = {
          data: {
            findMyDomains: {
              edges: [
                {
                  cursor: toGlobalId('domains', domainOne._key),
                  node: {
                    id: toGlobalId('domains', domainOne._key),
                    domain: 'test1.gc.ca',
                    lastRan: null,
                    selectors: ['selector1._domainkey', 'selector2._domainkey'],
                  },
                },
                {
                  cursor: toGlobalId('domains', domainTwo._key),
                  node: {
                    id: toGlobalId('domains', domainTwo._key),
                    domain: 'test2.gc.ca',
                    lastRan: null,
                    selectors: ['selector1._domainkey', 'selector2._domainkey'],
                  },
                },
              ],
              pageInfo: {
                endCursor: toGlobalId('domains', domainTwo._key),
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: toGlobalId('domains', domainOne._key),
              },
              totalCount: 2,
            },
          },
        }
        expect(response).toEqual(expectedResponse)
        expect(consoleOutput).toEqual([
          `User: ${user._key} successfully retrieved their domains.`,
        ])
      })
    })
  })
  describe('user has language set to english', () => {
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
    describe('given an error thrown during retrieving domains', () => {
      describe('user queries for their domains', () => {
        it('returns domains', async () => {
          const mockedQuery = jest
            .fn()
            .mockRejectedValue(new Error('Database error occurred'))

          const response = await graphql(
            schema,
            `
              query {
                findMyDomains(first: 5) {
                  edges {
                    cursor
                    node {
                      id
                      domain
                      lastRan
                      selectors
                    }
                  }
                  pageInfo {
                    hasNextPage
                    hasPreviousPage
                    startCursor
                    endCursor
                  }
                  totalCount
                }
              }
            `,
            null,
            {
              i18n,
              userKey: 1,
              auth: {
                checkSuperAdmin: jest.fn(),
                userRequired: jest.fn().mockReturnValue({}),
                verifiedRequired: jest.fn(),
              },
              loaders: {
                loadDomainConnectionsByUserId: loadDomainConnectionsByUserId({
                  query: mockedQuery,
                  userKey: 1,
                  cleanseInput,
                  i18n,
                }),
              },
            },
          )

          const error = [
            new GraphQLError(`Unable to query domain(s). Please try again.`),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Database error occurred while user: 1 was trying to query domains in loadDomainsByUser, error: Error: Database error occurred`,
          ])
        })
      })
    })
  })
  describe('user has language set to french', () => {
    beforeAll(() => {
      i18n = setupI18n({
        locale: 'fr',
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
    describe('given an error thrown during retrieving domains', () => {
      describe('user queries for their domains', () => {
        it('returns domains', async () => {
          const mockedQuery = jest
            .fn()
            .mockRejectedValue(new Error('Database error occurred'))

          const response = await graphql(
            schema,
            `
              query {
                findMyDomains(first: 5) {
                  edges {
                    cursor
                    node {
                      id
                      domain
                      lastRan
                      selectors
                    }
                  }
                  pageInfo {
                    hasNextPage
                    hasPreviousPage
                    startCursor
                    endCursor
                  }
                  totalCount
                }
              }
            `,
            null,
            {
              i18n,
              userKey: 1,
              auth: {
                checkSuperAdmin: jest.fn(),
                userRequired: jest.fn().mockReturnValue({}),
                verifiedRequired: jest.fn(),
              },
              loaders: {
                loadDomainConnectionsByUserId: loadDomainConnectionsByUserId({
                  query: mockedQuery,
                  userKey: 1,
                  cleanseInput,
                  i18n,
                }),
              },
            },
          )

          const error = [new GraphQLError(`todo`)]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Database error occurred while user: 1 was trying to query domains in loadDomainsByUser, error: Error: Database error occurred`,
          ])
        })
      })
    })
  })
})
