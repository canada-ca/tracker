import { setupI18n } from '@lingui/core'
import { dbNameFromFile } from 'arango-tools'
import { ensureDatabase as ensure } from '../../../testUtilities'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { toGlobalId } from 'graphql-relay'

import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { cleanseInput } from '../../../validators'
import { checkPermission, userRequired, verifiedRequired, tfaRequired } from '../../../auth'
import { loadDomainByKey } from '../../loaders'
import { loadOrgByKey } from '../../../organization/loaders'
import { loadUserByKey } from '../../../user/loaders'
import dbschema from '../../../../database.json'
import { collectionNames } from '../../../collection-names'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('removing a domain', () => {
  let schema, i18n, query, drop, truncate, collections, transaction, user

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
  describe('given a successful domain removal', () => {
    beforeEach(async () => {
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
      user = await collections.users.save({
        userName: 'test.account@istio.actually.exists',
        emailValidated: true,
        tfaSendMethod: 'email',
      })
    })
    afterEach(async () => {
      await truncate()
      await drop()
    })
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

        const dns = await collections.dns.save({ dns: true })
        await collections.domainsDNS.save({
          _from: domain._id,
          _to: dns._id,
        })

        const web = await collections.web.save({ web: true })
        await collections.domainsWeb.save({
          _from: domain._id,
          _to: web._id,
        })

        const webScan = await collections.webScan.save({
          webScan: true,
        })
        await collections.webToWebScans.save({
          _from: web._id,
          _to: webScan._id,
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
              const response = await graphql({
                schema,
                source: `
                mutation {
                  removeDomain(
                    input: {
                      reason: WRONG_ORG,
                      domainId: "${toGlobalId('domain', domain._key)}"
                      orgId: "${toGlobalId('organization', secondOrg._key)}"
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
                rootValue: null,
                contextValue: {
                  i18n,
                  query,
                  collections: collectionNames,
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
                    tfaRequired: tfaRequired({ i18n }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              })

              const expectedResponse = {
                data: {
                  removeDomain: {
                    result: {
                      status: `Successfully removed domain: test.gc.ca from communications-security-establishment.`,
                      domain: {
                        domain: 'test.gc.ca',
                      },
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully removed domain: test.gc.ca from org: communications-security-establishment.`,
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
              const response = await graphql({
                schema,
                source: `
                mutation {
                  removeDomain(
                    input: {
                      reason: WRONG_ORG,
                      domainId: "${toGlobalId('domain', domain._key)}"
                      orgId: "${toGlobalId('organization', secondOrg._key)}"
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
                rootValue: null,
                contextValue: {
                  i18n,
                  query,
                  collections: collectionNames,
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
                    tfaRequired: tfaRequired({ i18n }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              })

              const expectedResponse = {
                data: {
                  removeDomain: {
                    result: {
                      status: 'A réussi à supprimer le domaine : test.gc.ca de communications-security-establishment.',
                      domain: {
                        domain: 'test.gc.ca',
                      },
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully removed domain: test.gc.ca from org: communications-security-establishment.`,
              ])
            })
          })
          it('does not remove domain', async () => {
            await graphql({
              schema,
              source: `
                mutation {
                  removeDomain(
                    input: {
                      reason: WRONG_ORG,
                      domainId: "${toGlobalId('domain', domain._key)}"
                      orgId: "${toGlobalId('organization', secondOrg._key)}"
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
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
                  tfaRequired: tfaRequired({ i18n }),
                },
                validators: { cleanseInput },
                loaders: {
                  loadDomainByKey: loadDomainByKey({ query }),
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

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
            await graphql({
              schema,
              source: `
                mutation {
                  removeDomain(
                    input: {
                      reason: WRONG_ORG,
                      domainId: "${toGlobalId('domain', domain._key)}"
                      orgId: "${toGlobalId('organization', secondOrg._key)}"
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
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
                  tfaRequired: tfaRequired({ i18n }),
                },
                validators: { cleanseInput },
                loaders: {
                  loadDomainByKey: loadDomainByKey({ query }),
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            const testWebScanCursor =
              await query`FOR wScan IN webScan OPTIONS { waitForSync: true } RETURN wScan.webScan`
            const testWebScan = await testWebScanCursor.next()
            expect(testWebScan).toEqual(true)

            const testDNSCursor = await query`FOR dnsResult IN dns OPTIONS { waitForSync: true } RETURN dnsResult.dns`
            const testDNS = await testDNSCursor.next()
            expect(testDNS).toEqual(true)

            const testWebCursor = await query`FOR webResult IN web OPTIONS { waitForSync: true } RETURN webResult.web`
            const testWeb = await testWebCursor.next()
            expect(testWeb).toEqual(true)
          })
          describe('org owns dmarc summary data', () => {
            beforeEach(async () => {
              await collections.ownership.save({
                _from: secondOrg._id,
                _to: domain._id,
              })
            })
            it('removes dmarc summary data', async () => {
              await graphql({
                schema,
                source: `
                  mutation {
                    removeDomain(
                      input: {
                      reason: WRONG_ORG,
                        domainId: "${toGlobalId('domain', domain._key)}"
                        orgId: "${toGlobalId('organization', secondOrg._key)}"
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
                rootValue: null,
                contextValue: {
                  i18n,
                  query,
                  collections: collectionNames,
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
                    tfaRequired: tfaRequired({ i18n }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              })

              const testOwnershipCursor = await query`FOR owner IN ownership OPTIONS { waitForSync: true } RETURN owner`
              const testOwnership = await testOwnershipCursor.next()
              expect(testOwnership).toEqual(undefined)

              const testDmarcSummaryCursor =
                await query`FOR dmarcSum IN dmarcSummaries OPTIONS { waitForSync: true } RETURN dmarcSum`
              const testDmarcSummary = await testDmarcSummaryCursor.next()
              expect(testDmarcSummary).toEqual(undefined)

              const testDomainsToDmarcSumCursor =
                await query`FOR item IN domainsToDmarcSummaries OPTIONS { waitForSync: true } RETURN item`
              const testDomainsToDmarcSum = await testDomainsToDmarcSumCursor.next()
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
              await graphql({
                schema,
                source: `
                  mutation {
                    removeDomain(
                      input: {
                      reason: WRONG_ORG,
                        domainId: "${toGlobalId('domain', domain._key)}"
                        orgId: "${toGlobalId('organization', secondOrg._key)}"
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
                rootValue: null,
                contextValue: {
                  i18n,
                  query,
                  collections: collectionNames,
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
                    tfaRequired: tfaRequired({ i18n }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              })

              const testOwnershipCursor = await query`FOR owner IN ownership OPTIONS { waitForSync: true } RETURN owner`
              const testOwnership = await testOwnershipCursor.next()
              expect(testOwnership).toBeDefined()

              const testDmarcSummaryCursor =
                await query`FOR dmarcSum IN dmarcSummaries OPTIONS { waitForSync: true } RETURN dmarcSum`
              const testDmarcSummary = await testDmarcSummaryCursor.next()
              expect(testDmarcSummary).toBeDefined()

              const testDomainsToDmarcSumCursor =
                await query`FOR item IN domainsToDmarcSummaries OPTIONS { waitForSync: true } RETURN item`
              const testDomainsToDmarcSum = await testDomainsToDmarcSumCursor.next()
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
              const response = await graphql({
                schema,
                source: `
                mutation {
                  removeDomain(
                    input: {
                      reason: WRONG_ORG,
                      domainId: "${toGlobalId('domain', domain._key)}"
                      orgId: "${toGlobalId('organization', secondOrg._key)}"
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
                rootValue: null,
                contextValue: {
                  i18n,
                  query,
                  collections: collectionNames,
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
                    tfaRequired: tfaRequired({ i18n }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              })

              const expectedResponse = {
                data: {
                  removeDomain: {
                    result: {
                      status: `Successfully removed domain: test.gc.ca from communications-security-establishment.`,
                      domain: {
                        domain: 'test.gc.ca',
                      },
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully removed domain: test.gc.ca from org: communications-security-establishment.`,
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
              const response = await graphql({
                schema,
                source: `
              mutation {
                removeDomain(
                  input: {
                      reason: WRONG_ORG,
                    domainId: "${toGlobalId('domain', domain._key)}"
                    orgId: "${toGlobalId('organization', secondOrg._key)}"
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
                rootValue: null,
                contextValue: {
                  i18n,
                  query,
                  collections: collectionNames,
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
                    tfaRequired: tfaRequired({ i18n }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              })

              const expectedResponse = {
                data: {
                  removeDomain: {
                    result: {
                      status: 'A réussi à supprimer le domaine : test.gc.ca de communications-security-establishment.',
                      domain: {
                        domain: 'test.gc.ca',
                      },
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully removed domain: test.gc.ca from org: communications-security-establishment.`,
              ])
            })
          })
          it('does not remove domain', async () => {
            await graphql({
              schema,
              source: `
                mutation {
                  removeDomain(
                    input: {
                      reason: WRONG_ORG,
                      domainId: "${toGlobalId('domain', domain._key)}"
                      orgId: "${toGlobalId('organization', secondOrg._key)}"
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
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
                  tfaRequired: tfaRequired({ i18n }),
                },
                validators: { cleanseInput },
                loaders: {
                  loadDomainByKey: loadDomainByKey({ query }),
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

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
            await graphql({
              schema,
              source: `
                mutation {
                  removeDomain(
                    input: {
                      reason: WRONG_ORG,
                      domainId: "${toGlobalId('domain', domain._key)}"
                      orgId: "${toGlobalId('organization', secondOrg._key)}"
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
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
                  tfaRequired: tfaRequired({ i18n }),
                },
                validators: { cleanseInput },
                loaders: {
                  loadDomainByKey: loadDomainByKey({ query }),
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            await query`FOR wScan IN webScan OPTIONS { waitForSync: true } RETURN wScan`
            await query`FOR dnsResult IN dns OPTIONS { waitForSync: true } RETURN dnsResult`
            await query`FOR webResult IN web OPTIONS { waitForSync: true } RETURN webResult`

            const testWebScanCursor =
              await query`FOR wScan IN webScan OPTIONS { waitForSync: true } RETURN wScan.webScan`
            const testWebScan = await testWebScanCursor.next()
            expect(testWebScan).toEqual(true)

            const testDNSCursor = await query`FOR dnsResult IN dns OPTIONS { waitForSync: true } RETURN dnsResult.dns`
            const testDNS = await testDNSCursor.next()
            expect(testDNS).toEqual(true)

            const testWebCursor = await query`FOR webResult IN web OPTIONS { waitForSync: true } RETURN webResult.web`
            const testWeb = await testWebCursor.next()
            expect(testWeb).toEqual(true)
          })
          describe('org owns dmarc summary data', () => {
            beforeEach(async () => {
              await collections.ownership.save({
                _from: secondOrg._id,
                _to: domain._id,
              })
            })
            it('removes dmarc summary data', async () => {
              await graphql({
                schema,
                source: `
                  mutation {
                    removeDomain(
                      input: {
                      reason: WRONG_ORG,
                        domainId: "${toGlobalId('domain', domain._key)}"
                        orgId: "${toGlobalId('organization', secondOrg._key)}"
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
                rootValue: null,
                contextValue: {
                  i18n,
                  query,
                  collections: collectionNames,
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
                    tfaRequired: tfaRequired({ i18n }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              })

              const testOwnershipCursor = await query`FOR owner IN ownership OPTIONS { waitForSync: true } RETURN owner`
              const testOwnership = await testOwnershipCursor.next()
              expect(testOwnership).toEqual(undefined)

              const testDmarcSummaryCursor =
                await query`FOR dmarcSum IN dmarcSummaries OPTIONS { waitForSync: true } RETURN dmarcSum`
              const testDmarcSummary = await testDmarcSummaryCursor.next()
              expect(testDmarcSummary).toEqual(undefined)

              const testDomainsToDmarcSumCursor =
                await query`FOR item IN domainsToDmarcSummaries OPTIONS { waitForSync: true } RETURN item`
              const testDomainsToDmarcSum = await testDomainsToDmarcSumCursor.next()
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
              await graphql({
                schema,
                source: `
                  mutation {
                    removeDomain(
                      input: {
                      reason: WRONG_ORG,
                        domainId: "${toGlobalId('domain', domain._key)}"
                        orgId: "${toGlobalId('organization', secondOrg._key)}"
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
                rootValue: null,
                contextValue: {
                  i18n,
                  query,
                  collections: collectionNames,
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
                    tfaRequired: tfaRequired({ i18n }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              })

              const testOwnershipCursor = await query`FOR owner IN ownership OPTIONS { waitForSync: true } RETURN owner`
              const testOwnership = await testOwnershipCursor.next()
              expect(testOwnership).toBeDefined()

              const testDmarcSummaryCursor =
                await query`FOR dmarcSum IN dmarcSummaries OPTIONS { waitForSync: true } RETURN dmarcSum`
              const testDmarcSummary = await testDmarcSummaryCursor.next()
              expect(testDmarcSummary).toBeDefined()

              const testDomainsToDmarcSumCursor =
                await query`FOR item IN domainsToDmarcSummaries OPTIONS { waitForSync: true } RETURN item`
              const testDomainsToDmarcSum = await testDomainsToDmarcSumCursor.next()
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
              const response = await graphql({
                schema,
                source: `
                mutation {
                  removeDomain(
                    input: {
                      reason: WRONG_ORG,
                      domainId: "${toGlobalId('domain', domain._key)}"
                      orgId: "${toGlobalId('organization', org._key)}"
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
                rootValue: null,
                contextValue: {
                  i18n,
                  query,
                  collections: collectionNames,
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
                    tfaRequired: tfaRequired({ i18n }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              })

              const expectedResponse = {
                data: {
                  removeDomain: {
                    result: {
                      status: `Successfully removed domain: test.gc.ca from treasury-board-secretariat.`,
                      domain: {
                        domain: 'test.gc.ca',
                      },
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully removed domain: test.gc.ca from org: treasury-board-secretariat.`,
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
              const response = await graphql({
                schema,
                source: `
              mutation {
                removeDomain(
                  input: {
                      reason: WRONG_ORG,
                    domainId: "${toGlobalId('domain', domain._key)}"
                    orgId: "${toGlobalId('organization', org._key)}"
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
                rootValue: null,
                contextValue: {
                  i18n,
                  query,
                  collections: collectionNames,
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
                    tfaRequired: tfaRequired({ i18n }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              })

              const expectedResponse = {
                data: {
                  removeDomain: {
                    result: {
                      status: 'A réussi à supprimer le domaine : test.gc.ca de treasury-board-secretariat.',
                      domain: {
                        domain: 'test.gc.ca',
                      },
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully removed domain: test.gc.ca from org: treasury-board-secretariat.`,
              ])
            })
          })
          it('removes domain', async () => {
            await graphql({
              schema,
              source: `
                mutation {
                  removeDomain(
                    input: {
                      reason: WRONG_ORG,
                      domainId: "${toGlobalId('domain', domain._key)}"
                      orgId: "${toGlobalId('organization', org._key)}"
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
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
                  tfaRequired: tfaRequired({ i18n }),
                },
                validators: { cleanseInput },
                loaders: {
                  loadDomainByKey: loadDomainByKey({ query }),
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

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
            await graphql({
              schema,
              source: `
                mutation {
                  removeDomain(
                    input: {
                      reason: WRONG_ORG,
                      domainId: "${toGlobalId('domain', domain._key)}"
                      orgId: "${toGlobalId('organization', org._key)}"
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
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
                  tfaRequired: tfaRequired({ i18n }),
                },
                validators: { cleanseInput },
                loaders: {
                  loadDomainByKey: loadDomainByKey({ query }),
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            await query`FOR wScan IN webScan OPTIONS { waitForSync: true } RETURN wScan`
            await query`FOR dnsResult IN dns OPTIONS { waitForSync: true } RETURN dnsResult`
            await query`FOR webResult IN web OPTIONS { waitForSync: true } RETURN webResult`

            const testWebScanCursor = await query`FOR wScan IN webScan OPTIONS { waitForSync: true } RETURN wScan`
            const testWebScan = await testWebScanCursor.next()
            expect(testWebScan).toEqual(undefined)

            const testDNSCursor = await query`FOR dnsResult IN dns OPTIONS { waitForSync: true } RETURN dnsResult`
            const testDNS = await testDNSCursor.next()
            expect(testDNS).toEqual(undefined)

            const testWebCursor = await query`FOR webResult IN web OPTIONS { waitForSync: true } RETURN webResult`
            const testWeb = await testWebCursor.next()
            expect(testWeb).toEqual(undefined)
          })
          describe('org owns dmarc summary data', () => {
            beforeEach(async () => {
              await collections.ownership.save({
                _from: org._id,
                _to: domain._id,
              })
            })
            it('removes dmarc summary data', async () => {
              await graphql({
                schema,
                source: `
                  mutation {
                    removeDomain(
                      input: {
                      reason: WRONG_ORG,
                        domainId: "${toGlobalId('domain', domain._key)}"
                        orgId: "${toGlobalId('organization', org._key)}"
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
                rootValue: null,
                contextValue: {
                  i18n,
                  query,
                  collections: collectionNames,
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
                    tfaRequired: tfaRequired({ i18n }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              })

              const testOwnershipCursor = await query`FOR owner IN ownership OPTIONS { waitForSync: true } RETURN owner`
              const testOwnership = await testOwnershipCursor.next()
              expect(testOwnership).toEqual(undefined)

              const testDmarcSummaryCursor =
                await query`FOR dmarcSum IN dmarcSummaries OPTIONS { waitForSync: true } RETURN dmarcSum`
              const testDmarcSummary = await testDmarcSummaryCursor.next()
              expect(testDmarcSummary).toEqual(undefined)

              const testDomainsToDmarcSumCursor =
                await query`FOR item IN domainsToDmarcSummaries OPTIONS { waitForSync: true } RETURN item`
              const testDomainsToDmarcSum = await testDomainsToDmarcSumCursor.next()
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
              await graphql({
                schema,
                source: `
                  mutation {
                    removeDomain(
                      input: {
                      reason: WRONG_ORG,
                        domainId: "${toGlobalId('domain', domain._key)}"
                        orgId: "${toGlobalId('organization', secondOrg._key)}"
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
                rootValue: null,
                contextValue: {
                  i18n,
                  query,
                  collections: collectionNames,
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
                    tfaRequired: tfaRequired({ i18n }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              })

              const testOwnershipCursor = await query`FOR owner IN ownership OPTIONS { waitForSync: true } RETURN owner`
              const testOwnership = await testOwnershipCursor.next()
              expect(testOwnership).toBeDefined()

              const testDmarcSummaryCursor =
                await query`FOR dmarcSum IN dmarcSummaries OPTIONS { waitForSync: true } RETURN dmarcSum`
              const testDmarcSummary = await testDmarcSummaryCursor.next()
              expect(testDmarcSummary).toBeDefined()

              const testDomainsToDmarcSumCursor =
                await query`FOR item IN domainsToDmarcSummaries OPTIONS { waitForSync: true } RETURN item`
              const testDomainsToDmarcSum = await testDomainsToDmarcSumCursor.next()
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
              const response = await graphql({
                schema,
                source: `
                mutation {
                  removeDomain(
                    input: {
                      reason: WRONG_ORG,
                      domainId: "${toGlobalId('domain', domain._key)}"
                      orgId: "${toGlobalId('organization', org._key)}"
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
                rootValue: null,
                contextValue: {
                  i18n,
                  query,
                  collections: collectionNames,
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
                    tfaRequired: tfaRequired({ i18n }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              })

              const expectedResponse = {
                data: {
                  removeDomain: {
                    result: {
                      status: `Successfully removed domain: test.gc.ca from treasury-board-secretariat.`,
                      domain: {
                        domain: 'test.gc.ca',
                      },
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully removed domain: test.gc.ca from org: treasury-board-secretariat.`,
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
              const response = await graphql({
                schema,
                source: `
                mutation {
                  removeDomain(
                    input: {
                      reason: WRONG_ORG,
                      domainId: "${toGlobalId('domain', domain._key)}"
                      orgId: "${toGlobalId('organization', org._key)}"
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
                rootValue: null,
                contextValue: {
                  i18n,
                  query,
                  collections: collectionNames,
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
                    tfaRequired: tfaRequired({ i18n }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              })

              const expectedResponse = {
                data: {
                  removeDomain: {
                    result: {
                      status: 'A réussi à supprimer le domaine : test.gc.ca de treasury-board-secretariat.',
                      domain: {
                        domain: 'test.gc.ca',
                      },
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully removed domain: test.gc.ca from org: treasury-board-secretariat.`,
              ])
            })
          })
          it('removes domain', async () => {
            await graphql({
              schema,
              source: `
                mutation {
                  removeDomain(
                    input: {
                      reason: WRONG_ORG,
                      domainId: "${toGlobalId('domain', domain._key)}"
                      orgId: "${toGlobalId('organization', org._key)}"
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
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
                  tfaRequired: tfaRequired({ i18n }),
                },
                validators: { cleanseInput },
                loaders: {
                  loadDomainByKey: loadDomainByKey({ query }),
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

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
            await graphql({
              schema,
              source: `
                mutation {
                  removeDomain(
                    input: {
                      reason: WRONG_ORG,
                      domainId: "${toGlobalId('domain', domain._key)}"
                      orgId: "${toGlobalId('organization', org._key)}"
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
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
                  tfaRequired: tfaRequired({ i18n }),
                },
                validators: { cleanseInput },
                loaders: {
                  loadDomainByKey: loadDomainByKey({ query }),
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            await query`FOR wScan IN webScan OPTIONS { waitForSync: true } RETURN wScan`
            await query`FOR dnsResult IN dns OPTIONS { waitForSync: true } RETURN dnsResult`
            await query`FOR webResult IN web OPTIONS { waitForSync: true } RETURN webResult`

            const testWebScanCursor = await query`FOR wScan IN webScan OPTIONS { waitForSync: true } RETURN wScan`
            const testWebScan = await testWebScanCursor.next()
            expect(testWebScan).toEqual(undefined)

            const testDNSCursor = await query`FOR dnsResult IN dns OPTIONS { waitForSync: true } RETURN dnsResult`
            const testDNS = await testDNSCursor.next()
            expect(testDNS).toEqual(undefined)

            const testWebCursor = await query`FOR webResult IN web OPTIONS { waitForSync: true } RETURN webResult`
            const testWeb = await testWebCursor.next()
            expect(testWeb).toEqual(undefined)
          })
          describe('org owns dmarc summary data', () => {
            beforeEach(async () => {
              await collections.ownership.save({
                _from: org._id,
                _to: domain._id,
              })
            })
            it('removes dmarc summary data', async () => {
              await graphql({
                schema,
                source: `
                  mutation {
                    removeDomain(
                      input: {
                      reason: WRONG_ORG,
                        domainId: "${toGlobalId('domain', domain._key)}"
                        orgId: "${toGlobalId('organization', org._key)}"
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
                rootValue: null,
                contextValue: {
                  i18n,
                  query,
                  collections: collectionNames,
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
                    tfaRequired: tfaRequired({ i18n }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              })

              const testOwnershipCursor = await query`FOR owner IN ownership OPTIONS { waitForSync: true } RETURN owner`
              const testOwnership = await testOwnershipCursor.next()
              expect(testOwnership).toEqual(undefined)

              const testDmarcSummaryCursor =
                await query`FOR dmarcSum IN dmarcSummaries OPTIONS { waitForSync: true } RETURN dmarcSum`
              const testDmarcSummary = await testDmarcSummaryCursor.next()
              expect(testDmarcSummary).toEqual(undefined)

              const testDomainsToDmarcSumCursor =
                await query`FOR item IN domainsToDmarcSummaries OPTIONS { waitForSync: true } RETURN item`
              const testDomainsToDmarcSum = await testDomainsToDmarcSumCursor.next()
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
              await graphql({
                schema,
                source: `
                  mutation {
                    removeDomain(
                      input: {
                      reason: WRONG_ORG,
                        domainId: "${toGlobalId('domain', domain._key)}"
                        orgId: "${toGlobalId('organization', secondOrg._key)}"
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
                rootValue: null,
                contextValue: {
                  i18n,
                  query,
                  collections: collectionNames,
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
                    tfaRequired: tfaRequired({ i18n }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              })

              const testOwnershipCursor = await query`FOR owner IN ownership OPTIONS { waitForSync: true } RETURN owner`
              const testOwnership = await testOwnershipCursor.next()
              expect(testOwnership).toBeDefined()

              const testDmarcSummaryCursor =
                await query`FOR dmarcSum IN dmarcSummaries OPTIONS { waitForSync: true } RETURN dmarcSum`
              const testDmarcSummary = await testDmarcSummaryCursor.next()
              expect(testDmarcSummary).toBeDefined()

              const testDomainsToDmarcSumCursor =
                await query`FOR item IN domainsToDmarcSummaries OPTIONS { waitForSync: true } RETURN item`
              const testDomainsToDmarcSum = await testDomainsToDmarcSumCursor.next()
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

        const dns = await collections.dns.save({ dns: true })
        await collections.domainsDNS.save({
          _from: domain._id,
          _to: dns._id,
        })

        const web = await collections.web.save({ web: true })
        await collections.domainsWeb.save({
          _from: domain._id,
          _to: web._id,
        })

        const webScan = await collections.webScan.save({
          webScan: true,
        })
        await collections.webToWebScans.save({
          _from: web._id,
          _to: webScan._id,
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
              const response = await graphql({
                schema,
                source: `
                mutation {
                  removeDomain(
                    input: {
                      reason: WRONG_ORG,
                      domainId: "${toGlobalId('domain', domain._key)}"
                      orgId: "${toGlobalId('organization', org._key)}"
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
                rootValue: null,
                contextValue: {
                  i18n,
                  query,
                  collections: collectionNames,
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
                    tfaRequired: tfaRequired({ i18n }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              })

              const expectedResponse = {
                data: {
                  removeDomain: {
                    result: {
                      status: `Successfully removed domain: test.gc.ca from treasury-board-secretariat.`,
                      domain: {
                        domain: 'test.gc.ca',
                      },
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully removed domain: test.gc.ca from org: treasury-board-secretariat.`,
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
              const response = await graphql({
                schema,
                source: `
                mutation {
                  removeDomain(
                    input: {
                      reason: WRONG_ORG,
                      domainId: "${toGlobalId('domain', domain._key)}"
                      orgId: "${toGlobalId('organization', org._key)}"
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
                rootValue: null,
                contextValue: {
                  i18n,
                  query,
                  collections: collectionNames,
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
                    tfaRequired: tfaRequired({ i18n }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              })

              const expectedResponse = {
                data: {
                  removeDomain: {
                    result: {
                      status: 'A réussi à supprimer le domaine : test.gc.ca de treasury-board-secretariat.',
                      domain: {
                        domain: 'test.gc.ca',
                      },
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully removed domain: test.gc.ca from org: treasury-board-secretariat.`,
              ])
            })
          })
          it('does not remove domain', async () => {
            await graphql({
              schema,
              source: `
                mutation {
                  removeDomain(
                    input: {
                      reason: WRONG_ORG,
                      domainId: "${toGlobalId('domain', domain._key)}"
                      orgId: "${toGlobalId('organization', org._key)}"
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
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
                  tfaRequired: tfaRequired({ i18n }),
                },
                validators: { cleanseInput },
                loaders: {
                  loadDomainByKey: loadDomainByKey({ query }),
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

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
            await graphql({
              schema,
              source: `
                mutation {
                  removeDomain(
                    input: {
                      reason: WRONG_ORG,
                      domainId: "${toGlobalId('domain', domain._key)}"
                      orgId: "${toGlobalId('organization', org._key)}"
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
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
                  tfaRequired: tfaRequired({ i18n }),
                },
                validators: { cleanseInput },
                loaders: {
                  loadDomainByKey: loadDomainByKey({ query }),
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            const testWebScanCursor =
              await query`FOR wScan IN webScan OPTIONS { waitForSync: true } RETURN wScan.webScan`
            const testWebScan = await testWebScanCursor.next()
            expect(testWebScan).toEqual(true)

            const testDNSCursor = await query`FOR dnsResult IN dns OPTIONS { waitForSync: true } RETURN dnsResult.dns`
            const testDNS = await testDNSCursor.next()
            expect(testDNS).toEqual(true)

            const testWebCursor = await query`FOR webResult IN web OPTIONS { waitForSync: true } RETURN webResult.web`
            const testWeb = await testWebCursor.next()
            expect(testWeb).toEqual(true)
          })
          describe('org owns dmarc summary data', () => {
            beforeEach(async () => {
              await collections.ownership.save({
                _from: org._id,
                _to: domain._id,
              })
            })
            it('removes dmarc summary data', async () => {
              await graphql({
                schema,
                source: `
                  mutation {
                    removeDomain(
                      input: {
                      reason: WRONG_ORG,
                        domainId: "${toGlobalId('domain', domain._key)}"
                        orgId: "${toGlobalId('organization', org._key)}"
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
                rootValue: null,
                contextValue: {
                  i18n,
                  query,
                  collections: collectionNames,
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
                    tfaRequired: tfaRequired({ i18n }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              })

              const testOwnershipCursor = await query`FOR owner IN ownership OPTIONS { waitForSync: true } RETURN owner`
              const testOwnership = await testOwnershipCursor.next()
              expect(testOwnership).toEqual(undefined)

              const testDmarcSummaryCursor =
                await query`FOR dmarcSum IN dmarcSummaries OPTIONS { waitForSync: true } RETURN dmarcSum`
              const testDmarcSummary = await testDmarcSummaryCursor.next()
              expect(testDmarcSummary).toEqual(undefined)

              const testDomainsToDmarcSumCursor =
                await query`FOR item IN domainsToDmarcSummaries OPTIONS { waitForSync: true } RETURN item`
              const testDomainsToDmarcSum = await testDomainsToDmarcSumCursor.next()
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
              await graphql({
                schema,
                source: `
                  mutation {
                    removeDomain(
                      input: {
                      reason: WRONG_ORG,
                        domainId: "${toGlobalId('domain', domain._key)}"
                        orgId: "${toGlobalId('organization', secondOrg._key)}"
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
                rootValue: null,
                contextValue: {
                  i18n,
                  query,
                  collections: collectionNames,
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
                    tfaRequired: tfaRequired({ i18n }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              })

              const testOwnershipCursor = await query`FOR owner IN ownership OPTIONS { waitForSync: true } RETURN owner`
              const testOwnership = await testOwnershipCursor.next()
              expect(testOwnership).toBeDefined()

              const testDmarcSummaryCursor =
                await query`FOR dmarcSum IN dmarcSummaries OPTIONS { waitForSync: true } RETURN dmarcSum`
              const testDmarcSummary = await testDmarcSummaryCursor.next()
              expect(testDmarcSummary).toBeDefined()

              const testDomainsToDmarcSumCursor =
                await query`FOR item IN domainsToDmarcSummaries OPTIONS { waitForSync: true } RETURN item`
              const testDomainsToDmarcSum = await testDomainsToDmarcSumCursor.next()
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
              const response = await graphql({
                schema,
                source: `
                mutation {
                  removeDomain(
                    input: {
                      reason: WRONG_ORG,
                      domainId: "${toGlobalId('domain', domain._key)}"
                      orgId: "${toGlobalId('organization', org._key)}"
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
                rootValue: null,
                contextValue: {
                  i18n,
                  query,
                  collections: collectionNames,
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
                    tfaRequired: tfaRequired({ i18n }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              })

              const expectedResponse = {
                data: {
                  removeDomain: {
                    result: {
                      status: `Successfully removed domain: test.gc.ca from treasury-board-secretariat.`,
                      domain: {
                        domain: 'test.gc.ca',
                      },
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully removed domain: test.gc.ca from org: treasury-board-secretariat.`,
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
              const response = await graphql({
                schema,
                source: `
                mutation {
                  removeDomain(
                    input: {
                      reason: WRONG_ORG,
                      domainId: "${toGlobalId('domain', domain._key)}"
                      orgId: "${toGlobalId('organization', org._key)}"
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
                rootValue: null,
                contextValue: {
                  i18n,
                  query,
                  collections: collectionNames,
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
                    tfaRequired: tfaRequired({ i18n }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              })

              const expectedResponse = {
                data: {
                  removeDomain: {
                    result: {
                      status: 'A réussi à supprimer le domaine : test.gc.ca de treasury-board-secretariat.',
                      domain: {
                        domain: 'test.gc.ca',
                      },
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully removed domain: test.gc.ca from org: treasury-board-secretariat.`,
              ])
            })
          })
          it('removes domain', async () => {
            await graphql({
              schema,
              source: `
                mutation {
                  removeDomain(
                    input: {
                      reason: WRONG_ORG,
                      domainId: "${toGlobalId('domain', domain._key)}"
                      orgId: "${toGlobalId('organization', org._key)}"
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
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
                  tfaRequired: tfaRequired({ i18n }),
                },
                validators: { cleanseInput },
                loaders: {
                  loadDomainByKey: loadDomainByKey({ query }),
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

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
            await graphql({
              schema,
              source: `
                mutation {
                  removeDomain(
                    input: {
                      reason: WRONG_ORG,
                      domainId: "${toGlobalId('domain', domain._key)}"
                      orgId: "${toGlobalId('organization', org._key)}"
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
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
                  tfaRequired: tfaRequired({ i18n }),
                },
                validators: { cleanseInput },
                loaders: {
                  loadDomainByKey: loadDomainByKey({ query }),
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            const testWebScanCursor = await query`FOR wScan IN webScan OPTIONS { waitForSync: true } RETURN wScan`
            const testWebScan = await testWebScanCursor.next()
            expect(testWebScan).toEqual(undefined)

            const testDNSCursor = await query`FOR dnsResult IN dns OPTIONS { waitForSync: true } RETURN dnsResult`
            const testDNS = await testDNSCursor.next()
            expect(testDNS).toEqual(undefined)

            const testWebCursor = await query`FOR webResult IN web OPTIONS { waitForSync: true } RETURN webResult`
            const testWeb = await testWebCursor.next()
            expect(testWeb).toEqual(undefined)
          })
          describe('org owns dmarc summary data', () => {
            beforeEach(async () => {
              await collections.ownership.save({
                _from: org._id,
                _to: domain._id,
              })
            })
            it('removes dmarc summary data', async () => {
              await graphql({
                schema,
                source: `
                  mutation {
                    removeDomain(
                      input: {
                      reason: WRONG_ORG,
                        domainId: "${toGlobalId('domain', domain._key)}"
                        orgId: "${toGlobalId('organization', org._key)}"
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
                rootValue: null,
                contextValue: {
                  i18n,
                  query,
                  collections: collectionNames,
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
                    tfaRequired: tfaRequired({ i18n }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              })

              const testOwnershipCursor = await query`FOR owner IN ownership OPTIONS { waitForSync: true } RETURN owner`
              const testOwnership = await testOwnershipCursor.next()
              expect(testOwnership).toEqual(undefined)

              const testDmarcSummaryCursor =
                await query`FOR dmarcSum IN dmarcSummaries OPTIONS { waitForSync: true } RETURN dmarcSum`
              const testDmarcSummary = await testDmarcSummaryCursor.next()
              expect(testDmarcSummary).toEqual(undefined)

              const testDomainsToDmarcSumCursor =
                await query`FOR item IN domainsToDmarcSummaries OPTIONS { waitForSync: true } RETURN item`
              const testDomainsToDmarcSum = await testDomainsToDmarcSumCursor.next()
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
              await graphql({
                schema,
                source: `
                  mutation {
                    removeDomain(
                      input: {
                      reason: WRONG_ORG,
                        domainId: "${toGlobalId('domain', domain._key)}"
                        orgId: "${toGlobalId('organization', secondOrg._key)}"
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
                rootValue: null,
                contextValue: {
                  i18n,
                  query,
                  collections: collectionNames,
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
                    tfaRequired: tfaRequired({ i18n }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: loadDomainByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                },
              })

              const testOwnershipCursor = await query`FOR owner IN ownership OPTIONS { waitForSync: true } RETURN owner`
              const testOwnership = await testOwnershipCursor.next()
              expect(testOwnership).toBeDefined()

              const testDmarcSummaryCursor =
                await query`FOR dmarcSum IN dmarcSummaries OPTIONS { waitForSync: true } RETURN dmarcSum`
              const testDmarcSummary = await testDmarcSummaryCursor.next()
              expect(testDmarcSummary).toBeDefined()

              const testDomainsToDmarcSumCursor =
                await query`FOR item IN domainsToDmarcSummaries OPTIONS { waitForSync: true } RETURN item`
              const testDomainsToDmarcSum = await testDomainsToDmarcSumCursor.next()
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
          const response = await graphql({
            schema,
            source: `
            mutation {
              removeDomain(
                input: {
                      reason: WRONG_ORG,
                  domainId: "${toGlobalId('domain', 1)}"
                  orgId: "${toGlobalId('organization', 1)}"
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
            rootValue: null,
            contextValue: {
              i18n,
              query,
              collections: collectionNames,
              transaction,
              userKey: 123,
              auth: {
                checkPermission: jest.fn().mockReturnValue('admin'),
                userRequired: jest.fn(),
                verifiedRequired: jest.fn(),
                tfaRequired: jest.fn(),
              },
              validators: { cleanseInput },
              loaders: {
                loadDomainByKey: {
                  load: jest.fn().mockReturnValue(undefined),
                },
                loadOrgByKey: jest.fn(),
                loadUserByKey: jest.fn(),
              },
            },
          })

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
            `User: 123 attempted to remove 1 however no domain is associated with that id.`,
          ])
        })
      })
      describe('organization does not exist', () => {
        it('returns an error', async () => {
          const response = await graphql({
            schema,
            source: `
            mutation {
              removeDomain(
                input: {
                      reason: WRONG_ORG,
                  domainId: "${toGlobalId('domain', 123)}"
                  orgId: "${toGlobalId('organization', 1)}"
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
            rootValue: null,
            contextValue: {
              i18n,
              query,
              collections: collectionNames,
              transaction,
              userKey: 123,
              auth: {
                checkPermission: jest.fn().mockReturnValue('admin'),
                userRequired: jest.fn(),
                verifiedRequired: jest.fn(),
                tfaRequired: jest.fn(),
              },
              validators: { cleanseInput },
              loaders: {
                loadDomainByKey: {
                  load: jest.fn().mockReturnValue({}),
                },
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue(undefined),
                },
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          })

          const error = {
            data: {
              removeDomain: {
                result: {
                  code: 400,
                  description: 'Unable to remove domain from unknown organization.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to remove undefined in org: 1 however there is no organization associated with that id.`,
          ])
        })
      })
      describe('user attempts to remove domain from verified check org', () => {
        describe('users permission is admin', () => {
          it('returns an error', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                removeDomain(
                  input: {
                      reason: WRONG_ORG,
                    domainId: "${toGlobalId('domain', 123)}"
                    orgId: "${toGlobalId('organization', 456)}"
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
                transaction,
                userKey: 123,
                auth: {
                  checkPermission: jest.fn().mockReturnValue('admin'),
                  userRequired: jest.fn(),
                  verifiedRequired: jest.fn(),
                  tfaRequired: jest.fn(),
                },
                validators: { cleanseInput },
                loaders: {
                  loadDomainByKey: {
                    load: jest.fn().mockReturnValue({
                      domain: 'domain.gc.ca',
                    }),
                  },
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      verified: true,
                      slug: 'temp-org',
                    }),
                  },
                },
              },
            })

            const error = {
              data: {
                removeDomain: {
                  result: {
                    code: 403,
                    description: 'Permission Denied: Please contact super admin for help with removing domain.',
                  },
                },
              },
            }

            expect(response).toEqual(error)
            expect(consoleOutput).toEqual([
              `User: 123 attempted to remove domain.gc.ca in temp-org but does not have permission to remove a domain from a verified check org.`,
            ])
          })
        })
        describe('users permission is user', () => {
          it('returns an error', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                removeDomain(
                  input: {
                      reason: WRONG_ORG,
                    domainId: "${toGlobalId('domain', 123)}"
                    orgId: "${toGlobalId('organization', 456)}"
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
                transaction,
                userKey: 123,
                auth: {
                  checkPermission: jest.fn().mockReturnValue('user'),
                  userRequired: jest.fn(),
                  verifiedRequired: jest.fn(),
                  tfaRequired: jest.fn(),
                },
                validators: { cleanseInput },
                loaders: {
                  loadDomainByKey: {
                    load: jest.fn().mockReturnValue({
                      domain: 'domain.gc.ca',
                    }),
                  },
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      verified: true,
                      slug: 'temp-org',
                    }),
                  },
                },
              },
            })

            const error = {
              data: {
                removeDomain: {
                  result: {
                    code: 403,
                    description: 'Permission Denied: Please contact organization admin for help with removing domain.',
                  },
                },
              },
            }

            expect(response).toEqual(error)
            expect(consoleOutput).toEqual([
              `User: 123 attempted to remove domain.gc.ca in temp-org however they do not have permission in that org.`,
            ])
          })
        })
        describe('user does not belong to org', () => {
          it('returns an error', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                removeDomain(
                  input: {
                      reason: WRONG_ORG,
                    domainId: "${toGlobalId('domain', 123)}"
                    orgId: "${toGlobalId('organization', 456)}"
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
              rootValue: null,
              contextValue: {
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
                validators: { cleanseInput },
                loaders: {
                  loadDomainByKey: {
                    load: jest.fn().mockReturnValue({
                      domain: 'domain.gc.ca',
                    }),
                  },
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      verified: true,
                      slug: 'temp-org',
                    }),
                  },
                },
              },
            })

            const error = {
              data: {
                removeDomain: {
                  result: {
                    code: 403,
                    description: 'Permission Denied: Please contact organization admin for help with removing domain.',
                  },
                },
              },
            }

            expect(response).toEqual(error)
            expect(consoleOutput).toEqual([
              `User: 123 attempted to remove domain.gc.ca in temp-org however they do not have permission in that org.`,
            ])
          })
        })
      })
      describe('user attempts to remove domain from a regular org', () => {
        describe('users permission is user', () => {
          it('returns an error', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                removeDomain(
                  input: {
                      reason: WRONG_ORG,
                    domainId: "${toGlobalId('domain', 123)}"
                    orgId: "${toGlobalId('organization', 456)}"
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
                transaction,
                userKey: 123,
                auth: {
                  checkPermission: jest.fn().mockReturnValue('user'),
                  userRequired: jest.fn(),
                  verifiedRequired: jest.fn(),
                  tfaRequired: jest.fn(),
                },
                validators: { cleanseInput },
                loaders: {
                  loadDomainByKey: {
                    load: jest.fn().mockReturnValue({
                      domain: 'domain.gc.ca',
                    }),
                  },
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      verified: false,
                      slug: 'temp-org',
                    }),
                  },
                },
              },
            })

            const error = {
              data: {
                removeDomain: {
                  result: {
                    code: 403,
                    description: 'Permission Denied: Please contact organization admin for help with removing domain.',
                  },
                },
              },
            }

            expect(response).toEqual(error)
            expect(consoleOutput).toEqual([
              `User: 123 attempted to remove domain.gc.ca in temp-org however they do not have permission in that org.`,
            ])
          })
        })
        describe('user does not belong to org', () => {
          it('returns an error', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                removeDomain(
                  input: {
                      reason: WRONG_ORG,
                    domainId: "${toGlobalId('domain', 123)}"
                    orgId: "${toGlobalId('organization', 456)}"
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
              rootValue: null,
              contextValue: {
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
                validators: { cleanseInput },
                loaders: {
                  loadDomainByKey: {
                    load: jest.fn().mockReturnValue({
                      domain: 'domain.gc.ca',
                    }),
                  },
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      verified: false,
                      slug: 'temp-org',
                    }),
                  },
                },
              },
            })

            const error = {
              data: {
                removeDomain: {
                  result: {
                    code: 403,
                    description: 'Permission Denied: Please contact organization admin for help with removing domain.',
                  },
                },
              },
            }

            expect(response).toEqual(error)
            expect(consoleOutput).toEqual([
              `User: 123 attempted to remove domain.gc.ca in temp-org however they do not have permission in that org.`,
            ])
          })
        })
      })
      describe('database error occurs', () => {
        describe('when checking to see how many edges there are', () => {
          it('returns an error', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                removeDomain(
                  input: {
                      reason: WRONG_ORG,
                    domainId: "${toGlobalId('domain', 123)}"
                    orgId: "${toGlobalId('organization', 456)}"
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
              rootValue: null,
              contextValue: {
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
                validators: { cleanseInput },
                loaders: {
                  loadDomainByKey: {
                    load: jest.fn().mockReturnValue({
                      domain: 'domain.gc.ca',
                    }),
                  },
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      verified: false,
                      slug: 'temp-org',
                    }),
                  },
                },
              },
            })

            const error = [new GraphQLError('Unable to remove domain. Please try again.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Database error occurred for user: 123, when counting domain claims for domain: domain.gc.ca, error: Error: database error`,
            ])
          })
        })
        describe('when checking to see if domain has dmarc summary data', () => {
          it('returns an error', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                removeDomain(
                  input: {
                      reason: WRONG_ORG,
                    domainId: "${toGlobalId('domain', 123)}"
                    orgId: "${toGlobalId('organization', 456)}"
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
              rootValue: null,
              contextValue: {
                i18n,
                query: jest
                  .fn()
                  .mockReturnValueOnce({
                    all: jest.fn().mockReturnValueOnce([{ _id: toGlobalId('organization', 456) }]),
                  })
                  .mockRejectedValue(new Error('database error')),
                collections: collectionNames,
                transaction,
                userKey: 123,
                auth: {
                  checkPermission: jest.fn().mockReturnValue('admin'),
                  userRequired: jest.fn(),
                  verifiedRequired: jest.fn(),
                  tfaRequired: jest.fn(),
                },
                validators: { cleanseInput },
                loaders: {
                  loadDomainByKey: {
                    load: jest.fn().mockReturnValue({
                      _id: toGlobalId('domains', 123),
                      domain: 'domain.gc.ca',
                    }),
                  },
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      _id: toGlobalId('organization', 456),
                      verified: false,
                      slug: 'temp-org',
                    }),
                  },
                },
              },
            })

            const error = [new GraphQLError('Unable to remove domain. Please try again.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Database error occurred for user: 123, when counting ownership claims for domain: domain.gc.ca, error: Error: database error`,
            ])
          })
        })
      })
      describe('trx step error occurs', () => {
        describe('domain has dmarc summary info', () => {
          describe('when removing dmarc summary data', () => {
            it('throws an error', async () => {
              const mockedTransaction = jest.fn().mockReturnValue({
                step: jest.fn().mockRejectedValue(new Error('trx step error')),
                abort: jest.fn(),
              })

              const response = await graphql({
                schema,
                source: `
              mutation {
                removeDomain(
                  input: {
                      reason: WRONG_ORG,
                    domainId: "${toGlobalId('domain', 123)}"
                    orgId: "${toGlobalId('organization', 456)}"
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
                rootValue: null,
                contextValue: {
                  i18n,
                  query: jest.fn().mockReturnValue({
                    all: jest.fn().mockReturnValue([{ _id: toGlobalId('organization', 456) }]),
                    count: 1,
                  }),
                  collections: collectionNames,
                  transaction: mockedTransaction,
                  userKey: 123,
                  auth: {
                    checkPermission: jest.fn().mockReturnValue('admin'),
                    userRequired: jest.fn(),
                    verifiedRequired: jest.fn(),
                    tfaRequired: jest.fn(),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: {
                      load: jest.fn().mockReturnValue({
                        _id: toGlobalId('domains', 123),
                        domain: 'domain.gc.ca',
                      }),
                    },
                    loadOrgByKey: {
                      load: jest.fn().mockReturnValue({
                        _id: toGlobalId('organization', 456),
                        verified: false,
                        slug: 'temp-org',
                      }),
                    },
                  },
                },
              })

              const error = [new GraphQLError('Unable to remove domain. Please try again.')]

              expect(response.errors).toEqual(error)
              expect(consoleOutput).toEqual([
                `Trx step error occurred when removing dmarc summary data for user: 123 while attempting to remove domain: domain.gc.ca, error: Error: trx step error`,
              ])
            })
          })
          describe('when removing ownership info', () => {
            it('throws an error', async () => {
              const mockedTransaction = jest.fn().mockReturnValue({
                step: jest.fn().mockReturnValueOnce().mockRejectedValue(new Error('trx step error')),
                abort: jest.fn(),
              })

              const response = await graphql({
                schema,
                source: `
              mutation {
                removeDomain(
                  input: {
                      reason: WRONG_ORG,
                    domainId: "${toGlobalId('domain', 123)}"
                    orgId: "${toGlobalId('organization', 456)}"
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
                rootValue: null,
                contextValue: {
                  i18n,
                  query: jest.fn().mockReturnValue({
                    count: 1,
                    all: jest.fn().mockReturnValue([{ _id: toGlobalId('organization', 456) }]),
                  }),
                  collections: collectionNames,
                  transaction: mockedTransaction,
                  userKey: 123,
                  auth: {
                    checkPermission: jest.fn().mockReturnValue('admin'),
                    userRequired: jest.fn(),
                    verifiedRequired: jest.fn(),
                    tfaRequired: jest.fn(),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: {
                      load: jest.fn().mockReturnValue({
                        _id: toGlobalId('domains', 123),
                        domain: 'domain.gc.ca',
                      }),
                    },
                    loadOrgByKey: {
                      load: jest.fn().mockReturnValue({
                        _id: toGlobalId('organization', 456),
                        verified: false,
                        slug: 'temp-org',
                      }),
                    },
                  },
                },
              })

              const error = [new GraphQLError('Unable to remove domain. Please try again.')]

              expect(response.errors).toEqual(error)
              expect(consoleOutput).toEqual([
                `Trx step error occurred when removing ownership data for user: 123 while attempting to remove domain: domain.gc.ca, error: Error: trx step error`,
              ])
            })
          })
        })
        describe('when removing scans', () => {
          it('returns an error', async () => {
            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest
                .fn()
                .mockReturnValueOnce()
                .mockReturnValueOnce()
                .mockRejectedValue(new Error('Transaction error occurred.')),
              abort: jest.fn(),
            })

            const response = await graphql({
              schema,
              source: `
              mutation {
                removeDomain(
                  input: {
                      reason: WRONG_ORG,
                    domainId: "${toGlobalId('domain', 123)}"
                    orgId: "${toGlobalId('organization', 456)}"
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
              rootValue: null,
              contextValue: {
                i18n,
                query: jest
                  .fn()
                  .mockReturnValueOnce({
                    count: 0,
                    all: jest.fn().mockReturnValue([{ _id: toGlobalId('organization', 456) }]),
                  })
                  .mockReturnValue({ count: 1 }),
                collections: collectionNames,
                transaction: mockedTransaction,
                userKey: 123,
                auth: {
                  checkPermission: jest.fn().mockReturnValue('admin'),
                  userRequired: jest.fn(),
                  verifiedRequired: jest.fn(),
                  tfaRequired: jest.fn(),
                },
                validators: { cleanseInput },
                loaders: {
                  loadDomainByKey: {
                    load: jest.fn().mockReturnValue({
                      _id: toGlobalId('domains', 123),
                      domain: 'domain.gc.ca',
                    }),
                  },
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      _id: toGlobalId('organization', 456),
                      verified: false,
                      slug: 'temp-org',
                    }),
                  },
                },
              },
            })

            const error = [new GraphQLError('Unable to remove domain. Please try again.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred while user: 123 attempted to remove web data for domain.gc.ca in org: temp-org, error: Error: Transaction error occurred.`,
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
                abort: jest.fn(),
              })

              const response = await graphql({
                schema,
                source: `
                mutation {
                  removeDomain(
                    input: {
                      reason: WRONG_ORG,
                      domainId: "${toGlobalId('domain', 123)}"
                      orgId: "${toGlobalId('organization', 456)}"
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
                rootValue: null,
                contextValue: {
                  i18n,
                  query: jest.fn().mockReturnValue({
                    count: 1,
                    all: jest.fn().mockReturnValue([{ _id: toGlobalId('organizations', 456) }]),
                  }),
                  collections: collectionNames,
                  transaction: mockedTransaction,
                  userKey: 123,
                  auth: {
                    checkPermission: jest.fn().mockReturnValue('admin'),
                    userRequired: jest.fn(),
                    verifiedRequired: jest.fn(),
                    tfaRequired: jest.fn(),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: {
                      load: jest.fn().mockReturnValue({
                        _id: toGlobalId('domains', 123),
                        domain: 'domain.gc.ca',
                      }),
                    },
                    loadOrgByKey: {
                      load: jest.fn().mockReturnValue({
                        _id: toGlobalId('organizations', 456),
                        verified: false,
                        slug: 'temp-org',
                      }),
                    },
                  },
                },
              })

              const error = [new GraphQLError('Unable to remove domain. Please try again.')]

              expect(response.errors).toEqual(error)
              expect(consoleOutput).toEqual([
                `Trx step error occurred while user: 123 attempted to remove domain domain.gc.ca in org: temp-org, error: Error: Step error`,
              ])
            })
          })
          describe('domain has more than one edge', () => {
            it('returns an error', async () => {
              const mockedQuery = jest.fn().mockReturnValue({
                count: 2,
                all: jest.fn().mockReturnValue([{ _id: toGlobalId('organizations', 456) }]),
              })

              const mockedTransaction = jest.fn().mockReturnValue({
                step: jest.fn().mockRejectedValue(new Error('Step error')),
                abort: jest.fn(),
              })

              const response = await graphql({
                schema,
                source: `
                mutation {
                  removeDomain(
                    input: {
                      reason: WRONG_ORG,
                      domainId: "${toGlobalId('domain', 123)}"
                      orgId: "${toGlobalId('organization', 456)}"
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
                rootValue: null,
                contextValue: {
                  i18n,
                  query: mockedQuery,
                  collections: collectionNames,
                  transaction: mockedTransaction,
                  userKey: 123,
                  auth: {
                    checkPermission: jest.fn().mockReturnValue('admin'),
                    userRequired: jest.fn(),
                    verifiedRequired: jest.fn(),
                    tfaRequired: jest.fn(),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: {
                      load: jest.fn().mockReturnValue({
                        domain: 'domain.gc.ca',
                      }),
                    },
                    loadOrgByKey: {
                      load: jest.fn().mockReturnValue({
                        _id: toGlobalId('organizations', 456),
                        verified: false,
                        slug: 'temp-org',
                      }),
                    },
                  },
                },
              })

              const error = [new GraphQLError('Unable to remove domain. Please try again.')]

              expect(response.errors).toEqual(error)
              expect(consoleOutput).toEqual([
                `Trx step error occurred while user: 123 attempted to remove claim for domain.gc.ca in org: temp-org, error: Error: Step error`,
              ])
            })
          })
        })
      })
      describe('trx commit error occurs', () => {
        it('returns an error', async () => {
          const mockedTransaction = jest.fn().mockReturnValue({
            step: jest.fn().mockReturnValue({}),
            commit: jest.fn().mockRejectedValue(new Error('Transaction error occurred.')),
            abort: jest.fn(),
          })

          const response = await graphql({
            schema,
            source: `
              mutation {
                removeDomain(
                  input: {
                      reason: WRONG_ORG,
                    domainId: "${toGlobalId('domain', 123)}"
                    orgId: "${toGlobalId('organization', 456)}"
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
            rootValue: null,
            contextValue: {
              i18n,
              query: jest.fn().mockReturnValue({
                count: 2,
                all: jest.fn().mockReturnValue([{ _id: toGlobalId('organizations', 456) }]),
              }),
              collections: collectionNames,
              transaction: mockedTransaction,
              userKey: 123,
              auth: {
                checkPermission: jest.fn().mockReturnValue('admin'),
                userRequired: jest.fn(),
                verifiedRequired: jest.fn(),
                tfaRequired: jest.fn(),
              },
              validators: { cleanseInput },
              loaders: {
                loadDomainByKey: {
                  load: jest.fn().mockReturnValue({
                    domain: 'domain.gc.ca',
                  }),
                },
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({
                    _id: toGlobalId('organizations', 456),
                    verified: false,
                    slug: 'temp-org',
                  }),
                },
              },
            },
          })

          const error = [new GraphQLError('Unable to remove domain. Please try again.')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Trx commit error occurred while user: 123 attempted to remove domain.gc.ca in org: temp-org, error: Error: Transaction error occurred.`,
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
      describe('domain does not exist', () => {
        it('returns an error', async () => {
          const response = await graphql({
            schema,
            source: `
            mutation {
              removeDomain(
                input: {
                      reason: WRONG_ORG,
                  domainId: "${toGlobalId('domain', 1)}"
                  orgId: "${toGlobalId('organization', 1)}"
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
            rootValue: null,
            contextValue: {
              i18n,
              query,
              collections: collectionNames,
              transaction,
              userKey: 123,
              auth: {
                checkPermission: jest.fn().mockReturnValue('admin'),
                userRequired: jest.fn(),
                verifiedRequired: jest.fn(),
                tfaRequired: jest.fn(),
              },
              validators: { cleanseInput },
              loaders: {
                loadDomainByKey: {
                  load: jest.fn().mockReturnValue(undefined),
                },
                loadOrgByKey: jest.fn(),
                loadUserByKey: jest.fn(),
              },
            },
          })

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
            `User: 123 attempted to remove 1 however no domain is associated with that id.`,
          ])
        })
      })
      describe('organization does not exist', () => {
        it('returns an error', async () => {
          const response = await graphql({
            schema,
            source: `
            mutation {
              removeDomain(
                input: {
                      reason: WRONG_ORG,
                  domainId: "${toGlobalId('domain', 123)}"
                  orgId: "${toGlobalId('organization', 1)}"
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
            rootValue: null,
            contextValue: {
              i18n,
              query,
              collections: collectionNames,
              transaction,
              userKey: 123,
              auth: {
                checkPermission: jest.fn().mockReturnValue('admin'),
                userRequired: jest.fn(),
                verifiedRequired: jest.fn(),
                tfaRequired: jest.fn(),
              },
              validators: { cleanseInput },
              loaders: {
                loadDomainByKey: {
                  load: jest.fn().mockReturnValue({}),
                },
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue(undefined),
                },
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          })

          const error = {
            data: {
              removeDomain: {
                result: {
                  code: 400,
                  description: "Impossible de supprimer le domaine d'une organisation inconnue.",
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to remove undefined in org: 1 however there is no organization associated with that id.`,
          ])
        })
      })
      describe('user attempts to remove domain from verified check org', () => {
        describe('users permission is admin', () => {
          it('returns an error', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                removeDomain(
                  input: {
                      reason: WRONG_ORG,
                    domainId: "${toGlobalId('domain', 123)}"
                    orgId: "${toGlobalId('organization', 456)}"
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
                transaction,
                userKey: 123,
                auth: {
                  checkPermission: jest.fn().mockReturnValue('admin'),
                  userRequired: jest.fn(),
                  verifiedRequired: jest.fn(),
                  tfaRequired: jest.fn(),
                },
                validators: { cleanseInput },
                loaders: {
                  loadDomainByKey: {
                    load: jest.fn().mockReturnValue({
                      domain: 'domain.gc.ca',
                    }),
                  },
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      verified: true,
                      slug: 'temp-org',
                    }),
                  },
                },
              },
            })

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
              `User: 123 attempted to remove domain.gc.ca in temp-org but does not have permission to remove a domain from a verified check org.`,
            ])
          })
        })
        describe('users permission is user', () => {
          it('returns an error', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                removeDomain(
                  input: {
                      reason: WRONG_ORG,
                    domainId: "${toGlobalId('domain', 123)}"
                    orgId: "${toGlobalId('organization', 456)}"
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
                transaction,
                userKey: 123,
                auth: {
                  checkPermission: jest.fn().mockReturnValue('user'),
                  userRequired: jest.fn(),
                  verifiedRequired: jest.fn(),
                  tfaRequired: jest.fn(),
                },
                validators: { cleanseInput },
                loaders: {
                  loadDomainByKey: {
                    load: jest.fn().mockReturnValue({
                      domain: 'domain.gc.ca',
                    }),
                  },
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      verified: true,
                      slug: 'temp-org',
                    }),
                  },
                },
              },
            })

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
              `User: 123 attempted to remove domain.gc.ca in temp-org however they do not have permission in that org.`,
            ])
          })
        })
        describe('user does not belong to org', () => {
          it('returns an error', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                removeDomain(
                  input: {
                      reason: WRONG_ORG,
                    domainId: "${toGlobalId('domain', 123)}"
                    orgId: "${toGlobalId('organization', 456)}"
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
              rootValue: null,
              contextValue: {
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
                validators: { cleanseInput },
                loaders: {
                  loadDomainByKey: {
                    load: jest.fn().mockReturnValue({
                      domain: 'domain.gc.ca',
                    }),
                  },
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      verified: true,
                      slug: 'temp-org',
                    }),
                  },
                },
              },
            })

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
              `User: 123 attempted to remove domain.gc.ca in temp-org however they do not have permission in that org.`,
            ])
          })
        })
      })
      describe('user attempts to remove domain from a regular org', () => {
        describe('users permission is user', () => {
          it('returns an error', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                removeDomain(
                  input: {
                      reason: WRONG_ORG,
                    domainId: "${toGlobalId('domain', 123)}"
                    orgId: "${toGlobalId('organization', 456)}"
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
                transaction,
                userKey: 123,
                auth: {
                  checkPermission: jest.fn().mockReturnValue('user'),
                  userRequired: jest.fn(),
                  verifiedRequired: jest.fn(),
                  tfaRequired: jest.fn(),
                },
                validators: { cleanseInput },
                loaders: {
                  loadDomainByKey: {
                    load: jest.fn().mockReturnValue({
                      domain: 'domain.gc.ca',
                    }),
                  },
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      verified: false,
                      slug: 'temp-org',
                    }),
                  },
                },
              },
            })

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
              `User: 123 attempted to remove domain.gc.ca in temp-org however they do not have permission in that org.`,
            ])
          })
        })
        describe('user does not belong to org', () => {
          it('returns an error', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                removeDomain(
                  input: {
                      reason: WRONG_ORG,
                    domainId: "${toGlobalId('domain', 123)}"
                    orgId: "${toGlobalId('organization', 456)}"
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
              rootValue: null,
              contextValue: {
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
                validators: { cleanseInput },
                loaders: {
                  loadDomainByKey: {
                    load: jest.fn().mockReturnValue({
                      domain: 'domain.gc.ca',
                    }),
                  },
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      verified: false,
                      slug: 'temp-org',
                    }),
                  },
                },
              },
            })

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
              `User: 123 attempted to remove domain.gc.ca in temp-org however they do not have permission in that org.`,
            ])
          })
        })
      })
      describe('database error occurs', () => {
        describe('when checking to see how many edges there are', () => {
          it('returns an error', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                removeDomain(
                  input: {
                      reason: WRONG_ORG,
                    domainId: "${toGlobalId('domain', 123)}"
                    orgId: "${toGlobalId('organization', 456)}"
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
              rootValue: null,
              contextValue: {
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
                validators: { cleanseInput },
                loaders: {
                  loadDomainByKey: {
                    load: jest.fn().mockReturnValue({
                      domain: 'domain.gc.ca',
                    }),
                  },
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      verified: false,
                      slug: 'temp-org',
                    }),
                  },
                },
              },
            })

            const error = [new GraphQLError('Impossible de supprimer le domaine. Veuillez réessayer.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Database error occurred for user: 123, when counting domain claims for domain: domain.gc.ca, error: Error: database error`,
            ])
          })
        })
        describe('when checking to see if domain has dmarc summary data', () => {
          it('returns an error', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                removeDomain(
                  input: {
                      reason: WRONG_ORG,
                    domainId: "${toGlobalId('domain', 123)}"
                    orgId: "${toGlobalId('organization', 456)}"
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
              rootValue: null,
              contextValue: {
                i18n,
                query: jest
                  .fn()
                  .mockReturnValueOnce({
                    all: jest.fn().mockReturnValue([{ _id: toGlobalId('organizations', 456) }]),
                  })
                  .mockRejectedValue(new Error('database error')),
                collections: collectionNames,
                transaction,
                userKey: 123,
                auth: {
                  checkPermission: jest.fn().mockReturnValue('admin'),
                  userRequired: jest.fn(),
                  verifiedRequired: jest.fn(),
                  tfaRequired: jest.fn(),
                },
                validators: { cleanseInput },
                loaders: {
                  loadDomainByKey: {
                    load: jest.fn().mockReturnValue({
                      domain: 'domain.gc.ca',
                    }),
                  },
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      _id: toGlobalId('organizations', 456),
                      verified: false,
                      slug: 'temp-org',
                    }),
                  },
                },
              },
            })

            const error = [new GraphQLError('Impossible de supprimer le domaine. Veuillez réessayer.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Database error occurred for user: 123, when counting ownership claims for domain: domain.gc.ca, error: Error: database error`,
            ])
          })
        })
      })
      describe('trx step error occurs', () => {
        describe('domain has dmarc summary info', () => {
          describe('when removing dmarc summary data', () => {
            it('throws an error', async () => {
              const mockedTransaction = jest.fn().mockReturnValue({
                step: jest.fn().mockRejectedValue(new Error('trx step error')),
                abort: jest.fn(),
              })

              const response = await graphql({
                schema,
                source: `
              mutation {
                removeDomain(
                  input: {
                      reason: WRONG_ORG,
                    domainId: "${toGlobalId('domain', 123)}"
                    orgId: "${toGlobalId('organization', 456)}"
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
                rootValue: null,
                contextValue: {
                  i18n,
                  query: jest.fn().mockReturnValue({
                    count: 1,
                    all: jest.fn().mockReturnValue([{ _id: toGlobalId('organizations', 456) }]),
                  }),
                  collections: collectionNames,
                  transaction: mockedTransaction,
                  userKey: 123,
                  auth: {
                    checkPermission: jest.fn().mockReturnValue('admin'),
                    userRequired: jest.fn(),
                    verifiedRequired: jest.fn(),
                    tfaRequired: jest.fn(),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: {
                      load: jest.fn().mockReturnValue({
                        domain: 'domain.gc.ca',
                      }),
                    },
                    loadOrgByKey: {
                      load: jest.fn().mockReturnValue({
                        _id: toGlobalId('organizations', 456),
                        verified: false,
                        slug: 'temp-org',
                      }),
                    },
                  },
                },
              })

              const error = [new GraphQLError('Impossible de supprimer le domaine. Veuillez réessayer.')]

              expect(response.errors).toEqual(error)
              expect(consoleOutput).toEqual([
                `Trx step error occurred when removing dmarc summary data for user: 123 while attempting to remove domain: domain.gc.ca, error: Error: trx step error`,
              ])
            })
          })
          describe('when removing ownership info', () => {
            it('throws an error', async () => {
              const mockedTransaction = jest.fn().mockReturnValue({
                step: jest.fn().mockReturnValueOnce().mockRejectedValue(new Error('trx step error')),
                abort: jest.fn(),
              })

              const response = await graphql({
                schema,
                source: `
              mutation {
                removeDomain(
                  input: {
                      reason: WRONG_ORG,
                    domainId: "${toGlobalId('domain', 123)}"
                    orgId: "${toGlobalId('organization', 456)}"
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
                rootValue: null,
                contextValue: {
                  i18n,
                  query: jest.fn().mockReturnValue({
                    count: 1,
                    all: jest.fn().mockReturnValue([{ _id: toGlobalId('organizations', 456) }]),
                  }),
                  collections: collectionNames,
                  transaction: mockedTransaction,
                  userKey: 123,
                  auth: {
                    checkPermission: jest.fn().mockReturnValue('admin'),
                    userRequired: jest.fn(),
                    verifiedRequired: jest.fn(),
                    tfaRequired: jest.fn(),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: {
                      load: jest.fn().mockReturnValue({
                        domain: 'domain.gc.ca',
                      }),
                    },
                    loadOrgByKey: {
                      load: jest.fn().mockReturnValue({
                        _id: toGlobalId('organizations', 456),
                        verified: false,
                        slug: 'temp-org',
                      }),
                    },
                  },
                },
              })

              const error = [new GraphQLError('Impossible de supprimer le domaine. Veuillez réessayer.')]

              expect(response.errors).toEqual(error)
              expect(consoleOutput).toEqual([
                `Trx step error occurred when removing ownership data for user: 123 while attempting to remove domain: domain.gc.ca, error: Error: trx step error`,
              ])
            })
          })
        })
        describe('when removing scans', () => {
          it('returns an error', async () => {
            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest
                .fn()
                .mockReturnValueOnce()
                .mockReturnValueOnce()
                .mockRejectedValue(new Error('Transaction error occurred.')),
              abort: jest.fn(),
            })

            const response = await graphql({
              schema,
              source: `
              mutation {
                removeDomain(
                  input: {
                      reason: WRONG_ORG,
                    domainId: "${toGlobalId('domain', 123)}"
                    orgId: "${toGlobalId('organization', 456)}"
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
              rootValue: null,
              contextValue: {
                i18n,
                query: jest
                  .fn()
                  .mockReturnValueOnce({
                    count: 0,
                    all: jest.fn().mockReturnValue([{ _id: toGlobalId('organizations', 456) }]),
                  })
                  .mockReturnValue({ count: 1 }),
                collections: collectionNames,
                transaction: mockedTransaction,
                userKey: 123,
                auth: {
                  checkPermission: jest.fn().mockReturnValue('admin'),
                  userRequired: jest.fn(),
                  verifiedRequired: jest.fn(),
                  tfaRequired: jest.fn(),
                },
                validators: { cleanseInput },
                loaders: {
                  loadDomainByKey: {
                    load: jest.fn().mockReturnValue({
                      domain: 'domain.gc.ca',
                    }),
                  },
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      _id: toGlobalId('organizations', 456),
                      verified: false,
                      slug: 'temp-org',
                    }),
                  },
                },
              },
            })

            const error = [new GraphQLError('Impossible de supprimer le domaine. Veuillez réessayer.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred while user: 123 attempted to remove web data for domain.gc.ca in org: temp-org, error: Error: Transaction error occurred.`,
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
                abort: jest.fn(),
              })

              const response = await graphql({
                schema,
                source: `
                mutation {
                  removeDomain(
                    input: {
                      reason: WRONG_ORG,
                      domainId: "${toGlobalId('domain', 123)}"
                      orgId: "${toGlobalId('organization', 456)}"
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
                rootValue: null,
                contextValue: {
                  i18n,
                  query: jest.fn().mockReturnValue({
                    count: 1,
                    all: jest.fn().mockReturnValue([{ _id: toGlobalId('organizations', 456) }]),
                  }),
                  collections: collectionNames,
                  transaction: mockedTransaction,
                  userKey: 123,
                  auth: {
                    checkPermission: jest.fn().mockReturnValue('admin'),
                    userRequired: jest.fn(),
                    verifiedRequired: jest.fn(),
                    tfaRequired: jest.fn(),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: {
                      load: jest.fn().mockReturnValue({
                        domain: 'domain.gc.ca',
                      }),
                    },
                    loadOrgByKey: {
                      load: jest.fn().mockReturnValue({
                        _id: toGlobalId('organizations', 456),
                        verified: false,
                        slug: 'temp-org',
                      }),
                    },
                  },
                },
              })

              const error = [new GraphQLError('Impossible de supprimer le domaine. Veuillez réessayer.')]

              expect(response.errors).toEqual(error)
              expect(consoleOutput).toEqual([
                `Trx step error occurred while user: 123 attempted to remove domain domain.gc.ca in org: temp-org, error: Error: Step error`,
              ])
            })
          })
          describe('domain has more than one edge', () => {
            it('returns an error', async () => {
              const cursor = {
                count: 2,
                all: jest.fn().mockReturnValue([{ _id: toGlobalId('organizations', 456) }]),
              }

              const mockedQuery = jest.fn().mockReturnValue(cursor)

              const mockedTransaction = jest.fn().mockReturnValue({
                step: jest.fn().mockRejectedValue(new Error('Step error')),
                abort: jest.fn(),
              })

              const response = await graphql({
                schema,
                source: `
                mutation {
                  removeDomain(
                    input: {
                      reason: WRONG_ORG,
                      domainId: "${toGlobalId('domain', 123)}"
                      orgId: "${toGlobalId('organization', 456)}"
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
                rootValue: null,
                contextValue: {
                  i18n,
                  query: mockedQuery,
                  collections: collectionNames,
                  transaction: mockedTransaction,
                  userKey: 123,
                  auth: {
                    checkPermission: jest.fn().mockReturnValue('admin'),
                    userRequired: jest.fn(),
                    verifiedRequired: jest.fn(),
                    tfaRequired: jest.fn(),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadDomainByKey: {
                      load: jest.fn().mockReturnValue({
                        domain: 'domain.gc.ca',
                      }),
                    },
                    loadOrgByKey: {
                      load: jest.fn().mockReturnValue({
                        _id: toGlobalId('organizations', 456),
                        verified: false,
                        slug: 'temp-org',
                      }),
                    },
                  },
                },
              })

              const error = [new GraphQLError('Impossible de supprimer le domaine. Veuillez réessayer.')]

              expect(response.errors).toEqual(error)
              expect(consoleOutput).toEqual([
                `Trx step error occurred while user: 123 attempted to remove claim for domain.gc.ca in org: temp-org, error: Error: Step error`,
              ])
            })
          })
        })
      })
      describe('trx commit error occurs', () => {
        it('returns an error', async () => {
          const mockedTransaction = jest.fn().mockReturnValue({
            step: jest.fn().mockReturnValue({}),
            commit: jest.fn().mockRejectedValue(new Error('Transaction error occurred.')),
            abort: jest.fn(),
          })

          const response = await graphql({
            schema,
            source: `
              mutation {
                removeDomain(
                  input: {
                      reason: WRONG_ORG,
                    domainId: "${toGlobalId('domain', 123)}"
                    orgId: "${toGlobalId('organization', 456)}"
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
            rootValue: null,
            contextValue: {
              i18n,
              query: jest.fn().mockReturnValue({
                count: 2,
                all: jest.fn().mockReturnValue([{ _id: toGlobalId('organizations', 456) }]),
              }),
              collections: collectionNames,
              transaction: mockedTransaction,
              userKey: 123,
              auth: {
                checkPermission: jest.fn().mockReturnValue('admin'),
                userRequired: jest.fn(),
                verifiedRequired: jest.fn(),
                tfaRequired: jest.fn(),
              },
              validators: { cleanseInput },
              loaders: {
                loadDomainByKey: {
                  load: jest.fn().mockReturnValue({
                    domain: 'domain.gc.ca',
                  }),
                },
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({
                    _id: toGlobalId('organizations', 456),
                    verified: false,
                    slug: 'temp-org',
                  }),
                },
              },
            },
          })

          const error = [new GraphQLError('Impossible de supprimer le domaine. Veuillez réessayer.')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Trx commit error occurred while user: 123 attempted to remove domain.gc.ca in org: temp-org, error: Error: Transaction error occurred.`,
          ])
        })
      })
    })
  })
})
