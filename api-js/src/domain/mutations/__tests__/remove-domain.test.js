import { setupI18n } from '@lingui/core'
import { ensure, dbNameFromFile } from 'arango-tools'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { toGlobalId } from 'graphql-relay'

import { databaseOptions } from '../../../../database-options'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { cleanseInput } from '../../../validators'
import { checkPermission, userRequired } from '../../../auth'
import { loadDomainByKey } from '../../loaders'
import { loadOrgByKey } from '../../../organization/loaders'
import { loadUserByKey } from '../../../user/loaders'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('removing a domain', () => {
  let query, drop, truncate, schema, collections, transaction, i18n, user

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
    })
    consoleOutput.length = 0
  })

  afterEach(async () => {
    await truncate()
  })

  afterAll(async () => {
    await drop()
  })

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
    describe('given a successful domain removal', () => {
      describe('users permission is super admin', () => {
        let org, domain, secondOrg, superAdminOrg
        beforeEach(async () => {
          superAdminOrg = await collections.organizations.save({
            verified: false,
            orgDetails: {
              en: {
                slug: 'super-admin',
                acronym: 'SA',
              },
              fr: {
                slug: 'super-admin',
                acronym: 'SA',
              },
            },
          })
          org = await collections.organizations.save({
            verified: false,
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
          await collections.affiliations.save({
            _from: superAdminOrg._id,
            _to: user._id,
            permission: 'super_admin',
          })
        })
        describe('domain belongs to multiple orgs', () => {
          describe('domain belongs to a verified check org', () => {
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
              await collections.claims.save({
                _from: secondOrg._id,
                _to: domain._id,
              })
            })
            it('returns a status message', async () => {
              const response = await graphql(
                schema,
                `
                mutation {
                  removeDomain(
                    input: {
                      domainId: "${toGlobalId('domains', domain._key)}"
                      orgId: "${toGlobalId('organizations', secondOrg._key)}"
                    }
                  ) {
                    result {
                      ... on DomainResult {
                        status
                        domain {
                          domain
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
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const expectedResponse = {
                data: {
                  removeDomain: {
                    result: {
                      status: `Successfully removed domain: test-gc-ca from communications-security-establishment.`,
                      domain: {
                        domain: 'test.gc.ca',
                      },
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully removed domain: test-gc-ca from org: communications-security-establishment.`,
              ])
            })
            it('does not remove domain', async () => {
              await graphql(
                schema,
                `
                mutation {
                  removeDomain(
                    input: {
                      domainId: "${toGlobalId('domains', domain._key)}"
                      orgId: "${toGlobalId('organizations', secondOrg._key)}"
                    }
                  ) {
                    result {
                      ... on DomainResult {
                        status
                        domain {
                          domain
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
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const domainCursor = await query`
              FOR domain IN domains
                FILTER domain._key == ${domain._key}
                RETURN domain
            `
              const domainCheck = await domainCursor.next()
              expect(domainCheck._key).toEqual(domain._key)
            })
            it('does not remove all scan data', async () => {
              await graphql(
                schema,
                `
                mutation {
                  removeDomain(
                    input: {
                      domainId: "${toGlobalId('domains', domain._key)}"
                      orgId: "${toGlobalId('organizations', secondOrg._key)}"
                    }
                  ) {
                    result {
                      ... on DomainResult {
                        status
                        domain {
                          domain
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
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const testDkimCursor = await query`FOR dkimScan IN dkim RETURN dkimScan.dkim`
              const testDkim = await testDkimCursor.next()
              expect(testDkim).toEqual(true)

              const testDmarcCursor = await query`FOR dmarcScan IN dmarc RETURN dmarcScan.dmarc`
              const testDmarc = await testDmarcCursor.next()
              expect(testDmarc).toEqual(true)

              const testSpfCursor = await query`FOR spfScan IN spf RETURN spfScan.spf`
              const testSpf = await testSpfCursor.next()
              expect(testSpf).toEqual(true)

              const testHttpsCursor = await query`FOR httpsScan IN https RETURN httpsScan.https`
              const testHttps = await testHttpsCursor.next()
              expect(testHttps).toEqual(true)

              const testSslCursor = await query`FOR sslScan IN ssl RETURN sslScan.ssl`
              const testSsl = await testSslCursor.next()
              expect(testSsl).toEqual(true)
            })
          })
          describe('domain does not belong to a verified check org', () => {
            beforeEach(async () => {
              secondOrg = await collections.organizations.save({
                verified: false,
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
              await collections.claims.save({
                _from: secondOrg._id,
                _to: domain._id,
              })
            })
            it('returns a status message', async () => {
              const response = await graphql(
                schema,
                `
                mutation {
                  removeDomain(
                    input: {
                      domainId: "${toGlobalId('domains', domain._key)}"
                      orgId: "${toGlobalId('organizations', secondOrg._key)}"
                    }
                  ) {
                    result {
                      ... on DomainResult {
                        status
                        domain {
                          domain
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
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const expectedResponse = {
                data: {
                  removeDomain: {
                    result: {
                      status: `Successfully removed domain: test-gc-ca from communications-security-establishment.`,
                      domain: {
                        domain: 'test.gc.ca',
                      },
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully removed domain: test-gc-ca from org: communications-security-establishment.`,
              ])
            })
            it('does not remove domain', async () => {
              await graphql(
                schema,
                `
                mutation {
                  removeDomain(
                    input: {
                      domainId: "${toGlobalId('domains', domain._key)}"
                      orgId: "${toGlobalId('organizations', secondOrg._key)}"
                    }
                  ) {
                    result {
                      ... on DomainResult {
                        status
                        domain {
                          domain
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
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const domainCursor = await query`
              FOR domain IN domains
                FILTER domain._key == ${domain._key}
                RETURN domain
            `
              const domainCheck = await domainCursor.next()
              expect(domainCheck._key).toEqual(domain._key)
            })
            it('does not remove all scan data', async () => {
              await graphql(
                schema,
                `
                mutation {
                  removeDomain(
                    input: {
                      domainId: "${toGlobalId('domains', domain._key)}"
                      orgId: "${toGlobalId('organizations', secondOrg._key)}"
                    }
                  ) {
                    result {
                      ... on DomainResult {
                        status
                        domain {
                          domain
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
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const testDkimCursor = await query`FOR dkimScan IN dkim RETURN dkimScan.dkim`
              const testDkim = await testDkimCursor.next()
              expect(testDkim).toEqual(true)

              const testDmarcCursor = await query`FOR dmarcScan IN dmarc RETURN dmarcScan.dmarc`
              const testDmarc = await testDmarcCursor.next()
              expect(testDmarc).toEqual(true)

              const testSpfCursor = await query`FOR spfScan IN spf RETURN spfScan.spf`
              const testSpf = await testSpfCursor.next()
              expect(testSpf).toEqual(true)

              const testHttpsCursor = await query`FOR httpsScan IN https RETURN httpsScan.https`
              const testHttps = await testHttpsCursor.next()
              expect(testHttps).toEqual(true)

              const testSslCursor = await query`FOR sslScan IN ssl RETURN sslScan.ssl`
              const testSsl = await testSslCursor.next()
              expect(testSsl).toEqual(true)
            })
          })
        })
        describe('domain only belongs to one org', () => {
          describe('domain belongs to a verified check org', () => {
            beforeEach(async () => {
              await query`
                FOR org IN organizations
                  UPDATE ${org._key} WITH { verified: true } IN organizations
              `
            })
            it('returns a status message', async () => {
              const response = await graphql(
                schema,
                `
                mutation {
                  removeDomain(
                    input: {
                      domainId: "${toGlobalId('domains', domain._key)}"
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on DomainResult {
                        status
                        domain {
                          domain
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
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const expectedResponse = {
                data: {
                  removeDomain: {
                    result: {
                      status: `Successfully removed domain: test-gc-ca from treasury-board-secretariat.`,
                      domain: {
                        domain: 'test.gc.ca',
                      },
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully removed domain: test-gc-ca from org: treasury-board-secretariat.`,
              ])
            })
            it('removes domain', async () => {
              await graphql(
                schema,
                `
                mutation {
                  removeDomain(
                    input: {
                      domainId: "${toGlobalId('domains', domain._key)}"
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on DomainResult {
                        status
                        domain {
                          domain
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
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const domainCursor = await query`
              FOR domain IN domains
                FILTER domain._key == ${domain._key}
                RETURN domain
            `
              const domainCheck = await domainCursor.next()
              expect(domainCheck).toEqual(undefined)
            })
            it('removes all scan data', async () => {
              await graphql(
                schema,
                `
                mutation {
                  removeDomain(
                    input: {
                      domainId: "${toGlobalId('domains', domain._key)}"
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on DomainResult {
                        status
                        domain {
                          domain
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
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const testDkimCursor = await query`FOR dkimScan IN dkim RETURN dkimScan`
              const testDkim = await testDkimCursor.next()
              expect(testDkim).toEqual(undefined)

              const testDmarcCursor = await query`FOR dmarcScan IN dmarc RETURN dmarcScan`
              const testDmarc = await testDmarcCursor.next()
              expect(testDmarc).toEqual(undefined)

              const testSpfCursor = await query`FOR spfScan IN spf RETURN spfScan`
              const testSpf = await testSpfCursor.next()
              expect(testSpf).toEqual(undefined)

              const testHttpsCursor = await query`FOR httpsScan IN https RETURN httpsScan`
              const testHttps = await testHttpsCursor.next()
              expect(testHttps).toEqual(undefined)

              const testSslCursor = await query`FOR sslScan IN ssl RETURN sslScan`
              const testSsl = await testSslCursor.next()
              expect(testSsl).toEqual(undefined)
            })
          })
          describe('domain does not belong to a verified check org', () => {
            it('returns a status message', async () => {
              const response = await graphql(
                schema,
                `
                mutation {
                  removeDomain(
                    input: {
                      domainId: "${toGlobalId('domains', domain._key)}"
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on DomainResult {
                        status
                        domain {
                          domain
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
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const expectedResponse = {
                data: {
                  removeDomain: {
                    result: {
                      status: `Successfully removed domain: test-gc-ca from treasury-board-secretariat.`,
                      domain: {
                        domain: 'test.gc.ca',
                      },
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully removed domain: test-gc-ca from org: treasury-board-secretariat.`,
              ])
            })
            it('does not remove domain', async () => {
              await graphql(
                schema,
                `
                mutation {
                  removeDomain(
                    input: {
                      domainId: "${toGlobalId('domains', domain._key)}"
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on DomainResult {
                        status
                        domain {
                          domain
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
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const domainCursor = await query`
              FOR domain IN domains
                FILTER domain._key == ${domain._key}
                RETURN domain
            `
              const domainCheck = await domainCursor.next()
              expect(domainCheck).toEqual(undefined)
            })
            it('does not remove all scan data', async () => {
              await graphql(
                schema,
                `
                mutation {
                  removeDomain(
                    input: {
                      domainId: "${toGlobalId('domains', domain._key)}"
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on DomainResult {
                        status
                        domain {
                          domain
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
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const testDkimCursor = await query`FOR dkimScan IN dkim RETURN dkimScan`
              const testDkim = await testDkimCursor.next()
              expect(testDkim).toEqual(undefined)

              const testDmarcCursor = await query`FOR dmarcScan IN dmarc RETURN dmarcScan`
              const testDmarc = await testDmarcCursor.next()
              expect(testDmarc).toEqual(undefined)

              const testSpfCursor = await query`FOR spfScan IN spf RETURN spfScan`
              const testSpf = await testSpfCursor.next()
              expect(testSpf).toEqual(undefined)

              const testHttpsCursor = await query`FOR httpsScan IN https RETURN httpsScan`
              const testHttps = await testHttpsCursor.next()
              expect(testHttps).toEqual(undefined)

              const testSslCursor = await query`FOR sslScan IN ssl RETURN sslScan`
              const testSsl = await testSslCursor.next()
              expect(testSsl).toEqual(undefined)
            })
          })
        })
      })
      describe('users permission is admin', () => {
        let org, domain, secondOrg
        beforeEach(async () => {
          org = await collections.organizations.save({
            verified: false,
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
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'admin',
          })
        })
        describe('domain belongs to multiple orgs', () => {
          describe('domain does not belong to a verified check org', () => {
            beforeEach(async () => {
              secondOrg = await collections.organizations.save({
                verified: false,
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

              await collections.claims.save({
                _from: secondOrg._id,
                _to: domain._id,
              })
            })
            it('returns a status message', async () => {
              const response = await graphql(
                schema,
                `
                mutation {
                  removeDomain(
                    input: {
                      domainId: "${toGlobalId('domains', domain._key)}"
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on DomainResult {
                        status
                        domain {
                          domain
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
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const expectedResponse = {
                data: {
                  removeDomain: {
                    result: {
                      status: `Successfully removed domain: test-gc-ca from treasury-board-secretariat.`,
                      domain: {
                        domain: 'test.gc.ca',
                      },
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully removed domain: test-gc-ca from org: treasury-board-secretariat.`,
              ])
            })
            it('does not remove domain', async () => {
              await graphql(
                schema,
                `
                mutation {
                  removeDomain(
                    input: {
                      domainId: "${toGlobalId('domains', domain._key)}"
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on DomainResult {
                        status
                        domain {
                          domain
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
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const domainCursor = await query`
              FOR domain IN domains
                FILTER domain._key == ${domain._key}
                RETURN domain
            `
              const domainCheck = await domainCursor.next()
              expect(domainCheck._key).toEqual(domain._key)
            })
            it('does not remove all scan data', async () => {
              await graphql(
                schema,
                `
                mutation {
                  removeDomain(
                    input: {
                      domainId: "${toGlobalId('domains', domain._key)}"
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on DomainResult {
                        status
                        domain {
                          domain
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
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const testDkimCursor = await query`FOR dkimScan IN dkim RETURN dkimScan.dkim`
              const testDkim = await testDkimCursor.next()
              expect(testDkim).toEqual(true)

              const testDmarcCursor = await query`FOR dmarcScan IN dmarc RETURN dmarcScan.dmarc`
              const testDmarc = await testDmarcCursor.next()
              expect(testDmarc).toEqual(true)

              const testSpfCursor = await query`FOR spfScan IN spf RETURN spfScan.spf`
              const testSpf = await testSpfCursor.next()
              expect(testSpf).toEqual(true)

              const testHttpsCursor = await query`FOR httpsScan IN https RETURN httpsScan.https`
              const testHttps = await testHttpsCursor.next()
              expect(testHttps).toEqual(true)

              const testSslCursor = await query`FOR sslScan IN ssl RETURN sslScan.ssl`
              const testSsl = await testSslCursor.next()
              expect(testSsl).toEqual(true)
            })
          })
        })
        describe('domain only belongs to one org', () => {
          describe('domain does not belong to a verified check org', () => {
            it('returns a status message', async () => {
              const response = await graphql(
                schema,
                `
                mutation {
                  removeDomain(
                    input: {
                      domainId: "${toGlobalId('domains', domain._key)}"
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on DomainResult {
                        status
                        domain {
                          domain
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
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const expectedResponse = {
                data: {
                  removeDomain: {
                    result: {
                      status: `Successfully removed domain: test-gc-ca from treasury-board-secretariat.`,
                      domain: {
                        domain: 'test.gc.ca',
                      },
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully removed domain: test-gc-ca from org: treasury-board-secretariat.`,
              ])
            })
            it('does not remove domain', async () => {
              await graphql(
                schema,
                `
                mutation {
                  removeDomain(
                    input: {
                      domainId: "${toGlobalId('domains', domain._key)}"
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on DomainResult {
                        status
                        domain {
                          domain
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
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const domainCursor = await query`
              FOR domain IN domains
                FILTER domain._key == ${domain._key}
                RETURN domain
            `
              const domainCheck = await domainCursor.next()
              expect(domainCheck).toEqual(undefined)
            })
            it('does not remove all scan data', async () => {
              await graphql(
                schema,
                `
                mutation {
                  removeDomain(
                    input: {
                      domainId: "${toGlobalId('domains', domain._key)}"
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on DomainResult {
                        status
                        domain {
                          domain
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
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const testDkimCursor = await query`FOR dkimScan IN dkim RETURN dkimScan`
              const testDkim = await testDkimCursor.next()
              expect(testDkim).toEqual(undefined)

              const testDmarcCursor = await query`FOR dmarcScan IN dmarc RETURN dmarcScan`
              const testDmarc = await testDmarcCursor.next()
              expect(testDmarc).toEqual(undefined)

              const testSpfCursor = await query`FOR spfScan IN spf RETURN spfScan`
              const testSpf = await testSpfCursor.next()
              expect(testSpf).toEqual(undefined)

              const testHttpsCursor = await query`FOR httpsScan IN https RETURN httpsScan`
              const testHttps = await testHttpsCursor.next()
              expect(testHttps).toEqual(undefined)

              const testSslCursor = await query`FOR sslScan IN ssl RETURN sslScan`
              const testSsl = await testSslCursor.next()
              expect(testSsl).toEqual(undefined)
            })
          })
        })
      })
    })
    describe('given an unsuccessful domain removal', () => {
      describe('domain does not exist', () => {
        it('returns an error', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                removeDomain(
                  input: {
                    domainId: "${toGlobalId('domains', 1)}"
                    orgId: "${toGlobalId('organizations', 1)}"
                  }
                ) {
                  result {
                    ... on DomainResult {
                      status
                      domain {
                        domain
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
              },
              validators: { cleanseInput },
              loaders: {
                loadDomainByKey: loadDomainByKey({ query }),
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const error = {
            data: {
              removeDomain: {
                result: {
                  code: 400,
                  description: 'Unable to remove unknown domain.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to remove 1 however no domain is associated with that id.`,
          ])
        })
      })
      describe('organization does not exist', () => {
        let domain
        beforeEach(async () => {
          domain = await collections.domains.save({
            domain: 'test.gc.ca',
            slug: 'test-gc-ca',
          })
        })
        it('returns an error', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                removeDomain(
                  input: {
                    domainId: "${toGlobalId('domains', domain._key)}"
                    orgId: "${toGlobalId('organizations', 1)}"
                  }
                ) {
                  result {
                    ... on DomainResult {
                      status
                      domain {
                        domain
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
              },
              validators: { cleanseInput },
              loaders: {
                loadDomainByKey: loadDomainByKey({ query }),
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const error = {
            data: {
              removeDomain: {
                result: {
                  code: 400,
                  description:
                    'Unable to remove domain from unknown organization.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to remove test-gc-ca in org: 1 however there is no organization associated with that id.`,
          ])
        })
      })
      describe('user attempts to remove domain from verified check org', () => {
        let org, domain
        beforeEach(async () => {
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

          domain = await collections.domains.save({
            domain: 'test.gc.ca',
            slug: 'test-gc-ca',
          })
          await collections.claims.save({
            _from: org._id,
            _to: domain._id,
          })
        })
        describe('users permission is admin', () => {
          beforeEach(async () => {
            await collections.affiliations.save({
              _from: org._id,
              _to: user._id,
              permission: 'admin',
            })
          })
          it('returns an error', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  removeDomain(
                    input: {
                      domainId: "${toGlobalId('domains', domain._key)}"
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on DomainResult {
                        status
                        domain {
                          domain
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
                },
                validators: { cleanseInput },
                loaders: {
                  loadDomainByKey: loadDomainByKey({ query }),
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            )

            const error = {
              data: {
                removeDomain: {
                  result: {
                    code: 403,
                    description:
                      'Permission Denied: Please contact super admin for help with removing domain.',
                  },
                },
              },
            }

            expect(response).toEqual(error)
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to remove test-gc-ca in treasury-board-secretariat but does not have permission to remove a domain from a verified check org.`,
            ])
          })
        })
        describe('users permission is user', () => {
          beforeEach(async () => {
            await collections.affiliations.save({
              _from: org._id,
              _to: user._id,
              permission: 'user',
            })
          })
          it('returns an error', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  removeDomain(
                    input: {
                      domainId: "${toGlobalId('domains', domain._key)}"
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on DomainResult {
                        status
                        domain {
                          domain
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
                },
                validators: { cleanseInput },
                loaders: {
                  loadDomainByKey: loadDomainByKey({ query }),
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            )

            const error = {
              data: {
                removeDomain: {
                  result: {
                    code: 403,
                    description:
                      'Permission Denied: Please contact super admin for help with removing domain.',
                  },
                },
              },
            }

            expect(response).toEqual(error)
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to remove test-gc-ca in treasury-board-secretariat but does not have permission to remove a domain from a verified check org.`,
            ])
          })
        })
        describe('user does not belong to org', () => {
          it('returns an error', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  removeDomain(
                    input: {
                      domainId: "${toGlobalId('domains', domain._key)}"
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on DomainResult {
                        status
                        domain {
                          domain
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
                },
                validators: { cleanseInput },
                loaders: {
                  loadDomainByKey: loadDomainByKey({ query }),
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            )

            const error = {
              data: {
                removeDomain: {
                  result: {
                    code: 403,
                    description:
                      'Permission Denied: Please contact super admin for help with removing domain.',
                  },
                },
              },
            }

            expect(response).toEqual(error)
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to remove test-gc-ca in treasury-board-secretariat but does not have permission to remove a domain from a verified check org.`,
            ])
          })
        })
      })
      describe('user attempts to remove domain from a regular org', () => {
        let org, domain
        beforeEach(async () => {
          org = await collections.organizations.save({
            verified: false,
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
          })
          await collections.claims.save({
            _from: org._id,
            _to: domain._id,
          })
        })
        describe('users permission is user', () => {
          beforeEach(async () => {
            await collections.affiliations.save({
              _from: org._id,
              _to: user._id,
              permission: 'user',
            })
          })
          it('returns an error', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  removeDomain(
                    input: {
                      domainId: "${toGlobalId('domains', domain._key)}"
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on DomainResult {
                        status
                        domain {
                          domain
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
                },
                validators: { cleanseInput },
                loaders: {
                  loadDomainByKey: loadDomainByKey({ query }),
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            )

            const error = {
              data: {
                removeDomain: {
                  result: {
                    code: 403,
                    description:
                      'Permission Denied: Please contact organization admin for help with removing domain.',
                  },
                },
              },
            }

            expect(response).toEqual(error)
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to remove test-gc-ca in treasury-board-secretariat however they do not have permission in that org.`,
            ])
          })
        })
        describe('user does not belong to org', () => {
          it('returns an error', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  removeDomain(
                    input: {
                      domainId: "${toGlobalId('domains', domain._key)}"
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on DomainResult {
                        status
                        domain {
                          domain
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
                },
                validators: { cleanseInput },
                loaders: {
                  loadDomainByKey: loadDomainByKey({ query }),
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            )

            const error = {
              data: {
                removeDomain: {
                  result: {
                    code: 403,
                    description:
                      'Permission Denied: Please contact organization admin for help with removing domain.',
                  },
                },
              },
            }

            expect(response).toEqual(error)
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to remove test-gc-ca in treasury-board-secretariat however they do not have permission in that org.`,
            ])
          })
        })
      })
      describe('database error occurs', () => {
        let user, org, domain
        beforeEach(async () => {
          org = await collections.organizations.save({
            verified: false,
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
          })
          await collections.claims.save({
            _from: org._id,
            _to: domain._id,
          })

          const userCursor = await query`
            FOR user IN users
              RETURN user
          `
          user = await userCursor.next()
        })
        describe('when checking to see how many edges there are', () => {
          it('returns an error', async () => {
            const domainLoader = loadDomainByKey({ query })
            const orgLoader = loadOrgByKey({ query, language: 'en' })
            const userLoader = loadUserByKey({ query })

            const mockedQuery = jest
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
                  removeDomain(
                    input: {
                      domainId: "${toGlobalId('domains', domain._key)}"
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on DomainResult {
                        status
                        domain {
                          domain
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
                query: mockedQuery,
                collections,
                transaction,
                userKey: user._key,
                auth: {
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query: mockedQuery,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: userLoader,
                  }),
                },
                validators: { cleanseInput },
                loaders: {
                  loadDomainByKey: domainLoader,
                  loadOrgByKey: orgLoader,
                  loadUserByKey: userLoader,
                },
              },
            )

            const error = [
              new GraphQLError('Unable to remove domain. Please try again.'),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Database error occurred for user: ${user._key}, when counting domain claims for domain: test-gc-ca, error: Error: Database error occurred.`,
            ])
          })
        })
      })
      describe('Transaction error occurs', () => {
        let user, org, domain
        beforeEach(async () => {
          org = await collections.organizations.save({
            verified: false,
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
          })
          await collections.claims.save({
            _from: org._id,
            _to: domain._id,
          })

          const userCursor = await query`
            FOR user IN users
              RETURN user
          `
          user = await userCursor.next()

          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'admin',
          })
        })
        describe('when removing scans', () => {
          it('returns an error', async () => {
            const domainLoader = loadDomainByKey({ query })
            const orgLoader = loadOrgByKey({ query, language: 'en' })
            const userLoader = loadUserByKey({ query })

            const mockedTransaction = jest.fn().mockReturnValue({
              step() {
                throw new Error('Transaction error occurred.')
              },
            })

            const response = await graphql(
              schema,
              `
                mutation {
                  removeDomain(
                    input: {
                      domainId: "${toGlobalId('domains', domain._key)}"
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on DomainResult {
                        status
                        domain {
                          domain
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
                query,
                collections,
                transaction: mockedTransaction,
                userKey: user._key,
                auth: {
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: userLoader,
                  }),
                },
                validators: { cleanseInput },
                loaders: {
                  loadDomainByKey: domainLoader,
                  loadOrgByKey: orgLoader,
                  loadUserByKey: userLoader,
                },
              },
            )

            const error = [
              new GraphQLError('Unable to remove domain. Please try again.'),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Transaction error occurred while user: ${user._key} attempted to remove scan data for test-gc-ca in org: treasury-board-secretariat, error: Error: Transaction error occurred.`,
            ])
          })
        })
        describe('when removing edge', () => {
          describe('domain has only one edge', () => {
            it('returns an error', async () => {
              const domainLoader = loadDomainByKey({ query })
              const orgLoader = loadOrgByKey({ query, language: 'en' })
              const userLoader = loadUserByKey({ query })

              const cursor = {
                count: 1,
                next() {
                  return 'admin'
                },
              }

              const mockedQuery = jest
                .fn()
                .mockReturnValueOnce(cursor)
                .mockReturnValueOnce(cursor)
                .mockReturnValueOnce(cursor)
                .mockReturnValueOnce(undefined)
                .mockReturnValueOnce(undefined)
                .mockReturnValueOnce(undefined)
                .mockReturnValueOnce(undefined)
                .mockReturnValueOnce(undefined)
                .mockRejectedValue(new Error('Transaction error occurred.'))

              const response = await graphql(
                schema,
                `
                  mutation {
                    removeDomain(
                      input: {
                        domainId: "${toGlobalId('domains', domain._key)}"
                        orgId: "${toGlobalId('organizations', org._key)}"
                      }
                    ) {
                      result {
                        ... on DomainResult {
                          status
                          domain {
                            domain
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
                  query: mockedQuery,
                  collections,
                  transaction,
                  userKey: user._key,
                  auth: {
                    checkPermission: checkPermission({
                      userKey: user._key,
                      query: mockedQuery,
                    }),
                    userRequired: userRequired({
                      userKey: user._key,
                      loadUserByKey: userLoader,
                    }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: domainLoader,
                    loadOrgByKey: orgLoader,
                    loadUserByKey: userLoader,
                  },
                },
              )

              const error = [
                new GraphQLError('Unable to remove domain. Please try again.'),
              ]

              expect(response.errors).toEqual(error)
              expect(consoleOutput).toEqual([
                `Transaction error occurred while user: ${user._key} attempted to remove test-gc-ca in org: treasury-board-secretariat, error: Error: Transaction error occurred.`,
              ])
            })
          })
          describe('domain has more than one edge', () => {
            it('returns an error', async () => {
              const domainLoader = loadDomainByKey({ query })
              const orgLoader = loadOrgByKey({ query, language: 'en' })
              const userLoader = loadUserByKey({ query })

              const cursor = {
                count: 2,
                next() {
                  return 'admin'
                },
              }

              const mockedQuery = jest
                .fn()
                .mockReturnValueOnce(cursor)
                .mockReturnValueOnce(cursor)
                .mockReturnValueOnce(cursor)
                .mockRejectedValue(new Error('Transaction error occurred.'))

              const response = await graphql(
                schema,
                `
                  mutation {
                    removeDomain(
                      input: {
                        domainId: "${toGlobalId('domains', domain._key)}"
                        orgId: "${toGlobalId('organizations', org._key)}"
                      }
                    ) {
                      result {
                        ... on DomainResult {
                          status
                          domain {
                            domain
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
                  query: mockedQuery,
                  collections,
                  transaction,
                  userKey: user._key,
                  auth: {
                    checkPermission: checkPermission({
                      userKey: user._key,
                      query: mockedQuery,
                    }),
                    userRequired: userRequired({
                      userKey: user._key,
                      loadUserByKey: userLoader,
                    }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: domainLoader,
                    loadOrgByKey: orgLoader,
                    loadUserByKey: userLoader,
                  },
                },
              )

              const error = [
                new GraphQLError('Unable to remove domain. Please try again.'),
              ]

              expect(response.errors).toEqual(error)
              expect(consoleOutput).toEqual([
                `Transaction error occurred while user: ${user._key} attempted to remove claim for test-gc-ca in org: treasury-board-secretariat, error: Error: Transaction error occurred.`,
              ])
            })
          })
        })
        describe('when committing to db', () => {
          it('returns an error', async () => {
            const domainLoader = loadDomainByKey({ query })
            const orgLoader = loadOrgByKey({ query, language: 'en' })
            const userLoader = loadUserByKey({ query })

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
                  removeDomain(
                    input: {
                      domainId: "${toGlobalId('domains', domain._key)}"
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on DomainResult {
                        status
                        domain {
                          domain
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
                query,
                collections,
                transaction: mockedTransaction,
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
                },
                validators: { cleanseInput },
                loaders: {
                  loadDomainByKey: domainLoader,
                  loadOrgByKey: orgLoader,
                  loadUserByKey: userLoader,
                },
              },
            )

            const error = [
              new GraphQLError('Unable to remove domain. Please try again.'),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Transaction commit error occurred while user: ${user._key} attempted to remove test-gc-ca in org: treasury-board-secretariat, error: Error: Transaction error occurred.`,
            ])
          })
        })
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
    describe('given a successful domain removal', () => {
      describe('users permission is super admin', () => {
        let org, domain, secondOrg, superAdminOrg
        beforeEach(async () => {
          superAdminOrg = await collections.organizations.save({
            verified: false,
            orgDetails: {
              en: {
                slug: 'super-admin',
                acronym: 'SA',
              },
              fr: {
                slug: 'super-admin',
                acronym: 'SA',
              },
            },
          })
          org = await collections.organizations.save({
            verified: false,
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
          await collections.affiliations.save({
            _from: superAdminOrg._id,
            _to: user._id,
            permission: 'super_admin',
          })
        })
        describe('domain belongs to multiple orgs', () => {
          describe('domain belongs to a verified check org', () => {
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

              await collections.claims.save({
                _from: secondOrg._id,
                _to: domain._id,
              })
            })
            it('returns a status message', async () => {
              const response = await graphql(
                schema,
                `
                mutation {
                  removeDomain(
                    input: {
                      domainId: "${toGlobalId('domains', domain._key)}"
                      orgId: "${toGlobalId('organizations', secondOrg._key)}"
                    }
                  ) {
                    result {
                      ... on DomainResult {
                        status
                        domain {
                          domain
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
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const expectedResponse = {
                data: {
                  removeDomain: {
                    result: {
                      status: `todo`,
                      domain: {
                        domain: 'test.gc.ca',
                      },
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully removed domain: test-gc-ca from org: communications-security-establishment.`,
              ])
            })
            it('does not remove domain', async () => {
              await graphql(
                schema,
                `
                mutation {
                  removeDomain(
                    input: {
                      domainId: "${toGlobalId('domains', domain._key)}"
                      orgId: "${toGlobalId('organizations', secondOrg._key)}"
                    }
                  ) {
                    result {
                      ... on DomainResult {
                        status
                        domain {
                          domain
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
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const domainCursor = await query`
              FOR domain IN domains
                FILTER domain._key == ${domain._key}
                RETURN domain
            `
              const domainCheck = await domainCursor.next()
              expect(domainCheck._key).toEqual(domain._key)
            })
            it('does not remove all scan data', async () => {
              await graphql(
                schema,
                `
                mutation {
                  removeDomain(
                    input: {
                      domainId: "${toGlobalId('domains', domain._key)}"
                      orgId: "${toGlobalId('organizations', secondOrg._key)}"
                    }
                  ) {
                    result {
                      ... on DomainResult {
                        status
                        domain {
                          domain
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
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const testDkimCursor = await query`FOR dkimScan IN dkim RETURN dkimScan.dkim`
              const testDkim = await testDkimCursor.next()
              expect(testDkim).toEqual(true)

              const testDmarcCursor = await query`FOR dmarcScan IN dmarc RETURN dmarcScan.dmarc`
              const testDmarc = await testDmarcCursor.next()
              expect(testDmarc).toEqual(true)

              const testSpfCursor = await query`FOR spfScan IN spf RETURN spfScan.spf`
              const testSpf = await testSpfCursor.next()
              expect(testSpf).toEqual(true)

              const testHttpsCursor = await query`FOR httpsScan IN https RETURN httpsScan.https`
              const testHttps = await testHttpsCursor.next()
              expect(testHttps).toEqual(true)

              const testSslCursor = await query`FOR sslScan IN ssl RETURN sslScan.ssl`
              const testSsl = await testSslCursor.next()
              expect(testSsl).toEqual(true)
            })
          })
          describe('domain does not belong to a verified check org', () => {
            beforeEach(async () => {
              secondOrg = await collections.organizations.save({
                verified: false,
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

              await collections.claims.save({
                _from: secondOrg._id,
                _to: domain._id,
              })
            })
            it('returns a status message', async () => {
              const response = await graphql(
                schema,
                `
                mutation {
                  removeDomain(
                    input: {
                      domainId: "${toGlobalId('domains', domain._key)}"
                      orgId: "${toGlobalId('organizations', secondOrg._key)}"
                    }
                  ) {
                    result {
                      ... on DomainResult {
                        status
                        domain {
                          domain
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
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const expectedResponse = {
                data: {
                  removeDomain: {
                    result: {
                      status: `todo`,
                      domain: {
                        domain: 'test.gc.ca',
                      },
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully removed domain: test-gc-ca from org: communications-security-establishment.`,
              ])
            })
            it('does not remove domain', async () => {
              await graphql(
                schema,
                `
                mutation {
                  removeDomain(
                    input: {
                      domainId: "${toGlobalId('domains', domain._key)}"
                      orgId: "${toGlobalId('organizations', secondOrg._key)}"
                    }
                  ) {
                    result {
                      ... on DomainResult {
                        status
                        domain {
                          domain
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
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const domainCursor = await query`
              FOR domain IN domains
                FILTER domain._key == ${domain._key}
                RETURN domain
            `
              const domainCheck = await domainCursor.next()
              expect(domainCheck._key).toEqual(domain._key)
            })
            it('does not remove all scan data', async () => {
              await graphql(
                schema,
                `
                mutation {
                  removeDomain(
                    input: {
                      domainId: "${toGlobalId('domains', domain._key)}"
                      orgId: "${toGlobalId('organizations', secondOrg._key)}"
                    }
                  ) {
                    result {
                      ... on DomainResult {
                        status
                        domain {
                          domain
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
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const testDkimCursor = await query`FOR dkimScan IN dkim RETURN dkimScan.dkim`
              const testDkim = await testDkimCursor.next()
              expect(testDkim).toEqual(true)

              const testDmarcCursor = await query`FOR dmarcScan IN dmarc RETURN dmarcScan.dmarc`
              const testDmarc = await testDmarcCursor.next()
              expect(testDmarc).toEqual(true)

              const testSpfCursor = await query`FOR spfScan IN spf RETURN spfScan.spf`
              const testSpf = await testSpfCursor.next()
              expect(testSpf).toEqual(true)

              const testHttpsCursor = await query`FOR httpsScan IN https RETURN httpsScan.https`
              const testHttps = await testHttpsCursor.next()
              expect(testHttps).toEqual(true)

              const testSslCursor = await query`FOR sslScan IN ssl RETURN sslScan.ssl`
              const testSsl = await testSslCursor.next()
              expect(testSsl).toEqual(true)
            })
          })
        })
        describe('domain only belongs to one org', () => {
          describe('domain belongs to a verified check org', () => {
            beforeEach(async () => {
              await query`
                FOR org IN organizations
                  UPDATE ${org._key} WITH { verified: true } IN organizations
              `
            })
            it('returns a status message', async () => {
              const response = await graphql(
                schema,
                `
                mutation {
                  removeDomain(
                    input: {
                      domainId: "${toGlobalId('domains', domain._key)}"
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on DomainResult {
                        status
                        domain {
                          domain
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
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const expectedResponse = {
                data: {
                  removeDomain: {
                    result: {
                      status: `todo`,
                      domain: {
                        domain: 'test.gc.ca',
                      },
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully removed domain: test-gc-ca from org: treasury-board-secretariat.`,
              ])
            })
            it('removes domain', async () => {
              await graphql(
                schema,
                `
                mutation {
                  removeDomain(
                    input: {
                      domainId: "${toGlobalId('domains', domain._key)}"
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on DomainResult {
                        status
                        domain {
                          domain
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
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const domainCursor = await query`
              FOR domain IN domains
                FILTER domain._key == ${domain._key}
                RETURN domain
            `
              const domainCheck = await domainCursor.next()
              expect(domainCheck).toEqual(undefined)
            })
            it('removes all scan data', async () => {
              await graphql(
                schema,
                `
                mutation {
                  removeDomain(
                    input: {
                      domainId: "${toGlobalId('domains', domain._key)}"
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on DomainResult {
                        status
                        domain {
                          domain
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
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const testDkimCursor = await query`FOR dkimScan IN dkim RETURN dkimScan`
              const testDkim = await testDkimCursor.next()
              expect(testDkim).toEqual(undefined)

              const testDmarcCursor = await query`FOR dmarcScan IN dmarc RETURN dmarcScan`
              const testDmarc = await testDmarcCursor.next()
              expect(testDmarc).toEqual(undefined)

              const testSpfCursor = await query`FOR spfScan IN spf RETURN spfScan`
              const testSpf = await testSpfCursor.next()
              expect(testSpf).toEqual(undefined)

              const testHttpsCursor = await query`FOR httpsScan IN https RETURN httpsScan`
              const testHttps = await testHttpsCursor.next()
              expect(testHttps).toEqual(undefined)

              const testSslCursor = await query`FOR sslScan IN ssl RETURN sslScan`
              const testSsl = await testSslCursor.next()
              expect(testSsl).toEqual(undefined)
            })
          })
          describe('domain does not belong to a verified check org', () => {
            it('returns a status message', async () => {
              const response = await graphql(
                schema,
                `
                mutation {
                  removeDomain(
                    input: {
                      domainId: "${toGlobalId('domains', domain._key)}"
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on DomainResult {
                        status
                        domain {
                          domain
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
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const expectedResponse = {
                data: {
                  removeDomain: {
                    result: {
                      status: `todo`,
                      domain: {
                        domain: 'test.gc.ca',
                      },
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully removed domain: test-gc-ca from org: treasury-board-secretariat.`,
              ])
            })
            it('does not remove domain', async () => {
              await graphql(
                schema,
                `
                mutation {
                  removeDomain(
                    input: {
                      domainId: "${toGlobalId('domains', domain._key)}"
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on DomainResult {
                        status
                        domain {
                          domain
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
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const domainCursor = await query`
              FOR domain IN domains
                FILTER domain._key == ${domain._key}
                RETURN domain
            `
              const domainCheck = await domainCursor.next()
              expect(domainCheck).toEqual(undefined)
            })
            it('does not remove all scan data', async () => {
              await graphql(
                schema,
                `
                mutation {
                  removeDomain(
                    input: {
                      domainId: "${toGlobalId('domains', domain._key)}"
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on DomainResult {
                        status
                        domain {
                          domain
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
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const testDkimCursor = await query`FOR dkimScan IN dkim RETURN dkimScan`
              const testDkim = await testDkimCursor.next()
              expect(testDkim).toEqual(undefined)

              const testDmarcCursor = await query`FOR dmarcScan IN dmarc RETURN dmarcScan`
              const testDmarc = await testDmarcCursor.next()
              expect(testDmarc).toEqual(undefined)

              const testSpfCursor = await query`FOR spfScan IN spf RETURN spfScan`
              const testSpf = await testSpfCursor.next()
              expect(testSpf).toEqual(undefined)

              const testHttpsCursor = await query`FOR httpsScan IN https RETURN httpsScan`
              const testHttps = await testHttpsCursor.next()
              expect(testHttps).toEqual(undefined)

              const testSslCursor = await query`FOR sslScan IN ssl RETURN sslScan`
              const testSsl = await testSslCursor.next()
              expect(testSsl).toEqual(undefined)
            })
          })
        })
      })
      describe('users permission is admin', () => {
        let org, domain, secondOrg
        beforeEach(async () => {
          org = await collections.organizations.save({
            verified: false,
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
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'admin',
          })
        })
        describe('domain belongs to multiple orgs', () => {
          describe('domain does not belong to a verified check org', () => {
            beforeEach(async () => {
              secondOrg = await collections.organizations.save({
                verified: false,
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

              await collections.claims.save({
                _from: secondOrg._id,
                _to: domain._id,
              })
            })
            it('returns a status message', async () => {
              const response = await graphql(
                schema,
                `
                mutation {
                  removeDomain(
                    input: {
                      domainId: "${toGlobalId('domains', domain._key)}"
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on DomainResult {
                        status
                        domain {
                          domain
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
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const expectedResponse = {
                data: {
                  removeDomain: {
                    result: {
                      status: `todo`,
                      domain: {
                        domain: 'test.gc.ca',
                      },
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully removed domain: test-gc-ca from org: treasury-board-secretariat.`,
              ])
            })
            it('does not remove domain', async () => {
              await graphql(
                schema,
                `
                mutation {
                  removeDomain(
                    input: {
                      domainId: "${toGlobalId('domains', domain._key)}"
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on DomainResult {
                        status
                        domain {
                          domain
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
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const domainCursor = await query`
              FOR domain IN domains
                FILTER domain._key == ${domain._key}
                RETURN domain
            `
              const domainCheck = await domainCursor.next()
              expect(domainCheck._key).toEqual(domain._key)
            })
            it('does not remove all scan data', async () => {
              await graphql(
                schema,
                `
                mutation {
                  removeDomain(
                    input: {
                      domainId: "${toGlobalId('domains', domain._key)}"
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on DomainResult {
                        status
                        domain {
                          domain
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
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const testDkimCursor = await query`FOR dkimScan IN dkim RETURN dkimScan.dkim`
              const testDkim = await testDkimCursor.next()
              expect(testDkim).toEqual(true)

              const testDmarcCursor = await query`FOR dmarcScan IN dmarc RETURN dmarcScan.dmarc`
              const testDmarc = await testDmarcCursor.next()
              expect(testDmarc).toEqual(true)

              const testSpfCursor = await query`FOR spfScan IN spf RETURN spfScan.spf`
              const testSpf = await testSpfCursor.next()
              expect(testSpf).toEqual(true)

              const testHttpsCursor = await query`FOR httpsScan IN https RETURN httpsScan.https`
              const testHttps = await testHttpsCursor.next()
              expect(testHttps).toEqual(true)

              const testSslCursor = await query`FOR sslScan IN ssl RETURN sslScan.ssl`
              const testSsl = await testSslCursor.next()
              expect(testSsl).toEqual(true)
            })
          })
        })
        describe('domain only belongs to one org', () => {
          describe('domain does not belong to a verified check org', () => {
            it('returns a status message', async () => {
              const response = await graphql(
                schema,
                `
                mutation {
                  removeDomain(
                    input: {
                      domainId: "${toGlobalId('domains', domain._key)}"
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on DomainResult {
                        status
                        domain {
                          domain
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
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const expectedResponse = {
                data: {
                  removeDomain: {
                    result: {
                      status: `todo`,
                      domain: {
                        domain: 'test.gc.ca',
                      },
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully removed domain: test-gc-ca from org: treasury-board-secretariat.`,
              ])
            })
            it('does not remove domain', async () => {
              await graphql(
                schema,
                `
                mutation {
                  removeDomain(
                    input: {
                      domainId: "${toGlobalId('domains', domain._key)}"
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on DomainResult {
                        status
                        domain {
                          domain
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
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const domainCursor = await query`
              FOR domain IN domains
                FILTER domain._key == ${domain._key}
                RETURN domain
            `
              const domainCheck = await domainCursor.next()
              expect(domainCheck).toEqual(undefined)
            })
            it('does not remove all scan data', async () => {
              await graphql(
                schema,
                `
                mutation {
                  removeDomain(
                    input: {
                      domainId: "${toGlobalId('domains', domain._key)}"
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on DomainResult {
                        status
                        domain {
                          domain
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
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const testDkimCursor = await query`FOR dkimScan IN dkim RETURN dkimScan`
              const testDkim = await testDkimCursor.next()
              expect(testDkim).toEqual(undefined)

              const testDmarcCursor = await query`FOR dmarcScan IN dmarc RETURN dmarcScan`
              const testDmarc = await testDmarcCursor.next()
              expect(testDmarc).toEqual(undefined)

              const testSpfCursor = await query`FOR spfScan IN spf RETURN spfScan`
              const testSpf = await testSpfCursor.next()
              expect(testSpf).toEqual(undefined)

              const testHttpsCursor = await query`FOR httpsScan IN https RETURN httpsScan`
              const testHttps = await testHttpsCursor.next()
              expect(testHttps).toEqual(undefined)

              const testSslCursor = await query`FOR sslScan IN ssl RETURN sslScan`
              const testSsl = await testSslCursor.next()
              expect(testSsl).toEqual(undefined)
            })
          })
        })
      })
    })
    describe('given an unsuccessful domain removal', () => {
      describe('domain does not exist', () => {
        it('returns an error', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                removeDomain(
                  input: {
                    domainId: "${toGlobalId('domains', 1)}"
                    orgId: "${toGlobalId('organizations', 1)}"
                  }
                ) {
                  result {
                    ... on DomainResult {
                      status
                      domain {
                        domain
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
              },
              validators: { cleanseInput },
              loaders: {
                loadDomainByKey: loadDomainByKey({ query }),
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const error = {
            data: {
              removeDomain: {
                result: {
                  code: 400,
                  description: 'todo',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to remove 1 however no domain is associated with that id.`,
          ])
        })
      })
      describe('organization does not exist', () => {
        let domain
        beforeEach(async () => {
          domain = await collections.domains.save({
            domain: 'test.gc.ca',
            slug: 'test-gc-ca',
          })
        })
        it('returns an error', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                removeDomain(
                  input: {
                    domainId: "${toGlobalId('domains', domain._key)}"
                    orgId: "${toGlobalId('organizations', 1)}"
                  }
                ) {
                  result {
                    ... on DomainResult {
                      status
                      domain {
                        domain
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
              },
              validators: { cleanseInput },
              loaders: {
                loadDomainByKey: loadDomainByKey({ query }),
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const error = {
            data: {
              removeDomain: {
                result: {
                  code: 400,
                  description: 'todo',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to remove test-gc-ca in org: 1 however there is no organization associated with that id.`,
          ])
        })
      })
      describe('user attempts to remove domain from verified check org', () => {
        let org, domain
        beforeEach(async () => {
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

          domain = await collections.domains.save({
            domain: 'test.gc.ca',
            slug: 'test-gc-ca',
          })
          await collections.claims.save({
            _from: org._id,
            _to: domain._id,
          })
        })
        describe('users permission is admin', () => {
          beforeEach(async () => {
            await collections.affiliations.save({
              _from: org._id,
              _to: user._id,
              permission: 'admin',
            })
          })
          it('returns an error', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  removeDomain(
                    input: {
                      domainId: "${toGlobalId('domains', domain._key)}"
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on DomainResult {
                        status
                        domain {
                          domain
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
                },
                validators: { cleanseInput },
                loaders: {
                  loadDomainByKey: loadDomainByKey({ query }),
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            )

            const error = {
              data: {
                removeDomain: {
                  result: {
                    code: 403,
                    description: 'todo',
                  },
                },
              },
            }

            expect(response).toEqual(error)
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to remove test-gc-ca in treasury-board-secretariat but does not have permission to remove a domain from a verified check org.`,
            ])
          })
        })
        describe('users permission is user', () => {
          beforeEach(async () => {
            await collections.affiliations.save({
              _from: org._id,
              _to: user._id,
              permission: 'user',
            })
          })
          it('returns an error', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  removeDomain(
                    input: {
                      domainId: "${toGlobalId('domains', domain._key)}"
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on DomainResult {
                        status
                        domain {
                          domain
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
                },
                validators: { cleanseInput },
                loaders: {
                  loadDomainByKey: loadDomainByKey({ query }),
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            )

            const error = {
              data: {
                removeDomain: {
                  result: {
                    code: 403,
                    description: 'todo',
                  },
                },
              },
            }

            expect(response).toEqual(error)
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to remove test-gc-ca in treasury-board-secretariat but does not have permission to remove a domain from a verified check org.`,
            ])
          })
        })
        describe('user does not belong to org', () => {
          it('returns an error', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  removeDomain(
                    input: {
                      domainId: "${toGlobalId('domains', domain._key)}"
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on DomainResult {
                        status
                        domain {
                          domain
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
                },
                validators: { cleanseInput },
                loaders: {
                  loadDomainByKey: loadDomainByKey({ query }),
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            )

            const error = {
              data: {
                removeDomain: {
                  result: {
                    code: 403,
                    description: 'todo',
                  },
                },
              },
            }

            expect(response).toEqual(error)
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to remove test-gc-ca in treasury-board-secretariat but does not have permission to remove a domain from a verified check org.`,
            ])
          })
        })
      })
      describe('user attempts to remove domain from a regular org', () => {
        let org, domain
        beforeEach(async () => {
          org = await collections.organizations.save({
            verified: false,
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
          })
          await collections.claims.save({
            _from: org._id,
            _to: domain._id,
          })
        })
        describe('users permission is user', () => {
          beforeEach(async () => {
            await collections.affiliations.save({
              _from: org._id,
              _to: user._id,
              permission: 'user',
            })
          })
          it('returns an error', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  removeDomain(
                    input: {
                      domainId: "${toGlobalId('domains', domain._key)}"
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on DomainResult {
                        status
                        domain {
                          domain
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
                },
                validators: { cleanseInput },
                loaders: {
                  loadDomainByKey: loadDomainByKey({ query }),
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            )

            const error = {
              data: {
                removeDomain: {
                  result: {
                    code: 403,
                    description: 'todo',
                  },
                },
              },
            }

            expect(response).toEqual(error)
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to remove test-gc-ca in treasury-board-secretariat however they do not have permission in that org.`,
            ])
          })
        })
        describe('user does not belong to org', () => {
          it('returns an error', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  removeDomain(
                    input: {
                      domainId: "${toGlobalId('domains', domain._key)}"
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on DomainResult {
                        status
                        domain {
                          domain
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
                },
                validators: { cleanseInput },
                loaders: {
                  loadDomainByKey: loadDomainByKey({ query }),
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            )

            const error = {
              data: {
                removeDomain: {
                  result: {
                    code: 403,
                    description: 'todo',
                  },
                },
              },
            }

            expect(response).toEqual(error)
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to remove test-gc-ca in treasury-board-secretariat however they do not have permission in that org.`,
            ])
          })
        })
      })
      describe('database error occurs', () => {
        let org, domain
        beforeEach(async () => {
          org = await collections.organizations.save({
            verified: false,
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
          })
          await collections.claims.save({
            _from: org._id,
            _to: domain._id,
          })
        })
        describe('when checking to see how many edges there are', () => {
          it('returns an error', async () => {
            const domainLoader = loadDomainByKey({ query })
            const orgLoader = loadOrgByKey({ query, language: 'en' })
            const userLoader = loadUserByKey({ query })

            const mockedQuery = jest
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
                  removeDomain(
                    input: {
                      domainId: "${toGlobalId('domains', domain._key)}"
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on DomainResult {
                        status
                        domain {
                          domain
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
                query: mockedQuery,
                collections,
                transaction,
                userKey: user._key,
                auth: {
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query: mockedQuery,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: userLoader,
                  }),
                },
                validators: { cleanseInput },
                loaders: {
                  loadDomainByKey: domainLoader,
                  loadOrgByKey: orgLoader,
                  loadUserByKey: userLoader,
                },
              },
            )

            const error = [new GraphQLError('todo')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Database error occurred for user: ${user._key}, when counting domain claims for domain: test-gc-ca, error: Error: Database error occurred.`,
            ])
          })
        })
      })
      describe('Transaction error occurs', () => {
        let org, domain
        beforeEach(async () => {
          org = await collections.organizations.save({
            verified: false,
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
          })
          await collections.claims.save({
            _from: org._id,
            _to: domain._id,
          })
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'admin',
          })
        })
        describe('when removing scans', () => {
          it('returns an error', async () => {
            const domainLoader = loadDomainByKey({ query })
            const orgLoader = loadOrgByKey({ query, language: 'en' })
            const userLoader = loadUserByKey({ query })

            transaction = jest.fn().mockReturnValue({
              step() {
                throw new Error('Transaction error occurred.')
              },
            })

            const response = await graphql(
              schema,
              `
                mutation {
                  removeDomain(
                    input: {
                      domainId: "${toGlobalId('domains', domain._key)}"
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on DomainResult {
                        status
                        domain {
                          domain
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
                    loadUserByKey: userLoader,
                  }),
                },
                validators: { cleanseInput },
                loaders: {
                  loadDomainByKey: domainLoader,
                  loadOrgByKey: orgLoader,
                  loadUserByKey: userLoader,
                },
              },
            )

            const error = [new GraphQLError('todo')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Transaction error occurred while user: ${user._key} attempted to remove scan data for test-gc-ca in org: treasury-board-secretariat, error: Error: Transaction error occurred.`,
            ])
          })
        })
        describe('when removing edge', () => {
          describe('domain has only one edge', () => {
            it('returns an error', async () => {
              const domainLoader = loadDomainByKey({ query })
              const orgLoader = loadOrgByKey({ query, language: 'en' })
              const userLoader = loadUserByKey({ query })

              const cursor = {
                count: 1,
                next() {
                  return 'admin'
                },
              }

              const mockedQuery = jest
                .fn()
                .mockReturnValueOnce(cursor)
                .mockReturnValueOnce(cursor)
                .mockReturnValueOnce(cursor)
                .mockReturnValueOnce(undefined)
                .mockReturnValueOnce(undefined)
                .mockReturnValueOnce(undefined)
                .mockReturnValueOnce(undefined)
                .mockReturnValueOnce(undefined)
                .mockRejectedValue(new Error('Transaction error occurred.'))

              const response = await graphql(
                schema,
                `
                  mutation {
                    removeDomain(
                      input: {
                        domainId: "${toGlobalId('domains', domain._key)}"
                        orgId: "${toGlobalId('organizations', org._key)}"
                      }
                    ) {
                      result {
                        ... on DomainResult {
                          status
                          domain {
                            domain
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
                  query: mockedQuery,
                  collections,
                  transaction,
                  userKey: user._key,
                  auth: {
                    checkPermission: checkPermission({
                      userKey: user._key,
                      query: mockedQuery,
                    }),
                    userRequired: userRequired({
                      userKey: user._key,
                      loadUserByKey: userLoader,
                    }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: domainLoader,
                    loadOrgByKey: orgLoader,
                    loadUserByKey: userLoader,
                  },
                },
              )

              const error = [new GraphQLError('todo')]

              expect(response.errors).toEqual(error)
              expect(consoleOutput).toEqual([
                `Transaction error occurred while user: ${user._key} attempted to remove scan data for test-gc-ca in org: treasury-board-secretariat, error: Error: Transaction error occurred.`,
              ])
            })
          })
          describe('domain has more than one edge', () => {
            it('returns an error', async () => {
              const domainLoader = loadDomainByKey({ query })
              const orgLoader = loadOrgByKey({ query, language: 'en' })
              const userLoader = loadUserByKey({ query })

              const cursor = {
                count: 2,
                next() {
                  return 'admin'
                },
              }

              const mockedQuery = jest
                .fn()
                .mockReturnValueOnce(cursor)
                .mockReturnValueOnce(cursor)
                .mockReturnValueOnce(cursor)
                .mockRejectedValue(new Error('Transaction error occurred.'))

              const response = await graphql(
                schema,
                `
                  mutation {
                    removeDomain(
                      input: {
                        domainId: "${toGlobalId('domains', domain._key)}"
                        orgId: "${toGlobalId('organizations', org._key)}"
                      }
                    ) {
                      result {
                        ... on DomainResult {
                          status
                          domain {
                            domain
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
                  query: mockedQuery,
                  collections,
                  transaction,
                  userKey: user._key,
                  auth: {
                    checkPermission: checkPermission({
                      userKey: user._key,
                      query: mockedQuery,
                    }),
                    userRequired: userRequired({
                      userKey: user._key,
                      loadUserByKey: userLoader,
                    }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: domainLoader,
                    loadOrgByKey: orgLoader,
                    loadUserByKey: userLoader,
                  },
                },
              )

              const error = [new GraphQLError('todo')]

              expect(response.errors).toEqual(error)
              expect(consoleOutput).toEqual([
                `Transaction error occurred while user: ${user._key} attempted to remove claim for test-gc-ca in org: treasury-board-secretariat, error: Error: Transaction error occurred.`,
              ])
            })
          })
        })
        describe('when committing to db', () => {
          it('returns an error', async () => {
            const domainLoader = loadDomainByKey({ query })
            const orgLoader = loadOrgByKey({ query, language: 'en' })
            const userLoader = loadUserByKey({ query })

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
                  removeDomain(
                    input: {
                      domainId: "${toGlobalId('domains', domain._key)}"
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on DomainResult {
                        status
                        domain {
                          domain
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
                query,
                collections,
                transaction: mockedTransaction,
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
                },
                validators: { cleanseInput },
                loaders: {
                  loadDomainByKey: domainLoader,
                  loadOrgByKey: orgLoader,
                  loadUserByKey: userLoader,
                },
              },
            )

            const error = [new GraphQLError('todo')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Transaction commit error occurred while user: ${user._key} attempted to remove test-gc-ca in org: treasury-board-secretariat, error: Error: Transaction error occurred.`,
            ])
          })
        })
      })
    })
  })
})
