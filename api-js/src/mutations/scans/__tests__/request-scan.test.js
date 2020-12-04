require('jest-fetch-mock').enableFetchMocks()
const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { graphql, GraphQLSchema, GraphQLError } = require('graphql')
const { toGlobalId } = require('graphql-relay')
const { setupI18n } = require('@lingui/core')

const englishMessages = require('../../../locale/en/messages')
const frenchMessages = require('../../../locale/fr/messages')
const { makeMigrations } = require('../../../../migrations')
const { createQuerySchema } = require('../../../queries')
const { createMutationSchema } = require('../../../mutations')
const { checkDomainPermission, userRequired } = require('../../../auth')
const { domainLoaderByDomain, userLoaderByKey } = require('../../../loaders')
const { cleanseInput } = require('../../../validators')

describe('requesting a one time scan', () => {
  const fetch = fetchMock
  const consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  const mockedError = (output) => consoleOutput.push(output)

  let query,
    drop,
    truncate,
    migrate,
    schema,
    collections,
    i18n,
    org,
    user,
    domain,
    org2

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
    console.info = mockedInfo
    console.warn = mockedWarn
    console.error = mockedError
  })

  beforeEach(async () => {
    user = await collections.users.save({
      userName: 'test.account@istio.actually.exists',
      displayName: 'Test Account',
      preferredLang: 'french',
      tfaValidated: false,
      emailValidated: false,
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
    domain = await collections.domains.save({
      domain: 'test.gc.ca',
      slug: 'test-gc-ca',
      lastRan: null,
      selectors: ['selector1', 'selector2'],
    })
    await collections.claims.save({
      _to: domain._id,
      _from: org._id,
    })
  })

  afterEach(async () => {
    consoleOutput.length = 0
    await truncate()
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
    describe('given a successful request', () => {
      beforeEach(() => {
        fetch.mockResponseOnce(JSON.stringify({ data: '12345' }))
      })
      describe('user is a super admin', () => {
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: 'organizations/SA',
            _to: user._id,
            permission: 'super_admin',
          })
        })
        it('returns a subscriptionId', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                requestScan(input: { domain: "test.gc.ca" }) {
                  subscriptionId
                }
              }
            `,
            null,
            {
              i18n,
              fetch,
              userKey: user._key,
              auth: {
                checkDomainPermission: checkDomainPermission({
                  i18n,
                  query,
                  userKey: user._key,
                }),
                userRequired: userRequired({
                  i18n,
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query, user._key, i18n),
                }),
              },
              loaders: {
                domainLoaderByDomain: domainLoaderByDomain(
                  query,
                  user._key,
                  i18n,
                ),
              },
              validators: { cleanseInput },
            },
          )

          const expectedResponse = {}

          // expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([''])
        })
        it('returns a status message', async () => {})
      })
      describe('user is an org admin', () => {
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'admin',
          })
        })
        it('returns a subscriptionId', async () => {})
        it('returns a status message', async () => {})
      })
      describe('user is an org user', () => {
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'user',
          })
        })
        it('returns a subscriptionId', async () => {})
        it('returns a status message', async () => {})
      })
    })
    describe('given an unsuccessful request', () => {
      describe('user is not logged in', () => {
        it('returns an error message', async () => {})
      })
      describe('domain cannot be found', () => {
        it('returns an error message', async () => {})
      })
      describe('user does not have domain permission', () => {
        beforeEach(async () => {
          org2 = await collections.organizations.save({
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
        })
        describe('user is admin to another org', () => {
          beforeEach(async () => {
            await collections.affiliations.save({
              _from: org2._id,
              _to: user._id,
              permission: 'admin',
            })
          })
          it('returns an error message', async () => {})
        })
        describe('user is a user in another org', () => {
          beforeEach(async () => {
            await collections.affiliations.save({
              _from: org2._id,
              _to: user._id,
              permission: 'user',
            })
          })
          it('returns an error message', async () => {})
        })
      })
      describe('fetch error occurs', () => {
        describe('when sending dns scan request', () => {
          it('returns an error message', async () => {})
        })
        describe('when sending https scan request', () => {
          it('returns an error message', async () => {})
        })
        describe('when sending ssl scan request', () => {
          it('returns an error message', async () => {})
        })
      })
    })
  })
  describe('users langue is set to french', () => {
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
  })
})
