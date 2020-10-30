const dotenv = require('dotenv-safe')
dotenv.config()

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const bcrypt = require('bcrypt')
const { graphql, GraphQLSchema, GraphQLError } = require('graphql')
const { toGlobalId } = require('graphql-relay')
const { setupI18n } = require('@lingui/core')

const englishMessages = require('../locale/en/messages')
const frenchMessages = require('../locale/fr/messages')
const { makeMigrations } = require('../../migrations')
const { createQuerySchema } = require('../queries')
const { createMutationSchema } = require('../mutations')
const { cleanseInput } = require('../validators')
const { checkDomainPermission, tokenize, userRequired } = require('../auth')
const {
  userLoaderByUserName,
  domainLoaderByDomain,
  userLoaderByKey,
} = require('../loaders')
const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given findDomainByDomain query', () => {
  let query, drop, truncate, migrate, schema, collections, domain, org, i18n

  beforeAll(async () => {
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
    // Generate DB Items
    ;({ migrate } = await ArangoTools({ rootPass, url }))
    ;({ query, drop, truncate, collections } = await migrate(
      makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
    ))
    await truncate()
    await graphql(
      schema,
      `
        mutation {
          signUp(
            input: {
              displayName: "Test Account"
              userName: "test.account@istio.actually.exists"
              password: "testpassword123"
              confirmPassword: "testpassword123"
              preferredLang: FRENCH
            }
          ) {
            authResult {
              user {
                id
              }
            }
          }
        }
      `,
      null,
      {
        query,
        auth: {
          bcrypt,
          tokenize,
        },
        validators: {
          cleanseInput,
        },
        loaders: {
          userLoaderByUserName: userLoaderByUserName(query),
        },
      },
    )
    consoleOutput = []

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
      lastRan: null,
      selectors: ['selector1._domainkey', 'selector2._domainkey'],
    })
    await collections.claims.save({
      _to: domain._id,
      _from: org._id,
    })
  })

  afterEach(async () => {
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
    describe('given successful domain retrieval', () => {
      let user
      beforeEach(async () => {
        const userCursor = await query`
          FOR user IN users
            FILTER user.userName == "test.account@istio.actually.exists"
            RETURN user
        `
        user = await userCursor.next()
        await collections.affiliations.save({
          _from: org._id,
          _to: user._id,
          permission: 'user',
        })
      })
      afterEach(async () => {
        await query`
          LET userEdges = (FOR v, e IN 1..1 ANY ${org._id} affiliations RETURN { edgeKey: e._key, userId: e._to })
          LET removeUserEdges = (FOR userEdge IN userEdges REMOVE userEdge.edgeKey IN affiliations)
          RETURN true
        `
        await query`
          FOR affiliation IN affiliations
            REMOVE affiliation IN affiliations
        `
      })
      describe('authorized user queries domain by domain', () => {
        it('returns domain', async () => {
          const response = await graphql(
            schema,
            `
              query {
                findDomainByDomain(domain: "test.gc.ca") {
                  id
                  domain
                  lastRan
                  selectors
                }
              }
            `,
            null,
            {
              i18n,
              userId: user._key,
              query: query,
              auth: {
                checkDomainPermission: checkDomainPermission({query, userId: user._key}),
                userRequired: userRequired({ userId: user._key, userLoaderByKey: userLoaderByKey(query)}),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                domainLoaderByDomain: domainLoaderByDomain(query),
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const expectedResponse = {
            data: {
              findDomainByDomain: {
                id: toGlobalId('domains', domain._key),
                domain: 'test.gc.ca',
                lastRan: null,
                selectors: ['selector1._domainkey', 'selector2._domainkey'],
              },
            },
          }
          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User ${user._key} successfully retrieved domain ${domain._key}.`,
          ])
        })
      })
    })

    describe('given unsuccessful domain retrieval', () => {
      describe('domain cannot be found', () => {
        let user
        beforeEach(async () => {
          const userCursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
          user = await userCursor.next()
        })
        it('returns an appropriate error message', async () => {
          const response = await graphql(
            schema,
            `
              query {
                findDomainByDomain(domain: "not-test.gc.ca") {
                  id
                  domain
                  lastRan
                  selectors
                }
              }
            `,
            null,
            {
              i18n,
              userId: user._key,
              query: query,
              auth: {
                checkDomainPermission: checkDomainPermission({query, userId: user._key}),
                userRequired: userRequired({ userId: user._key, userLoaderByKey: userLoaderByKey(query)}),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                domainLoaderByDomain: domainLoaderByDomain(query),
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const error = [
            new GraphQLError(
              `No domain with the provided domain could be found.`,
            ),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User ${user._key} could not retrieve domain.`,
          ])
        })
      })

      describe('user does not belong to an org which claims domain', () => {
        let user
        beforeEach(async () => {
          org = await collections.organizations.save({
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
            domain: 'not-test.gc.ca',
            lastRan: null,
            selectors: ['selector1', 'selector2'],
          })
          await collections.claims.save({
            _to: domain._id,
            _from: org._id,
          })
          const userCursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
          user = await userCursor.next()
        })
        it('returns an appropriate error message', async () => {
          const response = await graphql(
            schema,
            `
              query {
                findDomainByDomain(domain: "not-test.gc.ca") {
                  id
                  domain
                  lastRan
                  selectors
                }
              }
            `,
            null,
            {
              i18n,
              userId: user._key,
              query: query,
              auth: {
                checkDomainPermission: checkDomainPermission({query, userId: user._key}),
                userRequired: userRequired({ userId: user._key, userLoaderByKey: userLoaderByKey(query)}),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                domainLoaderByDomain: domainLoaderByDomain(query),
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const error = [
            new GraphQLError(`Could not retrieve specified domain.`),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User ${user._key} could not retrieve domain.`,
          ])
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
    describe('given successful domain retrieval', () => {
      let user
      beforeEach(async () => {
        const userCursor = await query`
          FOR user IN users
            FILTER user.userName == "test.account@istio.actually.exists"
            RETURN user
        `
        user = await userCursor.next()
        await collections.affiliations.save({
          _from: org._id,
          _to: user._id,
          permission: 'user',
        })
      })
      afterEach(async () => {
        await query`
          LET userEdges = (FOR v, e IN 1..1 ANY ${org._id} affiliations RETURN { edgeKey: e._key, userId: e._to })
          LET removeUserEdges = (FOR userEdge IN userEdges REMOVE userEdge.edgeKey IN affiliations)
          RETURN true
        `
        await query`
          FOR affiliation IN affiliations
            REMOVE affiliation IN affiliations
        `
      })
      describe('authorized user queries domain by domain', () => {
        it('returns domain', async () => {
          const response = await graphql(
            schema,
            `
              query {
                findDomainByDomain(domain: "test.gc.ca") {
                  id
                  domain
                  lastRan
                  selectors
                }
              }
            `,
            null,
            {
              i18n,
              userId: user._key,
              query: query,
              auth: {
                checkDomainPermission: checkDomainPermission({query, userId: user._key}),
                userRequired: userRequired({ userId: user._key, userLoaderByKey: userLoaderByKey(query)}),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                domainLoaderByDomain: domainLoaderByDomain(query),
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const expectedResponse = {
            data: {
              findDomainByDomain: {
                id: toGlobalId('domains', domain._key),
                domain: 'test.gc.ca',
                lastRan: null,
                selectors: ['selector1._domainkey', 'selector2._domainkey'],
              },
            },
          }
          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User ${user._key} successfully retrieved domain ${domain._key}.`,
          ])
        })
      })
    })

    describe('given unsuccessful domain retrieval', () => {
      describe('domain cannot be found', () => {
        let user
        beforeEach(async () => {
          const userCursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
          user = await userCursor.next()
        })
        it('returns an appropriate error message', async () => {
          const response = await graphql(
            schema,
            `
              query {
                findDomainByDomain(domain: "not-test.gc.ca") {
                  id
                  domain
                  lastRan
                  selectors
                }
              }
            `,
            null,
            {
              i18n,
              userId: user._key,
              query: query,
              auth: {
                checkDomainPermission: checkDomainPermission({query, userId: user._key}),
                userRequired: userRequired({ userId: user._key, userLoaderByKey: userLoaderByKey(query)}),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                domainLoaderByDomain: domainLoaderByDomain(query),
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const error = [
            new GraphQLError(
              `todo`,
            ),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User ${user._key} could not retrieve domain.`,
          ])
        })
      })

      describe('user does not belong to an org which claims domain', () => {
        let user
        beforeEach(async () => {
          org = await collections.organizations.save({
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
            domain: 'not-test.gc.ca',
            lastRan: null,
            selectors: ['selector1', 'selector2'],
          })
          await collections.claims.save({
            _to: domain._id,
            _from: org._id,
          })
          const userCursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
          user = await userCursor.next()
        })
        it('returns an appropriate error message', async () => {
          const response = await graphql(
            schema,
            `
              query {
                findDomainByDomain(domain: "not-test.gc.ca") {
                  id
                  domain
                  lastRan
                  selectors
                }
              }
            `,
            null,
            {
              i18n,
              userId: user._key,
              query: query,
              auth: {
                checkDomainPermission: checkDomainPermission({query, userId: user._key}),
                userRequired: userRequired({ userId: user._key, userLoaderByKey: userLoaderByKey(query)}),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                domainLoaderByDomain: domainLoaderByDomain(query),
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const error = [
            new GraphQLError(`todo`),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User ${user._key} could not retrieve domain.`,
          ])
        })
      })
    })
  })
})
