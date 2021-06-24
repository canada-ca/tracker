import { ensure, dbNameFromFile } from 'arango-tools'
import { graphql, GraphQLSchema } from 'graphql'
import { toGlobalId } from 'graphql-relay'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { databaseOptions } from '../../../../database-options'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { cleanseInput } from '../../../validators'
import { loadVerifiedOrgConnectionsByDomainId } from '../../../verified-organizations'
import { loadVerifiedDomainConnections } from '../../loaders'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given findVerifiedDomains query', () => {
  let query, drop, truncate, schema, collections, domain, org, i18n

  beforeAll(async () => {
    // Create GQL Schema
    schema = new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createMutationSchema(),
    })
    // Generate DB Items
    ;({ query, drop, truncate, collections } = await ensure({
      type: 'database',
      name: dbNameFromFile(__filename),
      url,
      rootPassword: rootPass,
      options: databaseOptions({ rootPass }),
    }))
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

  let consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  const mockedError = (output) => consoleOutput.push(output)

  beforeEach(async () => {
    console.info = mockedInfo
    console.warn = mockedWarn
    console.error = mockedError
    org = await collections.organizations.save({
      verified: true,
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
    domain = await collections.domains.save({
      domain: 'test.gc.ca',
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
      _to: domain._id,
      _from: org._id,
    })
  })

  afterEach(async () => {
    await truncate()
    consoleOutput = []
  })

  afterAll(async () => {
    await drop()
  })

  describe('given successful domain retrieval', () => {
    it('returns domain', async () => {
      const response = await graphql(
        schema,
        `
          query {
            findVerifiedDomains(first: 5) {
              edges {
                cursor
                node {
                  id
                }
              }
              totalCount
              pageInfo {
                hasNextPage
                hasPreviousPage
                startCursor
                endCursor
              }
            }
          }
        `,
        null,
        {
          i18n,
          query: query,
          validators: {
            cleanseInput,
          },
          loaders: {
            loadVerifiedDomainConnections: loadVerifiedDomainConnections({
              query,
              cleanseInput,
            }),
            loadVerifiedOrgConnectionsByDomainId:
              loadVerifiedOrgConnectionsByDomainId(query, 'en', cleanseInput),
          },
        },
      )

      const expectedResponse = {
        data: {
          findVerifiedDomains: {
            edges: [
              {
                cursor: toGlobalId('verifiedDomains', domain._key),
                node: {
                  id: toGlobalId('verifiedDomains', domain._key),
                },
              },
            ],
            totalCount: 1,
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: toGlobalId('verifiedDomains', domain._key),
              endCursor: toGlobalId('verifiedDomains', domain._key),
            },
          },
        },
      }
      expect(response).toEqual(expectedResponse)
    })
  })

  describe('users language is set to english', () => {
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
    describe('given unsuccessful domain retrieval', () => {
      describe('domain cannot be found', () => {
        it('returns an appropriate error message', async () => {
          await truncate()

          const response = await graphql(
            schema,
            `
              query {
                findVerifiedDomains(first: 5) {
                  edges {
                    cursor
                    node {
                      id
                    }
                  }
                  totalCount
                  pageInfo {
                    hasNextPage
                    hasPreviousPage
                    startCursor
                    endCursor
                  }
                }
              }
            `,
            null,
            {
              i18n,
              query: query,
              validators: {
                cleanseInput,
              },
              loaders: {
                loadVerifiedDomainConnections: loadVerifiedDomainConnections({
                  query,
                  cleanseInput,
                  i18n,
                }),
                loadVerifiedOrgConnectionsByDomainId:
                  loadVerifiedOrgConnectionsByDomainId(
                    query,
                    'en',
                    cleanseInput,
                  ),
              },
            },
          )

          const expectedResponse = {
            data: {
              findVerifiedDomains: {
                edges: [],
                totalCount: 0,
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  startCursor: '',
                  endCursor: '',
                },
              },
            },
          }
          expect(response).toEqual(expectedResponse)
        })
      })
    })
  })
  describe('users language is set to french', () => {
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
    describe('given unsuccessful domain retrieval', () => {
      describe('domain cannot be found', () => {
        it('returns an appropriate error message', async () => {
          await truncate()

          const response = await graphql(
            schema,
            `
              query {
                findVerifiedDomains(first: 5) {
                  edges {
                    cursor
                    node {
                      id
                    }
                  }
                  totalCount
                  pageInfo {
                    hasNextPage
                    hasPreviousPage
                    startCursor
                    endCursor
                  }
                }
              }
            `,
            null,
            {
              i18n,
              query: query,
              validators: {
                cleanseInput,
              },
              loaders: {
                loadVerifiedDomainConnections: loadVerifiedDomainConnections({
                  query,
                  cleanseInput,
                  i18n,
                }),
                loadVerifiedOrgConnectionsByDomainId:
                  loadVerifiedOrgConnectionsByDomainId(
                    query,
                    'en',
                    cleanseInput,
                  ),
              },
            },
          )

          const expectedResponse = {
            data: {
              findVerifiedDomains: {
                edges: [],
                totalCount: 0,
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  startCursor: '',
                  endCursor: '',
                },
              },
            },
          }
          expect(response).toEqual(expectedResponse)
        })
      })
    })
  })
})
