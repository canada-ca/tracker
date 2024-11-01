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
import { checkPermission, userRequired, verifiedRequired } from '../../../auth'
import { loadUserByKey } from '../../../user/loaders'
import { loadOrgByKey } from '../../loaders'
import dbschema from '../../../../database.json'
import { collectionNames } from '../../../collection-names'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('removing an organization', () => {
  let query, drop, truncate, schema, collections, transaction, user, i18n

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
  describe('given a successful removal', () => {
    let org, domain
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
      })
      domain = await collections.domains.save({
        domain: 'test.gc.ca',
        slug: 'test-gc-ca',
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
    })
    afterEach(async () => {
      await truncate()
      await drop()
    })
    describe('users permission is super admin', () => {
      describe('org is verified', () => {
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
          const superAdminOrg = await collections.organizations.save({
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
          await collections.affiliations.save({
            _from: superAdminOrg._id,
            _to: user._id,
            permission: 'super_admin',
          })
          await collections.claims.save({
            _from: org._id,
            _to: domain._id,
          })
        })
        describe('it owns the dmarc summary data', () => {
          beforeEach(async () => {
            await collections.ownership.save({
              _from: org._id,
              _to: domain._id,
            })
          })
          it('removes the dmarc summary data', async () => {
            await graphql({
              schema,
              source: `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organization', org._key)}"
                    }
                  ) {
                    result {
                      ... on OrganizationResult {
                        status
                        organization {
                          name
                        }
                      }
                      ... on OrganizationError {
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
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            await query`FOR dmarcSum IN dmarcSummaries OPTIONS { waitForSync: true } RETURN dmarcSum`
            await query`FOR item IN domainsToDmarcSummaries OPTIONS { waitForSync: true } RETURN item`

            const testDmarcSummaryCursor =
              await query`FOR dmarcSum IN dmarcSummaries OPTIONS { waitForSync: true } RETURN dmarcSum`
            const testDmarcSummary = await testDmarcSummaryCursor.next()
            expect(testDmarcSummary).toEqual(undefined)

            const testDomainsToDmarcSumCursor =
              await query`FOR item IN domainsToDmarcSummaries OPTIONS { waitForSync: true } RETURN item`
            const testDomainsToDmarcSum = await testDomainsToDmarcSumCursor.next()
            expect(testDomainsToDmarcSum).toEqual(undefined)
          })
          it('removes the ownership edge', async () => {
            await graphql({
              schema,
              source: `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organization', org._key)}"
                    }
                  ) {
                    result {
                      ... on OrganizationResult {
                        status
                        organization {
                          name
                        }
                      }
                      ... on OrganizationError {
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
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            await query`FOR owner IN ownership OPTIONS { waitForSync: true } RETURN owner`

            const testOwnershipCursor = await query`FOR owner IN ownership OPTIONS { waitForSync: true } RETURN owner`
            const testOwnership = await testOwnershipCursor.next()
            expect(testOwnership).toEqual(undefined)
          })
        })
        describe('it does not own the dmarc summary data', () => {
          it('does not remove the dmarc summary data', async () => {
            await graphql({
              schema,
              source: `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organization', org._key)}"
                    }
                  ) {
                    result {
                      ... on OrganizationResult {
                        status
                        organization {
                          name
                        }
                      }
                      ... on OrganizationError {
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
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            await query`FOR dmarcSum IN dmarcSummaries OPTIONS { waitForSync: true } RETURN dmarcSum`
            await query`FOR item IN domainsToDmarcSummaries OPTIONS { waitForSync: true } RETURN item`

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
        describe('org is the only one claiming the domain', () => {
          it('removes the web scan result data', async () => {
            await graphql({
              schema,
              source: `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organization', org._key)}"
                    }
                  ) {
                    result {
                      ... on OrganizationResult {
                        status
                        organization {
                          name
                        }
                      }
                      ... on OrganizationError {
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
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            await query`FOR wScan IN webScan OPTIONS { waitForSync: true } RETURN wScan`

            const testWebScanCursor = await query`FOR wScan IN webScan OPTIONS { waitForSync: true } RETURN wScan`
            const testWebScan = await testWebScanCursor.next()
            expect(testWebScan).toEqual(undefined)
          })
          it('removes the scan data', async () => {
            await graphql({
              schema,
              source: `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organization', org._key)}"
                    }
                  ) {
                    result {
                      ... on OrganizationResult {
                        status
                        organization {
                          name
                        }
                      }
                      ... on OrganizationError {
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
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            await query`FOR dnsResult IN dns OPTIONS { waitForSync: true } RETURN dnsResult`
            await query`FOR webResult IN web OPTIONS { waitForSync: true } RETURN webResult`

            const testDNSCursor = await query`FOR dnsResult IN dns OPTIONS { waitForSync: true } RETURN dnsResult`
            const testDNS = await testDNSCursor.next()
            expect(testDNS).toEqual(undefined)

            const testWebCursor = await query`FOR webResult IN web OPTIONS { waitForSync: true } RETURN webResult`
            const testWeb = await testWebCursor.next()
            expect(testWeb).toEqual(undefined)
          })

          it('removes the domain', async () => {
            await graphql({
              schema,
              source: `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organization', org._key)}"
                    }
                  ) {
                    result {
                      ... on OrganizationResult {
                        status
                        organization {
                          name
                        }
                      }
                      ... on OrganizationError {
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
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            await query`FOR domain IN domains OPTIONS { waitForSync: true } RETURN domain`

            const domainCursor = await query`FOR domain IN domains OPTIONS { waitForSync: true } RETURN domain`
            const domainCheck = await domainCursor.next()
            expect(domainCheck).toEqual(undefined)
          })
          it('removes the affiliations, and org', async () => {
            await graphql({
              schema,
              source: `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organization', org._key)}"
                    }
                  ) {
                    result {
                      ... on OrganizationResult {
                        status
                        organization {
                          name
                        }
                      }
                      ... on OrganizationError {
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
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            await query`FOR aff IN affiliations OPTIONS { waitForSync: true } RETURN aff`
            await query`FOR org IN organizations OPTIONS { waitForSync: true } RETURN org`

            const testAffiliationCursor =
              await query`FOR aff IN affiliations OPTIONS { waitForSync: true } FILTER aff._from == ${org._key} RETURN aff`
            const testAffiliation = await testAffiliationCursor.next()
            expect(testAffiliation).toEqual(undefined)

            const testOrgCursor =
              await query`FOR org IN organizations OPTIONS { waitForSync: true } FILTER org._key == ${org._key} RETURN org`
            const testOrg = await testOrgCursor.next()
            expect(testOrg).toEqual(undefined)
          })
        })
        describe('multiple orgs claim the domain', () => {
          beforeEach(async () => {
            const secondOrg = await collections.organizations.save({})
            await collections.claims.save({
              _from: secondOrg._id,
              _to: domain._id,
            })
          })
          it('does not remove the web scan result data', async () => {
            await graphql({
              schema,
              source: `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organization', org._key)}"
                    }
                  ) {
                    result {
                      ... on OrganizationResult {
                        status
                        organization {
                          name
                        }
                      }
                      ... on OrganizationError {
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
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            const testWebScanCursor =
              await query`FOR wScan IN webScan OPTIONS { waitForSync: true } RETURN wScan.webScan`
            const testWebScan = await testWebScanCursor.next()
            expect(testWebScan).toEqual(true)
          })
          it('does not remove the scan data', async () => {
            await graphql({
              schema,
              source: `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organization', org._key)}"
                    }
                  ) {
                    result {
                      ... on OrganizationResult {
                        status
                        organization {
                          name
                        }
                      }
                      ... on OrganizationError {
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
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            const testDNSCursor = await query`FOR dnsResult IN dns OPTIONS { waitForSync: true } RETURN dnsResult.dns`
            const testDNS = await testDNSCursor.next()
            expect(testDNS).toEqual(true)

            const testWebCursor = await query`FOR webResult IN web OPTIONS { waitForSync: true } RETURN webResult.web`
            const testWeb = await testWebCursor.next()
            expect(testWeb).toEqual(true)
          })
          it('does not remove the domain', async () => {
            await graphql({
              schema,
              source: `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organization', org._key)}"
                    }
                  ) {
                    result {
                      ... on OrganizationResult {
                        status
                        organization {
                          name
                        }
                      }
                      ... on OrganizationError {
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
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            await query`FOR domain IN domains OPTIONS { waitForSync: true } RETURN domain`

            const domainCursor = await query`FOR domain IN domains OPTIONS { waitForSync: true } RETURN domain`
            const domainCheck = await domainCursor.next()
            expect(domainCheck).toBeDefined()
          })
          it('removes the affiliations, and org', async () => {
            await graphql({
              schema,
              source: `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organization', org._key)}"
                    }
                  ) {
                    result {
                      ... on OrganizationResult {
                        status
                        organization {
                          name
                        }
                      }
                      ... on OrganizationError {
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
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            await query`FOR aff IN affiliations OPTIONS { waitForSync: true } RETURN aff`
            await query`FOR org IN organizations OPTIONS { waitForSync: true } RETURN org`

            const testAffiliationCursor =
              await query`FOR aff IN affiliations OPTIONS { waitForSync: true } FILTER aff._from == ${org._key} RETURN aff`
            const testAffiliation = await testAffiliationCursor.next()
            expect(testAffiliation).toEqual(undefined)

            const testOrgCursor =
              await query`FOR org IN organizations OPTIONS { waitForSync: true } FILTER org._key == ${org._key} RETURN org`
            const testOrg = await testOrgCursor.next()
            expect(testOrg).toEqual(undefined)
          })
        })
      })
      describe('org is not verified', () => {
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
          const superAdminOrg = await collections.organizations.save({
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
          await collections.affiliations.save({
            _from: superAdminOrg._id,
            _to: user._id,
            permission: 'super_admin',
          })
          await collections.claims.save({
            _from: org._id,
            _to: domain._id,
          })
        })
        describe('it owns the dmarc summary data', () => {
          beforeEach(async () => {
            await collections.ownership.save({
              _from: org._id,
              _to: domain._id,
            })
          })
          it('removes the dmarc summary data', async () => {
            await graphql({
              schema,
              source: `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organization', org._key)}"
                    }
                  ) {
                    result {
                      ... on OrganizationResult {
                        status
                        organization {
                          name
                        }
                      }
                      ... on OrganizationError {
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
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            await query`FOR dmarcSum IN dmarcSummaries OPTIONS { waitForSync: true } RETURN dmarcSum`
            await query`FOR item IN domainsToDmarcSummaries OPTIONS { waitForSync: true } RETURN item`

            const testDmarcSummaryCursor =
              await query`FOR dmarcSum IN dmarcSummaries OPTIONS { waitForSync: true } RETURN dmarcSum`
            const testDmarcSummary = await testDmarcSummaryCursor.next()
            expect(testDmarcSummary).toEqual(undefined)

            const testDomainsToDmarcSumCursor =
              await query`FOR item IN domainsToDmarcSummaries OPTIONS { waitForSync: true } RETURN item`
            const testDomainsToDmarcSum = await testDomainsToDmarcSumCursor.next()
            expect(testDomainsToDmarcSum).toEqual(undefined)
          })
          it('removes the ownership edge', async () => {
            await graphql({
              schema,
              source: `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organization', org._key)}"
                    }
                  ) {
                    result {
                      ... on OrganizationResult {
                        status
                        organization {
                          name
                        }
                      }
                      ... on OrganizationError {
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
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            await query`FOR owner IN ownership OPTIONS { waitForSync: true } RETURN owner`

            const testOwnershipCursor = await query`FOR owner IN ownership OPTIONS { waitForSync: true } RETURN owner`
            const testOwnership = await testOwnershipCursor.next()
            expect(testOwnership).toEqual(undefined)
          })
        })
        describe('it does not own the dmarc summary data', () => {
          it('does not remove the dmarc summary data', async () => {
            await graphql({
              schema,
              source: `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organization', org._key)}"
                    }
                  ) {
                    result {
                      ... on OrganizationResult {
                        status
                        organization {
                          name
                        }
                      }
                      ... on OrganizationError {
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
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            await query`FOR dmarcSum IN dmarcSummaries OPTIONS { waitForSync: true } RETURN dmarcSum`
            await query`FOR item IN domainsToDmarcSummaries OPTIONS { waitForSync: true } RETURN item`

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
        describe('org is the only one claiming the domain', () => {
          it('removes the web scan result data', async () => {
            await graphql({
              schema,
              source: `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organization', org._key)}"
                    }
                  ) {
                    result {
                      ... on OrganizationResult {
                        status
                        organization {
                          name
                        }
                      }
                      ... on OrganizationError {
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
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            const testWebScanCursor = await query`FOR wScan IN webScan OPTIONS { waitForSync: true } RETURN wScan`
            const testWebScan = await testWebScanCursor.next()
            expect(testWebScan).toEqual(undefined)
          })
          it('removes the scan data', async () => {
            await graphql({
              schema,
              source: `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organization', org._key)}"
                    }
                  ) {
                    result {
                      ... on OrganizationResult {
                        status
                        organization {
                          name
                        }
                      }
                      ... on OrganizationError {
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
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            const testDNSCursor = await query`FOR dnsResult IN dns OPTIONS { waitForSync: true } RETURN dnsResult`
            const testDNS = await testDNSCursor.next()
            expect(testDNS).toEqual(undefined)

            const testWebCursor = await query`FOR webResult IN web OPTIONS { waitForSync: true } RETURN webResult`
            const testWeb = await testWebCursor.next()
            expect(testWeb).toEqual(undefined)
          })
          it('removes the domain', async () => {
            await graphql({
              schema,
              source: `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organization', org._key)}"
                    }
                  ) {
                    result {
                      ... on OrganizationResult {
                        status
                        organization {
                          name
                        }
                      }
                      ... on OrganizationError {
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
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            await query`FOR domain IN domains OPTIONS { waitForSync: true } RETURN domain`

            const domainCursor = await query`FOR domain IN domains OPTIONS { waitForSync: true } RETURN domain`
            const domainCheck = await domainCursor.next()
            expect(domainCheck).toEqual(undefined)
          })
          it('removes the affiliations, and org', async () => {
            await graphql({
              schema,
              source: `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organization', org._key)}"
                    }
                  ) {
                    result {
                      ... on OrganizationResult {
                        status
                        organization {
                          name
                        }
                      }
                      ... on OrganizationError {
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
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            await query`FOR aff IN affiliations OPTIONS { waitForSync: true } RETURN aff`
            await query`FOR org IN organizations OPTIONS { waitForSync: true } RETURN org`

            const testAffiliationCursor =
              await query`FOR aff IN affiliations OPTIONS { waitForSync: true } FILTER aff._from == ${org._key} RETURN aff`
            const testAffiliation = await testAffiliationCursor.next()
            expect(testAffiliation).toEqual(undefined)

            const testOrgCursor =
              await query`FOR org IN organizations OPTIONS { waitForSync: true } FILTER org._key == ${org._key} RETURN org`
            const testOrg = await testOrgCursor.next()
            expect(testOrg).toEqual(undefined)
          })
        })
        describe('multiple orgs claim the domain', () => {
          beforeEach(async () => {
            const secondOrg = await collections.organizations.save({})
            await collections.claims.save({
              _from: secondOrg._id,
              _to: domain._id,
            })
          })
          it('does not remove the web scan result data', async () => {
            await graphql({
              schema,
              source: `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organization', org._key)}"
                    }
                  ) {
                    result {
                      ... on OrganizationResult {
                        status
                        organization {
                          name
                        }
                      }
                      ... on OrganizationError {
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
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            const testWebScanCursor =
              await query`FOR wScan IN webScan OPTIONS { waitForSync: true } RETURN wScan.webScan`
            const testWebScan = await testWebScanCursor.next()
            expect(testWebScan).toEqual(true)
          })
          it('does not remove the scan data', async () => {
            await graphql({
              schema,
              source: `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organization', org._key)}"
                    }
                  ) {
                    result {
                      ... on OrganizationResult {
                        status
                        organization {
                          name
                        }
                      }
                      ... on OrganizationError {
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
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            const testDNSCursor = await query`FOR dnsResult IN dns OPTIONS { waitForSync: true } RETURN dnsResult.dns`
            const testDNS = await testDNSCursor.next()
            expect(testDNS).toEqual(true)

            const testWebCursor = await query`FOR webResult IN web OPTIONS { waitForSync: true } RETURN webResult.web`
            const testWeb = await testWebCursor.next()
            expect(testWeb).toEqual(true)
          })
          it('does not remove the domain', async () => {
            await graphql({
              schema,
              source: `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organization', org._key)}"
                    }
                  ) {
                    result {
                      ... on OrganizationResult {
                        status
                        organization {
                          name
                        }
                      }
                      ... on OrganizationError {
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
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            await query`FOR domain IN domains OPTIONS { waitForSync: true } RETURN domain`

            const domainCursor = await query`FOR domain IN domains OPTIONS { waitForSync: true } RETURN domain`
            const domainCheck = await domainCursor.next()
            expect(domainCheck).toBeDefined()
          })
          it('removes the affiliations, and org', async () => {
            await graphql({
              schema,
              source: `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organization', org._key)}"
                    }
                  ) {
                    result {
                      ... on OrganizationResult {
                        status
                        organization {
                          name
                        }
                      }
                      ... on OrganizationError {
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
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            await query`FOR aff IN affiliations OPTIONS { waitForSync: true } RETURN aff`
            await query`FOR org IN organizations OPTIONS { waitForSync: true } RETURN org`

            const testAffiliationCursor =
              await query`FOR aff IN affiliations OPTIONS { waitForSync: true } FILTER aff._from == ${org._key} RETURN aff`
            const testAffiliation = await testAffiliationCursor.next()
            expect(testAffiliation).toEqual(undefined)

            const testOrgCursor =
              await query`FOR org IN organizations OPTIONS { waitForSync: true } FILTER org._key == ${org._key} RETURN org`
            const testOrg = await testOrgCursor.next()
            expect(testOrg).toEqual(undefined)
          })
        })
      })
    })
    describe('users permission is owner', () => {
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
        await collections.affiliations.save({
          _from: org._id,
          _to: user._id,
          permission: 'owner',
        })
        await collections.claims.save({
          _from: org._id,
          _to: domain._id,
        })
      })
      describe('org is not verified', () => {
        describe('it owns the dmarc summary data', () => {
          beforeEach(async () => {
            await collections.ownership.save({
              _from: org._id,
              _to: domain._id,
            })
          })
          it('removes the dmarc summary data', async () => {
            await graphql({
              schema,
              source: `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organization', org._key)}"
                    }
                  ) {
                    result {
                      ... on OrganizationResult {
                        status
                        organization {
                          name
                        }
                      }
                      ... on OrganizationError {
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
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            await query`FOR dmarcSum IN dmarcSummaries OPTIONS { waitForSync: true } RETURN dmarcSum`
            await query`FOR item IN domainsToDmarcSummaries OPTIONS { waitForSync: true } RETURN item`

            const testDmarcSummaryCursor =
              await query`FOR dmarcSum IN dmarcSummaries OPTIONS { waitForSync: true } RETURN dmarcSum`
            const testDmarcSummary = await testDmarcSummaryCursor.next()
            expect(testDmarcSummary).toEqual(undefined)

            const testDomainsToDmarcSumCursor =
              await query`FOR item IN domainsToDmarcSummaries OPTIONS { waitForSync: true } RETURN item`
            const testDomainsToDmarcSum = await testDomainsToDmarcSumCursor.next()
            expect(testDomainsToDmarcSum).toEqual(undefined)
          })
          it('removes the ownership edge', async () => {
            await graphql({
              schema,
              source: `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organization', org._key)}"
                    }
                  ) {
                    result {
                      ... on OrganizationResult {
                        status
                        organization {
                          name
                        }
                      }
                      ... on OrganizationError {
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
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            await query`FOR owner IN ownership OPTIONS { waitForSync: true } RETURN owner`

            const testOwnershipCursor = await query`FOR owner IN ownership OPTIONS { waitForSync: true } RETURN owner`
            const testOwnership = await testOwnershipCursor.next()
            expect(testOwnership).toEqual(undefined)
          })
        })
        describe('it does not own the dmarc summary data', () => {
          it('does not remove the dmarc summary data', async () => {
            await graphql({
              schema,
              source: `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organization', org._key)}"
                    }
                  ) {
                    result {
                      ... on OrganizationResult {
                        status
                        organization {
                          name
                        }
                      }
                      ... on OrganizationError {
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
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            await query`FOR dmarcSum IN dmarcSummaries OPTIONS { waitForSync: true } RETURN dmarcSum`
            await query`FOR item IN domainsToDmarcSummaries OPTIONS { waitForSync: true } RETURN item`

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
        describe('org is the only one claiming the domain', () => {
          it('removes the web scan result data', async () => {
            await graphql({
              schema,
              source: `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organization', org._key)}"
                    }
                  ) {
                    result {
                      ... on OrganizationResult {
                        status
                        organization {
                          name
                        }
                      }
                      ... on OrganizationError {
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
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            const testWebScanCursor =
              await query`FOR wScan IN webScan OPTIONS { waitForSync: true } RETURN wScan.webScan`
            const testWebScan = await testWebScanCursor.next()
            expect(testWebScan).toEqual(undefined)
          })
          it('removes the scan data', async () => {
            await graphql({
              schema,
              source: `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organization', org._key)}"
                    }
                  ) {
                    result {
                      ... on OrganizationResult {
                        status
                        organization {
                          name
                        }
                      }
                      ... on OrganizationError {
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
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            const testDNSCursor = await query`FOR dnsResult IN dns OPTIONS { waitForSync: true } RETURN dnsResult.dns`
            const testDNS = await testDNSCursor.next()
            expect(testDNS).toEqual(undefined)

            const testWebCursor = await query`FOR webResult IN web OPTIONS { waitForSync: true } RETURN webResult.web`
            const testWeb = await testWebCursor.next()
            expect(testWeb).toEqual(undefined)
          })
          it('removes the domain', async () => {
            await graphql({
              schema,
              source: `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organization', org._key)}"
                    }
                  ) {
                    result {
                      ... on OrganizationResult {
                        status
                        organization {
                          name
                        }
                      }
                      ... on OrganizationError {
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
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            await query`FOR domain IN domains OPTIONS { waitForSync: true } RETURN domain`

            const domainCursor = await query`FOR domain IN domains OPTIONS { waitForSync: true } RETURN domain`
            const domainCheck = await domainCursor.next()
            expect(domainCheck).toEqual(undefined)
          })
          it('removes the affiliations, and org', async () => {
            await graphql({
              schema,
              source: `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organization', org._key)}"
                    }
                  ) {
                    result {
                      ... on OrganizationResult {
                        status
                        organization {
                          name
                        }
                      }
                      ... on OrganizationError {
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
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            await query`FOR aff IN affiliations OPTIONS { waitForSync: true } RETURN aff`
            await query`FOR org IN organizations OPTIONS { waitForSync: true } RETURN org`

            const testAffiliationCursor =
              await query`FOR aff IN affiliations OPTIONS { waitForSync: true } FILTER aff._from == ${org._key} RETURN aff`
            const testAffiliation = await testAffiliationCursor.next()
            expect(testAffiliation).toEqual(undefined)

            const testOrgCursor =
              await query`FOR org IN organizations OPTIONS { waitForSync: true } FILTER org._key == ${org._key} RETURN org`
            const testOrg = await testOrgCursor.next()
            expect(testOrg).toEqual(undefined)
          })
        })
        describe('multiple orgs claim the domain', () => {
          beforeEach(async () => {
            const secondOrg = await collections.organizations.save({})
            await collections.claims.save({
              _from: secondOrg._id,
              _to: domain._id,
            })
          })
          it('does not remove the web scan result data', async () => {
            await graphql({
              schema,
              source: `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organization', org._key)}"
                    }
                  ) {
                    result {
                      ... on OrganizationResult {
                        status
                        organization {
                          name
                        }
                      }
                      ... on OrganizationError {
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
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            const testWebScanCursor =
              await query`FOR wScan IN webScan OPTIONS { waitForSync: true } RETURN wScan.webScan`
            const testWebScan = await testWebScanCursor.next()
            expect(testWebScan).toEqual(true)
          })
          it('does not remove the scan data', async () => {
            await graphql({
              schema,
              source: `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organization', org._key)}"
                    }
                  ) {
                    result {
                      ... on OrganizationResult {
                        status
                        organization {
                          name
                        }
                      }
                      ... on OrganizationError {
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
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            const testDNSCursor = await query`FOR dnsResult IN dns OPTIONS { waitForSync: true } RETURN dnsResult.dns`
            const testDNS = await testDNSCursor.next()
            expect(testDNS).toEqual(true)

            const testWebCursor = await query`FOR webResult IN web OPTIONS { waitForSync: true } RETURN webResult.web`
            const testWeb = await testWebCursor.next()
            expect(testWeb).toEqual(true)
          })
          it('does not remove the domain', async () => {
            await graphql({
              schema,
              source: `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organization', org._key)}"
                    }
                  ) {
                    result {
                      ... on OrganizationResult {
                        status
                        organization {
                          name
                        }
                      }
                      ... on OrganizationError {
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
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            await query`FOR domain IN domains OPTIONS { waitForSync: true } RETURN domain`

            const domainCursor = await query`FOR domain IN domains OPTIONS { waitForSync: true } RETURN domain`
            const domainCheck = await domainCursor.next()
            expect(domainCheck).toBeDefined()
          })
          it('removes the affiliations, and org', async () => {
            await graphql({
              schema,
              source: `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organization', org._key)}"
                    }
                  ) {
                    result {
                      ... on OrganizationResult {
                        status
                        organization {
                          name
                        }
                      }
                      ... on OrganizationError {
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
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            await query`FOR aff IN affiliations OPTIONS { waitForSync: true } RETURN aff`
            await query`FOR org IN organizations OPTIONS { waitForSync: true } RETURN org`

            const testAffiliationCursor =
              await query`FOR aff IN affiliations OPTIONS { waitForSync: true } FILTER aff._from == ${org._key} RETURN aff`
            const testAffiliation = await testAffiliationCursor.next()
            expect(testAffiliation).toEqual(undefined)

            const testOrgCursor =
              await query`FOR org IN organizations OPTIONS { waitForSync: true } FILTER org._key == ${org._key} RETURN org`
            const testOrg = await testOrgCursor.next()
            expect(testOrg).toEqual(undefined)
          })
        })
      })
    })
  })
  describe('given an unsuccessful removal', () => {
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
      describe('the requested org is undefined', () => {
        it('returns an error', async () => {
          const response = await graphql({
            schema,
            source: `
              mutation {
                removeOrganization(
                  input: {
                    orgId: "${toGlobalId('organization', 123)}"
                  }
                ) {
                  result {
                    ... on OrganizationResult {
                      status
                      organization {
                        name
                      }
                    }
                    ... on OrganizationError {
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
                checkPermission: jest.fn(),
                userRequired: jest.fn(),
                verifiedRequired: jest.fn(),
              },
              validators: { cleanseInput },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue(undefined),
                },
              },
            },
          })

          const expectedResponse = {
            data: {
              removeOrganization: {
                result: {
                  code: 400,
                  description: 'Unable to remove unknown organization.',
                },
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to remove org: 123, but there is no org associated with that id.`,
          ])
        })
      })
      describe('given an incorrect permission', () => {
        describe('users belong to the org', () => {
          describe('users role is owner', () => {
            describe('user attempts to remove a verified org', () => {
              it('returns an error', async () => {
                const response = await graphql({
                  schema,
                  source: `
                    mutation {
                      removeOrganization(
                        input: {
                          orgId: "${toGlobalId('organization', 123)}"
                        }
                      ) {
                        result {
                          ... on OrganizationResult {
                            status
                            organization {
                              name
                            }
                          }
                          ... on OrganizationError {
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
                      checkPermission: jest.fn().mockReturnValue('owner'),
                      userRequired: jest.fn(),
                      verifiedRequired: jest.fn(),
                    },
                    validators: { cleanseInput },
                    loaders: {
                      loadOrgByKey: {
                        load: jest.fn().mockReturnValue({
                          _key: 123,
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
                        }),
                      },
                    },
                  },
                })

                const expectedResponse = {
                  data: {
                    removeOrganization: {
                      result: {
                        code: 403,
                        description:
                          'Permission Denied: Please contact super admin for help with removing organization.',
                      },
                    },
                  },
                }

                expect(response).toEqual(expectedResponse)
                expect(consoleOutput).toEqual([
                  `User: 123 attempted to remove org: 123, however the user is not a super admin.`,
                ])
              })
            })
          })
          describe('users role is user', () => {
            describe('they attempt to remove the org', () => {
              it('returns an error', async () => {
                const response = await graphql({
                  schema,
                  source: `
                    mutation {
                      removeOrganization(
                        input: {
                          orgId: "${toGlobalId('organization', 123)}"
                        }
                      ) {
                        result {
                          ... on OrganizationResult {
                            status
                            organization {
                              name
                            }
                          }
                          ... on OrganizationError {
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
                    },
                    validators: { cleanseInput },
                    loaders: {
                      loadOrgByKey: {
                        load: jest.fn().mockReturnValue({
                          _key: 123,
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
                        }),
                      },
                    },
                  },
                })

                const expectedResponse = {
                  data: {
                    removeOrganization: {
                      result: {
                        code: 403,
                        description:
                          'Permission Denied: Please contact organization admin for help with removing organization.',
                      },
                    },
                  },
                }

                expect(response).toEqual(expectedResponse)
                expect(consoleOutput).toEqual([
                  `User: 123 attempted to remove org: 123, however the user does not have permission to this organization.`,
                ])
              })
            })
          })
        })
      })
      describe('given a database error', () => {
        describe('when getting the ownership information', () => {
          it('throws an error', async () => {
            const mockedQuery = jest.fn().mockRejectedValue(new Error('Database Error'))

            const response = await graphql({
              schema,
              source: `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organization', 123)}"
                    }
                  ) {
                    result {
                      ... on OrganizationResult {
                        status
                        organization {
                          name
                        }
                      }
                      ... on OrganizationError {
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
                transaction: jest.fn().mockReturnValue({
                  abort: jest.fn(),
                }),
                userKey: 123,
                auth: {
                  checkPermission: jest.fn().mockReturnValue('owner'),
                  userRequired: jest.fn(),
                  verifiedRequired: jest.fn(),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      _key: 123,
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
                    }),
                  },
                },
              },
            })

            const error = [new GraphQLError('Unable to remove organization. Please try again.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Database error occurred for user: 123 while attempting to get dmarcSummaryInfo while removing org: 123, Error: Database Error`,
            ])
          })
        })
        describe('when getting the domain claim count', () => {
          it('throws an error', async () => {
            const mockedCursor = {
              all: jest.fn().mockReturnValue([]),
            }

            const mockedQuery = jest
              .fn()
              .mockReturnValueOnce(mockedCursor)
              .mockRejectedValue(new Error('Database Error'))

            const response = await graphql({
              schema,
              source: `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organization', 123)}"
                    }
                  ) {
                    result {
                      ... on OrganizationResult {
                        status
                        organization {
                          name
                        }
                      }
                      ... on OrganizationError {
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
                transaction: jest.fn().mockReturnValue({
                  abort: jest.fn(),
                }),
                userKey: 123,
                auth: {
                  checkPermission: jest.fn().mockReturnValue('owner'),
                  userRequired: jest.fn(),
                  verifiedRequired: jest.fn(),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      _key: 123,
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
                    }),
                  },
                },
              },
            })

            const error = [new GraphQLError('Unable to remove organization. Please try again.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Database error occurred for user: 123 while attempting to gather domain count while removing org: 123, Error: Database Error`,
            ])
          })
        })
      })
      describe('given a cursor error', () => {
        describe('when getting getting ownership information', () => {
          it('throws an error', async () => {
            const mockedCursor = {
              all: jest.fn().mockRejectedValue(new Error('Cursor Error')),
            }

            const mockedQuery = jest
              .fn()
              .mockReturnValueOnce(mockedCursor)
              .mockRejectedValue(new Error('Database Error'))

            const response = await graphql({
              schema,
              source: `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organization', 123)}"
                    }
                  ) {
                    result {
                      ... on OrganizationResult {
                        status
                        organization {
                          name
                        }
                      }
                      ... on OrganizationError {
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
                transaction: jest.fn().mockReturnValue({
                  abort: jest.fn(),
                }),
                userKey: 123,
                auth: {
                  checkPermission: jest.fn().mockReturnValue('owner'),
                  userRequired: jest.fn(),
                  verifiedRequired: jest.fn(),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      _key: 123,
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
                    }),
                  },
                },
              },
            })

            const error = [new GraphQLError('Unable to remove organization. Please try again.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Cursor error occurred for user: 123 while attempting to get dmarcSummaryInfo while removing org: 123, Error: Cursor Error`,
            ])
          })
        })
        describe('when getting getting domain claim count', () => {
          it('throws an error', async () => {
            const mockedCursor = {
              all: jest.fn().mockReturnValueOnce([]).mockRejectedValue(new Error('Cursor Error')),
            }

            const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

            const response = await graphql({
              schema,
              source: `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organization', 123)}"
                    }
                  ) {
                    result {
                      ... on OrganizationResult {
                        status
                        organization {
                          name
                        }
                      }
                      ... on OrganizationError {
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
                transaction: jest.fn().mockReturnValue({
                  abort: jest.fn(),
                }),
                userKey: 123,
                auth: {
                  checkPermission: jest.fn().mockReturnValue('owner'),
                  userRequired: jest.fn(),
                  verifiedRequired: jest.fn(),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      _key: 123,
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
                    }),
                  },
                },
              },
            })

            const error = [new GraphQLError('Unable to remove organization. Please try again.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Cursor error occurred for user: 123 while attempting to gather domain count while removing org: 123, Error: Cursor Error`,
            ])
          })
        })
      })
      describe('given a trx step error', () => {
        describe('when removing dmarc summary data', () => {
          it('throws an error', async () => {
            const mockedCursor = {
              all: jest.fn().mockReturnValue([{}]),
            }

            const mockedQuery = jest.fn().mockReturnValueOnce(mockedCursor)

            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest.fn().mockRejectedValue(new Error('Trx Step')),
              abort: jest.fn(),
            })

            const response = await graphql({
              schema,
              source: `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organization', 123)}"
                    }
                  ) {
                    result {
                      ... on OrganizationResult {
                        status
                        organization {
                          name
                        }
                      }
                      ... on OrganizationError {
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
                  checkPermission: jest.fn().mockReturnValue('owner'),
                  userRequired: jest.fn(),
                  verifiedRequired: jest.fn(),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      _key: 123,
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
                    }),
                  },
                },
              },
            })

            const error = [new GraphQLError('Unable to remove organization. Please try again.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred for user: 123 while attempting to remove dmarc summaries while removing org: 123, Error: Trx Step`,
            ])
          })
        })
        describe('when removing ownership data', () => {
          it('throws an error', async () => {
            const mockedCursor = {
              all: jest.fn().mockReturnValue([{}]),
            }

            const mockedQuery = jest.fn().mockReturnValueOnce(mockedCursor)

            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest.fn().mockReturnValueOnce({}).mockRejectedValue(new Error('Trx Step')),
              abort: jest.fn(),
            })

            const response = await graphql({
              schema,
              source: `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organization', 123)}"
                    }
                  ) {
                    result {
                      ... on OrganizationResult {
                        status
                        organization {
                          name
                        }
                      }
                      ... on OrganizationError {
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
                  checkPermission: jest.fn().mockReturnValue('owner'),
                  userRequired: jest.fn(),
                  verifiedRequired: jest.fn(),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      _key: 123,
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
                    }),
                  },
                },
              },
            })

            const error = [new GraphQLError('Unable to remove organization. Please try again.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred for user: 123 while attempting to remove ownerships while removing org: 123, Error: Trx Step`,
            ])
          })
        })
        describe('when removing web scan results data', () => {
          it('throws an error', async () => {
            const mockedCursor = {
              all: jest
                .fn()
                .mockReturnValueOnce([])
                .mockReturnValue([{ count: 1, domain: 'test.gc.ca' }]),
            }

            const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest.fn().mockRejectedValue(new Error('Trx Step')),
              abort: jest.fn(),
            })

            const response = await graphql({
              schema,
              source: `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organization', 123)}"
                    }
                  ) {
                    result {
                      ... on OrganizationResult {
                        status
                        organization {
                          name
                        }
                      }
                      ... on OrganizationError {
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
                  checkPermission: jest.fn().mockReturnValue('owner'),
                  userRequired: jest.fn(),
                  verifiedRequired: jest.fn(),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      _key: 123,
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
                    }),
                  },
                },
              },
            })

            const error = [new GraphQLError('Unable to remove organization. Please try again.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred while user: 123 attempted to remove web data for test.gc.ca in org: undefined, Error: Trx Step`,
            ])
          })
        })
        describe('when removing scan data', () => {
          it('throws an error', async () => {
            const mockedCursor = {
              all: jest
                .fn()
                .mockReturnValueOnce([])
                .mockReturnValue([{ count: 1, domain: 'test.gc.ca' }]),
            }

            const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest.fn().mockReturnValueOnce({}).mockRejectedValue(new Error('Trx Step')),
              abort: jest.fn(),
            })

            const response = await graphql({
              schema,
              source: `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organization', 123)}"
                    }
                  ) {
                    result {
                      ... on OrganizationResult {
                        status
                        organization {
                          name
                        }
                      }
                      ... on OrganizationError {
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
                  checkPermission: jest.fn().mockReturnValue('owner'),
                  userRequired: jest.fn(),
                  verifiedRequired: jest.fn(),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      _key: 123,
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
                    }),
                  },
                },
              },
            })

            const error = [new GraphQLError('Unable to remove organization. Please try again.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred while user: 123 attempted to remove DNS data for test.gc.ca in org: undefined, error: Error: Trx Step`,
            ])
          })
        })
        describe('when removing domain', () => {
          it('throws an error', async () => {
            const mockedCursor = {
              all: jest
                .fn()
                .mockReturnValueOnce([])
                .mockReturnValue([{ count: 1 }]),
            }

            const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest
                .fn()
                .mockReturnValueOnce({})
                .mockReturnValueOnce({})
                .mockReturnValueOnce({})
                .mockReturnValueOnce({})
                .mockRejectedValue(new Error('Trx Step')),
              abort: jest.fn(),
            })

            const response = await graphql({
              schema,
              source: `
              mutation {
                removeOrganization(
                  input: {
                    orgId: "${toGlobalId('organization', 123)}"
                  }
                ) {
                  result {
                    ... on OrganizationResult {
                      status
                      organization {
                        name
                      }
                    }
                    ... on OrganizationError {
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
                  checkPermission: jest.fn().mockReturnValue('owner'),
                  userRequired: jest.fn(),
                  verifiedRequired: jest.fn(),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      _key: 123,
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
                    }),
                  },
                },
              },
            })

            const error = [new GraphQLError('Unable to remove organization. Please try again.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred for user: 123 while attempting to remove domains while removing org: 123, Error: Trx Step`,
            ])
          })
        })
        describe('when removing affiliations and org', () => {
          it('throws an error', async () => {
            const mockedCursor = {
              all: jest
                .fn()
                .mockReturnValueOnce([])
                .mockReturnValue([{ count: 1 }]),
            }

            const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest
                .fn()
                .mockReturnValueOnce({})
                .mockReturnValueOnce({})
                .mockReturnValueOnce({})
                .mockReturnValueOnce({})
                .mockReturnValueOnce({})
                .mockRejectedValue(new Error('Trx Step')),
              abort: jest.fn(),
            })

            const response = await graphql({
              schema,
              source: `
              mutation {
                removeOrganization(
                  input: {
                    orgId: "${toGlobalId('organization', 123)}"
                  }
                ) {
                  result {
                    ... on OrganizationResult {
                      status
                      organization {
                        name
                      }
                    }
                    ... on OrganizationError {
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
                  checkPermission: jest.fn().mockReturnValue('owner'),
                  userRequired: jest.fn(),
                  verifiedRequired: jest.fn(),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      _key: 123,
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
                    }),
                  },
                },
              },
            })

            const error = [new GraphQLError('Unable to remove organization. Please try again.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred for user: 123 while attempting to remove affiliations, and the org while removing org: 123, Error: Trx Step`,
            ])
          })
        })
      })
      describe('given a trx commit error', () => {
        it('throws an error', async () => {
          const mockedCursor = {
            all: jest.fn().mockReturnValueOnce([]).mockReturnValue([]),
          }

          const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

          const mockedTransaction = jest.fn().mockReturnValue({
            step: jest.fn().mockReturnValue({}),
            commit: jest.fn().mockRejectedValue(new Error('Commit Error')),
            abort: jest.fn(),
          })

          const response = await graphql({
            schema,
            source: `
            mutation {
              removeOrganization(
                input: {
                  orgId: "${toGlobalId('organization', 123)}"
                }
              ) {
                result {
                  ... on OrganizationResult {
                    status
                    organization {
                      name
                    }
                  }
                  ... on OrganizationError {
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
                checkPermission: jest.fn().mockReturnValue('owner'),
                userRequired: jest.fn(),
                verifiedRequired: jest.fn(),
              },
              validators: { cleanseInput },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({
                    _key: 123,
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
                  }),
                },
              },
            },
          })

          const error = [new GraphQLError('Unable to remove organization. Please try again.')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Trx commit error occurred for user: 123 while attempting remove of org: 123, Error: Commit Error`,
          ])
        })
      })
    })
  })
})
