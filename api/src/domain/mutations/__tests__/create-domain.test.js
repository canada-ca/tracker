import { ensure, dbNameFromFile } from 'arango-tools'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { toGlobalId } from 'graphql-relay'
import { setupI18n } from '@lingui/core'

import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { cleanseInput, slugify } from '../../../validators'
import {
  checkPermission,
  userRequired,
  checkSuperAdmin,
  saltedHash,
  verifiedRequired,
  tfaRequired,
} from '../../../auth'
import { loadDomainByDomain } from '../../loaders'
import {
  loadOrgByKey,
  loadOrgConnectionsByDomainId,
} from '../../../organization/loaders'
import { loadUserByKey } from '../../../user/loaders'
import dbschema from '../../../../database.json'

const { DB_PASS: rootPass, DB_URL: url, HASHING_SECRET } = process.env

describe('create a domain', () => {
  let query, drop, truncate, schema, collections, transaction, user, org

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
  afterEach(() => {
    consoleOutput.length = 0
  })
  describe('given a successful domain creation', () => {
    beforeAll(async () => {
      ;({ query, drop, truncate, collections, transaction } = await ensure({
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
        userName: 'test.account@istio.actually.exists',
        emailValidated: true,
        tfaSendMethod: 'email',
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
    })
    afterEach(async () => {
      await truncate()
    })
    afterAll(async () => {
      await drop()
    })
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
                    orgId: "${toGlobalId('organization', org._key)}"
                    domain: "test.gc.ca"
                    selectors: ["selector1._domainkey", "selector2._domainkey"]
                  }
                ) {
                  result {
                    ... on Domain {
                      id
                      domain
                      lastRan
                      selectors
                      status {
                        dkim
                        dmarc
                        https
                        spf
                        ssl
                      }
                      organizations(first: 5) {
                        edges {
                          node {
                            id
                            name
                          }
                        }
                      }
                    }
                    ... on DomainError {
                      code
                      description
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
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                saltedHash: saltedHash(HASHING_SECRET),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                checkSuperAdmin: checkSuperAdmin({ userKey: user._key, query }),
                verifiedRequired: verifiedRequired({}),
                tfaRequired: tfaRequired({}),
              },
              loaders: {
                loadDomainByDomain: loadDomainByDomain({ query }),
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                loadOrgConnectionsByDomainId: loadOrgConnectionsByDomainId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  auth: { loginRequiredBool: true },
                }),
                loadUserByKey: loadUserByKey({ query }),
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
                result: {
                  id: toGlobalId('domain', domain._key),
                  domain: 'test.gc.ca',
                  lastRan: null,
                  selectors: ['selector1._domainkey', 'selector2._domainkey'],
                  status: {
                    dkim: null,
                    dmarc: null,
                    https: null,
                    spf: null,
                    ssl: null,
                  },
                  organizations: {
                    edges: [
                      {
                        node: {
                          id: toGlobalId('organization', org._key),
                          name: 'Treasury Board of Canada Secretariat',
                        },
                      },
                    ],
                  },
                },
              },
            },
          }

          expect(response).toEqual(expectedResponse)

          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully created ${domain.domain} in org: treasury-board-secretariat.`,
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
                    orgId: "${toGlobalId('organization', org._key)}"
                    domain: "test.gc.ca"
                    selectors: ["selector1._domainkey", "selector2._domainkey"]
                  }
                ) {
                  result {
                    ... on Domain {
                      id
                      domain
                      lastRan
                      selectors
                      status {
                        dkim
                        dmarc
                        https
                        spf
                        ssl
                      }
                      organizations(first: 5) {
                        edges {
                          node {
                            id
                            name
                          }
                        }
                      }
                    }
                    ... on DomainError {
                      code
                      description
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
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                saltedHash: saltedHash(HASHING_SECRET),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                checkSuperAdmin: checkSuperAdmin({ userKey: user._key, query }),
                verifiedRequired: verifiedRequired({}),
                tfaRequired: tfaRequired({}),
              },
              loaders: {
                loadDomainByDomain: loadDomainByDomain({ query }),
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                loadOrgConnectionsByDomainId: loadOrgConnectionsByDomainId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  auth: { loginRequired: true },
                }),
                loadUserByKey: loadUserByKey({ query }),
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
                result: {
                  id: toGlobalId('domain', domain._key),
                  domain: 'test.gc.ca',
                  lastRan: null,
                  selectors: ['selector1._domainkey', 'selector2._domainkey'],
                  status: {
                    dkim: null,
                    dmarc: null,
                    https: null,
                    spf: null,
                    ssl: null,
                  },
                  organizations: {
                    edges: [
                      {
                        node: {
                          id: toGlobalId('organization', org._key),
                          name: 'Treasury Board of Canada Secretariat',
                        },
                      },
                    ],
                  },
                },
              },
            },
          }

          expect(response).toEqual(expectedResponse)

          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully created ${domain.domain} in org: treasury-board-secretariat.`,
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
                  orgId: "${toGlobalId('organization', org._key)}"
                  domain: "test.gc.ca"
                  selectors: ["selector1._domainkey", "selector2._domainkey"]
                }
              ) {
                result {
                  ... on Domain {
                    id
                    domain
                    lastRan
                    selectors
                    status {
                      dkim
                      dmarc
                      https
                      spf
                      ssl
                    }
                    organizations(first: 5) {
                      edges {
                        node {
                          id
                          name
                        }
                      }
                    }
                  }
                  ... on DomainError {
                    code
                    description
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
            userKey: user._key,
            auth: {
              checkPermission: checkPermission({ userKey: user._key, query }),
              saltedHash: saltedHash(HASHING_SECRET),
              userRequired: userRequired({
                userKey: user._key,
                loadUserByKey: loadUserByKey({ query }),
              }),
              checkSuperAdmin: checkSuperAdmin({ userKey: user._key, query }),
              verifiedRequired: verifiedRequired({}),
              tfaRequired: tfaRequired({}),
            },
            loaders: {
              loadDomainByDomain: loadDomainByDomain({ query }),
              loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
              loadOrgConnectionsByDomainId: loadOrgConnectionsByDomainId({
                query,
                language: 'en',
                userKey: user._key,
                cleanseInput,
                auth: { loginRequired: true },
              }),
              loadUserByKey: loadUserByKey({ query }),
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
              result: {
                id: toGlobalId('domain', domain._key),
                domain: 'test.gc.ca',
                lastRan: null,
                selectors: ['selector1._domainkey', 'selector2._domainkey'],
                status: {
                  dkim: null,
                  dmarc: null,
                  https: null,
                  spf: null,
                  ssl: null,
                },
                organizations: {
                  edges: [
                    {
                      node: {
                        id: toGlobalId('organization', org._key),
                        name: 'Treasury Board of Canada Secretariat',
                      },
                    },
                  ],
                },
              },
            },
          },
        }

        expect(response).toEqual(expectedResponse)

        expect(consoleOutput).toEqual([
          `User: ${user._key} successfully created ${domain.domain} in org: treasury-board-secretariat.`,
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
                  orgId: "${toGlobalId('organization', org._key)}"
                  domain: "test.gc.ca"
                  selectors: ["selector1._domainkey", "selector2._domainkey"]
                }
              ) {
                result {
                  ... on Domain {
                    id
                    domain
                    lastRan
                    selectors
                    status {
                      dkim
                      dmarc
                      https
                      spf
                      ssl
                    }
                    organizations(first: 5) {
                      edges {
                        node {
                          id
                          name
                        }
                      }
                    }
                  }
                  ... on DomainError {
                    code
                    description
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
            userKey: user._key,
            auth: {
              checkPermission: checkPermission({ userKey: user._key, query }),
              saltedHash: saltedHash(HASHING_SECRET),
              userRequired: userRequired({
                userKey: user._key,
                loadUserByKey: loadUserByKey({ query }),
              }),
              checkSuperAdmin: checkSuperAdmin({ userKey: user._key, query }),
              verifiedRequired: verifiedRequired({}),
              tfaRequired: tfaRequired({}),
            },
            loaders: {
              loadDomainByDomain: loadDomainByDomain({ query }),
              loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
              loadOrgConnectionsByDomainId: loadOrgConnectionsByDomainId({
                query,
                language: 'en',
                userKey: user._key,
                cleanseInput,
                auth: { loginRequired: true },
              }),
              loadUserByKey: loadUserByKey({ query }),
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
              result: {
                id: toGlobalId('domain', domain._key),
                domain: 'test.gc.ca',
                lastRan: null,
                selectors: ['selector1._domainkey', 'selector2._domainkey'],
                status: {
                  dkim: null,
                  dmarc: null,
                  https: null,
                  spf: null,
                  ssl: null,
                },
                organizations: {
                  edges: [
                    {
                      node: {
                        id: toGlobalId('organization', org._key),
                        name: 'Treasury Board of Canada Secretariat',
                      },
                    },
                  ],
                },
              },
            },
          },
        }

        expect(response).toEqual(expectedResponse)

        expect(consoleOutput).toEqual([
          `User: ${user._key} successfully created ${domain.domain} in org: treasury-board-secretariat.`,
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
            selectors: ['selector1._domainkey', 'selector2._domainkey'],
            lastRan: null,
            status: {
              dkim: null,
              dmarc: null,
              https: null,
              spf: null,
              ssl: null,
            },
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
                  orgId: "${toGlobalId('organization', secondOrg._key)}"
                  domain: "test.gc.ca"
                }
              ) {
                result {
                  ... on Domain {
                    id
                    domain
                    lastRan
                    selectors
                    status {
                      dkim
                      dmarc
                      https
                      spf
                      ssl
                    }
                    organizations(first: 5) {
                      edges {
                        node {
                          id
                          name
                        }
                      }
                    }
                  }
                  ... on DomainError {
                    code
                    description
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
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                saltedHash: saltedHash(HASHING_SECRET),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                checkSuperAdmin: checkSuperAdmin({ userKey: user._key, query }),
                verifiedRequired: verifiedRequired({}),
                tfaRequired: tfaRequired({}),
              },
              loaders: {
                loadDomainByDomain: loadDomainByDomain({ query }),
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                loadOrgConnectionsByDomainId: loadOrgConnectionsByDomainId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  auth: { loginRequired: true },
                }),
                loadUserByKey: loadUserByKey({ query }),
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
                result: {
                  id: toGlobalId('domain', domain._key),
                  domain: 'test.gc.ca',
                  lastRan: null,
                  selectors: ['selector1._domainkey', 'selector2._domainkey'],
                  status: {
                    dkim: null,
                    dmarc: null,
                    https: null,
                    spf: null,
                    ssl: null,
                  },
                  organizations: {
                    edges: [
                      {
                        node: {
                          id: toGlobalId('organization', org._key),
                          name: 'Treasury Board of Canada Secretariat',
                        },
                      },
                      {
                        node: {
                          id: toGlobalId('organization', secondOrg._key),
                          name: 'Communications Security Establishment',
                        },
                      },
                    ],
                  },
                },
              },
            },
          }

          expect(response).toEqual(expectedResponse)

          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully created ${domain.domain} in org: communications-security-establishment.`,
          ])
        })
      })
      describe('selectors are the same', () => {
        beforeEach(async () => {
          const domain = await collections.domains.save({
            domain: 'test.gc.ca',
            selectors: ['selector1._domainkey', 'selector2._domainkey'],
            lastRan: null,
            status: {
              dkim: null,
              dmarc: null,
              https: null,
              spf: null,
              ssl: null,
            },
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
                  orgId: "${toGlobalId('organization', secondOrg._key)}"
                  domain: "test.gc.ca"
                  selectors: ["selector1._domainkey", "selector2._domainkey"]
                }
              ) {
                result {
                  ... on Domain {
                    id
                    domain
                    lastRan
                    selectors
                    status {
                      dkim
                      dmarc
                      https
                      spf
                      ssl
                    }
                    organizations(first: 5) {
                      edges {
                        node {
                          id
                          name
                        }
                      }
                    }
                  }
                  ... on DomainError {
                    code
                    description
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
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                saltedHash: saltedHash(HASHING_SECRET),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                checkSuperAdmin: checkSuperAdmin({ userKey: user._key, query }),
                verifiedRequired: verifiedRequired({}),
                tfaRequired: tfaRequired({}),
              },
              loaders: {
                loadDomainByDomain: loadDomainByDomain({ query }),
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                loadOrgConnectionsByDomainId: loadOrgConnectionsByDomainId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  auth: { loginRequired: true },
                }),
                loadUserByKey: loadUserByKey({ query }),
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
                result: {
                  id: toGlobalId('domain', domain._key),
                  domain: 'test.gc.ca',
                  lastRan: null,
                  selectors: ['selector1._domainkey', 'selector2._domainkey'],
                  status: {
                    dkim: null,
                    dmarc: null,
                    https: null,
                    spf: null,
                    ssl: null,
                  },
                  organizations: {
                    edges: [
                      {
                        node: {
                          id: toGlobalId('organization', org._key),
                          name: 'Treasury Board of Canada Secretariat',
                        },
                      },
                      {
                        node: {
                          id: toGlobalId('organization', secondOrg._key),
                          name: 'Communications Security Establishment',
                        },
                      },
                    ],
                  },
                },
              },
            },
          }

          expect(response).toEqual(expectedResponse)

          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully created ${domain.domain} in org: communications-security-establishment.`,
          ])
        })
      })
      describe('new selectors are added', () => {
        beforeEach(async () => {
          const domain = await collections.domains.save({
            domain: 'test.gc.ca',
            selectors: ['selector1._domainkey', 'selector2._domainkey'],
            lastRan: null,
            status: {
              dkim: null,
              dmarc: null,
              https: null,
              spf: null,
              ssl: null,
            },
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
                  orgId: "${toGlobalId('organization', secondOrg._key)}"
                  domain: "test.gc.ca"
                  selectors: ["selector3._domainkey", "selector4._domainkey"]
                }
              ) {
                result {
                  ... on Domain {
                    id
                    domain
                    lastRan
                    selectors
                    status {
                      dkim
                      dmarc
                      https
                      spf
                      ssl
                    }
                    organizations(first: 5) {
                      edges {
                        node {
                          id
                          name
                        }
                      }
                    }
                  }
                  ... on DomainError {
                    code
                    description
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
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                saltedHash: saltedHash(HASHING_SECRET),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                checkSuperAdmin: checkSuperAdmin({ userKey: user._key, query }),
                verifiedRequired: verifiedRequired({}),
                tfaRequired: tfaRequired({}),
              },
              loaders: {
                loadDomainByDomain: loadDomainByDomain({ query }),
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                loadOrgConnectionsByDomainId: loadOrgConnectionsByDomainId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  auth: { loginRequired: true },
                }),
                loadUserByKey: loadUserByKey({ query }),
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
                result: {
                  id: toGlobalId('domain', domain._key),
                  domain: 'test.gc.ca',
                  lastRan: null,
                  selectors: [
                    'selector1._domainkey',
                    'selector2._domainkey',
                    'selector3._domainkey',
                    'selector4._domainkey',
                  ],
                  status: {
                    dkim: null,
                    dmarc: null,
                    https: null,
                    spf: null,
                    ssl: null,
                  },
                  organizations: {
                    edges: [
                      {
                        node: {
                          id: toGlobalId('organization', org._key),
                          name: 'Treasury Board of Canada Secretariat',
                        },
                      },
                      {
                        node: {
                          id: toGlobalId('organization', secondOrg._key),
                          name: 'Communications Security Establishment',
                        },
                      },
                    ],
                  },
                },
              },
            },
          }

          expect(response).toEqual(expectedResponse)

          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully created ${domain.domain} in org: communications-security-establishment.`,
          ])
        })
      })
      describe('lastRan is not changed', () => {
        beforeEach(async () => {
          const domain = await collections.domains.save({
            domain: 'test.gc.ca',
            selectors: ['selector1._domainkey', 'selector2._domainkey'],
            lastRan: '2021-01-01 12:00:00.000000',
            status: {
              dkim: null,
              dmarc: null,
              https: null,
              spf: null,
              ssl: null,
            },
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
                  orgId: "${toGlobalId('organization', secondOrg._key)}"
                  domain: "test.gc.ca"
                  selectors: ["selector1._domainkey", "selector2._domainkey"]
                }
              ) {
                result {
                  ... on Domain {
                    id
                    domain
                    lastRan
                    selectors
                    status {
                      dkim
                      dmarc
                      https
                      spf
                      ssl
                    }
                    organizations(first: 5) {
                      edges {
                        node {
                          id
                          name
                        }
                      }
                    }
                  }
                  ... on DomainError {
                    code
                    description
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
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                saltedHash: saltedHash(HASHING_SECRET),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                checkSuperAdmin: checkSuperAdmin({ userKey: user._key, query }),
                verifiedRequired: verifiedRequired({}),
                tfaRequired: tfaRequired({}),
              },
              loaders: {
                loadDomainByDomain: loadDomainByDomain({ query }),
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                loadOrgConnectionsByDomainId: loadOrgConnectionsByDomainId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  auth: { loginRequired: true },
                }),
                loadUserByKey: loadUserByKey({ query }),
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
                result: {
                  id: toGlobalId('domain', domain._key),
                  domain: 'test.gc.ca',
                  lastRan: '2021-01-01 12:00:00.000000',
                  selectors: ['selector1._domainkey', 'selector2._domainkey'],
                  status: {
                    dkim: null,
                    dmarc: null,
                    https: null,
                    spf: null,
                    ssl: null,
                  },
                  organizations: {
                    edges: [
                      {
                        node: {
                          id: toGlobalId('organization', org._key),
                          name: 'Treasury Board of Canada Secretariat',
                        },
                      },
                      {
                        node: {
                          id: toGlobalId('organization', secondOrg._key),
                          name: 'Communications Security Establishment',
                        },
                      },
                    ],
                  },
                },
              },
            },
          }

          expect(response).toEqual(expectedResponse)

          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully created ${domain.domain} in org: communications-security-establishment.`,
          ])
        })
      })
      describe('status do not changed', () => {
        beforeEach(async () => {
          const domain = await collections.domains.save({
            domain: 'test.gc.ca',
            selectors: ['selector1._domainkey', 'selector2._domainkey'],
            lastRan: '',
            status: {
              dkim: 'fail',
              dmarc: 'fail',
              https: 'fail',
              spf: 'fail',
              ssl: 'fail',
            },
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
                  orgId: "${toGlobalId('organization', secondOrg._key)}"
                  domain: "test.gc.ca"
                  selectors: ["selector1._domainkey", "selector2._domainkey"]
                }
              ) {
                result {
                  ... on Domain {
                    id
                    domain
                    lastRan
                    selectors
                    status {
                      dkim
                      dmarc
                      https
                      spf
                      ssl
                    }
                    organizations(first: 5) {
                      edges {
                        node {
                          id
                          name
                        }
                      }
                    }
                  }
                  ... on DomainError {
                    code
                    description
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
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                saltedHash: saltedHash(HASHING_SECRET),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                checkSuperAdmin: checkSuperAdmin({ userKey: user._key, query }),
                verifiedRequired: verifiedRequired({}),
                tfaRequired: tfaRequired({}),
              },
              loaders: {
                loadDomainByDomain: loadDomainByDomain({ query }),
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                loadOrgConnectionsByDomainId: loadOrgConnectionsByDomainId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  auth: { loginRequired: true },
                }),
                loadUserByKey: loadUserByKey({ query }),
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
                result: {
                  id: toGlobalId('domain', domain._key),
                  domain: 'test.gc.ca',
                  lastRan: '',
                  selectors: ['selector1._domainkey', 'selector2._domainkey'],
                  status: {
                    dkim: 'FAIL',
                    dmarc: 'FAIL',
                    https: 'FAIL',
                    spf: 'FAIL',
                    ssl: 'FAIL',
                  },
                  organizations: {
                    edges: [
                      {
                        node: {
                          id: toGlobalId('organization', org._key),
                          name: 'Treasury Board of Canada Secretariat',
                        },
                      },
                      {
                        node: {
                          id: toGlobalId('organization', secondOrg._key),
                          name: 'Communications Security Establishment',
                        },
                      },
                    ],
                  },
                },
              },
            },
          }

          expect(response).toEqual(expectedResponse)

          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully created ${domain.domain} in org: communications-security-establishment.`,
          ])
        })
      })
    })
  })
  describe('given an unsuccessful domain creation', () => {
    let i18n
    describe('request language is english', () => {
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
                  result {
                    ... on Domain {
                      id
                      domain
                      lastRan
                      selectors
                      status {
                        dkim
                        dmarc
                        https
                        spf
                        ssl
                      }
                      organizations(first: 5) {
                        edges {
                          node {
                            id
                            name
                          }
                        }
                      }
                    }
                    ... on DomainError {
                      code
                      description
                    }
                  }
                }
              }
            `,
            null,
            {
              i18n,
              request: {
                language: 'en',
              },
              query,
              collections,
              transaction,
              userKey: 123,
              auth: {
                checkPermission: jest.fn(),
                saltedHash: jest.fn(),
                userRequired: jest.fn(),
                verifiedRequired: jest.fn(),
                tfaRequired: jest.fn(),
              },
              loaders: {
                loadDomainByDomain: {
                  load: jest.fn(),
                },
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue(undefined),
                },
                loadOrgConnectionsByDomainId: jest.fn(),
                loadUserByKey: {
                  load: jest.fn(),
                },
              },
              validators: { cleanseInput, slugify },
            },
          )

          const error = {
            data: {
              createDomain: {
                result: {
                  code: 400,
                  description:
                    'Unable to create domain in unknown organization.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to create a domain to an organization: 1 that does not exist.`,
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
                    orgId: "${toGlobalId('organization', 123)}"
                    domain: "test.gc.ca"
                    selectors: ["selector1._domainkey", "selector2._domainkey"]
                  }
                ) {
                  result {
                    ... on Domain {
                      id
                      domain
                      lastRan
                      selectors
                      status {
                        dkim
                        dmarc
                        https
                        spf
                        ssl
                      }
                      organizations(first: 5) {
                        edges {
                          node {
                            id
                            name
                          }
                        }
                      }
                    }
                    ... on DomainError {
                      code
                      description
                    }
                  }
                }
              }
            `,
            null,
            {
              i18n,
              request: {
                language: 'en',
              },
              query,
              collections,
              transaction,
              userKey: 123,
              auth: {
                checkPermission: jest.fn().mockReturnValue(undefined),
                userRequired: jest.fn(),
                saltedHash: jest.fn(),
                verifiedRequired: jest.fn(),
                tfaRequired: jest.fn(),
              },
              loaders: {
                loadDomainByDomain: {
                  load: jest.fn(),
                },
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({
                    slug: 'treasury-board-secretariat',
                  }),
                },
                loadOrgConnectionsByDomainId: jest.fn(),
                loadUserByKey: {
                  load: jest.fn(),
                },
              },
              validators: { cleanseInput, slugify },
            },
          )

          const error = {
            data: {
              createDomain: {
                result: {
                  code: 400,
                  description:
                    'Permission Denied: Please contact organization user for help with creating domain.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to create a domain in: treasury-board-secretariat, however they do not have permission to do so.`,
          ])
        })
      })
      describe('the domain already exists in the given organization', () => {
        it('returns an error', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                createDomain(
                  input: {
                    orgId: "${toGlobalId('organization', 123)}"
                    domain: "test.gc.ca"
                    selectors: ["selector1._domainkey", "selector2._domainkey"]
                  }
                ) {
                  result {
                    ... on Domain {
                      id
                      domain
                      lastRan
                      selectors
                      status {
                        dkim
                        dmarc
                        https
                        spf
                        ssl
                      }
                      organizations(first: 5) {
                        edges {
                          node {
                            id
                            name
                          }
                        }
                      }
                    }
                    ... on DomainError {
                      code
                      description
                    }
                  }
                }
              }
            `,
            null,
            {
              i18n,
              request: {
                language: 'en',
              },
              query: jest.fn().mockReturnValue({
                next: jest.fn().mockReturnValue({}),
              }),
              collections,
              transaction,
              userKey: 123,
              auth: {
                checkPermission: jest.fn().mockReturnValue('admin'),
                userRequired: jest.fn(),
                saltedHash: jest.fn(),
                verifiedRequired: jest.fn(),
                tfaRequired: jest.fn(),
              },
              loaders: {
                loadDomainByDomain: {
                  load: jest.fn(),
                },
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({
                    slug: 'treasury-board-secretariat',
                  }),
                },
                loadOrgConnectionsByDomainId: jest.fn(),
                loadUserByKey: {
                  load: jest.fn(),
                },
              },
              validators: { cleanseInput, slugify },
            },
          )

          const error = {
            data: {
              createDomain: {
                result: {
                  code: 400,
                  description:
                    'Unable to create domain, organization has already claimed it.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to create a domain for: treasury-board-secretariat, however that org already has that domain claimed.`,
          ])
        })
      })
      describe('database error occurs', () => {
        describe('when checking to see if org already contains domain', () => {
          it('returns an error message', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  createDomain(
                    input: {
                      orgId: "${toGlobalId('organization', 123)}"
                      domain: "test.gc.ca"
                      selectors: ["selector1._domainkey", "selector2._domainkey"]
                    }
                  ) {
                    result {
                      ... on Domain {
                        id
                        domain
                        lastRan
                        selectors
                        status {
                          dkim
                          dmarc
                          https
                          spf
                          ssl
                        }
                        organizations(first: 5) {
                          edges {
                            node {
                              id
                              name
                            }
                          }
                        }
                      }
                      ... on DomainError {
                        code
                        description
                      }
                    }
                  }
                }
              `,
              null,
              {
                i18n,
                request: {
                  language: 'en',
                },
                query: jest
                  .fn()
                  .mockRejectedValue(new Error('Database error occurred.')),
                collections,
                transaction,
                userKey: 123,
                auth: {
                  checkPermission: jest.fn().mockReturnValue('admin'),
                  userRequired: jest.fn(),
                  saltedHash: jest.fn(),
                  verifiedRequired: jest.fn(),
                  tfaRequired: jest.fn(),
                },
                loaders: {
                  loadDomainByDomain: {
                    load: jest.fn(),
                  },
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      slug: 'treasury-board-secretariat',
                    }),
                  },
                  loadOrgConnectionsByDomainId: jest.fn(),
                  loadUserByKey: {
                    load: jest.fn(),
                  },
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
      })
      describe('cursor error occurs', () => {
        describe('when checking to see if org already contains domain', () => {
          it('returns an error message', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  createDomain(
                    input: {
                      orgId: "${toGlobalId('organization', 123)}"
                      domain: "test.gc.ca"
                      selectors: ["selector1._domainkey", "selector2._domainkey"]
                    }
                  ) {
                    result {
                      ... on Domain {
                        id
                        domain
                        lastRan
                        selectors
                        status {
                          dkim
                          dmarc
                          https
                          spf
                          ssl
                        }
                        organizations(first: 5) {
                          edges {
                            node {
                              id
                              name
                            }
                          }
                        }
                      }
                      ... on DomainError {
                        code
                        description
                      }
                    }
                  }
                }
              `,
              null,
              {
                i18n,
                request: {
                  language: 'en',
                },
                query: jest.fn().mockReturnValue({
                  next: jest
                    .fn()
                    .mockRejectedValue(new Error('Cursor error occurred.')),
                }),
                collections,
                transaction,
                userKey: 123,
                auth: {
                  checkPermission: jest.fn().mockReturnValue('admin'),
                  userRequired: jest.fn(),
                  saltedHash: jest.fn(),
                  verifiedRequired: jest.fn(),
                  tfaRequired: jest.fn(),
                },
                loaders: {
                  loadDomainByDomain: {
                    load: jest.fn(),
                  },
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      slug: 'treasury-board-secretariat',
                    }),
                  },
                  loadOrgConnectionsByDomainId: jest.fn(),
                  loadUserByKey: {
                    load: jest.fn(),
                  },
                },
                validators: { cleanseInput, slugify },
              },
            )

            const error = [
              new GraphQLError('Unable to create domain. Please try again.'),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Cursor error occurred while running check to see if domain already exists in an org: Error: Cursor error occurred.`,
            ])
          })
        })
        describe('when gathering inserted domain', () => {
          it('throws an error', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  createDomain(
                    input: {
                      orgId: "${toGlobalId('organization', 123)}"
                      domain: "test.gc.ca"
                      selectors: ["selector1._domainkey", "selector2._domainkey"]
                    }
                  ) {
                    result {
                      ... on Domain {
                        id
                        domain
                        lastRan
                        selectors
                        status {
                          dkim
                          dmarc
                          https
                          spf
                          ssl
                        }
                        organizations(first: 5) {
                          edges {
                            node {
                              id
                              name
                            }
                          }
                        }
                      }
                      ... on DomainError {
                        code
                        description
                      }
                    }
                  }
                }
              `,
              null,
              {
                i18n,
                request: {
                  language: 'en',
                },
                query: jest.fn().mockReturnValue({
                  next: jest.fn().mockReturnValue(undefined),
                }),
                collections,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn().mockReturnValueOnce({
                    next: jest
                      .fn()
                      .mockRejectedValue(new Error('cursor error')),
                  }),
                }),
                userKey: 123,
                auth: {
                  checkPermission: jest.fn().mockReturnValue('admin'),
                  userRequired: jest.fn(),
                  saltedHash: jest.fn(),
                  verifiedRequired: jest.fn(),
                  tfaRequired: jest.fn(),
                },
                loaders: {
                  loadDomainByDomain: {
                    load: jest.fn(),
                  },
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      slug: 'treasury-board-secretariat',
                    }),
                  },
                  loadOrgConnectionsByDomainId: jest.fn(),
                  loadUserByKey: {
                    load: jest.fn(),
                  },
                },
                validators: { cleanseInput, slugify },
              },
            )

            const error = [
              new GraphQLError('Unable to create domain. Please try again.'),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Cursor error occurred for user: 123 after inserting new domain and gathering its domain info: Error: cursor error`,
            ])
          })
        })
      })
      describe('transaction step error occurs', () => {
        describe('when creating a new domain', () => {
          describe('when inserting new domain', () => {
            it('returns an error message', async () => {
              const response = await graphql(
                schema,
                `
                  mutation {
                    createDomain(
                      input: {
                        orgId: "${toGlobalId('organization', 123)}"
                        domain: "test.gc.ca"
                        selectors: ["selector1._domainkey", "selector2._domainkey"]
                      }
                    ) {
                      result {
                        ... on Domain {
                          id
                          domain
                          lastRan
                          selectors
                          status {
                            dkim
                            dmarc
                            https
                            spf
                            ssl
                          }
                          organizations(first: 5) {
                            edges {
                              node {
                                id
                                name
                              }
                            }
                          }
                        }
                        ... on DomainError {
                          code
                          description
                        }
                      }
                    }
                  }
                `,
                null,
                {
                  i18n,
                  request: {
                    language: 'en',
                  },
                  query: jest.fn().mockReturnValue({
                    next: jest.fn().mockReturnValue(undefined),
                  }),
                  collections,
                  transaction: jest.fn().mockReturnValue({
                    step: jest
                      .fn()
                      .mockRejectedValue(new Error('trx step error')),
                  }),
                  userKey: 123,
                  auth: {
                    checkPermission: jest.fn().mockReturnValue('admin'),
                    userRequired: jest.fn(),
                    saltedHash: jest.fn(),
                    verifiedRequired: jest.fn(),
                    tfaRequired: jest.fn(),
                  },
                  loaders: {
                    loadDomainByDomain: {
                      load: jest.fn(),
                    },
                    loadOrgByKey: {
                      load: jest.fn().mockReturnValue({
                        slug: 'treasury-board-secretariat',
                      }),
                    },
                    loadOrgConnectionsByDomainId: jest.fn(),
                    loadUserByKey: {
                      load: jest.fn(),
                    },
                  },
                  validators: { cleanseInput, slugify },
                },
              )

              const error = [
                new GraphQLError('Unable to create domain. Please try again.'),
              ]

              expect(response.errors).toEqual(error)
              expect(consoleOutput).toEqual([
                `Transaction step error occurred for user: 123 when inserting new domain: Error: trx step error`,
              ])
            })
          })
          describe('when inserting new edge', () => {
            it('returns an error message', async () => {
              const response = await graphql(
                schema,
                `
                  mutation {
                    createDomain(
                      input: {
                        orgId: "${toGlobalId('organization', 123)}"
                        domain: "test.gc.ca"
                        selectors: ["selector1._domainkey", "selector2._domainkey"]
                      }
                    ) {
                      result {
                        ... on Domain {
                          id
                          domain
                          lastRan
                          selectors
                          status {
                            dkim
                            dmarc
                            https
                            spf
                            ssl
                          }
                          organizations(first: 5) {
                            edges {
                              node {
                                id
                                name
                              }
                            }
                          }
                        }
                        ... on DomainError {
                          code
                          description
                        }
                      }
                    }
                  }
                `,
                null,
                {
                  i18n,
                  request: {
                    language: 'en',
                  },
                  query: jest.fn().mockReturnValue({
                    next: jest.fn().mockReturnValue(undefined),
                  }),
                  collections,
                  transaction: jest.fn().mockReturnValue({
                    step: jest
                      .fn()
                      .mockReturnValueOnce({
                        next: jest.fn(),
                      })
                      .mockRejectedValue(new Error('trx step error')),
                  }),
                  userKey: 123,
                  auth: {
                    checkPermission: jest.fn().mockReturnValue('admin'),
                    userRequired: jest.fn(),
                    saltedHash: jest.fn(),
                    verifiedRequired: jest.fn(),
                    tfaRequired: jest.fn(),
                  },
                  loaders: {
                    loadDomainByDomain: {
                      load: jest.fn(),
                    },
                    loadOrgByKey: {
                      load: jest.fn().mockReturnValue({
                        slug: 'treasury-board-secretariat',
                      }),
                    },
                    loadOrgConnectionsByDomainId: jest.fn(),
                    loadUserByKey: {
                      load: jest.fn(),
                    },
                  },
                  validators: { cleanseInput, slugify },
                },
              )

              const error = [
                new GraphQLError('Unable to create domain. Please try again.'),
              ]

              expect(response.errors).toEqual(error)
              expect(consoleOutput).toEqual([
                `Transaction step error occurred for user: 123 when inserting new domain edge: Error: trx step error`,
              ])
            })
          })
        })
        describe('when domain already exists', () => {
          describe('when upserting domain', () => {
            it('returns an error message', async () => {
              const response = await graphql(
                schema,
                `
                  mutation {
                    createDomain(
                      input: {
                        orgId: "${toGlobalId('organization', 123)}"
                        domain: "test.gc.ca"
                        selectors: ["selector1._domainkey", "selector2._domainkey"]
                      }
                    ) {
                      result {
                        ... on Domain {
                          id
                          domain
                          lastRan
                          selectors
                          status {
                            dkim
                            dmarc
                            https
                            spf
                            ssl
                          }
                          organizations(first: 5) {
                            edges {
                              node {
                                id
                                name
                              }
                            }
                          }
                        }
                        ... on DomainError {
                          code
                          description
                        }
                      }
                    }
                  }
                `,
                null,
                {
                  i18n,
                  request: {
                    language: 'en',
                  },
                  query: jest.fn().mockReturnValue({
                    next: jest.fn().mockReturnValueOnce(undefined),
                  }),
                  collections,
                  transaction: jest.fn().mockReturnValue({
                    step: jest
                      .fn()
                      .mockRejectedValue(new Error('trx step error')),
                  }),
                  userKey: 123,
                  auth: {
                    checkPermission: jest.fn().mockReturnValue('admin'),
                    userRequired: jest.fn(),
                    saltedHash: jest.fn(),
                    verifiedRequired: jest.fn(),
                    tfaRequired: jest.fn(),
                  },
                  loaders: {
                    loadDomainByDomain: {
                      load: jest.fn().mockReturnValue({
                        domain: 'domain.ca',
                        selectors: [],
                        status: {},
                        lastRan: '',
                      }),
                    },
                    loadOrgByKey: {
                      load: jest.fn().mockReturnValue({
                        slug: 'treasury-board-secretariat',
                      }),
                    },
                    loadOrgConnectionsByDomainId: jest.fn(),
                    loadUserByKey: {
                      load: jest.fn(),
                    },
                  },
                  validators: { cleanseInput, slugify },
                },
              )

              const error = [
                new GraphQLError('Unable to create domain. Please try again.'),
              ]

              expect(response.errors).toEqual(error)
              expect(consoleOutput).toEqual([
                `Transaction step error occurred for user: 123 when inserting domain selectors: Error: trx step error`,
              ])
            })
          })
          describe('when inserting edge to new org', () => {
            it('returns an error message', async () => {
              const response = await graphql(
                schema,
                `
                  mutation {
                    createDomain(
                      input: {
                        orgId: "${toGlobalId('organization', 123)}"
                        domain: "test.gc.ca"
                        selectors: ["selector1._domainkey", "selector2._domainkey"]
                      }
                    ) {
                      result {
                        ... on Domain {
                          id
                          domain
                          lastRan
                          selectors
                          status {
                            dkim
                            dmarc
                            https
                            spf
                            ssl
                          }
                          organizations(first: 5) {
                            edges {
                              node {
                                id
                                name
                              }
                            }
                          }
                        }
                        ... on DomainError {
                          code
                          description
                        }
                      }
                    }
                  }
                `,
                null,
                {
                  i18n,
                  request: {
                    language: 'en',
                  },
                  query: jest.fn().mockReturnValue({
                    next: jest.fn().mockReturnValueOnce(undefined),
                  }),
                  collections,
                  transaction: jest.fn().mockReturnValue({
                    step: jest
                      .fn()
                      .mockReturnValueOnce()
                      .mockRejectedValue(new Error('trx step error')),
                  }),
                  userKey: 123,
                  auth: {
                    checkPermission: jest.fn().mockReturnValue('admin'),
                    userRequired: jest.fn(),
                    saltedHash: jest.fn(),
                    verifiedRequired: jest.fn(),
                    tfaRequired: jest.fn(),
                  },
                  loaders: {
                    loadDomainByDomain: {
                      load: jest.fn().mockReturnValue({
                        domain: 'domain.ca',
                        selectors: [],
                        status: {},
                        lastRan: '',
                      }),
                    },
                    loadOrgByKey: {
                      load: jest.fn().mockReturnValue({
                        slug: 'treasury-board-secretariat',
                      }),
                    },
                    loadOrgConnectionsByDomainId: jest.fn(),
                    loadUserByKey: {
                      load: jest.fn(),
                    },
                  },
                  validators: { cleanseInput, slugify },
                },
              )

              const error = [
                new GraphQLError('Unable to create domain. Please try again.'),
              ]

              expect(response.errors).toEqual(error)
              expect(consoleOutput).toEqual([
                `Transaction step error occurred for user: 123 when inserting domain edge: Error: trx step error`,
              ])
            })
          })
        })
      })
      describe('transaction commit error occurs', () => {
        describe('when committing transaction', () => {
          it('returns an error message', async () => {
            const response = await graphql(
              schema,
              `
                  mutation {
                    createDomain(
                      input: {
                        orgId: "${toGlobalId('organization', 123)}"
                        domain: "test.gc.ca"
                        selectors: ["selector1._domainkey", "selector2._domainkey"]
                      }
                    ) {
                      result {
                        ... on Domain {
                          id
                          domain
                          lastRan
                          selectors
                          status {
                            dkim
                            dmarc
                            https
                            spf
                            ssl
                          }
                          organizations(first: 5) {
                            edges {
                              node {
                                id
                                name
                              }
                            }
                          }
                        }
                        ... on DomainError {
                          code
                          description
                        }
                      }
                    }
                  }
                `,
              null,
              {
                i18n,
                request: {
                  language: 'en',
                },
                query: jest.fn().mockReturnValue({
                  next: jest.fn().mockReturnValueOnce(undefined),
                }),
                collections,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn().mockReturnValue(),
                  commit: jest
                    .fn()
                    .mockRejectedValue(new Error('trx commit error')),
                }),
                userKey: 123,
                auth: {
                  checkPermission: jest.fn().mockReturnValue('admin'),
                  userRequired: jest.fn(),
                  saltedHash: jest.fn(),
                  verifiedRequired: jest.fn(),
                  tfaRequired: jest.fn(),
                },
                loaders: {
                  loadDomainByDomain: {
                    load: jest.fn().mockReturnValue({
                      domain: 'domain.ca',
                      selectors: [],
                      status: {},
                      lastRan: '',
                    }),
                  },
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      slug: 'treasury-board-secretariat',
                    }),
                  },
                  loadOrgConnectionsByDomainId: jest.fn(),
                  loadUserByKey: {
                    load: jest.fn(),
                  },
                },
                validators: { cleanseInput, slugify },
              },
            )

            const error = [
              new GraphQLError('Unable to create domain. Please try again.'),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Transaction commit error occurred while user: 123 was creating domain: Error: trx commit error`,
            ])
          })
        })
      })
    })
    describe('request language is french', () => {
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
                  result {
                    ... on Domain {
                      id
                      domain
                      lastRan
                      selectors
                      status {
                        dkim
                        dmarc
                        https
                        spf
                        ssl
                      }
                      organizations(first: 5) {
                        edges {
                          node {
                            id
                            name
                          }
                        }
                      }
                    }
                    ... on DomainError {
                      code
                      description
                    }
                  }
                }
              }
            `,
            null,
            {
              i18n,
              request: {
                language: 'en',
              },
              query,
              collections,
              transaction,
              userKey: 123,
              auth: {
                checkPermission: jest.fn(),
                userRequired: jest.fn(),
                saltedHash: jest.fn(),
                verifiedRequired: jest.fn(),
                tfaRequired: jest.fn(),
              },
              loaders: {
                loadDomainByDomain: {
                  load: jest.fn(),
                },
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue(undefined),
                },
                loadOrgConnectionsByDomainId: jest.fn(),
                loadUserByKey: {
                  load: jest.fn(),
                },
              },
              validators: { cleanseInput, slugify },
            },
          )

          const error = {
            data: {
              createDomain: {
                result: {
                  code: 400,
                  description:
                    'Impossible de créer un domaine dans une organisation inconnue.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to create a domain to an organization: 1 that does not exist.`,
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
                    orgId: "${toGlobalId('organization', 123)}"
                    domain: "test.gc.ca"
                    selectors: ["selector1._domainkey", "selector2._domainkey"]
                  }
                ) {
                  result {
                    ... on Domain {
                      id
                      domain
                      lastRan
                      selectors
                      status {
                        dkim
                        dmarc
                        https
                        spf
                        ssl
                      }
                      organizations(first: 5) {
                        edges {
                          node {
                            id
                            name
                          }
                        }
                      }
                    }
                    ... on DomainError {
                      code
                      description
                    }
                  }
                }
              }
            `,
            null,
            {
              i18n,
              request: {
                language: 'en',
              },
              query,
              collections,
              transaction,
              userKey: 123,
              auth: {
                checkPermission: jest.fn().mockReturnValue(undefined),
                userRequired: jest.fn(),
                saltedHash: jest.fn(),
                verifiedRequired: jest.fn(),
                tfaRequired: jest.fn(),
              },
              loaders: {
                loadDomainByDomain: {
                  load: jest.fn(),
                },
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({
                    slug: 'treasury-board-secretariat',
                  }),
                },
                loadOrgConnectionsByDomainId: jest.fn(),
                loadUserByKey: {
                  load: jest.fn(),
                },
              },
              validators: { cleanseInput, slugify },
            },
          )

          const error = {
            data: {
              createDomain: {
                result: {
                  code: 400,
                  description:
                    "Permission refusée : Veuillez contacter l'utilisateur de l'organisation pour obtenir de l'aide sur la création du domaine.",
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to create a domain in: treasury-board-secretariat, however they do not have permission to do so.`,
          ])
        })
      })
      describe('the domain already exists in the given organization', () => {
        it('returns an error', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                createDomain(
                  input: {
                    orgId: "${toGlobalId('organization', 123)}"
                    domain: "test.gc.ca"
                    selectors: ["selector1._domainkey", "selector2._domainkey"]
                  }
                ) {
                  result {
                    ... on Domain {
                      id
                      domain
                      lastRan
                      selectors
                      status {
                        dkim
                        dmarc
                        https
                        spf
                        ssl
                      }
                      organizations(first: 5) {
                        edges {
                          node {
                            id
                            name
                          }
                        }
                      }
                    }
                    ... on DomainError {
                      code
                      description
                    }
                  }
                }
              }
            `,
            null,
            {
              i18n,
              request: {
                language: 'en',
              },
              query: jest.fn().mockReturnValue({
                next: jest.fn().mockReturnValue({}),
              }),
              collections,
              transaction,
              userKey: 123,
              auth: {
                checkPermission: jest.fn().mockReturnValue('admin'),
                userRequired: jest.fn(),
                saltedHash: jest.fn(),
                verifiedRequired: jest.fn(),
                tfaRequired: jest.fn(),
              },
              loaders: {
                loadDomainByDomain: {
                  load: jest.fn(),
                },
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({
                    slug: 'treasury-board-secretariat',
                  }),
                },
                loadOrgConnectionsByDomainId: jest.fn(),
                loadUserByKey: {
                  load: jest.fn(),
                },
              },
              validators: { cleanseInput, slugify },
            },
          )

          const error = {
            data: {
              createDomain: {
                result: {
                  code: 400,
                  description:
                    "Impossible de créer le domaine, l'organisation l'a déjà réclamé.",
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to create a domain for: treasury-board-secretariat, however that org already has that domain claimed.`,
          ])
        })
      })
      describe('database error occurs', () => {
        describe('when checking to see if org already contains domain', () => {
          it('returns an error message', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  createDomain(
                    input: {
                      orgId: "${toGlobalId('organization', 123)}"
                      domain: "test.gc.ca"
                      selectors: ["selector1._domainkey", "selector2._domainkey"]
                    }
                  ) {
                    result {
                      ... on Domain {
                        id
                        domain
                        lastRan
                        selectors
                        status {
                          dkim
                          dmarc
                          https
                          spf
                          ssl
                        }
                        organizations(first: 5) {
                          edges {
                            node {
                              id
                              name
                            }
                          }
                        }
                      }
                      ... on DomainError {
                        code
                        description
                      }
                    }
                  }
                }
              `,
              null,
              {
                i18n,
                request: {
                  language: 'en',
                },
                query: jest
                  .fn()
                  .mockRejectedValue(new Error('Database error occurred.')),
                collections,
                transaction,
                userKey: 123,
                auth: {
                  checkPermission: jest.fn().mockReturnValue('admin'),
                  userRequired: jest.fn(),
                  saltedHash: jest.fn(),
                  verifiedRequired: jest.fn(),
                  tfaRequired: jest.fn(),
                },
                loaders: {
                  loadDomainByDomain: {
                    load: jest.fn(),
                  },
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      slug: 'treasury-board-secretariat',
                    }),
                  },
                  loadOrgConnectionsByDomainId: jest.fn(),
                  loadUserByKey: {
                    load: jest.fn(),
                  },
                },
                validators: { cleanseInput, slugify },
              },
            )

            const error = [
              new GraphQLError(
                'Impossible de créer un domaine. Veuillez réessayer.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Database error occurred while running check to see if domain already exists in an org: Error: Database error occurred.`,
            ])
          })
        })
      })
      describe('cursor error occurs', () => {
        describe('when checking to see if org already contains domain', () => {
          it('returns an error message', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  createDomain(
                    input: {
                      orgId: "${toGlobalId('organization', 123)}"
                      domain: "test.gc.ca"
                      selectors: ["selector1._domainkey", "selector2._domainkey"]
                    }
                  ) {
                    result {
                      ... on Domain {
                        id
                        domain
                        lastRan
                        selectors
                        status {
                          dkim
                          dmarc
                          https
                          spf
                          ssl
                        }
                        organizations(first: 5) {
                          edges {
                            node {
                              id
                              name
                            }
                          }
                        }
                      }
                      ... on DomainError {
                        code
                        description
                      }
                    }
                  }
                }
              `,
              null,
              {
                i18n,
                request: {
                  language: 'en',
                },
                query: jest.fn().mockReturnValue({
                  next: jest
                    .fn()
                    .mockRejectedValue(new Error('Cursor error occurred.')),
                }),
                collections,
                transaction,
                userKey: 123,
                auth: {
                  checkPermission: jest.fn().mockReturnValue('admin'),
                  userRequired: jest.fn(),
                  saltedHash: jest.fn(),
                  verifiedRequired: jest.fn(),
                  tfaRequired: jest.fn(),
                },
                loaders: {
                  loadDomainByDomain: {
                    load: jest.fn(),
                  },
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      slug: 'treasury-board-secretariat',
                    }),
                  },
                  loadOrgConnectionsByDomainId: jest.fn(),
                  loadUserByKey: {
                    load: jest.fn(),
                  },
                },
                validators: { cleanseInput, slugify },
              },
            )

            const error = [
              new GraphQLError(
                'Impossible de créer un domaine. Veuillez réessayer.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Cursor error occurred while running check to see if domain already exists in an org: Error: Cursor error occurred.`,
            ])
          })
        })
        describe('when gathering inserted domain', () => {
          it('throws an error', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  createDomain(
                    input: {
                      orgId: "${toGlobalId('organization', 123)}"
                      domain: "test.gc.ca"
                      selectors: ["selector1._domainkey", "selector2._domainkey"]
                    }
                  ) {
                    result {
                      ... on Domain {
                        id
                        domain
                        lastRan
                        selectors
                        status {
                          dkim
                          dmarc
                          https
                          spf
                          ssl
                        }
                        organizations(first: 5) {
                          edges {
                            node {
                              id
                              name
                            }
                          }
                        }
                      }
                      ... on DomainError {
                        code
                        description
                      }
                    }
                  }
                }
              `,
              null,
              {
                i18n,
                request: {
                  language: 'en',
                },
                query: jest.fn().mockReturnValue({
                  next: jest.fn().mockReturnValue(undefined),
                }),
                collections,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn().mockReturnValueOnce({
                    next: jest
                      .fn()
                      .mockRejectedValue(new Error('cursor error')),
                  }),
                }),
                userKey: 123,
                auth: {
                  checkPermission: jest.fn().mockReturnValue('admin'),
                  userRequired: jest.fn(),
                  saltedHash: jest.fn(),
                  verifiedRequired: jest.fn(),
                  tfaRequired: jest.fn(),
                },
                loaders: {
                  loadDomainByDomain: {
                    load: jest.fn(),
                  },
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      slug: 'treasury-board-secretariat',
                    }),
                  },
                  loadOrgConnectionsByDomainId: jest.fn(),
                  loadUserByKey: {
                    load: jest.fn(),
                  },
                },
                validators: { cleanseInput, slugify },
              },
            )

            const error = [
              new GraphQLError(
                'Impossible de créer un domaine. Veuillez réessayer.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Cursor error occurred for user: 123 after inserting new domain and gathering its domain info: Error: cursor error`,
            ])
          })
        })
      })
      describe('transaction step error occurs', () => {
        describe('when creating a new domain', () => {
          describe('when inserting new domain', () => {
            it('returns an error message', async () => {
              const response = await graphql(
                schema,
                `
                  mutation {
                    createDomain(
                      input: {
                        orgId: "${toGlobalId('organization', 123)}"
                        domain: "test.gc.ca"
                        selectors: ["selector1._domainkey", "selector2._domainkey"]
                      }
                    ) {
                      result {
                        ... on Domain {
                          id
                          domain
                          lastRan
                          selectors
                          status {
                            dkim
                            dmarc
                            https
                            spf
                            ssl
                          }
                          organizations(first: 5) {
                            edges {
                              node {
                                id
                                name
                              }
                            }
                          }
                        }
                        ... on DomainError {
                          code
                          description
                        }
                      }
                    }
                  }
                `,
                null,
                {
                  i18n,
                  request: {
                    language: 'en',
                  },
                  query: jest.fn().mockReturnValue({
                    next: jest.fn().mockReturnValue(undefined),
                  }),
                  collections,
                  transaction: jest.fn().mockReturnValue({
                    step: jest
                      .fn()
                      .mockRejectedValue(new Error('trx step error')),
                  }),
                  userKey: 123,
                  auth: {
                    checkPermission: jest.fn().mockReturnValue('admin'),
                    userRequired: jest.fn(),
                    saltedHash: jest.fn(),
                    verifiedRequired: jest.fn(),
                    tfaRequired: jest.fn(),
                  },
                  loaders: {
                    loadDomainByDomain: {
                      load: jest.fn(),
                    },
                    loadOrgByKey: {
                      load: jest.fn().mockReturnValue({
                        slug: 'treasury-board-secretariat',
                      }),
                    },
                    loadOrgConnectionsByDomainId: jest.fn(),
                    loadUserByKey: {
                      load: jest.fn(),
                    },
                  },
                  validators: { cleanseInput, slugify },
                },
              )

              const error = [
                new GraphQLError(
                  'Impossible de créer un domaine. Veuillez réessayer.',
                ),
              ]

              expect(response.errors).toEqual(error)
              expect(consoleOutput).toEqual([
                `Transaction step error occurred for user: 123 when inserting new domain: Error: trx step error`,
              ])
            })
          })
          describe('when inserting new edge', () => {
            it('returns an error message', async () => {
              const response = await graphql(
                schema,
                `
                  mutation {
                    createDomain(
                      input: {
                        orgId: "${toGlobalId('organization', 123)}"
                        domain: "test.gc.ca"
                        selectors: ["selector1._domainkey", "selector2._domainkey"]
                      }
                    ) {
                      result {
                        ... on Domain {
                          id
                          domain
                          lastRan
                          selectors
                          status {
                            dkim
                            dmarc
                            https
                            spf
                            ssl
                          }
                          organizations(first: 5) {
                            edges {
                              node {
                                id
                                name
                              }
                            }
                          }
                        }
                        ... on DomainError {
                          code
                          description
                        }
                      }
                    }
                  }
                `,
                null,
                {
                  i18n,
                  request: {
                    language: 'en',
                  },
                  query: jest.fn().mockReturnValue({
                    next: jest.fn().mockReturnValue(undefined),
                  }),
                  collections,
                  transaction: jest.fn().mockReturnValue({
                    step: jest
                      .fn()
                      .mockReturnValueOnce({
                        next: jest.fn(),
                      })
                      .mockRejectedValue(new Error('trx step error')),
                  }),
                  userKey: 123,
                  auth: {
                    checkPermission: jest.fn().mockReturnValue('admin'),
                    userRequired: jest.fn(),
                    saltedHash: jest.fn(),
                    verifiedRequired: jest.fn(),
                    tfaRequired: jest.fn(),
                  },
                  loaders: {
                    loadDomainByDomain: {
                      load: jest.fn(),
                    },
                    loadOrgByKey: {
                      load: jest.fn().mockReturnValue({
                        slug: 'treasury-board-secretariat',
                      }),
                    },
                    loadOrgConnectionsByDomainId: jest.fn(),
                    loadUserByKey: {
                      load: jest.fn(),
                    },
                  },
                  validators: { cleanseInput, slugify },
                },
              )

              const error = [
                new GraphQLError(
                  'Impossible de créer un domaine. Veuillez réessayer.',
                ),
              ]

              expect(response.errors).toEqual(error)
              expect(consoleOutput).toEqual([
                `Transaction step error occurred for user: 123 when inserting new domain edge: Error: trx step error`,
              ])
            })
          })
        })
        describe('when domain already exists', () => {
          describe('when upserting domain', () => {
            it('returns an error message', async () => {
              const response = await graphql(
                schema,
                `
                  mutation {
                    createDomain(
                      input: {
                        orgId: "${toGlobalId('organization', 123)}"
                        domain: "test.gc.ca"
                        selectors: ["selector1._domainkey", "selector2._domainkey"]
                      }
                    ) {
                      result {
                        ... on Domain {
                          id
                          domain
                          lastRan
                          selectors
                          status {
                            dkim
                            dmarc
                            https
                            spf
                            ssl
                          }
                          organizations(first: 5) {
                            edges {
                              node {
                                id
                                name
                              }
                            }
                          }
                        }
                        ... on DomainError {
                          code
                          description
                        }
                      }
                    }
                  }
                `,
                null,
                {
                  i18n,
                  request: {
                    language: 'en',
                  },
                  query: jest.fn().mockReturnValue({
                    next: jest.fn().mockReturnValueOnce(undefined),
                  }),
                  collections,
                  transaction: jest.fn().mockReturnValue({
                    step: jest
                      .fn()
                      .mockRejectedValue(new Error('trx step error')),
                  }),
                  userKey: 123,
                  auth: {
                    checkPermission: jest.fn().mockReturnValue('admin'),
                    userRequired: jest.fn(),
                    saltedHash: jest.fn(),
                    verifiedRequired: jest.fn(),
                    tfaRequired: jest.fn(),
                  },
                  loaders: {
                    loadDomainByDomain: {
                      load: jest.fn().mockReturnValue({
                        domain: 'domain.ca',
                        selectors: [],
                        status: {},
                        lastRan: '',
                      }),
                    },
                    loadOrgByKey: {
                      load: jest.fn().mockReturnValue({
                        slug: 'treasury-board-secretariat',
                      }),
                    },
                    loadOrgConnectionsByDomainId: jest.fn(),
                    loadUserByKey: {
                      load: jest.fn(),
                    },
                  },
                  validators: { cleanseInput, slugify },
                },
              )

              const error = [
                new GraphQLError(
                  'Impossible de créer un domaine. Veuillez réessayer.',
                ),
              ]

              expect(response.errors).toEqual(error)
              expect(consoleOutput).toEqual([
                `Transaction step error occurred for user: 123 when inserting domain selectors: Error: trx step error`,
              ])
            })
          })
          describe('when inserting edge to new org', () => {
            it('returns an error message', async () => {
              const response = await graphql(
                schema,
                `
                  mutation {
                    createDomain(
                      input: {
                        orgId: "${toGlobalId('organization', 123)}"
                        domain: "test.gc.ca"
                        selectors: ["selector1._domainkey", "selector2._domainkey"]
                      }
                    ) {
                      result {
                        ... on Domain {
                          id
                          domain
                          lastRan
                          selectors
                          status {
                            dkim
                            dmarc
                            https
                            spf
                            ssl
                          }
                          organizations(first: 5) {
                            edges {
                              node {
                                id
                                name
                              }
                            }
                          }
                        }
                        ... on DomainError {
                          code
                          description
                        }
                      }
                    }
                  }
                `,
                null,
                {
                  i18n,
                  request: {
                    language: 'en',
                  },
                  query: jest.fn().mockReturnValue({
                    next: jest.fn().mockReturnValueOnce(undefined),
                  }),
                  collections,
                  transaction: jest.fn().mockReturnValue({
                    step: jest
                      .fn()
                      .mockReturnValueOnce()
                      .mockRejectedValue(new Error('trx step error')),
                  }),
                  userKey: 123,
                  auth: {
                    checkPermission: jest.fn().mockReturnValue('admin'),
                    userRequired: jest.fn(),
                    saltedHash: jest.fn(),
                    verifiedRequired: jest.fn(),
                    tfaRequired: jest.fn(),
                  },
                  loaders: {
                    loadDomainByDomain: {
                      load: jest.fn().mockReturnValue({
                        domain: 'domain.ca',
                        selectors: [],
                        status: {},
                        lastRan: '',
                      }),
                    },
                    loadOrgByKey: {
                      load: jest.fn().mockReturnValue({
                        slug: 'treasury-board-secretariat',
                      }),
                    },
                    loadOrgConnectionsByDomainId: jest.fn(),
                    loadUserByKey: {
                      load: jest.fn(),
                    },
                  },
                  validators: { cleanseInput, slugify },
                },
              )

              const error = [
                new GraphQLError(
                  'Impossible de créer un domaine. Veuillez réessayer.',
                ),
              ]

              expect(response.errors).toEqual(error)
              expect(consoleOutput).toEqual([
                `Transaction step error occurred for user: 123 when inserting domain edge: Error: trx step error`,
              ])
            })
          })
        })
      })
      describe('transaction commit error occurs', () => {
        describe('when committing transaction', () => {
          it('returns an error message', async () => {
            const response = await graphql(
              schema,
              `
                  mutation {
                    createDomain(
                      input: {
                        orgId: "${toGlobalId('organization', 123)}"
                        domain: "test.gc.ca"
                        selectors: ["selector1._domainkey", "selector2._domainkey"]
                      }
                    ) {
                      result {
                        ... on Domain {
                          id
                          domain
                          lastRan
                          selectors
                          status {
                            dkim
                            dmarc
                            https
                            spf
                            ssl
                          }
                          organizations(first: 5) {
                            edges {
                              node {
                                id
                                name
                              }
                            }
                          }
                        }
                        ... on DomainError {
                          code
                          description
                        }
                      }
                    }
                  }
                `,
              null,
              {
                i18n,
                request: {
                  language: 'en',
                },
                query: jest.fn().mockReturnValue({
                  next: jest.fn().mockReturnValueOnce(undefined),
                }),
                collections,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn().mockReturnValue(),
                  commit: jest
                    .fn()
                    .mockRejectedValue(new Error('trx commit error')),
                }),
                userKey: 123,
                auth: {
                  checkPermission: jest.fn().mockReturnValue('admin'),
                  userRequired: jest.fn(),
                  saltedHash: jest.fn(),
                  verifiedRequired: jest.fn(),
                  tfaRequired: jest.fn(),
                },
                loaders: {
                  loadDomainByDomain: {
                    load: jest.fn().mockReturnValue({
                      domain: 'domain.ca',
                      selectors: [],
                      status: {},
                      lastRan: '',
                    }),
                  },
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      slug: 'treasury-board-secretariat',
                    }),
                  },
                  loadOrgConnectionsByDomainId: jest.fn(),
                  loadUserByKey: {
                    load: jest.fn(),
                  },
                },
                validators: { cleanseInput, slugify },
              },
            )

            const error = [
              new GraphQLError(
                'Impossible de créer un domaine. Veuillez réessayer.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Transaction commit error occurred while user: 123 was creating domain: Error: trx commit error`,
            ])
          })
        })
      })
    })
  })
})
