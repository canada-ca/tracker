const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { graphql, GraphQLSchema } = require('graphql')
const { toGlobalId } = require('graphql-relay')
const { setupI18n } = require('@lingui/core')

const englishMessages = require('../../../locale/en/messages')
const frenchMessages = require('../../../locale/fr/messages')
const { makeMigrations } = require('../../../../migrations')
const { createQuerySchema } = require('../..')
const { createMutationSchema } = require('../../../mutations')
const { cleanseInput } = require('../../../validators')
const {
  verifiedOrgLoaderConnections,
  verifiedDomainLoaderConnectionsByOrgId,
} = require('../../../loaders')
const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given findVerifiedOrganizations', () => {
  let query, drop, truncate, migrate, schema, collections, orgOne, orgTwo, i18n

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
    describe('given successful retrieval of domains', () => {
      describe('user queries for verified organizations', () => {
        it('returns organizations', async () => {
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
      describe('no organizations are found', () => {
        it('returns empty connection fields', async () => {
          await truncate()
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
                edges: [],
                totalCount: 0,
                pageInfo: {
                  endCursor: '',
                  hasNextPage: false,
                  hasPreviousPage: false,
                  startCursor: '',
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
        language: 'fr',
        locales: ['en', 'fr'],
        missing: 'Traduction manquante',
        catalogs: {
          en: englishMessages,
          fr: frenchMessages,
        },
      })
    })
    describe('given successful retrieval of domains', () => {
      describe('user queries for verified organizations', () => {
        it('returns organizations', async () => {
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
      describe('no organizations are found', () => {
        it('returns empty connection fields', async () => {
          await truncate()
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
                edges: [],
                totalCount: 0,
                pageInfo: {
                  endCursor: '',
                  hasNextPage: false,
                  hasPreviousPage: false,
                  startCursor: '',
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
