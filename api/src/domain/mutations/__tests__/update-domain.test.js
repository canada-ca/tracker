import { setupI18n } from '@lingui/core'
import { ensure, dbNameFromFile } from 'arango-tools'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { toGlobalId } from 'graphql-relay'

import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { cleanseInput, slugify } from '../../../validators'
import {
  checkPermission,
  userRequired,
  verifiedRequired,
  tfaRequired,
} from '../../../auth'
import { loadDomainByKey } from '../../loaders'
import { loadOrgByKey } from '../../../organization/loaders'
import { loadUserByKey } from '../../../user/loaders'
import dbschema from '../../../../database.json'

const { DB_PASS: rootPass, DB_URL: url } = process.env

const collectionNames = [
  'users',
  'organizations',
  'domains',
  'dkim',
  'dkimResults',
  'dmarc',
  'spf',
  'https',
  'ssl',
  'dkimGuidanceTags',
  'dmarcGuidanceTags',
  'spfGuidanceTags',
  'httpsGuidanceTags',
  'sslGuidanceTags',
  'chartSummaries',
  'dmarcSummaries',
  'aggregateGuidanceTags',
  'scanSummaryCriteria',
  'chartSummaryCriteria',
  'scanSummaries',
  'affiliations',
  'claims',
  'domainsDKIM',
  'dkimToDkimResults',
  'domainsDMARC',
  'domainsSPF',
  'domainsHTTPS',
  'domainsSSL',
  'ownership',
  'domainsToDmarcSummaries',
]

describe('updating a domain', () => {
  let query, drop, truncate, schema, collections, transaction, user

  const consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  const mockedError = (output) => consoleOutput.push(output)
  beforeAll(() => {
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

  describe('given a successful domain update', () => {
    let org, domain
    beforeAll(async () => {
      // Generate DB Items
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
      domain = await collections.domains.save({
        domain: 'test.gc.ca',
        lastRan: null,
        selectors: ['selector1', 'selector2'],
      })
      await collections.claims.save({
        _to: domain._id,
        _from: org._id,
      })
    })
    afterEach(async () => {
      await truncate()
    })
    afterAll(async () => {
      await drop()
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
                  domainId: "${toGlobalId('domain', domain._key)}"
                  orgId: "${toGlobalId('organization', org._key)}"
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
              collections: collectionNames,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({}),
                tfaRequired: tfaRequired({}),
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
                  id: toGlobalId('domain', domain._key),
                  domain: 'test.canada.ca',
                  lastRan: null,
                  selectors: ['selector1', 'selector2'],
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
                  domainId: "${toGlobalId('domain', domain._key)}"
                  orgId: "${toGlobalId('organization', org._key)}"
                  selectors: [
                    "selector3",
                    "selector4"
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
              collections: collectionNames,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({}),
                tfaRequired: tfaRequired({}),
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
                  id: toGlobalId('domain', domain._key),
                  domain: 'test.gc.ca',
                  lastRan: null,
                  selectors: ['selector3', 'selector4'],
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
                  domainId: "${toGlobalId('domain', domain._key)}"
                  orgId: "${toGlobalId('organization', org._key)}"
                  domain: "test.canada.ca"
                  selectors: [
                    "selector3",
                    "selector4"
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
              collections: collectionNames,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({}),
                tfaRequired: tfaRequired({}),
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
                  id: toGlobalId('domain', domain._key),
                  domain: 'test.canada.ca',
                  lastRan: null,
                  selectors: ['selector3', 'selector4'],
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
                  domainId: "${toGlobalId('domain', domain._key)}"
                  orgId: "${toGlobalId('organization', org._key)}"
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
              collections: collectionNames,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({}),
                tfaRequired: tfaRequired({}),
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
                  id: toGlobalId('domain', domain._key),
                  domain: 'test.canada.ca',
                  lastRan: null,
                  selectors: ['selector1', 'selector2'],
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
                  domainId: "${toGlobalId('domain', domain._key)}"
                  orgId: "${toGlobalId('organization', org._key)}"
                  selectors: [
                    "selector3",
                    "selector4"
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
              collections: collectionNames,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({}),
                tfaRequired: tfaRequired({}),
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
                  id: toGlobalId('domain', domain._key),
                  domain: 'test.gc.ca',
                  lastRan: null,
                  selectors: ['selector3', 'selector4'],
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
                  domainId: "${toGlobalId('domain', domain._key)}"
                  orgId: "${toGlobalId('organization', org._key)}"
                  domain: "test.canada.ca"
                  selectors: [
                    "selector3",
                    "selector4"
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
              collections: collectionNames,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({}),
                tfaRequired: tfaRequired({}),
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
                  id: toGlobalId('domain', domain._key),
                  domain: 'test.canada.ca',
                  lastRan: null,
                  selectors: ['selector3', 'selector4'],
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
                  domainId: "${toGlobalId('domain', domain._key)}"
                  orgId: "${toGlobalId('organization', org._key)}"
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
              collections: collectionNames,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({}),
                tfaRequired: tfaRequired({}),
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
                  id: toGlobalId('domain', domain._key),
                  domain: 'test.canada.ca',
                  lastRan: null,
                  selectors: ['selector1', 'selector2'],
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
                  domainId: "${toGlobalId('domain', domain._key)}"
                  orgId: "${toGlobalId('organization', org._key)}"
                  selectors: [
                    "selector3",
                    "selector4"
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
              collections: collectionNames,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({}),
                tfaRequired: tfaRequired({}),
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
                  id: toGlobalId('domain', domain._key),
                  domain: 'test.gc.ca',
                  lastRan: null,
                  selectors: ['selector3', 'selector4'],
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
                  domainId: "${toGlobalId('domain', domain._key)}"
                  orgId: "${toGlobalId('organization', org._key)}"
                  domain: "test.canada.ca"
                  selectors: [
                    "selector3",
                    "selector4"
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
              collections: collectionNames,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({}),
                tfaRequired: tfaRequired({}),
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
                  id: toGlobalId('domain', domain._key),
                  domain: 'test.canada.ca',
                  lastRan: null,
                  selectors: ['selector3', 'selector4'],
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
                  domainId: "${toGlobalId('domain', 1)}"
                  orgId: "${toGlobalId('organization', 1)}"
                  domain: "test.canada.ca"
                  selectors: [
                    "selector3",
                    "selector4"
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
              collections: collectionNames,
              transaction,
              userKey: 123,
              auth: {
                checkPermission: jest.fn(),
                userRequired: jest.fn(),
                verifiedRequired: jest.fn(),
                tfaRequired: jest.fn(),
              },
              validators: {
                cleanseInput,
                slugify,
              },
              loaders: {
                loadDomainByKey: {
                  load: jest.fn(),
                },
                loadOrgByKey: {
                  load: jest.fn(),
                },
                loadUserByKey: { load: jest.fn() },
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
            `User: 123 attempted to update domain: 1, however there is no domain associated with that id.`,
          ])
        })
      })
      describe('organization cannot be found', () => {
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
            mutation {
              updateDomain (
                input: {
                  domainId: "${toGlobalId('domain', 123)}"
                  orgId: "${toGlobalId('organization', 1)}"
                  domain: "test.canada.ca"
                  selectors: [
                    "selector3",
                    "selector4"
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
              collections: collectionNames,
              transaction,
              userKey: 123,
              auth: {
                checkPermission: jest.fn(),
                userRequired: jest.fn(),
                verifiedRequired: jest.fn(),
                tfaRequired: jest.fn(),
              },
              validators: {
                cleanseInput,
                slugify,
              },
              loaders: {
                loadDomainByKey: {
                  load: jest.fn().mockReturnValue({}),
                },
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue(undefined),
                },
                loadUserByKey: { load: jest.fn() },
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
            `User: 123 attempted to update domain: 123 for org: 1, however there is no org associated with that id.`,
          ])
        })
      })
      describe('user does not belong to org', () => {
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                updateDomain (
                  input: {
                    domainId: "${toGlobalId('domain', 123)}"
                    orgId: "${toGlobalId('organization', 123)}"
                    domain: "test.canada.ca"
                    selectors: [
                      "selector3",
                      "selector4"
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
              collections: collectionNames,
              transaction,
              userKey: 123,
              auth: {
                checkPermission: jest.fn().mockReturnValue(undefined),
                userRequired: jest.fn(),
                verifiedRequired: jest.fn(),
                tfaRequired: jest.fn(),
              },
              validators: {
                cleanseInput,
                slugify,
              },
              loaders: {
                loadDomainByKey: {
                  load: jest.fn().mockReturnValue({}),
                },
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({}),
                },
                loadUserByKey: { load: jest.fn() },
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
            `User: 123 attempted to update domain: 123 for org: 123, however they do not have permission in that org.`,
          ])
        })
      })
      describe('domain and org do not have any edges', () => {
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
            mutation {
              updateDomain (
                input: {
                  domainId: "${toGlobalId('domain', 123)}"
                  orgId: "${toGlobalId('organization', 123)}"
                  domain: "test.canada.ca"
                  selectors: [
                    "selector3",
                    "selector4"
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
              query: jest.fn().mockReturnValue({ count: 0 }),
              collections: collectionNames,
              transaction,
              userKey: 123,
              auth: {
                checkPermission: jest.fn().mockReturnValue('admin'),
                userRequired: jest.fn(),
                verifiedRequired: jest.fn(),
                tfaRequired: jest.fn(),
              },
              validators: {
                cleanseInput,
                slugify,
              },
              loaders: {
                loadDomainByKey: {
                  load: jest.fn().mockReturnValue({}),
                },
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({}),
                },
                loadUserByKey: { load: jest.fn() },
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
            `User: 123 attempted to update domain: 123 for org: 123, however that org has no claims to that domain.`,
          ])
        })
      })
      describe('database error occurs', () => {
        describe('while checking for edge connections', () => {
          it('returns an error message', async () => {
            const response = await graphql(
              schema,
              `
              mutation {
                updateDomain (
                  input: {
                    domainId: "${toGlobalId('domain', 123)}"
                    orgId: "${toGlobalId('organization', 123)}"
                    domain: "test.canada.ca"
                    selectors: [
                      "selector3",
                      "selector4"
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
                query: jest.fn().mockRejectedValue(new Error('database error')),
                collections: collectionNames,
                transaction,
                userKey: 123,
                auth: {
                  checkPermission: jest.fn().mockReturnValue('admin'),
                  userRequired: jest.fn(),
                  verifiedRequired: jest.fn(),
                  tfaRequired: jest.fn(),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  loadDomainByKey: {
                    load: jest.fn().mockReturnValue({}),
                  },
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({}),
                  },
                  loadUserByKey: { load: jest.fn() },
                },
              },
            )

            const error = [
              new GraphQLError('Unable to update domain. Please try again.'),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Database error occurred while user: 123 attempted to update domain: 123, error: Error: database error`,
            ])
          })
        })
      })
      describe('transaction step error occurs', () => {
        describe('when running domain upsert', () => {
          it('returns an error message', async () => {
            const response = await graphql(
              schema,
              `
              mutation {
                updateDomain (
                  input: {
                    domainId: "${toGlobalId('domain', 123)}"
                    orgId: "${toGlobalId('organization', 123)}"
                    domain: "test.canada.ca"
                    selectors: [
                      "selector3",
                      "selector4"
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
                query: jest.fn().mockReturnValue({ count: 1 }),
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest
                    .fn()
                    .mockRejectedValue(new Error('trx step error')),
                }),
                userKey: 123,
                auth: {
                  checkPermission: jest.fn().mockReturnValue('admin'),
                  userRequired: jest.fn(),
                  verifiedRequired: jest.fn(),
                  tfaRequired: jest.fn(),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  loadDomainByKey: {
                    load: jest.fn().mockReturnValue({}),
                  },
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({}),
                  },
                  loadUserByKey: { load: jest.fn() },
                },
              },
            )

            const error = [
              new GraphQLError('Unable to update domain. Please try again.'),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Transaction step error occurred when user: 123 attempted to update domain: 123, error: Error: trx step error`,
            ])
          })
        })
      })
      describe('transaction commit error occurs', () => {
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                updateDomain (
                  input: {
                    domainId: "${toGlobalId('domain', 123)}"
                    orgId: "${toGlobalId('organization', 123)}"
                    domain: "test.canada.ca"
                    selectors: [
                      "selector3",
                      "selector4"
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
              query: jest.fn().mockReturnValue({ count: 1 }),
              collections: collectionNames,
              transaction: jest.fn().mockReturnValue({
                step: jest.fn(),
                commit: jest
                  .fn()
                  .mockRejectedValue(new Error('trx commit error')),
              }),
              userKey: 123,
              auth: {
                checkPermission: jest.fn().mockReturnValue('admin'),
                userRequired: jest.fn(),
                verifiedRequired: jest.fn(),
                tfaRequired: jest.fn(),
              },
              validators: {
                cleanseInput,
                slugify,
              },
              loaders: {
                loadDomainByKey: {
                  load: jest.fn().mockReturnValue({}),
                },
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({}),
                },
                loadUserByKey: { load: jest.fn() },
              },
            },
          )

          const error = [
            new GraphQLError('Unable to update domain. Please try again.'),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Transaction commit error occurred when user: 123 attempted to update domain: 123, error: Error: trx commit error`,
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
                  domainId: "${toGlobalId('domain', 1)}"
                  orgId: "${toGlobalId('organization', 1)}"
                  domain: "test.canada.ca"
                  selectors: [
                    "selector3",
                    "selector4"
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
              collections: collectionNames,
              transaction,
              userKey: 123,
              auth: {
                checkPermission: jest.fn(),
                userRequired: jest.fn(),
                verifiedRequired: jest.fn(),
                tfaRequired: jest.fn(),
              },
              validators: {
                cleanseInput,
                slugify,
              },
              loaders: {
                loadDomainByKey: {
                  load: jest.fn(),
                },
                loadOrgByKey: {
                  load: jest.fn(),
                },
                loadUserByKey: { load: jest.fn() },
              },
            },
          )

          const error = {
            data: {
              updateDomain: {
                result: {
                  code: 400,
                  description:
                    'Impossible de mettre à jour un domaine inconnu.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to update domain: 1, however there is no domain associated with that id.`,
          ])
        })
      })
      describe('organization cannot be found', () => {
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
            mutation {
              updateDomain (
                input: {
                  domainId: "${toGlobalId('domain', 123)}"
                  orgId: "${toGlobalId('organization', 1)}"
                  domain: "test.canada.ca"
                  selectors: [
                    "selector3",
                    "selector4"
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
              collections: collectionNames,
              transaction,
              userKey: 123,
              auth: {
                checkPermission: jest.fn(),
                userRequired: jest.fn(),
                verifiedRequired: jest.fn(),
                tfaRequired: jest.fn(),
              },
              validators: {
                cleanseInput,
                slugify,
              },
              loaders: {
                loadDomainByKey: {
                  load: jest.fn().mockReturnValue({}),
                },
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue(undefined),
                },
                loadUserByKey: { load: jest.fn() },
              },
            },
          )

          const error = {
            data: {
              updateDomain: {
                result: {
                  code: 400,
                  description:
                    'Impossible de mettre à jour le domaine dans un org inconnu.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to update domain: 123 for org: 1, however there is no org associated with that id.`,
          ])
        })
      })
      describe('user does not belong to org', () => {
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                updateDomain (
                  input: {
                    domainId: "${toGlobalId('domain', 123)}"
                    orgId: "${toGlobalId('organization', 123)}"
                    domain: "test.canada.ca"
                    selectors: [
                      "selector3",
                      "selector4"
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
              collections: collectionNames,
              transaction,
              userKey: 123,
              auth: {
                checkPermission: jest.fn().mockReturnValue(undefined),
                userRequired: jest.fn(),
                verifiedRequired: jest.fn(),
                tfaRequired: jest.fn(),
              },
              validators: {
                cleanseInput,
                slugify,
              },
              loaders: {
                loadDomainByKey: {
                  load: jest.fn().mockReturnValue({}),
                },
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({}),
                },
                loadUserByKey: { load: jest.fn() },
              },
            },
          )

          const error = {
            data: {
              updateDomain: {
                result: {
                  code: 403,
                  description:
                    "Autorisation refusée : Veuillez contacter l'utilisateur de l'organisation pour obtenir de l'aide sur la mise à jour de ce domaine.",
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to update domain: 123 for org: 123, however they do not have permission in that org.`,
          ])
        })
      })
      describe('domain and org do not have any edges', () => {
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
            mutation {
              updateDomain (
                input: {
                  domainId: "${toGlobalId('domain', 123)}"
                  orgId: "${toGlobalId('organization', 123)}"
                  domain: "test.canada.ca"
                  selectors: [
                    "selector3",
                    "selector4"
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
              query: jest.fn().mockReturnValue({ count: 0 }),
              collections: collectionNames,
              transaction,
              userKey: 123,
              auth: {
                checkPermission: jest.fn().mockReturnValue('admin'),
                userRequired: jest.fn(),
                verifiedRequired: jest.fn(),
                tfaRequired: jest.fn(),
              },
              validators: {
                cleanseInput,
                slugify,
              },
              loaders: {
                loadDomainByKey: {
                  load: jest.fn().mockReturnValue({}),
                },
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({}),
                },
                loadUserByKey: { load: jest.fn() },
              },
            },
          )

          const error = {
            data: {
              updateDomain: {
                result: {
                  code: 400,
                  description:
                    "Impossible de mettre à jour un domaine qui n'appartient pas à l'organisation donnée.",
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to update domain: 123 for org: 123, however that org has no claims to that domain.`,
          ])
        })
      })
      describe('database error occurs', () => {
        describe('while checking for edge connections', () => {
          it('returns an error message', async () => {
            const response = await graphql(
              schema,
              `
              mutation {
                updateDomain (
                  input: {
                    domainId: "${toGlobalId('domain', 123)}"
                    orgId: "${toGlobalId('organization', 123)}"
                    domain: "test.canada.ca"
                    selectors: [
                      "selector3",
                      "selector4"
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
                query: jest.fn().mockRejectedValue(new Error('database error')),
                collections: collectionNames,
                transaction,
                userKey: 123,
                auth: {
                  checkPermission: jest.fn().mockReturnValue('admin'),
                  userRequired: jest.fn(),
                  verifiedRequired: jest.fn(),
                  tfaRequired: jest.fn(),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  loadDomainByKey: {
                    load: jest.fn().mockReturnValue({}),
                  },
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({}),
                  },
                  loadUserByKey: { load: jest.fn() },
                },
              },
            )

            const error = [
              new GraphQLError(
                'Impossible de mettre à jour le domaine. Veuillez réessayer.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Database error occurred while user: 123 attempted to update domain: 123, error: Error: database error`,
            ])
          })
        })
      })
      describe('transaction step error occurs', () => {
        describe('when running domain upsert', () => {
          it('returns an error message', async () => {
            const response = await graphql(
              schema,
              `
              mutation {
                updateDomain (
                  input: {
                    domainId: "${toGlobalId('domain', 123)}"
                    orgId: "${toGlobalId('organization', 123)}"
                    domain: "test.canada.ca"
                    selectors: [
                      "selector3",
                      "selector4"
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
                query: jest.fn().mockReturnValue({ count: 1 }),
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest
                    .fn()
                    .mockRejectedValue(new Error('trx step error')),
                }),
                userKey: 123,
                auth: {
                  checkPermission: jest.fn().mockReturnValue('admin'),
                  userRequired: jest.fn(),
                  verifiedRequired: jest.fn(),
                  tfaRequired: jest.fn(),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
                loaders: {
                  loadDomainByKey: {
                    load: jest.fn().mockReturnValue({}),
                  },
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({}),
                  },
                  loadUserByKey: { load: jest.fn() },
                },
              },
            )

            const error = [
              new GraphQLError(
                'Impossible de mettre à jour le domaine. Veuillez réessayer.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Transaction step error occurred when user: 123 attempted to update domain: 123, error: Error: trx step error`,
            ])
          })
        })
      })
      describe('transaction commit error occurs', () => {
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                updateDomain (
                  input: {
                    domainId: "${toGlobalId('domain', 123)}"
                    orgId: "${toGlobalId('organization', 123)}"
                    domain: "test.canada.ca"
                    selectors: [
                      "selector3",
                      "selector4"
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
              query: jest.fn().mockReturnValue({ count: 1 }),
              collections: collectionNames,
              transaction: jest.fn().mockReturnValue({
                step: jest.fn(),
                commit: jest
                  .fn()
                  .mockRejectedValue(new Error('trx commit error')),
              }),
              userKey: 123,
              auth: {
                checkPermission: jest.fn().mockReturnValue('admin'),
                userRequired: jest.fn(),
                verifiedRequired: jest.fn(),
                tfaRequired: jest.fn(),
              },
              validators: {
                cleanseInput,
                slugify,
              },
              loaders: {
                loadDomainByKey: {
                  load: jest.fn().mockReturnValue({}),
                },
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({}),
                },
                loadUserByKey: { load: jest.fn() },
              },
            },
          )

          const error = [
            new GraphQLError(
              'Impossible de mettre à jour le domaine. Veuillez réessayer.',
            ),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Transaction commit error occurred when user: 123 attempted to update domain: 123, error: Error: trx commit error`,
          ])
        })
      })
    })
  })
})
