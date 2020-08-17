const dotenv = require('dotenv-safe')
dotenv.config()

const { SIGN_IN_KEY } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { graphql, GraphQLSchema, GraphQLError } = require('graphql')
const { toGlobalId } = require('graphql-relay')
const { makeMigrations } = require('../../migrations')
const { createQuerySchema } = require('../queries')
const { createMutationSchema } = require('../mutations')

const bcrypt = require('bcrypt')
const { cleanseInput, slugify } = require('../validators')
const { checkPermission, tokenize, userRequired } = require('../auth')
const {
  domainLoaderBySlug,
  orgLoaderById,
  orgLoaderByDomainId,
  userLoaderById,
  userLoaderByUserName,
} = require('../loaders')

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('create a domain', () => {
  let query,
    drop,
    truncate,
    migrate,
    schema,
    collections,
    transaction,
    user,
    org

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

    const userCursor = await query`
      FOR user IN users
        RETURN user
    `
    user = await userCursor.next()
    consoleOutput = []
  })

  afterEach(async () => {
    await drop()
  })

  describe('given a successful domain creation', () => {
    describe('user has super admin permission level', () => {
      describe('user belongs to the same org', () => {
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'super_admin',
          })
        })
        it('returns the domain', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                createDomain(
                  input: {
                    orgId: "${toGlobalId('organizations', org._key)}"
                    domain: "test.gc.ca"
                    selectors: ["selector1._domainkey", "selector2._domainkey"]
                  }
                ) {
                  domain {
                    id
                    domain
                    slug
                    lastRan
                    selectors
                    organization {
                      id
                      name
                    }
                  }
                }
              }
            `,
            null,
            {
              request: {
                language: 'en',
              },
              query,
              collections,
              transaction,
              userId: user._key,
              auth: { checkPermission, userRequired },
              loaders: {
                domainLoaderBySlug: domainLoaderBySlug(query),
                orgLoaderById: orgLoaderById(query, 'en'),
                orgLoaderByDomainId: orgLoaderByDomainId(query, 'en'),
                userLoaderById: userLoaderById(query),
              },
              validators: { cleanseInput, slugify },
            },
          )

          const domainCursor = await query`
            FOR domain IN domains
              RETURN domain
          `
          const domain = await domainCursor.next()

          const expectedResponse = {
            data: {
              createDomain: {
                domain: {
                  id: toGlobalId('domains', domain._key),
                  domain: 'test.gc.ca',
                  slug: 'test-gc-ca',
                  lastRan: null,
                  selectors: ['selector1._domainkey', 'selector2._domainkey'],
                  organization: {
                    id: toGlobalId('organizations', org._key),
                    name: 'Treasury Board of Canada Secretariat',
                  },
                },
              },
            },
          }

          expect(response).toEqual(expectedResponse)

          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully created ${domain.slug} in org: treasury-board-secretariat.`,
          ])
        })
      })
      describe('user belongs to a different org', () => {
        let secondOrg
        beforeEach(async () => {
          secondOrg = await collections.organizations.save({
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
          await collections.affiliations.save({
            _from: secondOrg._id,
            _to: user._id,
            permission: 'super_admin',
          })
        })
        it('returns the domain', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                createDomain(
                  input: {
                    orgId: "${toGlobalId('organizations', org._key)}"
                    domain: "test.gc.ca"
                    selectors: ["selector1._domainkey", "selector2._domainkey"]
                  }
                ) {
                  domain {
                    id
                    domain
                    slug
                    lastRan
                    selectors
                    organization {
                      id
                      name
                    }
                  }
                }
              }
            `,
            null,
            {
              request: {
                language: 'en',
              },
              query,
              collections,
              transaction,
              userId: user._key,
              auth: { checkPermission, userRequired },
              loaders: {
                domainLoaderBySlug: domainLoaderBySlug(query),
                orgLoaderById: orgLoaderById(query, 'en'),
                orgLoaderByDomainId: orgLoaderByDomainId(query, 'en'),
                userLoaderById: userLoaderById(query),
              },
              validators: { cleanseInput, slugify },
            },
          )

          const domainCursor = await query`
            FOR domain IN domains
              RETURN domain
          `
          const domain = await domainCursor.next()

          const expectedResponse = {
            data: {
              createDomain: {
                domain: {
                  id: toGlobalId('domains', domain._key),
                  domain: 'test.gc.ca',
                  slug: 'test-gc-ca',
                  lastRan: null,
                  selectors: ['selector1._domainkey', 'selector2._domainkey'],
                  organization: {
                    id: toGlobalId('organizations', org._key),
                    name: 'Treasury Board of Canada Secretariat',
                  },
                },
              },
            },
          }

          expect(response).toEqual(expectedResponse)

          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully created ${domain.slug} in org: treasury-board-secretariat.`,
          ])
        })
      })
    })
    describe('user has admin permission level', () => {
      beforeEach(async () => {
        await collections.affiliations.save({
          _from: org._id,
          _to: user._id,
          permission: 'admin',
        })
      })
      it('returns the domain', async () => {
        const response = await graphql(
          schema,
          `
            mutation {
              createDomain(
                input: {
                  orgId: "${toGlobalId('organizations', org._key)}"
                  domain: "test.gc.ca"
                  selectors: ["selector1._domainkey", "selector2._domainkey"]
                }
              ) {
                domain {
                  id
                  domain
                  slug
                  lastRan
                  selectors
                  organization {
                    id
                    name
                  }
                }
              }
            }
          `,
          null,
          {
            request: {
              language: 'en',
            },
            query,
            collections,
            transaction,
            userId: user._key,
            auth: { checkPermission, userRequired },
            loaders: {
              domainLoaderBySlug: domainLoaderBySlug(query),
              orgLoaderById: orgLoaderById(query, 'en'),
              orgLoaderByDomainId: orgLoaderByDomainId(query, 'en'),
              userLoaderById: userLoaderById(query),
            },
            validators: { cleanseInput, slugify },
          },
        )

        const domainCursor = await query`
          FOR domain IN domains
            RETURN domain
        `
        const domain = await domainCursor.next()

        const expectedResponse = {
          data: {
            createDomain: {
              domain: {
                id: toGlobalId('domains', domain._key),
                domain: 'test.gc.ca',
                slug: 'test-gc-ca',
                lastRan: null,
                selectors: ['selector1._domainkey', 'selector2._domainkey'],
                organization: {
                  id: toGlobalId('organizations', org._key),
                  name: 'Treasury Board of Canada Secretariat',
                },
              },
            },
          },
        }

        expect(response).toEqual(expectedResponse)

        expect(consoleOutput).toEqual([
          `User: ${user._key} successfully created ${domain.slug} in org: treasury-board-secretariat.`,
        ])
      })
    })
    describe('user has user permission level', () => {
      beforeEach(async () => {
        await collections.affiliations.save({
          _from: org._id,
          _to: user._id,
          permission: 'user',
        })
      })
      it('returns the domain', async () => {
        const response = await graphql(
          schema,
          `
            mutation {
              createDomain(
                input: {
                  orgId: "${toGlobalId('organizations', org._key)}"
                  domain: "test.gc.ca"
                  selectors: ["selector1._domainkey", "selector2._domainkey"]
                }
              ) {
                domain {
                  id
                  domain
                  slug
                  lastRan
                  selectors
                  organization {
                    id
                    name
                  }
                }
              }
            }
          `,
          null,
          {
            request: {
              language: 'en',
            },
            query,
            collections,
            transaction,
            userId: user._key,
            auth: { checkPermission, userRequired },
            loaders: {
              domainLoaderBySlug: domainLoaderBySlug(query),
              orgLoaderById: orgLoaderById(query, 'en'),
              orgLoaderByDomainId: orgLoaderByDomainId(query, 'en'),
              userLoaderById: userLoaderById(query),
            },
            validators: { cleanseInput, slugify },
          },
        )

        const domainCursor = await query`
          FOR domain IN domains
            RETURN domain
        `
        const domain = await domainCursor.next()

        const expectedResponse = {
          data: {
            createDomain: {
              domain: {
                id: toGlobalId('domains', domain._key),
                domain: 'test.gc.ca',
                slug: 'test-gc-ca',
                lastRan: null,
                selectors: ['selector1._domainkey', 'selector2._domainkey'],
                organization: {
                  id: toGlobalId('organizations', org._key),
                  name: 'Treasury Board of Canada Secretariat',
                },
              },
            },
          },
        }

        expect(response).toEqual(expectedResponse)

        expect(consoleOutput).toEqual([
          `User: ${user._key} successfully created ${domain.slug} in org: treasury-board-secretariat.`,
        ])
      })
    })
    describe('domain can be created in a different organization', () => {
      let secondOrg
      beforeEach(async () => {
        secondOrg = await collections.organizations.save({
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
        await collections.affiliations.save({
          _from: secondOrg._id,
          _to: user._id,
          permission: 'super_admin',
        })
      })
      describe('selectors are not added', () => {
        beforeEach(async () => {
          const domain = await collections.domains.save({
            domain: 'test.gc.ca',
            slug: 'test-gc-ca',
            selectors: [
              'selector1._domainkey', 
              'selector2._domainkey',
            ],
          })
          await collections.claims.save({
            _from: org._id,
            _to: domain._id,
          })
        })
        it('returns the domain', async () => {
          const response = await graphql(
            schema,
            `
            mutation {
              createDomain(
                input: {
                  orgId: "${toGlobalId('organizations', secondOrg._key)}"
                  domain: "test.gc.ca"
                }
              ) {
                domain {
                  id
                  domain
                  slug
                  lastRan
                  selectors
                  organization {
                    id
                    name
                  }
                }
              }
            }
          `,
            null,
            {
              request: {
                language: 'en',
              },
              query,
              collections,
              transaction,
              userId: user._key,
              auth: { checkPermission, userRequired },
              loaders: {
                domainLoaderBySlug: domainLoaderBySlug(query),
                orgLoaderById: orgLoaderById(query, 'en'),
                orgLoaderByDomainId: orgLoaderByDomainId(query, 'en'),
                userLoaderById: userLoaderById(query),
              },
              validators: { cleanseInput, slugify },
            },
          )

          const domainCursor = await query`
          FOR domain IN domains
            RETURN domain
        `
          const domain = await domainCursor.next()

          const expectedResponse = {
            data: {
              createDomain: {
                domain: {
                  id: toGlobalId('domains', domain._key),
                  domain: 'test.gc.ca',
                  slug: 'test-gc-ca',
                  lastRan: null,
                  selectors: ['selector1._domainkey', 'selector2._domainkey'],
                  organization: {
                    id: toGlobalId('organizations', secondOrg._key),
                    name: 'Communications Security Establishment',
                  },
                },
              },
            },
          }

          expect(response).toEqual(expectedResponse)

          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully created ${domain.slug} in org: communications-security-establishment.`,
          ])
        })
      })
      describe('selectors are the same', () => {
        beforeEach(async () => {
          const domain = await collections.domains.save({
            domain: 'test.gc.ca',
            slug: 'test-gc-ca',
            selectors: [
              'selector1._domainkey', 
              'selector2._domainkey',
            ],
          })
          await collections.claims.save({
            _from: org._id,
            _to: domain._id,
          })
        })
        it('returns the domain', async () => {
          const response = await graphql(
            schema,
            `
            mutation {
              createDomain(
                input: {
                  orgId: "${toGlobalId('organizations', secondOrg._key)}"
                  domain: "test.gc.ca"
                  selectors: ["selector1._domainkey", "selector2._domainkey"]
                }
              ) {
                domain {
                  id
                  domain
                  slug
                  lastRan
                  selectors
                  organization {
                    id
                    name
                  }
                }
              }
            }
          `,
            null,
            {
              request: {
                language: 'en',
              },
              query,
              collections,
              transaction,
              userId: user._key,
              auth: { checkPermission, userRequired },
              loaders: {
                domainLoaderBySlug: domainLoaderBySlug(query),
                orgLoaderById: orgLoaderById(query, 'en'),
                orgLoaderByDomainId: orgLoaderByDomainId(query, 'en'),
                userLoaderById: userLoaderById(query),
              },
              validators: { cleanseInput, slugify },
            },
          )

          const domainCursor = await query`
          FOR domain IN domains
            RETURN domain
        `
          const domain = await domainCursor.next()

          const expectedResponse = {
            data: {
              createDomain: {
                domain: {
                  id: toGlobalId('domains', domain._key),
                  domain: 'test.gc.ca',
                  slug: 'test-gc-ca',
                  lastRan: null,
                  selectors: ['selector1._domainkey', 'selector2._domainkey'],
                  organization: {
                    id: toGlobalId('organizations', secondOrg._key),
                    name: 'Communications Security Establishment',
                  },
                },
              },
            },
          }

          expect(response).toEqual(expectedResponse)

          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully created ${domain.slug} in org: communications-security-establishment.`,
          ])
        })
      })
      describe('new selectors are added', () => {
        beforeEach(async () => {
          const domain = await collections.domains.save({
            domain: 'test.gc.ca',
            slug: 'test-gc-ca',
            selectors: [
              'selector1._domainkey', 
              'selector2._domainkey',
            ],
          })
          await collections.claims.save({
            _from: org._id,
            _to: domain._id,
          })
        })
        it('returns the domain', async () => {
          const response = await graphql(
            schema,
            `
            mutation {
              createDomain(
                input: {
                  orgId: "${toGlobalId('organizations', secondOrg._key)}"
                  domain: "test.gc.ca"
                  selectors: ["selector3._domainkey", "selector4._domainkey"]
                }
              ) {
                domain {
                  id
                  domain
                  slug
                  lastRan
                  selectors
                  organization {
                    id
                    name
                  }
                }
              }
            }
          `,
            null,
            {
              request: {
                language: 'en',
              },
              query,
              collections,
              transaction,
              userId: user._key,
              auth: { checkPermission, userRequired },
              loaders: {
                domainLoaderBySlug: domainLoaderBySlug(query),
                orgLoaderById: orgLoaderById(query, 'en'),
                orgLoaderByDomainId: orgLoaderByDomainId(query, 'en'),
                userLoaderById: userLoaderById(query),
              },
              validators: { cleanseInput, slugify },
            },
          )

          const domainCursor = await query`
          FOR domain IN domains
            RETURN domain
        `
          const domain = await domainCursor.next()

          const expectedResponse = {
            data: {
              createDomain: {
                domain: {
                  id: toGlobalId('domains', domain._key),
                  domain: 'test.gc.ca',
                  slug: 'test-gc-ca',
                  lastRan: null,
                  selectors: [
                    'selector1._domainkey', 
                    'selector2._domainkey',
                    'selector3._domainkey', 
                    'selector4._domainkey',
                  ],
                  organization: {
                    id: toGlobalId('organizations', secondOrg._key),
                    name: 'Communications Security Establishment',
                  },
                },
              },
            },
          }

          expect(response).toEqual(expectedResponse)

          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully created ${domain.slug} in org: communications-security-establishment.`,
          ])
        })
      })
    })
  })
  describe('given an unsuccessful domain creation', () => {
    describe('org does not exist', () => {
      it('returns an error', async () => {
        const response = await graphql(
          schema,
          `
            mutation {
              createDomain(
                input: {
                  orgId: "b3JnYW5pemF0aW9uOjE="
                  domain: "test.gc.ca"
                  selectors: ["selector1._domainkey", "selector2._domainkey"]
                }
              ) {
                domain {
                  id
                  domain
                  slug
                  lastRan
                  selectors
                  organization {
                    id
                    name
                  }
                }
              }
            }
          `,
          null,
          {
            request: {
              language: 'en',
            },
            query,
            collections,
            transaction,
            userId: user._key,
            auth: { checkPermission, userRequired },
            loaders: {
              domainLoaderBySlug: domainLoaderBySlug(query),
              orgLoaderById: orgLoaderById(query, 'en'),
              orgLoaderByDomainId: orgLoaderByDomainId(query, 'en'),
              userLoaderById: userLoaderById(query),
            },
            validators: { cleanseInput, slugify },
          },
        )

        const error = [
          new GraphQLError('Unable to create domain. Please try again.'),
        ]

        expect(response.errors).toEqual(error)
        expect(consoleOutput).toEqual([
          `User: ${user._key} attempted to create a domain to an organization: 1 that does not exist.`,
        ])
      })
    })
    describe('user does not belong to organization', () => {
      it('returns an error', async () => {
        const response = await graphql(
          schema,
          `
            mutation {
              createDomain(
                input: {
                  orgId: "${toGlobalId('organizations', org._key)}"
                  domain: "test.gc.ca"
                  selectors: ["selector1._domainkey", "selector2._domainkey"]
                }
              ) {
                domain {
                  id
                  domain
                  slug
                  lastRan
                  selectors
                  organization {
                    id
                    name
                  }
                }
              }
            }
          `,
          null,
          {
            request: {
              language: 'en',
            },
            query,
            collections,
            transaction,
            userId: user._key,
            auth: { checkPermission, userRequired },
            loaders: {
              domainLoaderBySlug: domainLoaderBySlug(query),
              orgLoaderById: orgLoaderById(query, 'en'),
              orgLoaderByDomainId: orgLoaderByDomainId(query, 'en'),
              userLoaderById: userLoaderById(query),
            },
            validators: { cleanseInput, slugify },
          },
        )

        const error = [
          new GraphQLError('Unable to create domain. Please try again.'),
        ]

        expect(response.errors).toEqual(error)
        expect(consoleOutput).toEqual([
          `User: ${user._key} attempted to create a domain in: treasury-board-secretariat, however they do not have permission to do so.`,
        ])
      })
    })
    describe('the domain already exists in the given organization', () => {
      beforeEach(async () => {
        await collections.affiliations.save({
          _from: org._id,
          _to: user._id,
          permission: 'user',
        })
        const domain = await collections.domains.save({
          domain: 'test.gc.ca',
          slug: 'test-gc-ca',
        })
        await collections.claims.save({
          _from: org._id,
          _to: domain._id,
        })
      })
      it('returns an error', async () => {
        const response = await graphql(
          schema,
          `
            mutation {
              createDomain(
                input: {
                  orgId: "${toGlobalId('organizations', org._key)}"
                  domain: "test.gc.ca"
                  selectors: ["selector1._domainkey", "selector2._domainkey"]
                }
              ) {
                domain {
                  id
                  domain
                  slug
                  lastRan
                  selectors
                  organization {
                    id
                    name
                  }
                }
              }
            }
          `,
          null,
          {
            request: {
              language: 'en',
            },
            query,
            collections,
            transaction,
            userId: user._key,
            auth: { checkPermission, userRequired },
            loaders: {
              domainLoaderBySlug: domainLoaderBySlug(query),
              orgLoaderById: orgLoaderById(query, 'en'),
              orgLoaderByDomainId: orgLoaderByDomainId(query, 'en'),
              userLoaderById: userLoaderById(query),
            },
            validators: { cleanseInput, slugify },
          },
        )

        const error = [
          new GraphQLError('Unable to create domain. Please try again.'),
        ]

        expect(response.errors).toEqual(error)
        expect(consoleOutput).toEqual([
          `User: ${user._key} attempted to create a domain for: treasury-board-secretariat, however that org already has that domain claimed.`,
        ])
      })
    })
    describe('database error occurs', () => {
      describe('when checking to see if org already contains domain', () => {
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'user',
          })
        })
        it('returns an error message', async () => {
          const domainLoader = domainLoaderBySlug(query)
          const orgIdLoader = orgLoaderById(query, 'en')
          const orgDomainIdLoader = orgLoaderByDomainId(query, 'en')
          const userIdLoader = userLoaderById(query)

          query = jest
            .fn()
            .mockReturnValueOnce({
              next() {
                return 'user'
              },
            })
            .mockReturnValueOnce({
              next() {
                return 'user'
              },
            })
            .mockRejectedValue(new Error('Database error occurred.'))

          const response = await graphql(
            schema,
            `
              mutation {
                createDomain(
                  input: {
                    orgId: "${toGlobalId('organizations', org._key)}"
                    domain: "test.gc.ca"
                    selectors: ["selector1._domainkey", "selector2._domainkey"]
                  }
                ) {
                  domain {
                    id
                    domain
                    slug
                    lastRan
                    selectors
                    organization {
                      id
                      name
                    }
                  }
                }
              }
            `,
            null,
            {
              request: {
                language: 'en',
              },
              query,
              collections,
              transaction,
              userId: user._key,
              auth: { checkPermission, userRequired },
              loaders: {
                domainLoaderBySlug: domainLoader,
                orgLoaderById: orgIdLoader,
                orgLoaderByDomainId: orgDomainIdLoader,
                userLoaderById: userIdLoader,
              },
              validators: { cleanseInput, slugify },
            },
          )

          const error = [
            new GraphQLError('Unable to create domain. Please try again.'),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Database error occurred while running check to see if domain already exists in an org: Error: Database error occurred.`,
          ])
        })
      })
      describe('when committing transaction to database', () => {
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'user',
          })
        })
        it('returns an error message', async () => {
          const domainLoader = domainLoaderBySlug(query)
          const orgIdLoader = orgLoaderById(query, 'en')
          const orgDomainIdLoader = orgLoaderByDomainId(query, 'en')
          const userIdLoader = userLoaderById(query)

          transaction = jest.fn().mockReturnValueOnce({
            run() {
              return 'user'
            },
            commit() {
              throw new Error('Database error occurred.')
            },
          })

          const response = await graphql(
            schema,
            `
              mutation {
                createDomain(
                  input: {
                    orgId: "${toGlobalId('organizations', org._key)}"
                    domain: "test.gc.ca"
                    selectors: ["selector1._domainkey", "selector2._domainkey"]
                  }
                ) {
                  domain {
                    id
                    domain
                    slug
                    lastRan
                    selectors
                    organization {
                      id
                      name
                    }
                  }
                }
              }
            `,
            null,
            {
              request: {
                language: 'en',
              },
              query,
              collections,
              transaction,
              userId: user._key,
              auth: { checkPermission, userRequired },
              loaders: {
                domainLoaderBySlug: domainLoader,
                orgLoaderById: orgIdLoader,
                orgLoaderByDomainId: orgDomainIdLoader,
                userLoaderById: userIdLoader,
              },
              validators: { cleanseInput, slugify },
            },
          )

          const error = [
            new GraphQLError('Unable to create domain. Please try again.'),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Database error occurred while committing create domain transaction: Error: Database error occurred.`,
          ])
        })
      })
    })
  })
})
