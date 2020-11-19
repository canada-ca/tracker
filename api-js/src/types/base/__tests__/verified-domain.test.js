const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { graphql, GraphQLSchema } = require('graphql')
const { toGlobalId } = require('graphql-relay')
const { setupI18n } = require('@lingui/core')

const englishMessages = require('../../../locale/en/messages')
const frenchMessages = require('../../../locale/fr/messages')
const { makeMigrations } = require('../../../../migrations')
const { createQuerySchema } = require('../../../queries')
const { createMutationSchema } = require('../../../mutations')
const { cleanseInput } = require('../../../validators')
const {
  verifiedOrgLoaderConnectionsByDomainId,
  verifiedDomainLoaderConnections,
} = require('../../../loaders')
const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the verified domains connection, and verified domains object', () => {
  let query, drop, truncate, migrate, schema, collections, domain, org, i18n

  beforeAll(async () => {
    // Create GQL Schema
    schema = new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createMutationSchema(),
    })
    // Generate DB Items
    ;({ migrate } = await ArangoTools({ rootPass, url }))
    ;({ query, drop, truncate, collections } = await migrate(
      makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
    ))
    i18n = setupI18n({
      language: 'en',
      locales: ['en', 'fr'],
      missing: 'Traduction manquante',
      catalogs: {
        en: englishMessages,
        fr: frenchMessages,
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
    await truncate()
    consoleOutput = []
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

  afterAll(async () => {
    await drop()
  })

  describe('querying all fields', () => {
    it('resolves all fields', async () => {
      const response = await graphql(
        schema,
        `
          query {
            findVerifiedDomains(first: 5) {
              edges {
                cursor
                node {
                  id
                  domain
                  lastRan
                  status {
                    dkim
                  }
                  organizations(first: 5) {
                    edges {
                      node {
                        id
                      }
                    }
                  }
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
            verifiedDomainLoaderConnections: verifiedDomainLoaderConnections(
              query,
              cleanseInput,
            ),
            verifiedOrgLoaderConnectionsByDomainId: verifiedOrgLoaderConnectionsByDomainId(
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
            edges: [
              {
                cursor: toGlobalId('verifiedDomains', domain._key),
                node: {
                  id: toGlobalId('verifiedDomains', domain._key),
                  domain: 'test.gc.ca',
                  lastRan: null,
                  status: {
                    dkim: 'PASS',
                  },
                  organizations: {
                    edges: [
                      {
                        node: {
                          id: toGlobalId('verifiedOrganizations', org._key),
                        },
                      },
                    ],
                  },
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
})
