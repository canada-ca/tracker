import { ensure, dbNameFromFile } from 'arango-tools'
import { graphql, GraphQLSchema } from 'graphql'
import { toGlobalId } from 'graphql-relay'
import { setupI18n } from '@lingui/core'
import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'

import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { cleanseInput } from '../../../validators'
import {
  checkPermission,
  userRequired,
  verifiedRequired,
  tfaRequired,
} from '../../../auth'
import { loadDomainByDomain } from '../../loaders'
import { loadOrgByKey } from '../../../organization/loaders'
import { loadUserByKey } from '../../../user/loaders'
import dbschema from '../../../../database.json'
import { collectionNames } from '../../../collection-names'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the addOrganizationsDomains mutation', () => {
  let query,
    drop,
    i18n,
    truncate,
    schema,
    collections,
    transaction,
    user,
    org,
    domain,
    domain2,
    org2

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
  describe('given a successful bulk domain removal', () => {
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
      org2 = await collections.organizations.save({
        orgDetails: {
          en: {
            slug: 'test-org',
            acronym: 'TO',
            name: 'Test Org',
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
        domain = await collections.domains.save({
          domain: 'test.gc.ca',
          slug: 'test-gc-ca',
          archived: false,
        })
        await collections.claims.save({
          _from: org._id,
          _to: domain._id,
        })
        const dkim = await collections.dkim.save({ dkim: true })
        await collections.domainsDKIM.save({
          _from: domain._id,
          _to: dkim._id,
        })
        const dkimResult = await collections.dkimResults.save({
          dkimResult: true,
        })
        await collections.dkimToDkimResults.save({
          _from: dkim._id,
          _to: dkimResult._id,
        })
        const dmarc = await collections.dmarc.save({ dmarc: true })
        await collections.domainsDMARC.save({
          _from: domain._id,
          _to: dmarc._id,
        })
        const spf = await collections.spf.save({ spf: true })
        await collections.domainsSPF.save({
          _from: domain._id,
          _to: spf._id,
        })
        const https = await collections.https.save({ https: true })
        await collections.domainsHTTPS.save({
          _from: domain._id,
          _to: https._id,
        })
        const ssl = await collections.ssl.save({ ssl: true })
        await collections.domainsSSL.save({
          _from: domain._id,
          _to: ssl._id,
        })
        const dmarcSummary = await collections.dmarcSummaries.save({
          dmarcSummary: true,
        })
        await collections.domainsToDmarcSummaries.save({
          _from: domain._id,
          _to: dmarcSummary._id,
        })

        domain2 = await collections.domains.save({
          domain: 'test2.gc.ca',
          slug: 'test2-gc-ca',
          archived: false,
        })
        await collections.claims.save({
          _from: org._id,
          _to: domain2._id,
        })
        await collections.claims.save({
          _from: org2._id,
          _to: domain2._id,
        })

        await collections.affiliations.save({
          _from: org._id,
          _to: user._id,
          permission: 'super_admin',
        })
      })
      it('removes domains', async () => {
        const response = await graphql(
          schema,
          `
              mutation {
                removeOrganizationsDomains(
                  input: {
                    orgId: "${toGlobalId('organization', org._key)}"
                    domains: ["test.gc.ca", "test2.gc.ca"]
                    archiveDomains: false
                    audit: false
                  }
                ) {
                  result {
                    ... on DomainResult {
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
          null,
          {
            request: {
              language: 'en',
            },
            i18n,
            query,
            collections: collectionNames,
            transaction,
            userKey: user._key,
            publish: jest.fn(),
            auth: {
              checkPermission: checkPermission({ userKey: user._key, query }),
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
        )
        const expectedResponse = {
          data: {
            removeOrganizationsDomains: {
              result: {
                status: `Successfully removed 2 domain(s) from treasury-board-secretariat.`,
              },
            },
          },
        }
        expect(response).toEqual(expectedResponse)

        expect(consoleOutput).toEqual([
          `User: ${user._key} successfully removed 2 domain(s) from org: treasury-board-secretariat.`,
        ])
      })
      it(`"audit" flag is true`, async () => {
        const response = await graphql(
          schema,
          `
              mutation {
                removeOrganizationsDomains(
                  input: {
                    orgId: "${toGlobalId('organization', org._key)}"
                    domains: ["test.gc.ca", "test2.gc.ca"]
                    archiveDomains: false
                    audit: true
                  }
                ) {
                  result {
                    ... on DomainResult {
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
          null,
          {
            request: {
              language: 'en',
            },
            i18n,
            query,
            collections: collectionNames,
            transaction,
            userKey: user._key,
            publish: jest.fn(),
            auth: {
              checkPermission: checkPermission({ userKey: user._key, query }),
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
        )
        const expectedResponse = {
          data: {
            removeOrganizationsDomains: {
              result: {
                status: `Successfully removed 2 domain(s) from treasury-board-secretariat.`,
              },
            },
          },
        }
        expect(response).toEqual(expectedResponse)

        expect(consoleOutput).toEqual([
          `User: ${user._key} successfully removed domain: test.gc.ca from org: treasury-board-secretariat.`,
          `User: ${user._key} successfully removed domain: test2.gc.ca from org: treasury-board-secretariat.`,
        ])
      })
      it(`"archive" flag is true`, async () => {
        const response = await graphql(
          schema,
          `
              mutation {
                removeOrganizationsDomains(
                  input: {
                    orgId: "${toGlobalId('organization', org._key)}"
                    domains: ["test.gc.ca", "test2.gc.ca"]
                    archiveDomains: true
                    audit: false
                  }
                ) {
                  result {
                    ... on DomainResult {
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
          null,
          {
            request: {
              language: 'en',
            },
            i18n,
            query,
            collections: collectionNames,
            transaction,
            userKey: user._key,
            publish: jest.fn(),
            auth: {
              checkPermission: checkPermission({ userKey: user._key, query }),
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
        )
        const expectedResponse = {
          data: {
            removeOrganizationsDomains: {
              result: {
                status: `Successfully removed 2 domain(s) from treasury-board-secretariat.`,
              },
            },
          },
        }
        expect(response).toEqual(expectedResponse)

        expect(consoleOutput).toEqual([
          `User: ${user._key} successfully removed 2 domain(s) from org: treasury-board-secretariat.`,
        ])
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
      org2 = await collections.organizations.save({
        verified: false,
        orgDetails: {
          en: {
            slug: 'test-org',
            acronym: 'TO',
            name: 'Test Org',
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
    describe('user has admin permission level', () => {
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
        domain = await collections.domains.save({
          domain: 'test.gc.ca',
          slug: 'test-gc-ca',
          archived: false,
        })
        await collections.claims.save({
          _from: org._id,
          _to: domain._id,
        })

        domain2 = await collections.domains.save({
          domain: 'test2.gc.ca',
          slug: 'test2-gc-ca',
          archived: false,
        })
        await collections.claims.save({
          _from: org._id,
          _to: domain2._id,
        })
        await collections.claims.save({
          _from: org2._id,
          _to: domain2._id,
        })

        await collections.affiliations.save({
          _from: org._id,
          _to: user._id,
          permission: 'admin',
        })
        await collections.affiliations.save({
          _from: org2._id,
          _to: user._id,
          permission: 'admin',
        })
      })
      describe('org is verified', () => {
        it('returns error', async () => {
          const response = await graphql(
            schema,
            `
            mutation {
              removeOrganizationsDomains(
                input: {
                  orgId: "${toGlobalId('organization', org._key)}"
                  domains: ["test.gc.ca", "test2.gc.ca"]
                  archiveDomains: false
                  audit: false
                }
              ) {
                result {
                  ... on DomainResult {
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
            null,
            {
              request: {
                language: 'en',
              },
              i18n,
              query,
              collections: collectionNames,
              transaction,
              userKey: user._key,
              publish: jest.fn(),
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
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
          )
          const expectedResponse = {
            data: {
              removeOrganizationsDomains: {
                result: {
                  code: 403,
                  description: `Permission Denied: Please contact super admin for help with removing domain.`,
                },
              },
            },
          }
          expect(response).toEqual(expectedResponse)
        })
      })
      describe('archive flag is true', () => {
        it('returns error', async () => {
          const response = await graphql(
            schema,
            `
            mutation {
              removeOrganizationsDomains(
                input: {
                  orgId: "${toGlobalId('organization', org2._key)}"
                  domains: ["test2.gc.ca"]
                  archiveDomains: true
                  audit: false
                }
              ) {
                result {
                  ... on DomainResult {
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
            null,
            {
              request: {
                language: 'en',
              },
              i18n,
              query,
              collections: collectionNames,
              transaction,
              userKey: user._key,
              publish: jest.fn(),
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
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
          )
          const expectedResponse = {
            data: {
              removeOrganizationsDomains: {
                result: {
                  code: 403,
                  description: `Permission Denied: Please contact organization admin for help with archiving domains.`,
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
