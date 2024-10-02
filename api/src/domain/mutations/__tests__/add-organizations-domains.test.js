import { dbNameFromFile } from 'arango-tools'
import { ensureDatabase as ensure } from '../../../testUtilities'
import { graphql, GraphQLSchema } from 'graphql'
import { toGlobalId } from 'graphql-relay'
import { setupI18n } from '@lingui/core'
import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'

import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { cleanseInput } from '../../../validators'
import { checkPermission, userRequired, saltedHash, verifiedRequired, tfaRequired } from '../../../auth'
import { loadDomainByDomain } from '../../loaders'
import { loadOrgByKey } from '../../../organization/loaders'
import { loadUserByKey } from '../../../user/loaders'
import dbschema from '../../../../database.json'
import { collectionNames } from '../../../collection-names'

const { DB_PASS: rootPass, DB_URL: url, HASHING_SECRET } = process.env

describe('given the addOrganizationsDomains mutation', () => {
  let query, drop, i18n, truncate, schema, collections, transaction, user, org

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
  describe('given a successful bulk domain creation', () => {
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
      beforeEach(async () => {
        await collections.affiliations.save({
          _from: org._id,
          _to: user._id,
          permission: 'super_admin',
        })
      })
      it('creates domains', async () => {
        const response = await graphql({
          schema,
          source: `
            mutation {
              addOrganizationsDomains(
                input: {
                  orgId: "${toGlobalId('organizations', org._key)}"
                  domains: ["test.domain.gov", "test.domain2.gov"]
                  tagNewDomains: false
                  tagStagingDomains: false
                  audit: false
                }
              ) {
                result {
                  ... on DomainBulkResult {
                    status
                  }
                  ... on DomainError {
                    code
                    description
                  }
                }
              }
            }
        `,
          rootValue: null,
          contextValue: {
            request: {
              language: 'en',
            },
            i18n,
            query,
            collections: collectionNames,
            transaction,
            userKey: user._key,
            auth: {
              checkPermission: checkPermission({ userKey: user._key, query }),
              saltedHash: saltedHash(HASHING_SECRET),
              userRequired: userRequired({
                userKey: user._key,
                loadUserByKey: loadUserByKey({ query }),
              }),
              verifiedRequired: verifiedRequired({}),
              tfaRequired: tfaRequired({}),
            },
            loaders: {
              loadDomainByDomain: loadDomainByDomain({ query }),
              loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
            },
            validators: { cleanseInput },
          },
        })
        const expectedResponse = {
          data: {
            addOrganizationsDomains: {
              result: {
                status: `Successfully added 2 domain(s) to treasury-board-secretariat.`,
              },
            },
          },
        }
        expect(response).toEqual(expectedResponse)

        expect(consoleOutput).toEqual([
          `User: ${user._key} successfully added 2 domain(s) to org: treasury-board-secretariat.`,
        ])
      })
      describe('audit flag is true', () => {
        it('creates additional logs for each domain added', async () => {
          const response = await graphql({
            schema,
            source: `
            mutation {
              addOrganizationsDomains(
                input: {
                  orgId: "${toGlobalId('organizations', org._key)}"
                  domains: ["test.domain.gov", "test.domain2.gov"]
                  tagNewDomains: false
                  tagStagingDomains: false
                  audit: true
                }
              ) {
                result {
                  ... on DomainBulkResult {
                    status
                  }
                  ... on DomainError {
                    code
                    description
                  }
                }
              }
            }
        `,
            rootValue: null,
            contextValue: {
              request: {
                language: 'en',
              },
              i18n,
              query,
              collections: collectionNames,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                saltedHash: saltedHash(HASHING_SECRET),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({}),
                tfaRequired: tfaRequired({}),
              },
              loaders: {
                loadDomainByDomain: loadDomainByDomain({ query }),
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
              },
              validators: { cleanseInput },
            },
          })
          const expectedResponse = {
            data: {
              addOrganizationsDomains: {
                result: {
                  status: `Successfully added 2 domain(s) to treasury-board-secretariat.`,
                },
              },
            },
          }
          expect(response).toEqual(expectedResponse)

          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully added domain: test.domain.gov to org: treasury-board-secretariat.`,
            `User: ${user._key} successfully added domain: test.domain2.gov to org: treasury-board-secretariat.`,
          ])
        })
      })
    })
  })

  describe('given an unsuccessful bulk domain creation', () => {
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
    describe('user does not have permission to add domains', () => {
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
      beforeEach(async () => {
        await collections.affiliations.save({
          _from: org._id,
          _to: user._id,
          permission: 'user',
        })
      })
      it('returns an error message', async () => {
        const response = await graphql({
          schema,
          source: `
            mutation {
              addOrganizationsDomains(
                input: {
                  orgId: "${toGlobalId('organizations', org._key)}"
                  domains: ["test.domain.gov", "test.domain2.gov"]
                  tagNewDomains: false
                  tagStagingDomains: false
                  audit: false
                }
              ) {
                result {
                  ... on DomainBulkResult {
                    status
                  }
                  ... on DomainError {
                    code
                    description
                  }
                }
              }
            }
        `,
          rootValue: null,
          contextValue: {
            request: {
              language: 'en',
            },
            i18n,
            query,
            collections: collectionNames,
            transaction,
            userKey: user._key,
            auth: {
              checkPermission: checkPermission({ userKey: user._key, query }),
              saltedHash: saltedHash(HASHING_SECRET),
              userRequired: userRequired({
                userKey: user._key,
                loadUserByKey: loadUserByKey({ query }),
              }),
              verifiedRequired: verifiedRequired({}),
              tfaRequired: tfaRequired({}),
            },
            loaders: {
              loadDomainByDomain: loadDomainByDomain({ query }),
              loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
            },
            validators: { cleanseInput },
          },
        })
        const expectedResponse = {
          data: {
            addOrganizationsDomains: {
              result: {
                code: 400,
                description: `Permission Denied: Please contact organization user for help with creating domains.`,
              },
            },
          },
        }
        expect(response).toEqual(expectedResponse)
      })
    })
  })
})
