import { setupI18n } from '@lingui/core'
import { ensure, dbNameFromFile } from 'arango-tools'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { toGlobalId } from 'graphql-relay'

import { databaseOptions } from '../../../../database-options'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { cleanseInput, slugify } from '../../../validators'
import { checkPermission, userRequired, verifiedRequired } from '../../../auth'
import { loadDomainByKey } from '../../loaders'
import { loadOrgByKey } from '../../../organization/loaders'
import { loadUserByKey } from '../../../user/loaders'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('updating a domain', () => {
  let query, drop, truncate, schema, collections, transaction, user

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
    // Generate DB Items
    ;({ query, drop, truncate, collections, transaction } = await ensure({
      type: 'database',
      name: dbNameFromFile(__filename),
      url,
      rootPassword: rootPass,
      options: databaseOptions({ rootPass }),
    }))
  })
  beforeEach(async () => {
    user = await collections.users.save({
      userName: 'test.account@istio.actually.exists',
      emailValidated: true,
    })
    consoleOutput.length = 0
  })
  afterEach(async () => {
    await truncate()
  })
  afterAll(async () => {
    await drop()
  })
  describe('given a successful domain update', () => {
    let org, domain
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
                result {
                  ... on Domain {
                    id
                    domain
                    lastRan
                    selectors
                  }
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
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({}),
              },
              validators: {
                cleanseInput,
                slugify,
              },
              loaders: {
                loadDomainByKey: loadDomainByKey({ query }),
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const expectedResponse = {
            data: {
              updateDomain: {
                result: {
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
                result {
                  ... on Domain {
                    id
                    domain
                    lastRan
                    selectors
                  }
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
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({}),
              },
              validators: {
                cleanseInput,
                slugify,
              },
              loaders: {
                loadDomainByKey: loadDomainByKey({ query }),
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const expectedResponse = {
            data: {
              updateDomain: {
                result: {
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
                result {
                  ... on Domain {
                    id
                    domain
                    lastRan
                    selectors
                  }
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
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({}),
              },
              validators: {
                cleanseInput,
                slugify,
              },
              loaders: {
                loadDomainByKey: loadDomainByKey({ query }),
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const expectedResponse = {
            data: {
              updateDomain: {
                result: {
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
                result {
                  ... on Domain {
                    id
                    domain
                    lastRan
                    selectors
                  }
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
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({}),
              },
              validators: {
                cleanseInput,
                slugify,
              },
              loaders: {
                loadDomainByKey: loadDomainByKey({ query }),
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const expectedResponse = {
            data: {
              updateDomain: {
                result: {
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
                result {
                  ... on Domain {
                    id
                    domain
                    lastRan
                    selectors
                  }
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
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({}),
              },
              validators: {
                cleanseInput,
                slugify,
              },
              loaders: {
                loadDomainByKey: loadDomainByKey({ query }),
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const expectedResponse = {
            data: {
              updateDomain: {
                result: {
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
                result {
                  ... on Domain {
                    id
                    domain
                    lastRan
                    selectors
                  }
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
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({}),
              },
              validators: {
                cleanseInput,
                slugify,
              },
              loaders: {
                loadDomainByKey: loadDomainByKey({ query }),
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const expectedResponse = {
            data: {
              updateDomain: {
                result: {
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
                result {
                  ... on Domain {
                    id
                    domain
                    lastRan
                    selectors
                  }
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
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({}),
              },
              validators: {
                cleanseInput,
                slugify,
              },
              loaders: {
                loadDomainByKey: loadDomainByKey({ query }),
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const expectedResponse = {
            data: {
              updateDomain: {
                result: {
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
                result {
                  ... on Domain {
                    id
                    domain
                    lastRan
                    selectors
                  }
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
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({}),
              },
              validators: {
                cleanseInput,
                slugify,
              },
              loaders: {
                loadDomainByKey: loadDomainByKey({ query }),
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const expectedResponse = {
            data: {
              updateDomain: {
                result: {
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
                result {
                  ... on Domain {
                    id
                    domain
                    lastRan
                    selectors
                  }
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
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({}),
              },
              validators: {
                cleanseInput,
                slugify,
              },
              loaders: {
                loadDomainByKey: loadDomainByKey({ query }),
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const expectedResponse = {
            data: {
              updateDomain: {
                result: {
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
      describe('domain cannot be found', () => {
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
                result {
                  ... on Domain {
                    id
                    domain
                    lastRan
                    selectors
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
              query,
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({}),
              },
              validators: {
                cleanseInput,
                slugify,
              },
              loaders: {
                loadDomainByKey: loadDomainByKey({ query }),
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const error = {
            data: {
              updateDomain: {
                result: {
                  code: 400,
                  description: 'Unable to update unknown domain.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to update domain: 1, however there is no domain associated with that id.`,
          ])
        })
      })
      describe('organization cannot be found', () => {
        let domain
        beforeEach(async () => {
          domain = await collections.domains.save({
            domain: 'test.gc.ca',
            lastRan: null,
            selectors: ['selector1._domainkey', 'selector2._domainkey'],
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
                  orgId: "${toGlobalId('organizations', 1)}"
                  domain: "test.canada.ca"
                  selectors: [
                    "selector3._domainkey",
                    "selector4._domainkey"
                  ]
                }
              ) {
                result {
                  ... on Domain {
                    id
                    domain
                    lastRan
                    selectors
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
              query,
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({}),
              },
              validators: {
                cleanseInput,
                slugify,
              },
              loaders: {
                loadDomainByKey: loadDomainByKey({ query }),
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const error = {
            data: {
              updateDomain: {
                result: {
                  code: 400,
                  description: 'Unable to update domain in an unknown org.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to update domain: ${domain._key} for org: 1, however there is no org associated with that id.`,
          ])
        })
      })
      describe('user does not belong to org', () => {
        let org, domain, secondOrg
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
                  result {
                    ... on Domain {
                      id
                      domain
                      lastRan
                      selectors
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
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                  verifiedRequired: verifiedRequired({}),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  loadDomainByKey: loadDomainByKey({ query }),
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            )

            const error = {
              data: {
                updateDomain: {
                  result: {
                    code: 403,
                    description:
                      'Permission Denied: Please contact organization user for help with updating this domain.',
                  },
                },
              },
            }

            expect(response).toEqual(error)
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
                  result {
                    ... on Domain {
                      id
                      domain
                      lastRan
                      selectors
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
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                  verifiedRequired: verifiedRequired({}),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  loadDomainByKey: loadDomainByKey({ query }),
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            )

            const error = {
              data: {
                updateDomain: {
                  result: {
                    code: 403,
                    description:
                      'Permission Denied: Please contact organization user for help with updating this domain.',
                  },
                },
              },
            }

            expect(response).toEqual(error)
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to update domain: ${domain._key} for org: ${org._key}, however they do not have permission in that org.`,
            ])
          })
        })
      })
      describe('domain and org do not have any edges', () => {
        let org, domain
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
                result {
                  ... on Domain {
                    id
                    domain
                    lastRan
                    selectors
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
              query,
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({}),
              },
              validators: {
                cleanseInput,
                slugify,
              },
              loaders: {
                loadDomainByKey: loadDomainByKey({ query }),
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const error = {
            data: {
              updateDomain: {
                result: {
                  code: 400,
                  description:
                    'Unable to update domain that does not belong to the given organization.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to update domain: ${domain._key} for org: ${org._key}, however that org has no claims to that domain.`,
          ])
        })
      })
    })
    describe('database error occurs', () => {
      let org, domain
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
        await collections.affiliations.save({
          _from: org._id,
          _to: user._id,
          permission: 'admin',
        })
      })
      describe('while checking for edge connections', () => {
        it('returns an error message', async () => {
          const mockedQuery = jest
            .fn()
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
                result {
                  ... on Domain {
                    id
                    domain
                    lastRan
                    selectors
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
              query: mockedQuery,
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
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({}),
              },
              validators: {
                cleanseInput,
                slugify,
              },
              loaders: {
                loadDomainByKey: loadDomainByKey({ query }),
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                loadUserByKey: loadUserByKey({ query }),
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
      let org, domain
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
        await collections.affiliations.save({
          _from: org._id,
          _to: user._id,
          permission: 'admin',
        })
      })
      describe('when running domain upsert', () => {
        it('returns an error message', async () => {
          const mockedTransaction = jest.fn().mockReturnValue({
            step() {
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
                result {
                  ... on Domain {
                    id
                    domain
                    lastRan
                    selectors
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
              query,
              collections,
              transaction: mockedTransaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({}),
              },
              validators: {
                cleanseInput,
                slugify,
              },
              loaders: {
                loadDomainByKey: loadDomainByKey({ query }),
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const error = [
            new GraphQLError('Unable to update domain. Please try again.'),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Transaction step error occurred when user: ${user._key} attempted to update domain: ${domain._key}, error: Error: Transaction error occurred.`,
          ])
        })
      })
      describe('when committing transaction', () => {
        it('returns an error message', async () => {
          const mockedTransaction = jest.fn().mockReturnValue({
            step() {
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
                result {
                  ... on Domain {
                    id
                    domain
                    lastRan
                    selectors
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
              query,
              collections,
              transaction: mockedTransaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({}),
              },
              validators: {
                cleanseInput,
                slugify,
              },
              loaders: {
                loadDomainByKey: loadDomainByKey({ query }),
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                loadUserByKey: loadUserByKey({ query }),
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
      describe('domain cannot be found', () => {
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
                result {
                  ... on Domain {
                    id
                    domain
                    lastRan
                    selectors
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
              query,
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({}),
              },
              validators: {
                cleanseInput,
                slugify,
              },
              loaders: {
                loadDomainByKey: loadDomainByKey({ query }),
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const error = {
            data: {
              updateDomain: {
                result: {
                  code: 400,
                  description: 'todo',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to update domain: 1, however there is no domain associated with that id.`,
          ])
        })
      })
      describe('organization cannot be found', () => {
        let domain
        beforeEach(async () => {
          domain = await collections.domains.save({
            domain: 'test.gc.ca',
            lastRan: null,
            selectors: ['selector1._domainkey', 'selector2._domainkey'],
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
                  orgId: "${toGlobalId('organizations', 1)}"
                  domain: "test.canada.ca"
                  selectors: [
                    "selector3._domainkey",
                    "selector4._domainkey"
                  ]
                }
              ) {
                result {
                  ... on Domain {
                    id
                    domain
                    lastRan
                    selectors
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
              query,
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({}),
              },
              validators: {
                cleanseInput,
                slugify,
              },
              loaders: {
                loadDomainByKey: loadDomainByKey({ query }),
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const error = {
            data: {
              updateDomain: {
                result: {
                  code: 400,
                  description: 'todo',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to update domain: ${domain._key} for org: 1, however there is no org associated with that id.`,
          ])
        })
      })
      describe('user does not belong to org', () => {
        let org, domain, secondOrg
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
                  result {
                    ... on Domain {
                      id
                      domain
                      lastRan
                      selectors
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
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                  verifiedRequired: verifiedRequired({}),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  loadDomainByKey: loadDomainByKey({ query }),
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            )

            const error = {
              data: {
                updateDomain: {
                  result: {
                    code: 403,
                    description: 'todo',
                  },
                },
              },
            }

            expect(response).toEqual(error)
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
                  result {
                    ... on Domain {
                      id
                      domain
                      lastRan
                      selectors
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
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                  verifiedRequired: verifiedRequired({}),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  loadDomainByKey: loadDomainByKey({ query }),
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            )

            const error = {
              data: {
                updateDomain: {
                  result: {
                    code: 403,
                    description: 'todo',
                  },
                },
              },
            }

            expect(response).toEqual(error)
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to update domain: ${domain._key} for org: ${org._key}, however they do not have permission in that org.`,
            ])
          })
        })
      })
      describe('domain and org do not have any edges', () => {
        let org, domain
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
                result {
                  ... on Domain {
                    id
                    domain
                    lastRan
                    selectors
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
              query,
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({}),
              },
              validators: {
                cleanseInput,
                slugify,
              },
              loaders: {
                loadDomainByKey: loadDomainByKey({ query }),
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const error = {
            data: {
              updateDomain: {
                result: {
                  code: 400,
                  description: 'todo',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to update domain: ${domain._key} for org: ${org._key}, however that org has no claims to that domain.`,
          ])
        })
      })
    })
    describe('database error occurs', () => {
      let org, domain
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
        await collections.affiliations.save({
          _from: org._id,
          _to: user._id,
          permission: 'admin',
        })
      })
      describe('while checking for edge connections', () => {
        it('returns an error message', async () => {
          const mockedQuery = jest
            .fn()
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
                result {
                  ... on Domain {
                    id
                    domain
                    lastRan
                    selectors
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
              query: mockedQuery,
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({
                  userKey: user._key,
                  query: query,
                }),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({}),
              },
              validators: {
                cleanseInput,
                slugify,
              },
              loaders: {
                loadDomainByKey: loadDomainByKey({ query }),
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                loadUserByKey: loadUserByKey({ query }),
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
      let org, domain
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
        await collections.affiliations.save({
          _from: org._id,
          _to: user._id,
          permission: 'admin',
        })
      })
      describe('when running domain upsert', () => {
        it('returns an error message', async () => {
          const mockedTransaction = jest.fn().mockReturnValue({
            step() {
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
                result {
                  ... on Domain {
                    id
                    domain
                    lastRan
                    selectors
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
              query,
              collections,
              transaction: mockedTransaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({}),
              },
              validators: {
                cleanseInput,
                slugify,
              },
              loaders: {
                loadDomainByKey: loadDomainByKey({ query }),
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Transaction step error occurred when user: ${user._key} attempted to update domain: ${domain._key}, error: Error: Transaction error occurred.`,
          ])
        })
      })
      describe('when committing transaction', () => {
        it('returns an error message', async () => {
          const mockedTransaction = jest.fn().mockReturnValue({
            step() {
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
                result {
                  ... on Domain {
                    id
                    domain
                    lastRan
                    selectors
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
              query,
              collections,
              transaction: mockedTransaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({}),
              },
              validators: {
                cleanseInput,
                slugify,
              },
              loaders: {
                loadDomainByKey: loadDomainByKey({ query }),
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                loadUserByKey: loadUserByKey({ query }),
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
