import { dbNameFromFile } from 'arango-tools'
import { ensureDatabase as ensure } from '../../../testUtilities'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { toGlobalId } from 'graphql-relay'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { cleanseInput } from '../../../validators'
import { checkDomainPermission, checkSuperAdmin, userRequired, verifiedRequired } from '../../../auth'
import { loadDkimSelectorsByDomainId, loadDomainConnectionsByUserId } from '../../loaders'
import { loadUserByKey } from '../../../user'
import dbschema from '../../../../database.json'

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
        displayName: 'Test Account',
        userName: 'test.account@istio.actually.exists',
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
        status: {
          dkim: 'pass',
          dmarc: 'pass',
          https: 'info',
          spf: 'fail',
          ssl: 'fail',
        },
      })
      const selector1 = await collections.selectors.save({ selector: 'selector1' })
      const selector2 = await collections.selectors.save({ selector: 'selector2' })
      await collections.domainsToSelectors.save({
        _from: domainOne._id,
        _to: selector1._id,
      })
      await collections.domainsToSelectors.save({
        _from: domainTwo._id,
        _to: selector1._id,
      })
      await collections.domainsToSelectors.save({
        _from: domainOne._id,
        _to: selector2._id,
      })
      await collections.domainsToSelectors.save({
        _from: domainTwo._id,
        _to: selector2._id,
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
        const response = await graphql({
          schema,
          source: `
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
          rootValue: null,
          contextValue: {
            i18n,
            userKey: user._key,
            auth: {
              checkDomainPermission: checkDomainPermission({
                i18n,
                userKey: user._key,
                query,
              }),
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
                auth: { loginRequired: true },
              }),
              loadDkimSelectorsByDomainId: loadDkimSelectorsByDomainId({
                query,
                userKey: user._key,
                cleanseInput,
                i18n,
                auth: { loginRequiredBool: true },
              }),
            },
          },
        })

        const expectedResponse = {
          data: {
            findMyDomains: {
              edges: [
                {
                  cursor: toGlobalId('domain', domainOne._key),
                  node: {
                    id: toGlobalId('domain', domainOne._key),
                    domain: 'test1.gc.ca',
                    lastRan: null,
                    selectors: ['selector1', 'selector2'],
                  },
                },
                {
                  cursor: toGlobalId('domain', domainTwo._key),
                  node: {
                    id: toGlobalId('domain', domainTwo._key),
                    domain: 'test2.gc.ca',
                    lastRan: null,
                    selectors: ['selector1', 'selector2'],
                  },
                },
              ],
              pageInfo: {
                endCursor: toGlobalId('domain', domainTwo._key),
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: toGlobalId('domain', domainOne._key),
              },
              totalCount: 2,
            },
          },
        }
        expect(response).toEqual(expectedResponse)
        expect(consoleOutput).toEqual([`User: ${user._key} successfully retrieved their domains.`])
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
          const mockedQuery = jest.fn().mockRejectedValue(new Error('Database error occurred'))

          const response = await graphql({
            schema,
            source: `
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
            rootValue: null,
            contextValue: {
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
                  auth: { loginRequired: true },
                  i18n,
                }),
              },
            },
          })

          const error = [new GraphQLError(`Unable to query domain(s). Please try again.`)]

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
          const mockedQuery = jest.fn().mockRejectedValue(new Error('Database error occurred'))

          const response = await graphql({
            schema,
            source: `
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
            rootValue: null,
            contextValue: {
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
                  auth: { loginRequired: true },
                  i18n,
                }),
              },
            },
          })

          const error = [new GraphQLError("Impossible d'interroger le(s) domaine(s). Veuillez réessayer.")]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Database error occurred while user: 1 was trying to query domains in loadDomainsByUser, error: Error: Database error occurred`,
          ])
        })
      })
    })
  })
})
