const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { graphql, GraphQLSchema, GraphQLError } = require('graphql')
const { makeMigrations } = require('../../../../migrations')
const { createQuerySchema } = require('../../../queries')
const { createMutationSchema } = require('../..')
const { toGlobalId } = require('graphql-relay')
const bcrypt = require('bcrypt')

const { setupI18n } = require('@lingui/core')
const englishMessages = require('../../../locale/en/messages')
const frenchMessages = require('../../../locale/fr/messages')

const { cleanseInput, slugify } = require('../../../validators')
const { checkPermission, tokenize, userRequired } = require('../../../auth')
const {
  domainLoaderByKey,
  orgLoaderByKey,
  userLoaderByKey,
  userLoaderByUserName,
} = require('../../../loaders')

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('updating a domain', () => {
  let query, drop, truncate, migrate, schema, collections, transaction

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
    ;({ query, drop, truncate, collections, transaction } = await migrate(
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
  })

  afterEach(async () => {
    await drop()
  })

  describe('given a successful domain update', () => {
    let org, user, domain
    beforeEach(async () => {
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

      const userCursor = await query`
        FOR user IN users
          FILTER user.userName == "test.account@istio.actually.exists"
          RETURN user
      `
      user = await userCursor.next()
    })
    describe('users permission is super admin', () => {
      beforeEach(async () => {
        await collections.affiliations.save({
          _to: user._id,
          _from: org._id,
          permission: 'super_admin',
        })
      })
      describe('user updates domain', () => {
        it('returns updated domain', async () => {
          const response = await graphql(
            schema,
            `
            mutation {
              updateDomain (
                input: {
                  domainId: "${toGlobalId('domains', domain._key)}"
                  orgId: "${toGlobalId('organizations', org._key)}"
                  domain: "test.canada.ca"
                }
              ) {
                domain {
                  id
                  domain
                  lastRan
                  selectors
                }
              }
            }
            `,
            null,
            {
              query,
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              validators: {
                cleanseInput,
                slugify,
              },
              loaders: {
                domainLoaderByKey: domainLoaderByKey(query),
                orgLoaderByKey: orgLoaderByKey(query, 'en'),
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const expectedResponse = {
            data: {
              updateDomain: {
                domain: {
                  id: toGlobalId('domains', domain._key),
                  domain: 'test.canada.ca',
                  lastRan: null,
                  selectors: ['selector1._domainkey', 'selector2._domainkey'],
                },
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully updated domain: ${domain._key}.`,
          ])
        })
      })
      describe('user updates selectors', () => {
        it('returns updated domain', async () => {
          const response = await graphql(
            schema,
            `
            mutation {
              updateDomain (
                input: {
                  domainId: "${toGlobalId('domains', domain._key)}"
                  orgId: "${toGlobalId('organizations', org._key)}"
                  selectors: [
                    "selector3._domainkey",
                    "selector4._domainkey"
                  ]
                }
              ) {
                domain {
                  id
                  domain
                  lastRan
                  selectors
                }
              }
            }
            `,
            null,
            {
              query,
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              validators: {
                cleanseInput,
                slugify,
              },
              loaders: {
                domainLoaderByKey: domainLoaderByKey(query),
                orgLoaderByKey: orgLoaderByKey(query, 'en'),
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const expectedResponse = {
            data: {
              updateDomain: {
                domain: {
                  id: toGlobalId('domains', domain._key),
                  domain: 'test.gc.ca',
                  lastRan: null,
                  selectors: ['selector3._domainkey', 'selector4._domainkey'],
                },
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully updated domain: ${domain._key}.`,
          ])
        })
      })
      describe('user updates domain and selectors', () => {
        it('returns updated domain', async () => {
          const response = await graphql(
            schema,
            `
            mutation {
              updateDomain (
                input: {
                  domainId: "${toGlobalId('domains', domain._key)}"
                  orgId: "${toGlobalId('organizations', org._key)}"
                  domain: "test.canada.ca"
                  selectors: [
                    "selector3._domainkey",
                    "selector4._domainkey"
                  ]
                }
              ) {
                domain {
                  id
                  domain
                  lastRan
                  selectors
                }
              }
            }
            `,
            null,
            {
              query,
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              validators: {
                cleanseInput,
                slugify,
              },
              loaders: {
                domainLoaderByKey: domainLoaderByKey(query),
                orgLoaderByKey: orgLoaderByKey(query, 'en'),
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const expectedResponse = {
            data: {
              updateDomain: {
                domain: {
                  id: toGlobalId('domains', domain._key),
                  domain: 'test.canada.ca',
                  lastRan: null,
                  selectors: ['selector3._domainkey', 'selector4._domainkey'],
                },
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully updated domain: ${domain._key}.`,
          ])
        })
      })
    })
    describe('users permission is admin', () => {
      beforeEach(async () => {
        await collections.affiliations.save({
          _to: user._id,
          _from: org._id,
          permission: 'admin',
        })
      })
      describe('user updates domain', () => {
        it('returns updated domain', async () => {
          const response = await graphql(
            schema,
            `
            mutation {
              updateDomain (
                input: {
                  domainId: "${toGlobalId('domains', domain._key)}"
                  orgId: "${toGlobalId('organizations', org._key)}"
                  domain: "test.canada.ca"
                }
              ) {
                domain {
                  id
                  domain
                  lastRan
                  selectors
                }
              }
            }
            `,
            null,
            {
              query,
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              validators: {
                cleanseInput,
                slugify,
              },
              loaders: {
                domainLoaderByKey: domainLoaderByKey(query),
                orgLoaderByKey: orgLoaderByKey(query, 'en'),
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const expectedResponse = {
            data: {
              updateDomain: {
                domain: {
                  id: toGlobalId('domains', domain._key),
                  domain: 'test.canada.ca',
                  lastRan: null,
                  selectors: ['selector1._domainkey', 'selector2._domainkey'],
                },
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully updated domain: ${domain._key}.`,
          ])
        })
      })
      describe('user updates selectors', () => {
        it('returns updated domain', async () => {
          const response = await graphql(
            schema,
            `
            mutation {
              updateDomain (
                input: {
                  domainId: "${toGlobalId('domains', domain._key)}"
                  orgId: "${toGlobalId('organizations', org._key)}"
                  selectors: [
                    "selector3._domainkey",
                    "selector4._domainkey"
                  ]
                }
              ) {
                domain {
                  id
                  domain
                  lastRan
                  selectors
                }
              }
            }
            `,
            null,
            {
              query,
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              validators: {
                cleanseInput,
                slugify,
              },
              loaders: {
                domainLoaderByKey: domainLoaderByKey(query),
                orgLoaderByKey: orgLoaderByKey(query, 'en'),
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const expectedResponse = {
            data: {
              updateDomain: {
                domain: {
                  id: toGlobalId('domains', domain._key),
                  domain: 'test.gc.ca',
                  lastRan: null,
                  selectors: ['selector3._domainkey', 'selector4._domainkey'],
                },
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully updated domain: ${domain._key}.`,
          ])
        })
      })
      describe('user updates domain and selectors', () => {
        it('returns updated domain', async () => {
          const response = await graphql(
            schema,
            `
            mutation {
              updateDomain (
                input: {
                  domainId: "${toGlobalId('domains', domain._key)}"
                  orgId: "${toGlobalId('organizations', org._key)}"
                  domain: "test.canada.ca"
                  selectors: [
                    "selector3._domainkey",
                    "selector4._domainkey"
                  ]
                }
              ) {
                domain {
                  id
                  domain
                  lastRan
                  selectors
                }
              }
            }
            `,
            null,
            {
              query,
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              validators: {
                cleanseInput,
                slugify,
              },
              loaders: {
                domainLoaderByKey: domainLoaderByKey(query),
                orgLoaderByKey: orgLoaderByKey(query, 'en'),
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const expectedResponse = {
            data: {
              updateDomain: {
                domain: {
                  id: toGlobalId('domains', domain._key),
                  domain: 'test.canada.ca',
                  lastRan: null,
                  selectors: ['selector3._domainkey', 'selector4._domainkey'],
                },
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully updated domain: ${domain._key}.`,
          ])
        })
      })
    })
    describe('users permission is user', () => {
      beforeEach(async () => {
        await collections.affiliations.save({
          _to: user._id,
          _from: org._id,
          permission: 'admin',
        })
      })
      describe('user updates domain', () => {
        it('returns updated domain', async () => {
          const response = await graphql(
            schema,
            `
            mutation {
              updateDomain (
                input: {
                  domainId: "${toGlobalId('domains', domain._key)}"
                  orgId: "${toGlobalId('organizations', org._key)}"
                  domain: "test.canada.ca"
                }
              ) {
                domain {
                  id
                  domain
                  lastRan
                  selectors
                }
              }
            }
            `,
            null,
            {
              query,
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              validators: {
                cleanseInput,
                slugify,
              },
              loaders: {
                domainLoaderByKey: domainLoaderByKey(query),
                orgLoaderByKey: orgLoaderByKey(query, 'en'),
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const expectedResponse = {
            data: {
              updateDomain: {
                domain: {
                  id: toGlobalId('domains', domain._key),
                  domain: 'test.canada.ca',
                  lastRan: null,
                  selectors: ['selector1._domainkey', 'selector2._domainkey'],
                },
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully updated domain: ${domain._key}.`,
          ])
        })
      })
      describe('user updates selectors', () => {
        it('returns updated domain', async () => {
          const response = await graphql(
            schema,
            `
            mutation {
              updateDomain (
                input: {
                  domainId: "${toGlobalId('domains', domain._key)}"
                  orgId: "${toGlobalId('organizations', org._key)}"
                  selectors: [
                    "selector3._domainkey",
                    "selector4._domainkey"
                  ]
                }
              ) {
                domain {
                  id
                  domain
                  lastRan
                  selectors
                }
              }
            }
            `,
            null,
            {
              query,
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              validators: {
                cleanseInput,
                slugify,
              },
              loaders: {
                domainLoaderByKey: domainLoaderByKey(query),
                orgLoaderByKey: orgLoaderByKey(query, 'en'),
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const expectedResponse = {
            data: {
              updateDomain: {
                domain: {
                  id: toGlobalId('domains', domain._key),
                  domain: 'test.gc.ca',
                  lastRan: null,
                  selectors: ['selector3._domainkey', 'selector4._domainkey'],
                },
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully updated domain: ${domain._key}.`,
          ])
        })
      })
      describe('user updates domain and selectors', () => {
        it('returns updated domain', async () => {
          const response = await graphql(
            schema,
            `
            mutation {
              updateDomain (
                input: {
                  domainId: "${toGlobalId('domains', domain._key)}"
                  orgId: "${toGlobalId('organizations', org._key)}"
                  domain: "test.canada.ca"
                  selectors: [
                    "selector3._domainkey",
                    "selector4._domainkey"
                  ]
                }
              ) {
                domain {
                  id
                  domain
                  lastRan
                  selectors
                }
              }
            }
            `,
            null,
            {
              query,
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              validators: {
                cleanseInput,
                slugify,
              },
              loaders: {
                domainLoaderByKey: domainLoaderByKey(query),
                orgLoaderByKey: orgLoaderByKey(query, 'en'),
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const expectedResponse = {
            data: {
              updateDomain: {
                domain: {
                  id: toGlobalId('domains', domain._key),
                  domain: 'test.canada.ca',
                  lastRan: null,
                  selectors: ['selector3._domainkey', 'selector4._domainkey'],
                },
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully updated domain: ${domain._key}.`,
          ])
        })
      })
    })
  })
  describe('given an unsuccessful domain update', () => {
    let i18n
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
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
            mutation {
              updateDomain (
                input: {
                  domainId: "${toGlobalId('domains', 1)}"
                  orgId: "${toGlobalId('organizations', 1)}"
                  domain: "test.canada.ca"
                  selectors: [
                    "selector3._domainkey",
                    "selector4._domainkey"
                  ]
                }
              ) {
                domain {
                  id
                  domain
                  lastRan
                  selectors
                }
              }
            }
            `,
            null,
            {
              i18n,
              query,
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              validators: {
                cleanseInput,
                slugify,
              },
              loaders: {
                domainLoaderByKey: domainLoaderByKey(query),
                orgLoaderByKey: orgLoaderByKey(query, 'en'),
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const error = [
            new GraphQLError('Unable to update domain. Please try again.'),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to update domain: 1, however there is no domain associated with that id.`,
          ])
        })
      })
      describe('organization cannot be found', () => {
        let user, domain
        beforeEach(async () => {
          domain = await collections.domains.save({
            domain: 'test.gc.ca',
            lastRan: null,
            selectors: ['selector1._domainkey', 'selector2._domainkey'],
          })

          const userCursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
          user = await userCursor.next()
        })
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
            mutation {
              updateDomain (
                input: {
                  domainId: "${toGlobalId('domains', domain._key)}"
                  orgId: "${toGlobalId('organizations', 1)}"
                  domain: "test.canada.ca"
                  selectors: [
                    "selector3._domainkey",
                    "selector4._domainkey"
                  ]
                }
              ) {
                domain {
                  id
                  domain
                  lastRan
                  selectors
                }
              }
            }
            `,
            null,
            {
              i18n,
              query,
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              validators: {
                cleanseInput,
                slugify,
              },
              loaders: {
                domainLoaderByKey: domainLoaderByKey(query),
                orgLoaderByKey: orgLoaderByKey(query, 'en'),
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const error = [
            new GraphQLError('Unable to update domain. Please try again.'),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to update domain: ${domain._key} for org: 1, however there is no org associated with that id.`,
          ])
        })
      })
      describe('user does not belong to org', () => {
        let org, user, domain, secondOrg
        beforeEach(async () => {
          secondOrg = await collections.organizations.save({
            verified: true,
            orgDetails: {
              en: {
                slug: 'communications-security-establishment',
                acronym: 'CSE',
                name: 'Communications Security Establishment',
                zone: 'FED',
                sector: 'DND',
                country: 'Canada',
                province: 'Ontario',
                city: 'Ottawa',
              },
              fr: {
                slug: 'centre-de-la-securite-des-telecommunications',
                acronym: 'CST',
                name: 'Centre de la Securite des Telecommunications',
                zone: 'FED',
                sector: 'DND',
                country: 'Canada',
                province: 'Ontario',
                city: 'Ottawa',
              },
            },
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
            lastRan: null,
            selectors: ['selector1._domainkey', 'selector2._domainkey'],
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
        describe('user has admin in a different org', () => {
          beforeEach(async () => {
            await collections.affiliations.save({
              _from: secondOrg._id,
              _to: user._id,
              permission: 'admin',
            })
          })
          it('returns an error message', async () => {
            const response = await graphql(
              schema,
              `
              mutation {
                updateDomain (
                  input: {
                    domainId: "${toGlobalId('domains', domain._key)}"
                    orgId: "${toGlobalId('organizations', org._key)}"
                    domain: "test.canada.ca"
                    selectors: [
                      "selector3._domainkey",
                      "selector4._domainkey"
                    ]
                  }
                ) {
                  domain {
                    id
                    domain
                    lastRan
                    selectors
                  }
                }
              }
              `,
              null,
              {
                i18n,
                query,
                collections,
                transaction,
                userKey: user._key,
                auth: {
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    userLoaderByKey: userLoaderByKey(query),
                  }),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  domainLoaderByKey: domainLoaderByKey(query),
                  orgLoaderByKey: orgLoaderByKey(query, 'en'),
                  userLoaderByKey: userLoaderByKey(query),
                },
              },
            )

            const error = [
              new GraphQLError('Unable to update domain. Please try again.'),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to update domain: ${domain._key} for org: ${org._key}, however they do not have permission in that org.`,
            ])
          })
        })
        describe('user has user in a different org', () => {
          beforeEach(async () => {
            await collections.affiliations.save({
              _from: secondOrg._id,
              _to: user._id,
              permission: 'user',
            })
          })
          it('returns an error message', async () => {
            const response = await graphql(
              schema,
              `
              mutation {
                updateDomain (
                  input: {
                    domainId: "${toGlobalId('domains', domain._key)}"
                    orgId: "${toGlobalId('organizations', org._key)}"
                    domain: "test.canada.ca"
                    selectors: [
                      "selector3._domainkey",
                      "selector4._domainkey"
                    ]
                  }
                ) {
                  domain {
                    id
                    domain
                    lastRan
                    selectors
                  }
                }
              }
              `,
              null,
              {
                i18n,
                query,
                collections,
                transaction,
                userKey: user._key,
                auth: {
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    userLoaderByKey: userLoaderByKey(query),
                  }),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  domainLoaderByKey: domainLoaderByKey(query),
                  orgLoaderByKey: orgLoaderByKey(query, 'en'),
                  userLoaderByKey: userLoaderByKey(query),
                },
              },
            )

            const error = [
              new GraphQLError('Unable to update domain. Please try again.'),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to update domain: ${domain._key} for org: ${org._key}, however they do not have permission in that org.`,
            ])
          })
        })
      })
      describe('domain and org do not have any edges', () => {
        let org, user, domain
        beforeEach(async () => {
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

          const userCursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
          user = await userCursor.next()

          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'admin',
          })
        })
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
            mutation {
              updateDomain (
                input: {
                  domainId: "${toGlobalId('domains', domain._key)}"
                  orgId: "${toGlobalId('organizations', org._key)}"
                  domain: "test.canada.ca"
                  selectors: [
                    "selector3._domainkey",
                    "selector4._domainkey"
                  ]
                }
              ) {
                domain {
                  id
                  domain
                  lastRan
                  selectors
                }
              }
            }
            `,
            null,
            {
              i18n,
              query,
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              validators: {
                cleanseInput,
                slugify,
              },
              loaders: {
                domainLoaderByKey: domainLoaderByKey(query),
                orgLoaderByKey: orgLoaderByKey(query, 'en'),
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const error = [
            new GraphQLError('Unable to update domain. Please try again.'),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to update domain: ${domain._key} for org: ${org._key}, however that org has no claims to that domain.`,
          ])
        })
      })
    })
    describe('database error occurs', () => {
      let org, user, domain
      beforeEach(async () => {
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

        const userCursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
        user = await userCursor.next()

        await collections.affiliations.save({
          _from: org._id,
          _to: user._id,
          permission: 'admin',
        })
      })
      describe('while checking for edge connections', () => {
        it('returns an error message', async () => {
          const domainLoader = domainLoaderByKey(query)
          const orgLoader = orgLoaderByKey(query, 'en')
          const userLoader = userLoaderByKey(query)

          query = jest
            .fn()
            .mockReturnValueOnce({
              next() {
                return 'admin'
              },
            })
            .mockReturnValueOnce({
              next() {
                return 'admin'
              },
            })
            .mockRejectedValue(new Error('Database error occurred.'))

          const response = await graphql(
            schema,
            `
            mutation {
              updateDomain (
                input: {
                  domainId: "${toGlobalId('domains', domain._key)}"
                  orgId: "${toGlobalId('organizations', org._key)}"
                  domain: "test.canada.ca"
                  selectors: [
                    "selector3._domainkey",
                    "selector4._domainkey"
                  ]
                }
              ) {
                domain {
                  id
                  domain
                  lastRan
                  selectors
                }
              }
            }
            `,
            null,
            {
              i18n,
              query,
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  userLoaderByKey: userLoader,
                }),
              },
              validators: {
                cleanseInput,
                slugify,
              },
              loaders: {
                domainLoaderByKey: domainLoader,
                orgLoaderByKey: orgLoader,
                userLoaderByKey: userLoader,
              },
            },
          )

          const error = [
            new GraphQLError('Unable to update domain. Please try again.'),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Database error occurred while user: ${user._key} attempted to update domain: ${domain._key}, error: Error: Database error occurred.`,
          ])
        })
      })
    })
    describe('transaction error occurs', () => {
      let org, user, domain
      beforeEach(async () => {
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

        const userCursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
        user = await userCursor.next()

        await collections.affiliations.save({
          _from: org._id,
          _to: user._id,
          permission: 'admin',
        })
      })
      describe('when running domain upsert', () => {
        it('returns an error message', async () => {
          const domainLoader = domainLoaderByKey(query)
          const orgLoader = orgLoaderByKey(query, 'en')
          const userLoader = userLoaderByKey(query)

          transaction = jest.fn().mockReturnValue({
            run() {
              throw new Error('Transaction error occurred.')
            },
          })

          const response = await graphql(
            schema,
            `
            mutation {
              updateDomain (
                input: {
                  domainId: "${toGlobalId('domains', domain._key)}"
                  orgId: "${toGlobalId('organizations', org._key)}"
                  domain: "test.canada.ca"
                  selectors: [
                    "selector3._domainkey",
                    "selector4._domainkey"
                  ]
                }
              ) {
                domain {
                  id
                  domain
                  lastRan
                  selectors
                }
              }
            }
            `,
            null,
            {
              i18n,
              query,
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              validators: {
                cleanseInput,
                slugify,
              },
              loaders: {
                domainLoaderByKey: domainLoader,
                orgLoaderByKey: orgLoader,
                userLoaderByKey: userLoader,
              },
            },
          )

          const error = [
            new GraphQLError('Unable to update domain. Please try again.'),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Transaction run error occurred when user: ${user._key} attempted to update domain: ${domain._key}, error: Error: Transaction error occurred.`,
          ])
        })
      })
      describe('when committing transaction', () => {
        it('returns an error message', async () => {
          const domainLoader = domainLoaderByKey(query)
          const orgLoader = orgLoaderByKey(query, 'en')
          const userLoader = userLoaderByKey(query)

          transaction = jest.fn().mockReturnValue({
            run() {
              return undefined
            },
            commit() {
              throw new Error('Transaction error occurred.')
            },
          })

          const response = await graphql(
            schema,
            `
            mutation {
              updateDomain (
                input: {
                  domainId: "${toGlobalId('domains', domain._key)}"
                  orgId: "${toGlobalId('organizations', org._key)}"
                  domain: "test.canada.ca"
                  selectors: [
                    "selector3._domainkey",
                    "selector4._domainkey"
                  ]
                }
              ) {
                domain {
                  id
                  domain
                  lastRan
                  selectors
                }
              }
            }
            `,
            null,
            {
              i18n,
              query,
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              validators: {
                cleanseInput,
                slugify,
              },
              loaders: {
                domainLoaderByKey: domainLoader,
                orgLoaderByKey: orgLoader,
                userLoaderByKey: userLoader,
              },
            },
          )

          const error = [
            new GraphQLError('Unable to update domain. Please try again.'),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Transaction commit error occurred when user: ${user._key} attempted to update domain: ${domain._key}, error: Error: Transaction error occurred.`,
          ])
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
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
            mutation {
              updateDomain (
                input: {
                  domainId: "${toGlobalId('domains', 1)}"
                  orgId: "${toGlobalId('organizations', 1)}"
                  domain: "test.canada.ca"
                  selectors: [
                    "selector3._domainkey",
                    "selector4._domainkey"
                  ]
                }
              ) {
                domain {
                  id
                  domain
                  lastRan
                  selectors
                }
              }
            }
            `,
            null,
            {
              i18n,
              query,
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              validators: {
                cleanseInput,
                slugify,
              },
              loaders: {
                domainLoaderByKey: domainLoaderByKey(query),
                orgLoaderByKey: orgLoaderByKey(query, 'en'),
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to update domain: 1, however there is no domain associated with that id.`,
          ])
        })
      })
      describe('organization cannot be found', () => {
        let user, domain
        beforeEach(async () => {
          domain = await collections.domains.save({
            domain: 'test.gc.ca',
            lastRan: null,
            selectors: ['selector1._domainkey', 'selector2._domainkey'],
          })

          const userCursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
          user = await userCursor.next()
        })
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
            mutation {
              updateDomain (
                input: {
                  domainId: "${toGlobalId('domains', domain._key)}"
                  orgId: "${toGlobalId('organizations', 1)}"
                  domain: "test.canada.ca"
                  selectors: [
                    "selector3._domainkey",
                    "selector4._domainkey"
                  ]
                }
              ) {
                domain {
                  id
                  domain
                  lastRan
                  selectors
                }
              }
            }
            `,
            null,
            {
              i18n,
              query,
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              validators: {
                cleanseInput,
                slugify,
              },
              loaders: {
                domainLoaderByKey: domainLoaderByKey(query),
                orgLoaderByKey: orgLoaderByKey(query, 'en'),
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to update domain: ${domain._key} for org: 1, however there is no org associated with that id.`,
          ])
        })
      })
      describe('user does not belong to org', () => {
        let org, user, domain, secondOrg
        beforeEach(async () => {
          secondOrg = await collections.organizations.save({
            verified: true,
            orgDetails: {
              en: {
                slug: 'communications-security-establishment',
                acronym: 'CSE',
                name: 'Communications Security Establishment',
                zone: 'FED',
                sector: 'DND',
                country: 'Canada',
                province: 'Ontario',
                city: 'Ottawa',
              },
              fr: {
                slug: 'centre-de-la-securite-des-telecommunications',
                acronym: 'CST',
                name: 'Centre de la Securite des Telecommunications',
                zone: 'FED',
                sector: 'DND',
                country: 'Canada',
                province: 'Ontario',
                city: 'Ottawa',
              },
            },
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
            lastRan: null,
            selectors: ['selector1._domainkey', 'selector2._domainkey'],
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
        describe('user has admin in a different org', () => {
          beforeEach(async () => {
            await collections.affiliations.save({
              _from: secondOrg._id,
              _to: user._id,
              permission: 'admin',
            })
          })
          it('returns an error message', async () => {
            const response = await graphql(
              schema,
              `
              mutation {
                updateDomain (
                  input: {
                    domainId: "${toGlobalId('domains', domain._key)}"
                    orgId: "${toGlobalId('organizations', org._key)}"
                    domain: "test.canada.ca"
                    selectors: [
                      "selector3._domainkey",
                      "selector4._domainkey"
                    ]
                  }
                ) {
                  domain {
                    id
                    domain
                    lastRan
                    selectors
                  }
                }
              }
              `,
              null,
              {
                i18n,
                query,
                collections,
                transaction,
                userKey: user._key,
                auth: {
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    userLoaderByKey: userLoaderByKey(query),
                  }),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  domainLoaderByKey: domainLoaderByKey(query),
                  orgLoaderByKey: orgLoaderByKey(query, 'en'),
                  userLoaderByKey: userLoaderByKey(query),
                },
              },
            )

            const error = [new GraphQLError('todo')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to update domain: ${domain._key} for org: ${org._key}, however they do not have permission in that org.`,
            ])
          })
        })
        describe('user has user in a different org', () => {
          beforeEach(async () => {
            await collections.affiliations.save({
              _from: secondOrg._id,
              _to: user._id,
              permission: 'user',
            })
          })
          it('returns an error message', async () => {
            const response = await graphql(
              schema,
              `
              mutation {
                updateDomain (
                  input: {
                    domainId: "${toGlobalId('domains', domain._key)}"
                    orgId: "${toGlobalId('organizations', org._key)}"
                    domain: "test.canada.ca"
                    selectors: [
                      "selector3._domainkey",
                      "selector4._domainkey"
                    ]
                  }
                ) {
                  domain {
                    id
                    domain
                    lastRan
                    selectors
                  }
                }
              }
              `,
              null,
              {
                i18n,
                query,
                collections,
                transaction,
                userKey: user._key,
                auth: {
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    userLoaderByKey: userLoaderByKey(query),
                  }),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  domainLoaderByKey: domainLoaderByKey(query),
                  orgLoaderByKey: orgLoaderByKey(query, 'en'),
                  userLoaderByKey: userLoaderByKey(query),
                },
              },
            )

            const error = [new GraphQLError('todo')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to update domain: ${domain._key} for org: ${org._key}, however they do not have permission in that org.`,
            ])
          })
        })
      })
      describe('domain and org do not have any edges', () => {
        let org, user, domain
        beforeEach(async () => {
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

          const userCursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
          user = await userCursor.next()

          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'admin',
          })
        })
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
            mutation {
              updateDomain (
                input: {
                  domainId: "${toGlobalId('domains', domain._key)}"
                  orgId: "${toGlobalId('organizations', org._key)}"
                  domain: "test.canada.ca"
                  selectors: [
                    "selector3._domainkey",
                    "selector4._domainkey"
                  ]
                }
              ) {
                domain {
                  id
                  domain
                  lastRan
                  selectors
                }
              }
            }
            `,
            null,
            {
              i18n,
              query,
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              validators: {
                cleanseInput,
                slugify,
              },
              loaders: {
                domainLoaderByKey: domainLoaderByKey(query),
                orgLoaderByKey: orgLoaderByKey(query, 'en'),
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to update domain: ${domain._key} for org: ${org._key}, however that org has no claims to that domain.`,
          ])
        })
      })
    })
    describe('database error occurs', () => {
      let org, user, domain
      beforeEach(async () => {
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

        const userCursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
        user = await userCursor.next()

        await collections.affiliations.save({
          _from: org._id,
          _to: user._id,
          permission: 'admin',
        })
      })
      describe('while checking for edge connections', () => {
        it('returns an error message', async () => {
          const domainLoader = domainLoaderByKey(query)
          const orgLoader = orgLoaderByKey(query, 'en')
          const userLoader = userLoaderByKey(query)

          query = jest
            .fn()
            .mockReturnValueOnce({
              next() {
                return 'admin'
              },
            })
            .mockReturnValueOnce({
              next() {
                return 'admin'
              },
            })
            .mockRejectedValue(new Error('Database error occurred.'))

          const response = await graphql(
            schema,
            `
            mutation {
              updateDomain (
                input: {
                  domainId: "${toGlobalId('domains', domain._key)}"
                  orgId: "${toGlobalId('organizations', org._key)}"
                  domain: "test.canada.ca"
                  selectors: [
                    "selector3._domainkey",
                    "selector4._domainkey"
                  ]
                }
              ) {
                domain {
                  id
                  domain
                  lastRan
                  selectors
                }
              }
            }
            `,
            null,
            {
              i18n,
              query,
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  userLoaderByKey: userLoader,
                }),
              },
              validators: {
                cleanseInput,
                slugify,
              },
              loaders: {
                domainLoaderByKey: domainLoader,
                orgLoaderByKey: orgLoader,
                userLoaderByKey: userLoader,
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Database error occurred while user: ${user._key} attempted to update domain: ${domain._key}, error: Error: Database error occurred.`,
          ])
        })
      })
    })
    describe('transaction error occurs', () => {
      let org, user, domain
      beforeEach(async () => {
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

        const userCursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
        user = await userCursor.next()

        await collections.affiliations.save({
          _from: org._id,
          _to: user._id,
          permission: 'admin',
        })
      })
      describe('when running domain upsert', () => {
        it('returns an error message', async () => {
          const domainLoader = domainLoaderByKey(query)
          const orgLoader = orgLoaderByKey(query, 'en')
          const userLoader = userLoaderByKey(query)

          transaction = jest.fn().mockReturnValue({
            run() {
              throw new Error('Transaction error occurred.')
            },
          })

          const response = await graphql(
            schema,
            `
            mutation {
              updateDomain (
                input: {
                  domainId: "${toGlobalId('domains', domain._key)}"
                  orgId: "${toGlobalId('organizations', org._key)}"
                  domain: "test.canada.ca"
                  selectors: [
                    "selector3._domainkey",
                    "selector4._domainkey"
                  ]
                }
              ) {
                domain {
                  id
                  domain
                  lastRan
                  selectors
                }
              }
            }
            `,
            null,
            {
              i18n,
              query,
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              validators: {
                cleanseInput,
                slugify,
              },
              loaders: {
                domainLoaderByKey: domainLoader,
                orgLoaderByKey: orgLoader,
                userLoaderByKey: userLoader,
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Transaction run error occurred when user: ${user._key} attempted to update domain: ${domain._key}, error: Error: Transaction error occurred.`,
          ])
        })
      })
      describe('when committing transaction', () => {
        it('returns an error message', async () => {
          const domainLoader = domainLoaderByKey(query)
          const orgLoader = orgLoaderByKey(query, 'en')
          const userLoader = userLoaderByKey(query)

          transaction = jest.fn().mockReturnValue({
            run() {
              return undefined
            },
            commit() {
              throw new Error('Transaction error occurred.')
            },
          })

          const response = await graphql(
            schema,
            `
            mutation {
              updateDomain (
                input: {
                  domainId: "${toGlobalId('domains', domain._key)}"
                  orgId: "${toGlobalId('organizations', org._key)}"
                  domain: "test.canada.ca"
                  selectors: [
                    "selector3._domainkey",
                    "selector4._domainkey"
                  ]
                }
              ) {
                domain {
                  id
                  domain
                  lastRan
                  selectors
                }
              }
            }
            `,
            null,
            {
              i18n,
              query,
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              validators: {
                cleanseInput,
                slugify,
              },
              loaders: {
                domainLoaderByKey: domainLoader,
                orgLoaderByKey: orgLoader,
                userLoaderByKey: userLoader,
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Transaction commit error occurred when user: ${user._key} attempted to update domain: ${domain._key}, error: Error: Transaction error occurred.`,
          ])
        })
      })
    })
  })
})
