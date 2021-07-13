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
import { checkPermission, userRequired, verifiedRequired } from '../../../auth'
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
                    verifiedRequired: verifiedRequired({ i18n }),
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
                    verifiedRequired: verifiedRequired({ i18n }),
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
                      status:
                        'A réussi à supprimer le domaine : test-gc-ca de communications-security-establishment.',
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
                  verifiedRequired: verifiedRequired({ i18n }),
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
                OPTIONS { waitForSync: true }
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
                  verifiedRequired: verifiedRequired({ i18n }),
                },
                validators: { cleanseInput },
                loaders: {
                  loadDomainByKey: loadDomainByKey({ query }),
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            )

            const testDkimResultCursor =
              await query`FOR dkimResult IN dkimResults OPTIONS { waitForSync: true } RETURN dkimResult.dkimResult`
            const testDkimResult = await testDkimResultCursor.next()
            expect(testDkimResult).toEqual(true)

            const testDkimCursor =
              await query`FOR dkimScan IN dkim OPTIONS { waitForSync: true } RETURN dkimScan.dkim`
            const testDkim = await testDkimCursor.next()
            expect(testDkim).toEqual(true)

            const testDmarcCursor =
              await query`FOR dmarcScan IN dmarc OPTIONS { waitForSync: true } RETURN dmarcScan.dmarc`
            const testDmarc = await testDmarcCursor.next()
            expect(testDmarc).toEqual(true)

            const testSpfCursor =
              await query`FOR spfScan IN spf OPTIONS { waitForSync: true } RETURN spfScan.spf`
            const testSpf = await testSpfCursor.next()
            expect(testSpf).toEqual(true)

            const testHttpsCursor =
              await query`FOR httpsScan IN https OPTIONS { waitForSync: true } RETURN httpsScan.https`
            const testHttps = await testHttpsCursor.next()
            expect(testHttps).toEqual(true)

            const testSslCursor =
              await query`FOR sslScan IN ssl OPTIONS { waitForSync: true } RETURN sslScan.ssl`
            const testSsl = await testSslCursor.next()
            expect(testSsl).toEqual(true)
          })
          describe('org owns dmarc summary data', () => {
            beforeEach(async () => {
              await collections.ownership.save({
                _from: secondOrg._id,
                _to: domain._id,
              })
            })
            it('removes dmarc summary data', async () => {
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
                    verifiedRequired: verifiedRequired({ i18n }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const testOwnershipCursor =
                await query`FOR owner IN ownership OPTIONS { waitForSync: true } RETURN owner`
              const testOwnership = await testOwnershipCursor.next()
              expect(testOwnership).toEqual(undefined)

              const testDmarcSummaryCursor =
                await query`FOR dmarcSum IN dmarcSummaries OPTIONS { waitForSync: true } RETURN dmarcSum`
              const testDmarcSummary = await testDmarcSummaryCursor.next()
              expect(testDmarcSummary).toEqual(undefined)

              const testDomainsToDmarcSumCursor =
                await query`FOR item IN domainsToDmarcSummaries OPTIONS { waitForSync: true } RETURN item`
              const testDomainsToDmarcSum =
                await testDomainsToDmarcSumCursor.next()
              expect(testDomainsToDmarcSum).toEqual(undefined)
            })
          })
          describe('org does not own dmarc summary data', () => {
            beforeEach(async () => {
              await collections.ownership.save({
                _from: org._id,
                _to: domain._id,
              })
            })
            it('does not remove dmarc summary data', async () => {
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
                    verifiedRequired: verifiedRequired({ i18n }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const testOwnershipCursor =
                await query`FOR owner IN ownership OPTIONS { waitForSync: true } RETURN owner`
              const testOwnership = await testOwnershipCursor.next()
              expect(testOwnership).toBeDefined()

              const testDmarcSummaryCursor =
                await query`FOR dmarcSum IN dmarcSummaries OPTIONS { waitForSync: true } RETURN dmarcSum`
              const testDmarcSummary = await testDmarcSummaryCursor.next()
              expect(testDmarcSummary).toBeDefined()

              const testDomainsToDmarcSumCursor =
                await query`FOR item IN domainsToDmarcSummaries OPTIONS { waitForSync: true } RETURN item`
              const testDomainsToDmarcSum =
                await testDomainsToDmarcSumCursor.next()
              expect(testDomainsToDmarcSum).toBeDefined()
            })
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
                    verifiedRequired: verifiedRequired({ i18n }),
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
                    verifiedRequired: verifiedRequired({ i18n }),
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
                      status:
                        'A réussi à supprimer le domaine : test-gc-ca de communications-security-establishment.',
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
                  verifiedRequired: verifiedRequired({ i18n }),
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
                OPTIONS { waitForSync: true }
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
                  verifiedRequired: verifiedRequired({ i18n }),
                },
                validators: { cleanseInput },
                loaders: {
                  loadDomainByKey: loadDomainByKey({ query }),
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            )

            const testDkimResultCursor =
              await query`FOR dkimResult IN dkimResults OPTIONS { waitForSync: true } RETURN dkimResult.dkimResult`
            const testDkimResult = await testDkimResultCursor.next()
            expect(testDkimResult).toEqual(true)

            const testDkimCursor =
              await query`FOR dkimScan IN dkim OPTIONS { waitForSync: true } RETURN dkimScan.dkim`
            const testDkim = await testDkimCursor.next()
            expect(testDkim).toEqual(true)

            const testDmarcCursor =
              await query`FOR dmarcScan IN dmarc OPTIONS { waitForSync: true } RETURN dmarcScan.dmarc`
            const testDmarc = await testDmarcCursor.next()
            expect(testDmarc).toEqual(true)

            const testSpfCursor =
              await query`FOR spfScan IN spf OPTIONS { waitForSync: true } RETURN spfScan.spf`
            const testSpf = await testSpfCursor.next()
            expect(testSpf).toEqual(true)

            const testHttpsCursor =
              await query`FOR httpsScan IN https OPTIONS { waitForSync: true } RETURN httpsScan.https`
            const testHttps = await testHttpsCursor.next()
            expect(testHttps).toEqual(true)

            const testSslCursor =
              await query`FOR sslScan IN ssl OPTIONS { waitForSync: true } RETURN sslScan.ssl`
            const testSsl = await testSslCursor.next()
            expect(testSsl).toEqual(true)
          })
          describe('org owns dmarc summary data', () => {
            beforeEach(async () => {
              await collections.ownership.save({
                _from: secondOrg._id,
                _to: domain._id,
              })
            })
            it('removes dmarc summary data', async () => {
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
                    verifiedRequired: verifiedRequired({ i18n }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const testOwnershipCursor =
                await query`FOR owner IN ownership OPTIONS { waitForSync: true } RETURN owner`
              const testOwnership = await testOwnershipCursor.next()
              expect(testOwnership).toEqual(undefined)

              const testDmarcSummaryCursor =
                await query`FOR dmarcSum IN dmarcSummaries OPTIONS { waitForSync: true } RETURN dmarcSum`
              const testDmarcSummary = await testDmarcSummaryCursor.next()
              expect(testDmarcSummary).toEqual(undefined)

              const testDomainsToDmarcSumCursor =
                await query`FOR item IN domainsToDmarcSummaries OPTIONS { waitForSync: true } RETURN item`
              const testDomainsToDmarcSum =
                await testDomainsToDmarcSumCursor.next()
              expect(testDomainsToDmarcSum).toEqual(undefined)
            })
          })
          describe('org does not own dmarc summary data', () => {
            beforeEach(async () => {
              await collections.ownership.save({
                _from: org._id,
                _to: domain._id,
              })
            })
            it('does not remove dmarc summary data', async () => {
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
                    verifiedRequired: verifiedRequired({ i18n }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const testOwnershipCursor =
                await query`FOR owner IN ownership OPTIONS { waitForSync: true } RETURN owner`
              const testOwnership = await testOwnershipCursor.next()
              expect(testOwnership).toBeDefined()

              const testDmarcSummaryCursor =
                await query`FOR dmarcSum IN dmarcSummaries OPTIONS { waitForSync: true } RETURN dmarcSum`
              const testDmarcSummary = await testDmarcSummaryCursor.next()
              expect(testDmarcSummary).toBeDefined()

              const testDomainsToDmarcSumCursor =
                await query`FOR item IN domainsToDmarcSummaries OPTIONS { waitForSync: true } RETURN item`
              const testDomainsToDmarcSum =
                await testDomainsToDmarcSumCursor.next()
              expect(testDomainsToDmarcSum).toBeDefined()
            })
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
                    verifiedRequired: verifiedRequired({ i18n }),
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
                    verifiedRequired: verifiedRequired({ i18n }),
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
                      status:
                        'A réussi à supprimer le domaine : test-gc-ca de treasury-board-secretariat.',
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
                  verifiedRequired: verifiedRequired({ i18n }),
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
                OPTIONS { waitForSync: true }
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
                  verifiedRequired: verifiedRequired({ i18n }),
                },
                validators: { cleanseInput },
                loaders: {
                  loadDomainByKey: loadDomainByKey({ query }),
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            )

            const testDkimResultCursor =
              await query`FOR dkimResult IN dkimResults OPTIONS { waitForSync: true } RETURN dkimResult`
            const testDkimResult = await testDkimResultCursor.next()
            expect(testDkimResult).toEqual(undefined)

            const testDkimCursor =
              await query`FOR dkimScan IN dkim OPTIONS { waitForSync: true } RETURN dkimScan`
            const testDkim = await testDkimCursor.next()
            expect(testDkim).toEqual(undefined)

            const testDmarcCursor =
              await query`FOR dmarcScan IN dmarc OPTIONS { waitForSync: true } RETURN dmarcScan`
            const testDmarc = await testDmarcCursor.next()
            expect(testDmarc).toEqual(undefined)

            const testSpfCursor =
              await query`FOR spfScan IN spf OPTIONS { waitForSync: true } RETURN spfScan`
            const testSpf = await testSpfCursor.next()
            expect(testSpf).toEqual(undefined)

            const testHttpsCursor =
              await query`FOR httpsScan IN https OPTIONS { waitForSync: true } RETURN httpsScan`
            const testHttps = await testHttpsCursor.next()
            expect(testHttps).toEqual(undefined)

            const testSslCursor =
              await query`FOR sslScan IN ssl OPTIONS { waitForSync: true } RETURN sslScan`
            const testSsl = await testSslCursor.next()
            expect(testSsl).toEqual(undefined)
          })
          describe('org owns dmarc summary data', () => {
            beforeEach(async () => {
              await collections.ownership.save({
                _from: org._id,
                _to: domain._id,
              })
            })
            it('removes dmarc summary data', async () => {
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
                    verifiedRequired: verifiedRequired({ i18n }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const testOwnershipCursor =
                await query`FOR owner IN ownership OPTIONS { waitForSync: true } RETURN owner`
              const testOwnership = await testOwnershipCursor.next()
              expect(testOwnership).toEqual(undefined)

              const testDmarcSummaryCursor =
                await query`FOR dmarcSum IN dmarcSummaries OPTIONS { waitForSync: true } RETURN dmarcSum`
              const testDmarcSummary = await testDmarcSummaryCursor.next()
              expect(testDmarcSummary).toEqual(undefined)

              const testDomainsToDmarcSumCursor =
                await query`FOR item IN domainsToDmarcSummaries OPTIONS { waitForSync: true } RETURN item`
              const testDomainsToDmarcSum =
                await testDomainsToDmarcSumCursor.next()
              expect(testDomainsToDmarcSum).toEqual(undefined)
            })
          })
          describe('org does not own dmarc summary data', () => {
            beforeEach(async () => {
              await collections.ownership.save({
                _from: org._id,
                _to: domain._id,
              })
            })
            it('does not remove dmarc summary data', async () => {
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
                    verifiedRequired: verifiedRequired({ i18n }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const testOwnershipCursor =
                await query`FOR owner IN ownership OPTIONS { waitForSync: true } RETURN owner`
              const testOwnership = await testOwnershipCursor.next()
              expect(testOwnership).toBeDefined()

              const testDmarcSummaryCursor =
                await query`FOR dmarcSum IN dmarcSummaries OPTIONS { waitForSync: true } RETURN dmarcSum`
              const testDmarcSummary = await testDmarcSummaryCursor.next()
              expect(testDmarcSummary).toBeDefined()

              const testDomainsToDmarcSumCursor =
                await query`FOR item IN domainsToDmarcSummaries OPTIONS { waitForSync: true } RETURN item`
              const testDomainsToDmarcSum =
                await testDomainsToDmarcSumCursor.next()
              expect(testDomainsToDmarcSum).toBeDefined()
            })
          })
        })
        describe('domain does not belong to a verified check org', () => {
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
                    verifiedRequired: verifiedRequired({ i18n }),
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
                    verifiedRequired: verifiedRequired({ i18n }),
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
                      status:
                        'A réussi à supprimer le domaine : test-gc-ca de treasury-board-secretariat.',
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
                  verifiedRequired: verifiedRequired({ i18n }),
                },
                validators: { cleanseInput },
                loaders: {
                  loadDomainByKey: loadDomainByKey({ query }),
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            )

            await query`
              FOR domain IN domains
                OPTIONS { waitForSync: true }
                RETURN domain
            `

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
                  verifiedRequired: verifiedRequired({ i18n }),
                },
                validators: { cleanseInput },
                loaders: {
                  loadDomainByKey: loadDomainByKey({ query }),
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            )

            await query`
              FOR dkimResult IN dkimResults 
                OPTIONS { waitForSync: true }  
                RETURN dkimResult
            `

            await query`
              FOR dkimScan IN dkim 
                OPTIONS { waitForSync: true }  
                RETURN dkimScan
            `

            await query`
              FOR dmarcScan IN dmarc 
                OPTIONS { waitForSync: true }  
                RETURN dmarcScan
            `

            await query`
              FOR spfScan IN spf 
                OPTIONS { waitForSync: true }  
                RETURN spfScan
            `

            await query`
              FOR httpsScan IN https 
                OPTIONS { waitForSync: true }  
                RETURN httpsScan
            `

            await query`
              FOR sslScan IN ssl 
                OPTIONS { waitForSync: true }  
                RETURN sslScan
            `

            const testDkimResultCursor =
              await query`FOR dkimResult IN dkimResults RETURN dkimResult`
            const testDkimResult = await testDkimResultCursor.next()
            expect(testDkimResult).toEqual(undefined)

            const testDkimCursor =
              await query`FOR dkimScan IN dkim RETURN dkimScan`
            const testDkim = await testDkimCursor.next()
            expect(testDkim).toEqual(undefined)

            const testDmarcCursor =
              await query`FOR dmarcScan IN dmarc RETURN dmarcScan`
            const testDmarc = await testDmarcCursor.next()
            expect(testDmarc).toEqual(undefined)

            const testSpfCursor = await query`FOR spfScan IN spf RETURN spfScan`
            const testSpf = await testSpfCursor.next()
            expect(testSpf).toEqual(undefined)

            const testHttpsCursor =
              await query`FOR httpsScan IN https RETURN httpsScan`
            const testHttps = await testHttpsCursor.next()
            expect(testHttps).toEqual(undefined)

            const testSslCursor = await query`FOR sslScan IN ssl RETURN sslScan`
            const testSsl = await testSslCursor.next()
            expect(testSsl).toEqual(undefined)
          })
          describe('org owns dmarc summary data', () => {
            beforeEach(async () => {
              await collections.ownership.save({
                _from: org._id,
                _to: domain._id,
              })
            })
            it('removes dmarc summary data', async () => {
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
                    verifiedRequired: verifiedRequired({ i18n }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              await query`
                FOR owner IN ownership
                  OPTIONS { waitForSync: true }
                  RETURN owner
              `

              const testOwnershipCursor =
                await query`FOR owner IN ownership RETURN owner`
              const testOwnership = await testOwnershipCursor.next()
              expect(testOwnership).toEqual(undefined)

              await query`
                FOR dmarcSum IN dmarcSummaries
                  OPTIONS { waitForSync: true }
                  RETURN dmarcSum
              `

              const testDmarcSummaryCursor =
                await query`FOR dmarcSum IN dmarcSummaries RETURN dmarcSum`
              const testDmarcSummary = await testDmarcSummaryCursor.next()
              expect(testDmarcSummary).toEqual(undefined)

              await query`
                FOR item IN domainsToDmarcSummaries
                  OPTIONS { waitForSync: true }
                  RETURN item
              `

              const testDomainsToDmarcSumCursor =
                await query`FOR item IN domainsToDmarcSummaries RETURN item`
              const testDomainsToDmarcSum =
                await testDomainsToDmarcSumCursor.next()
              expect(testDomainsToDmarcSum).toEqual(undefined)
            })
          })
          describe('org does not own dmarc summary data', () => {
            beforeEach(async () => {
              await collections.ownership.save({
                _from: org._id,
                _to: domain._id,
              })
            })
            it('does not remove dmarc summary data', async () => {
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
                    verifiedRequired: verifiedRequired({ i18n }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const testOwnershipCursor =
                await query`FOR owner IN ownership RETURN owner`
              const testOwnership = await testOwnershipCursor.next()
              expect(testOwnership).toBeDefined()

              const testDmarcSummaryCursor =
                await query`FOR dmarcSum IN dmarcSummaries RETURN dmarcSum`
              const testDmarcSummary = await testDmarcSummaryCursor.next()
              expect(testDmarcSummary).toBeDefined()

              const testDomainsToDmarcSumCursor =
                await query`FOR item IN domainsToDmarcSummaries RETURN item`
              const testDomainsToDmarcSum =
                await testDomainsToDmarcSumCursor.next()
              expect(testDomainsToDmarcSum).toBeDefined()
            })
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
        await collections.affiliations.save({
          _from: org._id,
          _to: user._id,
          permission: 'admin',
        })
        const dmarcSummary = await collections.dmarcSummaries.save({
          dmarcSummary: true,
        })
        await collections.domainsToDmarcSummaries.save({
          _from: domain._id,
          _to: dmarcSummary._id,
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
                    verifiedRequired: verifiedRequired({ i18n }),
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
                    verifiedRequired: verifiedRequired({ i18n }),
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
                      status:
                        'A réussi à supprimer le domaine : test-gc-ca de treasury-board-secretariat.',
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
                  verifiedRequired: verifiedRequired({ i18n }),
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
                OPTIONS { waitForSync: true }
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
                  verifiedRequired: verifiedRequired({ i18n }),
                },
                validators: { cleanseInput },
                loaders: {
                  loadDomainByKey: loadDomainByKey({ query }),
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            )

            const testDkimResultCursor =
              await query`FOR dkimResult IN dkimResults OPTIONS { waitForSync: true } RETURN dkimResult.dkimResult`
            const testDkimResult = await testDkimResultCursor.next()
            expect(testDkimResult).toEqual(true)

            const testDkimCursor =
              await query`FOR dkimScan IN dkim OPTIONS { waitForSync: true } RETURN dkimScan.dkim`
            const testDkim = await testDkimCursor.next()
            expect(testDkim).toEqual(true)

            const testDmarcCursor =
              await query`FOR dmarcScan IN dmarc OPTIONS { waitForSync: true } RETURN dmarcScan.dmarc`
            const testDmarc = await testDmarcCursor.next()
            expect(testDmarc).toEqual(true)

            const testSpfCursor =
              await query`FOR spfScan IN spf OPTIONS { waitForSync: true } RETURN spfScan.spf`
            const testSpf = await testSpfCursor.next()
            expect(testSpf).toEqual(true)

            const testHttpsCursor =
              await query`FOR httpsScan IN https OPTIONS { waitForSync: true } RETURN httpsScan.https`
            const testHttps = await testHttpsCursor.next()
            expect(testHttps).toEqual(true)

            const testSslCursor =
              await query`FOR sslScan IN ssl OPTIONS { waitForSync: true } RETURN sslScan.ssl`
            const testSsl = await testSslCursor.next()
            expect(testSsl).toEqual(true)
          })
          describe('org owns dmarc summary data', () => {
            beforeEach(async () => {
              await collections.ownership.save({
                _from: org._id,
                _to: domain._id,
              })
            })
            it('removes dmarc summary data', async () => {
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
                    verifiedRequired: verifiedRequired({ i18n }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const testOwnershipCursor =
                await query`FOR owner IN ownership OPTIONS { waitForSync: true } RETURN owner`
              const testOwnership = await testOwnershipCursor.next()
              expect(testOwnership).toEqual(undefined)

              const testDmarcSummaryCursor =
                await query`FOR dmarcSum IN dmarcSummaries OPTIONS { waitForSync: true } RETURN dmarcSum`
              const testDmarcSummary = await testDmarcSummaryCursor.next()
              expect(testDmarcSummary).toEqual(undefined)

              const testDomainsToDmarcSumCursor =
                await query`FOR item IN domainsToDmarcSummaries OPTIONS { waitForSync: true } RETURN item`
              const testDomainsToDmarcSum =
                await testDomainsToDmarcSumCursor.next()
              expect(testDomainsToDmarcSum).toEqual(undefined)
            })
          })
          describe('org does not own dmarc summary data', () => {
            beforeEach(async () => {
              await collections.ownership.save({
                _from: org._id,
                _to: domain._id,
              })
            })
            it('does not remove dmarc summary data', async () => {
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
                    verifiedRequired: verifiedRequired({ i18n }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const testOwnershipCursor =
                await query`FOR owner IN ownership OPTIONS { waitForSync: true } RETURN owner`
              const testOwnership = await testOwnershipCursor.next()
              expect(testOwnership).toBeDefined()

              const testDmarcSummaryCursor =
                await query`FOR dmarcSum IN dmarcSummaries OPTIONS { waitForSync: true } RETURN dmarcSum`
              const testDmarcSummary = await testDmarcSummaryCursor.next()
              expect(testDmarcSummary).toBeDefined()

              const testDomainsToDmarcSumCursor =
                await query`FOR item IN domainsToDmarcSummaries OPTIONS { waitForSync: true } RETURN item`
              const testDomainsToDmarcSum =
                await testDomainsToDmarcSumCursor.next()
              expect(testDomainsToDmarcSum).toBeDefined()
            })
          })
        })
      })
      describe('domain only belongs to one org', () => {
        describe('domain does not belong to a verified check org', () => {
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
                    verifiedRequired: verifiedRequired({ i18n }),
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
                    verifiedRequired: verifiedRequired({ i18n }),
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
                      status:
                        'A réussi à supprimer le domaine : test-gc-ca de treasury-board-secretariat.',
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
                  verifiedRequired: verifiedRequired({ i18n }),
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
                OPTIONS { waitForSync: true }
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
                  verifiedRequired: verifiedRequired({ i18n }),
                },
                validators: { cleanseInput },
                loaders: {
                  loadDomainByKey: loadDomainByKey({ query }),
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            )

            const testDkimResultCursor =
              await query`FOR dkimResult IN dkimResults OPTIONS { waitForSync: true } RETURN dkimResult`
            const testDkimResult = await testDkimResultCursor.next()
            expect(testDkimResult).toEqual(undefined)

            const testDkimCursor =
              await query`FOR dkimScan IN dkim OPTIONS { waitForSync: true } RETURN dkimScan`
            const testDkim = await testDkimCursor.next()
            expect(testDkim).toEqual(undefined)

            const testDmarcCursor =
              await query`FOR dmarcScan IN dmarc OPTIONS { waitForSync: true } RETURN dmarcScan`
            const testDmarc = await testDmarcCursor.next()
            expect(testDmarc).toEqual(undefined)

            const testSpfCursor =
              await query`FOR spfScan IN spf OPTIONS { waitForSync: true } RETURN spfScan`
            const testSpf = await testSpfCursor.next()
            expect(testSpf).toEqual(undefined)

            const testHttpsCursor =
              await query`FOR httpsScan IN https OPTIONS { waitForSync: true } RETURN httpsScan`
            const testHttps = await testHttpsCursor.next()
            expect(testHttps).toEqual(undefined)

            const testSslCursor =
              await query`FOR sslScan IN ssl OPTIONS { waitForSync: true } RETURN sslScan`
            const testSsl = await testSslCursor.next()
            expect(testSsl).toEqual(undefined)
          })
          describe('org owns dmarc summary data', () => {
            beforeEach(async () => {
              await collections.ownership.save({
                _from: org._id,
                _to: domain._id,
              })
            })
            it('removes dmarc summary data', async () => {
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
                    verifiedRequired: verifiedRequired({ i18n }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const testOwnershipCursor =
                await query`FOR owner IN ownership OPTIONS { waitForSync: true } RETURN owner`
              const testOwnership = await testOwnershipCursor.next()
              expect(testOwnership).toEqual(undefined)

              const testDmarcSummaryCursor =
                await query`FOR dmarcSum IN dmarcSummaries OPTIONS { waitForSync: true } RETURN dmarcSum`
              const testDmarcSummary = await testDmarcSummaryCursor.next()
              expect(testDmarcSummary).toEqual(undefined)

              const testDomainsToDmarcSumCursor =
                await query`FOR item IN domainsToDmarcSummaries OPTIONS { waitForSync: true } RETURN item`
              const testDomainsToDmarcSum =
                await testDomainsToDmarcSumCursor.next()
              expect(testDomainsToDmarcSum).toEqual(undefined)
            })
          })
          describe('org does not own dmarc summary data', () => {
            beforeEach(async () => {
              await collections.ownership.save({
                _from: org._id,
                _to: domain._id,
              })
            })
            it('does not remove dmarc summary data', async () => {
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
                    verifiedRequired: verifiedRequired({ i18n }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const testOwnershipCursor =
                await query`FOR owner IN ownership OPTIONS { waitForSync: true } RETURN owner`
              const testOwnership = await testOwnershipCursor.next()
              expect(testOwnership).toBeDefined()

              const testDmarcSummaryCursor =
                await query`FOR dmarcSum IN dmarcSummaries OPTIONS { waitForSync: true } RETURN dmarcSum`
              const testDmarcSummary = await testDmarcSummaryCursor.next()
              expect(testDmarcSummary).toBeDefined()

              const testDomainsToDmarcSumCursor =
                await query`FOR item IN domainsToDmarcSummaries OPTIONS { waitForSync: true } RETURN item`
              const testDomainsToDmarcSum =
                await testDomainsToDmarcSumCursor.next()
              expect(testDomainsToDmarcSum).toBeDefined()
            })
          })
        })
      })
    })
  })
  describe('given an unsuccessful domain removal', () => {
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
                verifiedRequired: verifiedRequired({ i18n }),
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
                verifiedRequired: verifiedRequired({ i18n }),
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
                  verifiedRequired: verifiedRequired({ i18n }),
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
                  verifiedRequired: verifiedRequired({ i18n }),
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
                  verifiedRequired: verifiedRequired({ i18n }),
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
                  verifiedRequired: verifiedRequired({ i18n }),
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
                  verifiedRequired: verifiedRequired({ i18n }),
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
                  verifiedRequired: verifiedRequired({ i18n }),
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
        describe('when checking to see if domain has dmarc summary data', () => {
          it('returns an error', async () => {
            const mockedQuery = jest
              .fn()
              .mockReturnValueOnce()
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
                  checkPermission: jest.fn().mockReturnValue('admin'),
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                  verifiedRequired: verifiedRequired({ i18n }),
                },
                validators: { cleanseInput },
                loaders: {
                  loadDomainByKey: loadDomainByKey({ query }),
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            )

            const error = [
              new GraphQLError('Unable to remove domain. Please try again.'),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Database error occurred for user: ${user._key}, when counting ownership claims for domain: test-gc-ca, error: Error: Database error occurred.`,
            ])
          })
        })
      })
      describe('trx step error occurs', () => {
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
        describe('domain has dmarc summary info', () => {
          beforeEach(async () => {
            const dmarcSummary = await collections.dmarcSummaries.save({
              dmarcSummary: true,
            })
            await collections.domainsToDmarcSummaries.save({
              _from: domain._id,
              _to: dmarcSummary._id,
            })
            await collections.ownership.save({
              _from: org._id,
              _to: domain._id,
            })
          })
          describe('when removing dmarc summary data', () => {
            it('throws an error', async () => {
              const mockedTransaction = jest.fn().mockReturnValue({
                step: jest.fn().mockRejectedValue(new Error('trx step error')),
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
                    verifiedRequired: verifiedRequired({ i18n }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const error = [
                new GraphQLError('Unable to remove domain. Please try again.'),
              ]

              expect(response.errors).toEqual(error)
              expect(consoleOutput).toEqual([
                `Trx step error occurred when removing dmarc summary data for user: ${user._key} while attempting to remove domain: test-gc-ca, error: Error: trx step error`,
              ])
            })
          })
          describe('when removing ownership info', () => {
            it('throws an error', async () => {
              const mockedTransaction = jest.fn().mockReturnValue({
                step: jest
                  .fn()
                  .mockReturnValueOnce()
                  .mockRejectedValue(new Error('trx step error')),
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
                    verifiedRequired: verifiedRequired({ i18n }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const error = [
                new GraphQLError('Unable to remove domain. Please try again.'),
              ]

              expect(response.errors).toEqual(error)
              expect(consoleOutput).toEqual([
                `Trx step error occurred when removing ownership data for user: ${user._key} while attempting to remove domain: test-gc-ca, error: Error: trx step error`,
              ])
            })
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
                  verifiedRequired: verifiedRequired({ i18n }),
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
              `Trx step error occurred while user: ${user._key} attempted to remove scan data for test-gc-ca in org: treasury-board-secretariat, error: Error: Transaction error occurred.`,
            ])
          })
        })
        describe('when removing edge', () => {
          describe('domain has only one edge', () => {
            it('returns an error', async () => {
              const mockedTransaction = jest.fn().mockReturnValue({
                step: jest
                  .fn()
                  .mockReturnValueOnce()
                  .mockReturnValueOnce()
                  .mockReturnValueOnce()
                  .mockReturnValueOnce()
                  .mockReturnValueOnce()
                  .mockReturnValueOnce()
                  .mockRejectedValue(new Error('Step error')),
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
                  query: query,
                  collections,
                  transaction: mockedTransaction,
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
                    verifiedRequired: verifiedRequired({ i18n }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const error = [
                new GraphQLError('Unable to remove domain. Please try again.'),
              ]

              expect(response.errors).toEqual(error)
              expect(consoleOutput).toEqual([
                `Trx step error occurred while user: ${user._key} attempted to remove test-gc-ca in org: treasury-board-secretariat, error: Error: Step error`,
              ])
            })
          })
          describe('domain has more than one edge', () => {
            it('returns an error', async () => {
              const cursor = {
                count: 2,
              }

              const mockedQuery = jest.fn().mockReturnValue(cursor)

              const mockedTransaction = jest.fn().mockReturnValue({
                step: jest.fn().mockRejectedValue(new Error('Step error')),
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
                  query: mockedQuery,
                  collections,
                  transaction: mockedTransaction,
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
                    verifiedRequired: verifiedRequired({ i18n }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const error = [
                new GraphQLError('Unable to remove domain. Please try again.'),
              ]

              expect(response.errors).toEqual(error)
              expect(consoleOutput).toEqual([
                `Trx step error occurred while user: ${user._key} attempted to remove claim for test-gc-ca in org: treasury-board-secretariat, error: Error: Step error`,
              ])
            })
          })
        })
      })
      describe('trx commit error occurs', () => {
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
                  verifiedRequired: verifiedRequired({ i18n }),
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
              `Trx commit error occurred while user: ${user._key} attempted to remove test-gc-ca in org: treasury-board-secretariat, error: Error: Transaction error occurred.`,
            ])
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
                verifiedRequired: verifiedRequired({ i18n }),
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
                  description: 'Impossible de supprimer un domaine inconnu.',
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
                verifiedRequired: verifiedRequired({ i18n }),
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
                    "Impossible de supprimer le domaine d'une organisation inconnue.",
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
                  verifiedRequired: verifiedRequired({ i18n }),
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
                      "Permission refusée : Veuillez contacter l'utilisateur de l'organisation pour obtenir de l'aide sur la mise à jour de ce domaine.",
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
                  verifiedRequired: verifiedRequired({ i18n }),
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
                      "Permission refusée : Veuillez contacter l'utilisateur de l'organisation pour obtenir de l'aide sur la mise à jour de ce domaine.",
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
                  verifiedRequired: verifiedRequired({ i18n }),
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
                      "Permission refusée : Veuillez contacter l'utilisateur de l'organisation pour obtenir de l'aide sur la mise à jour de ce domaine.",
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
                  verifiedRequired: verifiedRequired({ i18n }),
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
                      "Permission refusée : Veuillez contacter l'administrateur de l'organisation pour obtenir de l'aide afin de supprimer le domaine.",
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
                  verifiedRequired: verifiedRequired({ i18n }),
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
                      "Permission refusée : Veuillez contacter l'administrateur de l'organisation pour obtenir de l'aide afin de supprimer le domaine.",
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
                  verifiedRequired: verifiedRequired({ i18n }),
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
              new GraphQLError(
                'Impossible de supprimer le domaine. Veuillez réessayer.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Database error occurred for user: ${user._key}, when counting domain claims for domain: test-gc-ca, error: Error: Database error occurred.`,
            ])
          })
        })
        describe('when checking to see if domain has dmarc summary data', () => {
          it('returns an error', async () => {
            const mockedQuery = jest
              .fn()
              .mockReturnValueOnce()
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
                  checkPermission: jest.fn().mockReturnValue('admin'),
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                  verifiedRequired: verifiedRequired({ i18n }),
                },
                validators: { cleanseInput },
                loaders: {
                  loadDomainByKey: loadDomainByKey({ query }),
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            )

            const error = [
              new GraphQLError(
                'Impossible de supprimer le domaine. Veuillez réessayer.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Database error occurred for user: ${user._key}, when counting ownership claims for domain: test-gc-ca, error: Error: Database error occurred.`,
            ])
          })
        })
      })
      describe('trx step error occurs', () => {
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
        describe('domain has dmarc summary info', () => {
          beforeEach(async () => {
            const dmarcSummary = await collections.dmarcSummaries.save({
              dmarcSummary: true,
            })
            await collections.domainsToDmarcSummaries.save({
              _from: domain._id,
              _to: dmarcSummary._id,
            })
            await collections.ownership.save({
              _from: org._id,
              _to: domain._id,
            })
          })
          describe('when removing dmarc summary data', () => {
            it('throws an error', async () => {
              const mockedTransaction = jest.fn().mockReturnValue({
                step: jest.fn().mockRejectedValue(new Error('trx step error')),
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
                    verifiedRequired: verifiedRequired({ i18n }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const error = [
                new GraphQLError(
                  'Impossible de supprimer le domaine. Veuillez réessayer.',
                ),
              ]

              expect(response.errors).toEqual(error)
              expect(consoleOutput).toEqual([
                `Trx step error occurred when removing dmarc summary data for user: ${user._key} while attempting to remove domain: test-gc-ca, error: Error: trx step error`,
              ])
            })
          })
          describe('when removing ownership info', () => {
            it('throws an error', async () => {
              const mockedTransaction = jest.fn().mockReturnValue({
                step: jest
                  .fn()
                  .mockReturnValueOnce()
                  .mockRejectedValue(new Error('trx step error')),
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
                    verifiedRequired: verifiedRequired({ i18n }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const error = [
                new GraphQLError(
                  'Impossible de supprimer le domaine. Veuillez réessayer.',
                ),
              ]

              expect(response.errors).toEqual(error)
              expect(consoleOutput).toEqual([
                `Trx step error occurred when removing ownership data for user: ${user._key} while attempting to remove domain: test-gc-ca, error: Error: trx step error`,
              ])
            })
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
                  verifiedRequired: verifiedRequired({ i18n }),
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
              new GraphQLError(
                'Impossible de supprimer le domaine. Veuillez réessayer.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred while user: ${user._key} attempted to remove scan data for test-gc-ca in org: treasury-board-secretariat, error: Error: Transaction error occurred.`,
            ])
          })
        })
        describe('when removing edge', () => {
          describe('domain has only one edge', () => {
            it('returns an error', async () => {
              const mockedTransaction = jest.fn().mockReturnValue({
                step: jest
                  .fn()
                  .mockReturnValueOnce()
                  .mockReturnValueOnce()
                  .mockReturnValueOnce()
                  .mockReturnValueOnce()
                  .mockReturnValueOnce()
                  .mockReturnValueOnce()
                  .mockRejectedValue(new Error('Step error')),
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
                  query: query,
                  collections,
                  transaction: mockedTransaction,
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
                    verifiedRequired: verifiedRequired({ i18n }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const error = [
                new GraphQLError(
                  'Impossible de supprimer le domaine. Veuillez réessayer.',
                ),
              ]

              expect(response.errors).toEqual(error)
              expect(consoleOutput).toEqual([
                `Trx step error occurred while user: ${user._key} attempted to remove test-gc-ca in org: treasury-board-secretariat, error: Error: Step error`,
              ])
            })
          })
          describe('domain has more than one edge', () => {
            it('returns an error', async () => {
              const cursor = {
                count: 2,
              }

              const mockedQuery = jest.fn().mockReturnValue(cursor)

              const mockedTransaction = jest.fn().mockReturnValue({
                step: jest.fn().mockRejectedValue(new Error('Step error')),
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
                  query: mockedQuery,
                  collections,
                  transaction: mockedTransaction,
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
                    verifiedRequired: verifiedRequired({ i18n }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              )

              const error = [
                new GraphQLError(
                  'Impossible de supprimer le domaine. Veuillez réessayer.',
                ),
              ]

              expect(response.errors).toEqual(error)
              expect(consoleOutput).toEqual([
                `Trx step error occurred while user: ${user._key} attempted to remove claim for test-gc-ca in org: treasury-board-secretariat, error: Error: Step error`,
              ])
            })
          })
        })
      })
      describe('trx commit error occurs', () => {
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
                  verifiedRequired: verifiedRequired({ i18n }),
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
              new GraphQLError(
                'Impossible de supprimer le domaine. Veuillez réessayer.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx commit error occurred while user: ${user._key} attempted to remove test-gc-ca in org: treasury-board-secretariat, error: Error: Transaction error occurred.`,
            ])
          })
        })
      })
    })
  })
})
