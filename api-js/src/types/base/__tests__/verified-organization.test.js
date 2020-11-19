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
  verifiedOrgLoaderConnections,
  verifiedDomainLoaderConnectionsByOrgId,
} = require('../../../loaders')
const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the verified organization connection, and verified organization object', () => {
  let query,
    drop,
    truncate,
    migrate,
    schema,
    collections,
    orgOne,
    orgTwo,
    i18n,
    domain

  beforeAll(async () => {
    // Generate DB Items
    ;({ migrate } = await ArangoTools({ rootPass, url }))
    ;({ query, drop, truncate, collections } = await migrate(
      makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
    ))
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
    await truncate()
    consoleOutput = []

    orgOne = await collections.organizations.save({
      verified: true,
      summaries: {
        web: {
          pass: 50,
          fail: 1000,
          total: 1050,
        },
        mail: {
          pass: 50,
          fail: 1000,
          total: 1050,
        },
      },
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
    orgTwo = await collections.organizations.save({
      verified: true,
      summaries: {
        web: {
          pass: 50,
          fail: 1000,
          total: 1050,
        },
        mail: {
          pass: 50,
          fail: 1000,
          total: 1050,
        },
      },
      orgDetails: {
        en: {
          slug: 'not-treasury-board-secretariat',
          acronym: 'NTBS',
          name: 'Not Treasury Board of Canada Secretariat',
          zone: 'NFED',
          sector: 'NTBS',
          country: 'Canada',
          province: 'Ontario',
          city: 'Ottawa',
        },
        fr: {
          slug: 'ne-pas-secretariat-conseil-tresor',
          acronym: 'NPSCT',
          name: 'Ne Pas Secrétariat du Conseil Trésor du Canada',
          zone: 'NPFED',
          sector: 'NPTBS',
          country: 'Canada',
          province: 'Ontario',
          city: 'Ottawa',
        },
      },
    })
    domain = await collections.domains.save({
      domain: 'test.gc.ca',
    })
    await collections.claims.save({
      _from: orgOne._id,
      _to: domain._id,
    })
    await collections.claims.save({
      _from: orgTwo._id,
      _to: domain._id,
    })
  })

  afterAll(async () => {
    await drop()
  })

  describe('users language is set to english', () => {
    beforeAll(() => {
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
    describe('user queries for all verified organization fields', () => {
      it('resolves all fields', async () => {
        const response = await graphql(
          schema,
          `
            query {
              findVerifiedOrganizations(first: 5) {
                edges {
                  cursor
                  node {
                    id
                    acronym
                    name
                    slug
                    zone
                    sector
                    country
                    province
                    city
                    verified
                    summaries {
                      mail {
                        total
                      }
                    }
                    domainCount
                    domains(first: 5) {
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
            loaders: {
              verifiedOrgLoaderConnections: verifiedOrgLoaderConnections(
                query,
                'en',
                cleanseInput,
                i18n,
              ),
              verifiedDomainLoaderConnectionsByOrgId: verifiedDomainLoaderConnectionsByOrgId(
                query,
                cleanseInput,
                i18n,
              ),
            },
          },
        )

        const expectedResponse = {
          data: {
            findVerifiedOrganizations: {
              edges: [
                {
                  cursor: toGlobalId('verifiedOrganizations', orgOne._key),
                  node: {
                    id: toGlobalId('verifiedOrganizations', orgOne._key),
                    acronym: 'TBS',
                    name: 'Treasury Board of Canada Secretariat',
                    slug: 'treasury-board-secretariat',
                    zone: 'FED',
                    sector: 'TBS',
                    province: 'Ontario',
                    city: 'Ottawa',
                    country: 'Canada',
                    verified: true,
                    summaries: {
                      mail: {
                        total: 1050,
                      },
                    },
                    domainCount: 1,
                    domains: {
                      edges: [
                        {
                          node: {
                            id: toGlobalId('verifiedDomains', domain._key),
                          },
                        },
                      ],
                    },
                  },
                },
                {
                  cursor: toGlobalId('verifiedOrganizations', orgTwo._key),
                  node: {
                    id: toGlobalId('verifiedOrganizations', orgTwo._key),
                    acronym: 'NTBS',
                    name: 'Not Treasury Board of Canada Secretariat',
                    slug: 'not-treasury-board-secretariat',
                    zone: 'NFED',
                    sector: 'NTBS',
                    province: 'Ontario',
                    city: 'Ottawa',
                    country: 'Canada',
                    verified: true,
                    summaries: {
                      mail: {
                        total: 1050,
                      },
                    },
                    domainCount: 1,
                    domains: {
                      edges: [
                        {
                          node: {
                            id: toGlobalId('verifiedDomains', domain._key),
                          },
                        },
                      ],
                    },
                  },
                },
              ],
              totalCount: 2,
              pageInfo: {
                endCursor: toGlobalId('verifiedOrganizations', orgTwo._key),
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: toGlobalId('verifiedOrganizations', orgOne._key),
              },
            },
          },
        }
        expect(response).toEqual(expectedResponse)
      })
    })
  })
  describe('users language is set to french', () => {
    beforeAll(() => {
      i18n = setupI18n({
        language: 'fr',
        locales: ['en', 'fr'],
        missing: 'Traduction manquante',
        catalogs: {
          en: englishMessages,
          fr: frenchMessages,
        },
      })
    })
    describe('user queries for all verified organization fields', () => {
      it('resolves all fields', async () => {
        const response = await graphql(
          schema,
          `
            query {
              findVerifiedOrganizations(first: 5) {
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
            loaders: {
              verifiedOrgLoaderConnections: verifiedOrgLoaderConnections(
                query,
                'fr',
                cleanseInput,
                i18n,
              ),
              verifiedDomainLoaderConnectionsByOrgId: verifiedDomainLoaderConnectionsByOrgId(
                query,
                cleanseInput,
                i18n,
              ),
            },
          },
        )

        const expectedResponse = {
          data: {
            findVerifiedOrganizations: {
              edges: [
                {
                  cursor: toGlobalId('verifiedOrganizations', orgOne._key),
                  node: {
                    id: toGlobalId('verifiedOrganizations', orgOne._key),
                  },
                },
                {
                  cursor: toGlobalId('verifiedOrganizations', orgTwo._key),
                  node: {
                    id: toGlobalId('verifiedOrganizations', orgTwo._key),
                  },
                },
              ],
              totalCount: 2,
              pageInfo: {
                endCursor: toGlobalId('verifiedOrganizations', orgTwo._key),
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: toGlobalId('verifiedOrganizations', orgOne._key),
              },
            },
          },
        }
        expect(response).toEqual(expectedResponse)
      })
    })
  })
})
