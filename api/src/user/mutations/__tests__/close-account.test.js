import {setupI18n} from '@lingui/core'
import {ensure, dbNameFromFile} from 'arango-tools'
import {graphql, GraphQLSchema, GraphQLError} from 'graphql'
import {toGlobalId} from 'graphql-relay'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import {checkSuperAdmin, userRequired} from '../../../auth'
import {loadOrgByKey} from '../../../organization/loaders'
import {loadUserByKey} from '../../../user/loaders'
import {cleanseInput} from '../../../validators'
import {createMutationSchema} from '../../../mutation'
import {createQuerySchema} from '../../../query'
import dbschema from '../../../../database.json'
import { collectionNames } from '../../../collection-names'

const {DB_PASS: rootPass, DB_URL: url} = process.env

describe('given the closeAccount mutation', () => {
  let i18n,
    query,
    drop,
    truncate,
    schema,
    collections,
    transaction,
    user,
    org,
    domain

  const consoleOutput = []
  const mockedConsole = (output) => consoleOutput.push(output)
  beforeAll(() => {
    console.info = mockedConsole
    console.warn = mockedConsole
    console.error = mockedConsole
    schema = new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createMutationSchema(),
    })
    i18n = setupI18n({
      locale: 'en',
      localeData: {
        en: {plurals: {}},
        fr: {plurals: {}},
      },
      locales: ['en', 'fr'],
      messages: {
        en: englishMessages.messages,
        fr: frenchMessages.messages,
      },
    })
  })
  afterEach(() => {
    consoleOutput.length = 0
  })

  describe('given a successful closing of an account', () => {
    beforeEach(async () => {
      ;({query, drop, truncate, collections, transaction} = await ensure({
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
    afterEach(async () => {
      await truncate()
      await drop()
    })
    describe('user is closing their own account', () => {
      beforeEach(async () => {
        user = await collections.users.save({
          userName: 'test.account@istio.actually.exists',
          emailValidated: true,
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
      })
      describe('user is an org owner', () => {
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'admin',
            owner: true,
          })
        })
        describe('org is owner of a domain', () => {
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
                  closeAccount(input: {}) {
                    result {
                      ... on CloseAccountResult {
                        status
                      }
                      ... on CloseAccountError {
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
                userKey: user._key,
                auth: {
                  checkSuperAdmin: checkSuperAdmin({
                    i18n,
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    i18n,
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({
                      query,
                      userKey: user._key,
                      i18n,
                    }),
                  }),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    i18n,
                    userKey: user._key,
                  }),
                },
                validators: {cleanseInput},
              },
            )

            await query`FOR dmarcSum IN dmarcSummaries OPTIONS { waitForSync: true } RETURN dmarcSum`
            await query`FOR item IN domainsToDmarcSummaries OPTIONS { waitForSync: true } RETURN item`

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
          it('removes ownership', async () => {
            await graphql(
              schema,
              `
                mutation {
                  closeAccount(input: {}) {
                    result {
                      ... on CloseAccountResult {
                        status
                      }
                      ... on CloseAccountError {
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
                userKey: user._key,
                auth: {
                  checkSuperAdmin: checkSuperAdmin({
                    i18n,
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    i18n,
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({
                      query,
                      userKey: user._key,
                      i18n,
                    }),
                  }),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    i18n,
                    userKey: user._key,
                  }),
                },
                validators: {cleanseInput},
              },
            )

            await query`FOR owner IN ownership OPTIONS { waitForSync: true } RETURN owner`

            const testOwnershipCursor =
              await query`FOR owner IN ownership OPTIONS { waitForSync: true } RETURN owner`
            const testOwnership = await testOwnershipCursor.next()
            expect(testOwnership).toEqual(undefined)
          })
        })
        describe('org is not owner of a domain', () => {
          beforeEach(async () => {
            await collections.ownership.save({
              _from: 'organizations/1',
              _to: domain._id,
            })
          })
          it('does not remove dmarc summary data', async () => {
            await graphql(
              schema,
              `
                mutation {
                  closeAccount(input: {}) {
                    result {
                      ... on CloseAccountResult {
                        status
                      }
                      ... on CloseAccountError {
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
                userKey: user._key,
                auth: {
                  checkSuperAdmin: checkSuperAdmin({
                    i18n,
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    i18n,
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({
                      query,
                      userKey: user._key,
                      i18n,
                    }),
                  }),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    i18n,
                    userKey: user._key,
                  }),
                },
                validators: {cleanseInput},
              },
            )

            await query`FOR dmarcSum IN dmarcSummaries OPTIONS { waitForSync: true } RETURN dmarcSum`
            await query`FOR item IN domainsToDmarcSummaries OPTIONS { waitForSync: true } RETURN item`

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
          it('does not remove ownership', async () => {
            await graphql(
              schema,
              `
                mutation {
                  closeAccount(input: {}) {
                    result {
                      ... on CloseAccountResult {
                        status
                      }
                      ... on CloseAccountError {
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
                userKey: user._key,
                auth: {
                  checkSuperAdmin: checkSuperAdmin({
                    i18n,
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    i18n,
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({
                      query,
                      userKey: user._key,
                      i18n,
                    }),
                  }),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    i18n,
                    userKey: user._key,
                  }),
                },
                validators: {cleanseInput},
              },
            )

            await query`FOR owner IN ownership OPTIONS { waitForSync: true } RETURN owner`

            const testOwnershipCursor =
              await query`FOR owner IN ownership OPTIONS { waitForSync: true } RETURN owner`
            const testOwnership = await testOwnershipCursor.next()
            expect(testOwnership).toBeDefined()
          })
        })
        describe('org is the only one claiming a domain', () => {
          it('removes web scan result data', async () => {
            await graphql(
              schema,
              `
                mutation {
                  closeAccount(input: {}) {
                    result {
                      ... on CloseAccountResult {
                        status
                      }
                      ... on CloseAccountError {
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
                userKey: user._key,
                auth: {
                  checkSuperAdmin: checkSuperAdmin({
                    i18n,
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    i18n,
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({
                      query,
                      userKey: user._key,
                      i18n,
                    }),
                  }),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    i18n,
                    userKey: user._key,
                  }),
                },
                validators: {cleanseInput},
              },
            )

            const testWebScanCursor =
              await query`FOR wScan IN webScan OPTIONS { waitForSync: true } RETURN wScan`
            const testWebScan = await testWebScanCursor.next()
            expect(testWebScan).toEqual(undefined)

          })
          it('removes scan data', async () => {
            await graphql(
              schema,
              `
                mutation {
                  closeAccount(input: {}) {
                    result {
                      ... on CloseAccountResult {
                        status
                      }
                      ... on CloseAccountError {
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
                userKey: user._key,
                auth: {
                  checkSuperAdmin: checkSuperAdmin({
                    i18n,
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    i18n,
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({
                      query,
                      userKey: user._key,
                      i18n,
                    }),
                  }),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    i18n,
                    userKey: user._key,
                  }),
                },
                validators: {cleanseInput},
              },
            )

            await query`FOR dnsResult IN dns OPTIONS { waitForSync: true } RETURN dnsResult`
            await query`FOR webResult IN web OPTIONS { waitForSync: true } RETURN webResult`

            const testDNSCursor =
              await query`FOR dnsResult IN dns OPTIONS { waitForSync: true } RETURN dnsResult`
            const testDNS = await testDNSCursor.next()
            expect(testDNS).toEqual(undefined)

            const testWebCursor =
              await query`FOR webResult IN web OPTIONS { waitForSync: true } RETURN webResult`
            const testWeb = await testWebCursor.next()
            expect(testWeb).toEqual(undefined)

          })
          it('removes claims', async () => {
            await graphql(
              schema,
              `
                mutation {
                  closeAccount(input: {}) {
                    result {
                      ... on CloseAccountResult {
                        status
                      }
                      ... on CloseAccountError {
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
                userKey: user._key,
                auth: {
                  checkSuperAdmin: checkSuperAdmin({
                    i18n,
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    i18n,
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({
                      query,
                      userKey: user._key,
                      i18n,
                    }),
                  }),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    i18n,
                    userKey: user._key,
                  }),
                },
                validators: {cleanseInput},
              },
            )

            await query`FOR claim IN claims OPTIONS { waitForSync: true } RETURN claim`

            const testClaimCursor =
              await query`FOR claim IN claims OPTIONS { waitForSync: true } RETURN claim`
            const testOrg = await testClaimCursor.next()
            expect(testOrg).toEqual(undefined)
          })
          it('removes domain', async () => {
            await graphql(
              schema,
              `
                mutation {
                  closeAccount(input: {}) {
                    result {
                      ... on CloseAccountResult {
                        status
                      }
                      ... on CloseAccountError {
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
                userKey: user._key,
                auth: {
                  checkSuperAdmin: checkSuperAdmin({
                    i18n,
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    i18n,
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({
                      query,
                      userKey: user._key,
                      i18n,
                    }),
                  }),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    i18n,
                    userKey: user._key,
                  }),
                },
                validators: {cleanseInput},
              },
            )

            await query`FOR domain IN domains OPTIONS { waitForSync: true } RETURN domain`

            const testDomainCursor =
              await query`FOR domain IN domains OPTIONS { waitForSync: true } RETURN domain`
            const testDomain = await testDomainCursor.next()
            expect(testDomain).toEqual(undefined)
          })
        })
        describe('multiple orgs claim the domain', () => {
          let org2
          beforeEach(async () => {
            org2 = await collections.organizations.save({
              orgDetails: {
                en: {
                  slug: 'treasury-board-secretariat-2',
                  acronym: 'TBS',
                  name: 'Treasury Board of Canada Secretariat',
                  zone: 'FED',
                  sector: 'TBS',
                  country: 'Canada',
                  province: 'Ontario',
                  city: 'Ottawa',
                },
                fr: {
                  slug: 'secretariat-conseil-tresor-2',
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
            await collections.claims.save({
              _from: org2._id,
              _to: domain._id,
            })
          })
          it('does not remove the domain', async () => {
            await graphql(
              schema,
              `
                mutation {
                  closeAccount(input: {}) {
                    result {
                      ... on CloseAccountResult {
                        status
                      }
                      ... on CloseAccountError {
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
                userKey: user._key,
                auth: {
                  checkSuperAdmin: checkSuperAdmin({
                    i18n,
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    i18n,
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({
                      query,
                      userKey: user._key,
                      i18n,
                    }),
                  }),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    i18n,
                    userKey: user._key,
                  }),
                },
                validators: {cleanseInput},
              },
            )

            await query`FOR domain IN domains OPTIONS { waitForSync: true } RETURN domain`

            const testDomainCursor =
              await query`FOR domain IN domains OPTIONS { waitForSync: true } RETURN domain`
            const testDomain = await testDomainCursor.next()
            expect(testDomain).toBeDefined()
          })
          it('removes the claim', async () => {
            await graphql(
              schema,
              `
                mutation {
                  closeAccount(input: {}) {
                    result {
                      ... on CloseAccountResult {
                        status
                      }
                      ... on CloseAccountError {
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
                userKey: user._key,
                auth: {
                  checkSuperAdmin: checkSuperAdmin({
                    i18n,
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    i18n,
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({
                      query,
                      userKey: user._key,
                      i18n,
                    }),
                  }),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    i18n,
                    userKey: user._key,
                  }),
                },
                validators: {cleanseInput},
              },
            )

            await query`FOR claim IN claims OPTIONS { waitForSync: true } RETURN claim`

            const testClaimCursor = await query`
                FOR claim IN claims
                  OPTIONS { waitForSync: true }
                  FILTER claim._from == ${org._id}
                  RETURN claim
              `
            const testClaim = await testClaimCursor.next()
            expect(testClaim).toEqual(undefined)
          })
        })
        it('removes affiliated users and org', async () => {
          await graphql(
            schema,
            `
              mutation {
                closeAccount(input: {}) {
                  result {
                    ... on CloseAccountResult {
                      status
                    }
                    ... on CloseAccountError {
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
              userKey: user._key,
              auth: {
                checkSuperAdmin: checkSuperAdmin({
                  i18n,
                  userKey: user._key,
                  query,
                }),
                userRequired: userRequired({
                  i18n,
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: user._key,
                    i18n,
                  }),
                }),
              },
              loaders: {
                loadOrgByKey: loadOrgByKey({
                  query,
                  language: 'en',
                  i18n,
                  userKey: user._key,
                }),
              },
              validators: {cleanseInput},
            },
          )

          await query`FOR aff IN affiliations OPTIONS { waitForSync: true } RETURN aff`
          await query`FOR org IN organizations OPTIONS { waitForSync: true } RETURN org`

          const testAffiliationCursor = await query`
              FOR aff IN affiliations
                OPTIONS { waitForSync: true }
                RETURN aff
            `
          const testAffiliation = await testAffiliationCursor.next()
          expect(testAffiliation).toEqual(undefined)

          const testOrgCursor = await query`
            FOR org IN organizations
              OPTIONS { waitForSync: true }
              RETURN org
          `
          const testOrg = await testOrgCursor.next()
          expect(testOrg).toEqual(undefined)
        })
        describe('user belongs to multiple orgs', () => {
          let org2
          beforeEach(async () => {
            org2 = await collections.organizations.save({
              orgDetails: {
                en: {
                  slug: 'treasury-board-secretariat-2',
                  acronym: 'TBS',
                  name: 'Treasury Board of Canada Secretariat',
                  zone: 'FED',
                  sector: 'TBS',
                  country: 'Canada',
                  province: 'Ontario',
                  city: 'Ottawa',
                },
                fr: {
                  slug: 'secretariat-conseil-tresor-2',
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
              _from: org2._id,
              _to: user._id,
              permission: 'user',
              owner: false,
            })
          })
          it('removes requesting users remaining affiliations', async () => {
            await graphql(
              schema,
              `
                mutation {
                  closeAccount(input: {}) {
                    result {
                      ... on CloseAccountResult {
                        status
                      }
                      ... on CloseAccountError {
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
                userKey: user._key,
                auth: {
                  checkSuperAdmin: checkSuperAdmin({
                    i18n,
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    i18n,
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({
                      query,
                      userKey: user._key,
                      i18n,
                    }),
                  }),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    i18n,
                    userKey: user._key,
                  }),
                },
                validators: {cleanseInput},
              },
            )

            await query`FOR aff IN affiliations OPTIONS { waitForSync: true } RETURN aff`

            const testAffiliationCursor = await query`
                FOR aff IN affiliations
                  OPTIONS { waitForSync: true }
                  RETURN aff
              `
            const testAffiliation = await testAffiliationCursor.next()
            expect(testAffiliation).toEqual(undefined)
          })
        })
      })
      describe('user is not an org owner', () => {
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'user',
            owner: false,
          })
        })
        it('removes the users affiliations', async () => {
          await graphql(
            schema,
            `
              mutation {
                closeAccount(input: {}) {
                  result {
                    ... on CloseAccountResult {
                      status
                    }
                    ... on CloseAccountError {
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
              userKey: user._key,
              auth: {
                checkSuperAdmin: checkSuperAdmin({
                  i18n,
                  userKey: user._key,
                  query,
                }),
                userRequired: userRequired({
                  i18n,
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: user._key,
                    i18n,
                  }),
                }),
              },
              loaders: {
                loadOrgByKey: loadOrgByKey({
                  query,
                  language: 'en',
                  i18n,
                  userKey: user._key,
                }),
              },
              validators: {cleanseInput},
            },
          )

          await query`FOR aff IN affiliations OPTIONS { waitForSync: true } RETURN aff`

          const testAffiliationCursor = await query`
              FOR aff IN affiliations
                OPTIONS { waitForSync: true }
                RETURN aff
            `
          const testAffiliation = await testAffiliationCursor.next()
          expect(testAffiliation).toEqual(undefined)
        })
      })
      describe('users language is set to english', () => {
        beforeAll(() => {
          i18n = setupI18n({
            locale: 'en',
            localeData: {
              en: {plurals: {}},
              fr: {plurals: {}},
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
                closeAccount(input: {}) {
                  result {
                    ... on CloseAccountResult {
                      status
                    }
                    ... on CloseAccountError {
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
              userKey: user._key,
              auth: {
                checkSuperAdmin: checkSuperAdmin({
                  i18n,
                  userKey: user._key,
                  query,
                }),
                userRequired: userRequired({
                  i18n,
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: user._key,
                    i18n,
                  }),
                }),
              },
              loaders: {
                loadOrgByKey: loadOrgByKey({
                  query,
                  language: 'en',
                  i18n,
                  userKey: user._key,
                }),
              },
              validators: {cleanseInput},
            },
          )

          const expectedResponse = {
            data: {
              closeAccount: {
                result: {
                  status: 'Successfully closed account.',
                },
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully closed user: ${user._id} account.`,
          ])
        })
      })
      describe('users language is set to french', () => {
        beforeAll(() => {
          i18n = setupI18n({
            locale: 'fr',
            localeData: {
              en: {plurals: {}},
              fr: {plurals: {}},
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
                closeAccount(input: {}) {
                  result {
                    ... on CloseAccountResult {
                      status
                    }
                    ... on CloseAccountError {
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
              userKey: user._key,
              auth: {
                checkSuperAdmin: checkSuperAdmin({
                  i18n,
                  userKey: user._key,
                  query,
                }),
                userRequired: userRequired({
                  i18n,
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: user._key,
                    i18n,
                  }),
                }),
              },
              loaders: {
                loadOrgByKey: loadOrgByKey({
                  query,
                  language: 'en',
                  i18n,
                  userKey: user._key,
                }),
              },
              validators: {cleanseInput},
            },
          )

          const expectedResponse = {
            data: {
              closeAccount: {
                result: {
                  status: 'Le compte a été fermé avec succès.',
                },
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully closed user: ${user._id} account.`,
          ])
        })
      })
      it('closes the users account', async () => {
        await graphql(
          schema,
          `
            mutation {
              closeAccount(input: {}) {
                result {
                  ... on CloseAccountResult {
                    status
                  }
                  ... on CloseAccountError {
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
            userKey: user._key,
            auth: {
              checkSuperAdmin: checkSuperAdmin({
                i18n,
                userKey: user._key,
                query,
              }),
              userRequired: userRequired({
                i18n,
                userKey: user._key,
                loadUserByKey: loadUserByKey({
                  query,
                  userKey: user._key,
                  i18n,
                }),
              }),
            },
            loaders: {
              loadOrgByKey: loadOrgByKey({
                query,
                language: 'en',
                i18n,
                userKey: user._key,
              }),
            },
            validators: {cleanseInput},
          },
        )

        await query`FOR user IN users OPTIONS { waitForSync: true } RETURN user`

        const testUserCursor =
          await query`FOR user IN users OPTIONS { waitForSync: true } RETURN user`
        const testUser = await testUserCursor.next()
        expect(testUser).toEqual(undefined)
      })
    })
    describe('super admin is closing another users account', () => {
      let superAdmin, superAdminOrg
      beforeEach(async () => {
        superAdmin = await collections.users.save({
          userName: 'super.admin@istio.actually.exists',
          emailValidated: true,
        })
        superAdminOrg = await collections.organizations.save({
          orgDetails: {
            en: {
              slug: 'super-admin',
              acronym: 'SA',
              name: 'Super Admin',
              zone: 'FED',
              sector: 'TBS',
              country: 'Canada',
              province: 'Ontario',
              city: 'Ottawa',
            },
            fr: {
              slug: 'super-admin',
              acronym: 'SA',
              name: 'Super Admin',
              zone: 'FED',
              sector: 'TBS',
              country: 'Canada',
              province: 'Ontario',
              city: 'Ottawa',
            },
          },
        })
        await collections.affiliations.save({
          _from: superAdminOrg._id,
          _to: superAdmin._id,
          permission: 'super_admin',
          owner: false,
        })
        user = await collections.users.save({
          userName: 'test.account@istio.actually.exists',
          emailValidated: true,
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
      })
      describe('user is an org owner', () => {
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'admin',
            owner: true,
          })
        })
        describe('org is owner of a domain', () => {
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
                  closeAccount(input: {
                    userId: "${toGlobalId('user', user._key)}"
                  }) {
                    result {
                      ... on CloseAccountResult {
                        status
                      }
                      ... on CloseAccountError {
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
                userKey: superAdmin._key,
                auth: {
                  checkSuperAdmin: checkSuperAdmin({
                    i18n,
                    userKey: superAdmin._key,
                    query,
                  }),
                  userRequired: userRequired({
                    i18n,
                    userKey: superAdmin._key,
                    loadUserByKey: loadUserByKey({
                      query,
                      userKey: superAdmin._key,
                      i18n,
                    }),
                  }),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    i18n,
                    userKey: superAdmin._key,
                  }),
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: user._key,
                    i18n,
                  }),
                },
                validators: {cleanseInput},
              },
            )

            await query`FOR dmarcSum IN dmarcSummaries OPTIONS { waitForSync: true } RETURN dmarcSum`
            await query`FOR item IN domainsToDmarcSummaries OPTIONS { waitForSync: true } RETURN item`

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
          it('removes ownership', async () => {
            await graphql(
              schema,
              `
                mutation {
                  closeAccount(input: {
                    userId: "${toGlobalId('user', user._key)}"
                  }) {
                    result {
                      ... on CloseAccountResult {
                        status
                      }
                      ... on CloseAccountError {
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
                userKey: superAdmin._key,
                auth: {
                  checkSuperAdmin: checkSuperAdmin({
                    i18n,
                    userKey: superAdmin._key,
                    query,
                  }),
                  userRequired: userRequired({
                    i18n,
                    userKey: superAdmin._key,
                    loadUserByKey: loadUserByKey({
                      query,
                      userKey: superAdmin._key,
                      i18n,
                    }),
                  }),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    i18n,
                    userKey: superAdmin._key,
                  }),
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: user._key,
                    i18n,
                  }),
                },
                validators: {cleanseInput},
              },
            )

            await query`FOR owner IN ownership OPTIONS { waitForSync: true } RETURN owner`

            const testOwnershipCursor =
              await query`FOR owner IN ownership OPTIONS { waitForSync: true } RETURN owner`
            const testOwnership = await testOwnershipCursor.next()
            expect(testOwnership).toEqual(undefined)
          })
        })
        describe('org is not owner of a domain', () => {
          beforeEach(async () => {
            await collections.ownership.save({
              _from: 'organizations/1',
              _to: domain._id,
            })
          })
          it('does not remove dmarc summary data', async () => {
            await graphql(
              schema,
              `
                mutation {
                  closeAccount(input: {
                    userId: "${toGlobalId('user', user._key)}"
                  }) {
                    result {
                      ... on CloseAccountResult {
                        status
                      }
                      ... on CloseAccountError {
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
                userKey: superAdmin._key,
                auth: {
                  checkSuperAdmin: checkSuperAdmin({
                    i18n,
                    userKey: superAdmin._key,
                    query,
                  }),
                  userRequired: userRequired({
                    i18n,
                    userKey: superAdmin._key,
                    loadUserByKey: loadUserByKey({
                      query,
                      userKey: superAdmin._key,
                      i18n,
                    }),
                  }),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    i18n,
                    userKey: superAdmin._key,
                  }),
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: user._key,
                    i18n,
                  }),
                },
                validators: {cleanseInput},
              },
            )

            await query`FOR dmarcSum IN dmarcSummaries OPTIONS { waitForSync: true } RETURN dmarcSum`
            await query`FOR item IN domainsToDmarcSummaries OPTIONS { waitForSync: true } RETURN item`

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
          it('does not remove ownership', async () => {
            await graphql(
              schema,
              `
                mutation {
                  closeAccount(input: {}) {
                    result {
                      ... on CloseAccountResult {
                        status
                      }
                      ... on CloseAccountError {
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
                userKey: user._key,
                auth: {
                  checkSuperAdmin: checkSuperAdmin({
                    i18n,
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    i18n,
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({
                      query,
                      userKey: user._key,
                      i18n,
                    }),
                  }),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    i18n,
                    userKey: user._key,
                  }),
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: user._key,
                    i18n,
                  }),
                },
                validators: {cleanseInput},
              },
            )

            await query`FOR owner IN ownership OPTIONS { waitForSync: true } RETURN owner`

            const testOwnershipCursor =
              await query`FOR owner IN ownership OPTIONS { waitForSync: true } RETURN owner`
            const testOwnership = await testOwnershipCursor.next()
            expect(testOwnership).toBeDefined()
          })
        })
        describe('org is the only one claiming a domain', () => {
          it('removes web scan result data', async () => {
            await graphql(
              schema,
              `
                mutation {
                  closeAccount(input: {
                    userId: "${toGlobalId('user', user._key)}"
                  }) {
                    result {
                      ... on CloseAccountResult {
                        status
                      }
                      ... on CloseAccountError {
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
                userKey: superAdmin._key,
                auth: {
                  checkSuperAdmin: checkSuperAdmin({
                    i18n,
                    userKey: superAdmin._key,
                    query,
                  }),
                  userRequired: userRequired({
                    i18n,
                    userKey: superAdmin._key,
                    loadUserByKey: loadUserByKey({
                      query,
                      userKey: superAdmin._key,
                      i18n,
                    }),
                  }),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    i18n,
                    userKey: superAdmin._key,
                  }),
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: user._key,
                    i18n,
                  }),
                },
                validators: {cleanseInput},
              },
            )

            const testWebScanCursor =
              await query`FOR wScan IN webScan OPTIONS { waitForSync: true } RETURN wScan`
            const testWebScan = await testWebScanCursor.next()
            expect(testWebScan).toEqual(undefined)

          })
          it('removes scan data', async () => {
            await graphql(
              schema,
              `
                mutation {
                  closeAccount(input: {
                    userId: "${toGlobalId('user', user._key)}"
                  }) {
                    result {
                      ... on CloseAccountResult {
                        status
                      }
                      ... on CloseAccountError {
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
                userKey: superAdmin._key,
                auth: {
                  checkSuperAdmin: checkSuperAdmin({
                    i18n,
                    userKey: superAdmin._key,
                    query,
                  }),
                  userRequired: userRequired({
                    i18n,
                    userKey: superAdmin._key,
                    loadUserByKey: loadUserByKey({
                      query,
                      userKey: superAdmin._key,
                      i18n,
                    }),
                  }),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    i18n,
                    userKey: superAdmin._key,
                  }),
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: user._key,
                    i18n,
                  }),
                },
                validators: {cleanseInput},
              },
            )

            await query`FOR dnsResult IN dns OPTIONS { waitForSync: true } RETURN dnsResult`
            await query`FOR webResult IN web OPTIONS { waitForSync: true } RETURN webResult`

            const testDNSCursor =
              await query`FOR dnsResult IN dns OPTIONS { waitForSync: true } RETURN dnsResult`
            const testDNS = await testDNSCursor.next()
            expect(testDNS).toEqual(undefined)

            const testWebCursor =
              await query`FOR webResult IN web OPTIONS { waitForSync: true } RETURN webResult`
            const testWeb = await testWebCursor.next()
            expect(testWeb).toEqual(undefined)

          })
          it('removes claims', async () => {
            await graphql(
              schema,
              `
                mutation {
                  closeAccount(input: {
                    userId: "${toGlobalId('user', user._key)}"
                  }) {
                    result {
                      ... on CloseAccountResult {
                        status
                      }
                      ... on CloseAccountError {
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
                userKey: superAdmin._key,
                auth: {
                  checkSuperAdmin: checkSuperAdmin({
                    i18n,
                    userKey: superAdmin._key,
                    query,
                  }),
                  userRequired: userRequired({
                    i18n,
                    userKey: superAdmin._key,
                    loadUserByKey: loadUserByKey({
                      query,
                      userKey: superAdmin._key,
                      i18n,
                    }),
                  }),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    i18n,
                    userKey: superAdmin._key,
                  }),
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: user._key,
                    i18n,
                  }),
                },
                validators: {cleanseInput},
              },
            )

            await query`FOR claim IN claims OPTIONS { waitForSync: true } RETURN claim`

            const testClaimCursor =
              await query`FOR claim IN claims OPTIONS { waitForSync: true } RETURN claim`
            const testOrg = await testClaimCursor.next()
            expect(testOrg).toEqual(undefined)
          })
          it('removes domain', async () => {
            await graphql(
              schema,
              `
                mutation {
                  closeAccount(input: {
                    userId: "${toGlobalId('user', user._key)}"
                  }) {
                    result {
                      ... on CloseAccountResult {
                        status
                      }
                      ... on CloseAccountError {
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
                userKey: superAdmin._key,
                auth: {
                  checkSuperAdmin: checkSuperAdmin({
                    i18n,
                    userKey: superAdmin._key,
                    query,
                  }),
                  userRequired: userRequired({
                    i18n,
                    userKey: superAdmin._key,
                    loadUserByKey: loadUserByKey({
                      query,
                      userKey: superAdmin._key,
                      i18n,
                    }),
                  }),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    i18n,
                    userKey: superAdmin._key,
                  }),
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: user._key,
                    i18n,
                  }),
                },
                validators: {cleanseInput},
              },
            )

            await query`FOR domain IN domains OPTIONS { waitForSync: true } RETURN domain`

            const testDomainCursor =
              await query`FOR domain IN domains OPTIONS { waitForSync: true } RETURN domain`
            const testDomain = await testDomainCursor.next()
            expect(testDomain).toEqual(undefined)
          })
        })
        describe('multiple orgs claim the domain', () => {
          let org2
          beforeEach(async () => {
            org2 = await collections.organizations.save({
              orgDetails: {
                en: {
                  slug: 'treasury-board-secretariat-2',
                  acronym: 'TBS',
                  name: 'Treasury Board of Canada Secretariat',
                  zone: 'FED',
                  sector: 'TBS',
                  country: 'Canada',
                  province: 'Ontario',
                  city: 'Ottawa',
                },
                fr: {
                  slug: 'secretariat-conseil-tresor-2',
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
            await collections.claims.save({
              _from: org2._id,
              _to: domain._id,
            })
          })
          it('does not remove the domain', async () => {
            await graphql(
              schema,
              `
                mutation {
                  closeAccount(input: {}) {
                    result {
                      ... on CloseAccountResult {
                        status
                      }
                      ... on CloseAccountError {
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
                userKey: user._key,
                auth: {
                  checkSuperAdmin: checkSuperAdmin({
                    i18n,
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    i18n,
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({
                      query,
                      userKey: user._key,
                      i18n,
                    }),
                  }),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    i18n,
                    userKey: user._key,
                  }),
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: user._key,
                    i18n,
                  }),
                },
                validators: {cleanseInput},
              },
            )

            await query`FOR domain IN domains OPTIONS { waitForSync: true } RETURN domain`

            const testDomainCursor =
              await query`FOR domain IN domains OPTIONS { waitForSync: true } RETURN domain`
            const testDomain = await testDomainCursor.next()
            expect(testDomain).toBeDefined()
          })
          it('removes the claim', async () => {
            await graphql(
              schema,
              `
                mutation {
                  closeAccount(input: {}) {
                    result {
                      ... on CloseAccountResult {
                        status
                      }
                      ... on CloseAccountError {
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
                userKey: user._key,
                auth: {
                  checkSuperAdmin: checkSuperAdmin({
                    i18n,
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    i18n,
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({
                      query,
                      userKey: user._key,
                      i18n,
                    }),
                  }),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    i18n,
                    userKey: user._key,
                  }),
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: user._key,
                    i18n,
                  }),
                },
                validators: {cleanseInput},
              },
            )

            await query`FOR claim IN claims OPTIONS { waitForSync: true } RETURN claim`

            const testClaimCursor = await query`
                FOR claim IN claims
                  OPTIONS { waitForSync: true }
                  FILTER claim._from == ${org._id}
                  RETURN claim
              `
            const testClaim = await testClaimCursor.next()
            expect(testClaim).toEqual(undefined)
          })
        })
        describe('user belongs to multiple orgs', () => {
          let org2
          beforeEach(async () => {
            org2 = await collections.organizations.save({
              orgDetails: {
                en: {
                  slug: 'treasury-board-secretariat-2',
                  acronym: 'TBS',
                  name: 'Treasury Board of Canada Secretariat',
                  zone: 'FED',
                  sector: 'TBS',
                  country: 'Canada',
                  province: 'Ontario',
                  city: 'Ottawa',
                },
                fr: {
                  slug: 'secretariat-conseil-tresor-2',
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
              _from: org2._id,
              _to: user._id,
              permission: 'user',
              owner: false,
            })
          })
          it('removes requesting users remaining affiliations', async () => {
            await graphql(
              schema,
              `
                mutation {
                  closeAccount(input: {}) {
                    result {
                      ... on CloseAccountResult {
                        status
                      }
                      ... on CloseAccountError {
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
                userKey: user._key,
                auth: {
                  checkSuperAdmin: checkSuperAdmin({
                    i18n,
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    i18n,
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({
                      query,
                      userKey: user._key,
                      i18n,
                    }),
                  }),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    i18n,
                    userKey: user._key,
                  }),
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: user._key,
                    i18n,
                  }),
                },
                validators: {cleanseInput},
              },
            )

            await query`FOR aff IN affiliations OPTIONS { waitForSync: true } RETURN aff`

            const testAffiliationCursor = await query`
                FOR aff IN affiliations
                  OPTIONS { waitForSync: true }
                  FILTER aff._from != ${superAdminOrg._id}
                  RETURN aff
              `
            const testAffiliation = await testAffiliationCursor.next()
            expect(testAffiliation).toEqual(undefined)
          })
        })
        it('removes affiliated users and org', async () => {
          await graphql(
            schema,
            `
              mutation {
                closeAccount(input: {}) {
                  result {
                    ... on CloseAccountResult {
                      status
                    }
                    ... on CloseAccountError {
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
              userKey: user._key,
              auth: {
                checkSuperAdmin: checkSuperAdmin({
                  i18n,
                  userKey: user._key,
                  query,
                }),
                userRequired: userRequired({
                  i18n,
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: user._key,
                    i18n,
                  }),
                }),
              },
              loaders: {
                loadOrgByKey: loadOrgByKey({
                  query,
                  language: 'en',
                  i18n,
                  userKey: user._key,
                }),
                loadUserByKey: loadUserByKey({
                  query,
                  userKey: user._key,
                  i18n,
                }),
              },
              validators: {cleanseInput},
            },
          )

          await query`FOR aff IN affiliations OPTIONS { waitForSync: true } RETURN aff`
          await query`FOR org IN organizations OPTIONS { waitForSync: true } RETURN org`

          const testAffiliationCursor = await query`
              FOR aff IN affiliations
                OPTIONS { waitForSync: true }
                FILTER aff._from != ${superAdminOrg._id}
                RETURN aff
            `
          const testAffiliation = await testAffiliationCursor.next()
          expect(testAffiliation).toEqual(undefined)

          const testOrgCursor = await query`
            FOR org IN organizations
              OPTIONS { waitForSync: true }
              FILTER org._key != ${superAdminOrg._key}
              RETURN org
          `
          const testOrg = await testOrgCursor.next()
          expect(testOrg).toEqual(undefined)
        })
      })
      describe('user is not an org owner', () => {
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'user',
            owner: false,
          })
        })
        it('removes the users affiliations', async () => {
          await graphql(
            schema,
            `
              mutation {
                closeAccount(input: {}) {
                  result {
                    ... on CloseAccountResult {
                      status
                    }
                    ... on CloseAccountError {
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
              userKey: user._key,
              auth: {
                checkSuperAdmin: checkSuperAdmin({
                  i18n,
                  userKey: user._key,
                  query,
                }),
                userRequired: userRequired({
                  i18n,
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: user._key,
                    i18n,
                  }),
                }),
              },
              loaders: {
                loadOrgByKey: loadOrgByKey({
                  query,
                  language: 'en',
                  i18n,
                  userKey: user._key,
                }),
                loadUserByKey: loadUserByKey({
                  query,
                  userKey: user._key,
                  i18n,
                }),
              },
              validators: {cleanseInput},
            },
          )

          await query`FOR aff IN affiliations OPTIONS { waitForSync: true } RETURN aff`

          const testAffiliationCursor = await query`
              FOR aff IN affiliations
                OPTIONS { waitForSync: true }
                FILTER aff._from != ${superAdminOrg._id}
                RETURN aff
            `
          const testAffiliation = await testAffiliationCursor.next()
          expect(testAffiliation).toEqual(undefined)
        })
      })
      describe('users language is set to english', () => {
        beforeAll(() => {
          i18n = setupI18n({
            locale: 'en',
            localeData: {
              en: {plurals: {}},
              fr: {plurals: {}},
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
                closeAccount(input: {}) {
                  result {
                    ... on CloseAccountResult {
                      status
                    }
                    ... on CloseAccountError {
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
              userKey: user._key,
              auth: {
                checkSuperAdmin: checkSuperAdmin({
                  i18n,
                  userKey: user._key,
                  query,
                }),
                userRequired: userRequired({
                  i18n,
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: user._key,
                    i18n,
                  }),
                }),
              },
              loaders: {
                loadOrgByKey: loadOrgByKey({
                  query,
                  language: 'en',
                  i18n,
                  userKey: user._key,
                }),
                loadUserByKey: loadUserByKey({
                  query,
                  userKey: user._key,
                  i18n,
                }),
              },
              validators: {cleanseInput},
            },
          )

          const expectedResponse = {
            data: {
              closeAccount: {
                result: {
                  status: 'Successfully closed account.',
                },
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully closed user: ${user._id} account.`,
          ])
        })
      })
      describe('users language is set to french', () => {
        beforeAll(() => {
          i18n = setupI18n({
            locale: 'fr',
            localeData: {
              en: {plurals: {}},
              fr: {plurals: {}},
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
                closeAccount(input: {}) {
                  result {
                    ... on CloseAccountResult {
                      status
                    }
                    ... on CloseAccountError {
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
              userKey: user._key,
              auth: {
                checkSuperAdmin: checkSuperAdmin({
                  i18n,
                  userKey: user._key,
                  query,
                }),
                userRequired: userRequired({
                  i18n,
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: user._key,
                    i18n,
                  }),
                }),
              },
              loaders: {
                loadOrgByKey: loadOrgByKey({
                  query,
                  language: 'en',
                  i18n,
                  userKey: user._key,
                }),
                loadUserByKey: loadUserByKey({
                  query,
                  userKey: user._key,
                  i18n,
                }),
              },
              validators: {cleanseInput},
            },
          )

          const expectedResponse = {
            data: {
              closeAccount: {
                result: {
                  status: 'Le compte a été fermé avec succès.',
                },
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully closed user: ${user._id} account.`,
          ])
        })
      })
      it('closes the users account', async () => {
        await graphql(
          schema,
          `
            mutation {
              closeAccount(input: {
                userId: "${toGlobalId('user', user._key)}"
              }) {
                result {
                  ... on CloseAccountResult {
                    status
                  }
                  ... on CloseAccountError {
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
            userKey: superAdmin._key,
            auth: {
              checkSuperAdmin: checkSuperAdmin({
                i18n,
                userKey: superAdmin._key,
                query,
              }),
              userRequired: userRequired({
                i18n,
                userKey: superAdmin._key,
                loadUserByKey: loadUserByKey({
                  query,
                  userKey: superAdmin._key,
                  i18n,
                }),
              }),
            },
            loaders: {
              loadUserByKey: loadUserByKey({
                query,
                userKey: superAdmin._key,
                i18n,
              }),
            },
            validators: {cleanseInput},
          },
        )

        await query`FOR user IN users OPTIONS { waitForSync: true } RETURN user`

        const testUserCursor = await query`
          FOR user IN users
            OPTIONS { waitForSync: true }
            FILTER user.userName != "super.admin@istio.actually.exists"
            RETURN user
        `
        const testUser = await testUserCursor.next()
        expect(testUser).toEqual(undefined)
      })
    })
  })

  describe('given an unsuccessful closing of an account', () => {
    describe('language is set to english', () => {
      beforeAll(() => {
        i18n = setupI18n({
          locale: 'en',
          localeData: {
            en: {plurals: {}},
            fr: {plurals: {}},
          },
          locales: ['en', 'fr'],
          messages: {
            en: englishMessages.messages,
            fr: frenchMessages.messages,
          },
        })
      })
      describe('user attempts to close another users account', () => {
        describe('requesting user is not a super admin', () => {
          it('returns an error', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  closeAccount(input: {
                    userId: "${toGlobalId('user', '456')}"
                  }) {
                    result {
                      ... on CloseAccountResult {
                        status
                      }
                      ... on CloseAccountError {
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
                userKey: '123',
                auth: {
                  checkSuperAdmin: jest.fn().mockReturnValue(false),
                  userRequired: jest.fn().mockReturnValue({_key: '123'}),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    i18n,
                    userKey: '123',
                  }),
                },
                validators: {cleanseInput},
              },
            )

            const expectedResponse = {
              data: {
                closeAccount: {
                  result: {
                    code: 400,
                    description:
                      "Permission error: Unable to close other user's account.",
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: 123 attempted to close user: 456 account, but requesting user is not a super admin.`,
            ])
          })
        })
        describe('requested user is undefined', () => {
          it('returns an error', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  closeAccount(input: {
                    userId: "${toGlobalId('user', '456')}"
                  }) {
                    result {
                      ... on CloseAccountResult {
                        status
                      }
                      ... on CloseAccountError {
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
                userKey: '123',
                auth: {
                  checkSuperAdmin: jest.fn().mockReturnValue(true),
                  userRequired: jest.fn().mockReturnValue({_key: '123'}),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    i18n,
                    userKey: '123',
                  }),
                  loadUserByKey: {
                    load: jest.fn().mockReturnValue(undefined),
                  },
                },
                validators: {cleanseInput},
              },
            )

            const expectedResponse = {
              data: {
                closeAccount: {
                  result: {
                    code: 400,
                    description:
                      'Unable to close account of an undefined user.',
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: 123 attempted to close user: 456 account, but requested user is undefined.`,
            ])
          })
        })
      })
      describe('database error occurs', () => {
        describe('when getting affiliation info', () => {
          it('throws an error', async () => {
            const mockedQuery = jest
              .fn()
              .mockRejectedValue(new Error('database error'))

            const response = await graphql(
              schema,
              `
                mutation {
                  closeAccount(input: {}) {
                    result {
                      ... on CloseAccountResult {
                        status
                      }
                      ... on CloseAccountError {
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
                collections: collectionNames,
                transaction,
                userKey: '123',
                auth: {
                  checkSuperAdmin: jest.fn().mockReturnValue(true),
                  userRequired: jest
                    .fn()
                    .mockReturnValue({_key: '123', _id: 'users/123'}),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    i18n,
                    userKey: '123',
                  }),
                  loadUserByKey: {
                    load: jest.fn().mockReturnValue({_key: '123'}),
                  },
                },
                validators: {cleanseInput},
              },
            )

            const error = [
              new GraphQLError('Unable to close account. Please try again.'),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Database error occurred when getting affiliations when user: 123 attempted to close account: users/123: Error: database error`,
            ])
          })
        })
        describe('when getting ownership info', () => {
          it('throws an error', async () => {
            const mockedCursor = {
              all: jest.fn().mockReturnValue([{}]),
            }

            const mockedQuery = jest
              .fn()
              .mockReturnValueOnce(mockedCursor)
              .mockRejectedValue(new Error('database error'))

            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest.fn().mockReturnValue(),
              commit: jest.fn(),
            })

            const response = await graphql(
              schema,
              `
                mutation {
                  closeAccount(input: {}) {
                    result {
                      ... on CloseAccountResult {
                        status
                      }
                      ... on CloseAccountError {
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
                collections: collectionNames,
                transaction: mockedTransaction,
                userKey: '123',
                auth: {
                  checkSuperAdmin: jest.fn().mockReturnValue(true),
                  userRequired: jest
                    .fn()
                    .mockReturnValue({_key: '123', _id: 'users/123'}),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    i18n,
                    userKey: '123',
                  }),
                  loadUserByKey: {
                    load: jest.fn().mockReturnValue({_key: '123'}),
                  },
                },
                validators: {cleanseInput},
              },
            )

            const error = [
              new GraphQLError('Unable to close account. Please try again.'),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Database error occurred when getting ownership info when user: 123 attempted to close account: users/123: Error: database error`,
            ])
          })
        })
        describe('when gathering domain claim info', () => {
          it('throws an error', async () => {
            const mockedCursor = {
              all: jest.fn().mockReturnValue([{}]),
            }

            const mockedQuery = jest
              .fn()
              .mockReturnValueOnce(mockedCursor)
              .mockReturnValueOnce(mockedCursor)
              .mockRejectedValue(new Error('database error'))

            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest.fn().mockReturnValue(),
              commit: jest.fn(),
            })

            const response = await graphql(
              schema,
              `
                mutation {
                  closeAccount(input: {}) {
                    result {
                      ... on CloseAccountResult {
                        status
                      }
                      ... on CloseAccountError {
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
                collections: collectionNames,
                transaction: mockedTransaction,
                userKey: '123',
                auth: {
                  checkSuperAdmin: jest.fn().mockReturnValue(true),
                  userRequired: jest
                    .fn()
                    .mockReturnValue({_key: '123', _id: 'users/123'}),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    i18n,
                    userKey: '123',
                  }),
                  loadUserByKey: {
                    load: jest.fn().mockReturnValue({_key: '123'}),
                  },
                },
                validators: {cleanseInput},
              },
            )

            const error = [
              new GraphQLError('Unable to close account. Please try again.'),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Database error occurred when getting claim info when user: 123 attempted to close account: users/123: Error: database error`,
            ])
          })
        })
      })
      describe('cursor error occurs', () => {
        describe('when getting affiliation info', () => {
          it('throws an error', async () => {
            const mockedCursor = {
              all: jest.fn().mockRejectedValue(new Error('cursor error')),
            }

            const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest.fn().mockReturnValue(),
              commit: jest.fn(),
            })

            const response = await graphql(
              schema,
              `
                mutation {
                  closeAccount(input: {}) {
                    result {
                      ... on CloseAccountResult {
                        status
                      }
                      ... on CloseAccountError {
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
                collections: collectionNames,
                transaction: mockedTransaction,
                userKey: '123',
                auth: {
                  checkSuperAdmin: jest.fn().mockReturnValue(true),
                  userRequired: jest
                    .fn()
                    .mockReturnValue({_key: '123', _id: 'users/123'}),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    i18n,
                    userKey: '123',
                  }),
                  loadUserByKey: {
                    load: jest.fn().mockReturnValue({_key: '123'}),
                  },
                },
                validators: {cleanseInput},
              },
            )

            const error = [
              new GraphQLError('Unable to close account. Please try again.'),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Cursor error occurred when getting affiliations when user: 123 attempted to close account: users/123: Error: cursor error`,
            ])
          })
        })
        describe('when getting ownership info', () => {
          it('throws an error', async () => {
            const mockedCursor = {
              all: jest
                .fn()
                .mockReturnValueOnce([{}])
                .mockRejectedValue(new Error('cursor error')),
            }

            const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest.fn().mockReturnValue(),
              commit: jest.fn(),
            })

            const response = await graphql(
              schema,
              `
                mutation {
                  closeAccount(input: {}) {
                    result {
                      ... on CloseAccountResult {
                        status
                      }
                      ... on CloseAccountError {
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
                collections: collectionNames,
                transaction: mockedTransaction,
                userKey: '123',
                auth: {
                  checkSuperAdmin: jest.fn().mockReturnValue(true),
                  userRequired: jest
                    .fn()
                    .mockReturnValue({_key: '123', _id: 'users/123'}),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    i18n,
                    userKey: '123',
                  }),
                  loadUserByKey: {
                    load: jest.fn().mockReturnValue({_key: '123'}),
                  },
                },
                validators: {cleanseInput},
              },
            )

            const error = [
              new GraphQLError('Unable to close account. Please try again.'),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Cursor error occurred when getting ownership info when user: 123 attempted to close account: users/123: Error: cursor error`,
            ])
          })
        })
        describe('when getting claim info', () => {
          it('throws an error', async () => {
            const mockedCursor = {
              all: jest
                .fn()
                .mockReturnValueOnce([{}])
                .mockReturnValueOnce([{}])
                .mockRejectedValue(new Error('cursor error')),
            }

            const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest.fn().mockReturnValue(),
              commit: jest.fn(),
            })

            const response = await graphql(
              schema,
              `
                mutation {
                  closeAccount(input: {}) {
                    result {
                      ... on CloseAccountResult {
                        status
                      }
                      ... on CloseAccountError {
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
                collections: collectionNames,
                transaction: mockedTransaction,
                userKey: '123',
                auth: {
                  checkSuperAdmin: jest.fn().mockReturnValue(true),
                  userRequired: jest
                    .fn()
                    .mockReturnValue({_key: '123', _id: 'users/123'}),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    i18n,
                    userKey: '123',
                  }),
                  loadUserByKey: {
                    load: jest.fn().mockReturnValue({_key: '123'}),
                  },
                },
                validators: {cleanseInput},
              },
            )

            const error = [
              new GraphQLError('Unable to close account. Please try again.'),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Cursor error occurred when getting claim info when user: 123 attempted to close account: users/123: Error: cursor error`,
            ])
          })
        })
      })
      describe('trx step error occurs', () => {
        describe('domain is only claimed by one org', () => {
          describe('when removing dmarc summary info', () => {
            it('throws an error', async () => {
              const mockedCursor = {
                all: jest.fn().mockReturnValue([{}]),
              }

              const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

              const mockedTransaction = jest.fn().mockReturnValue({
                step: jest.fn().mockRejectedValue(new Error('trx step error')),
                commit: jest.fn(),
              })

              const response = await graphql(
                schema,
                `
                  mutation {
                    closeAccount(input: {}) {
                      result {
                        ... on CloseAccountResult {
                          status
                        }
                        ... on CloseAccountError {
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
                  collections: collectionNames,
                  transaction: mockedTransaction,
                  userKey: '123',
                  auth: {
                    checkSuperAdmin: jest.fn().mockReturnValue(true),
                    userRequired: jest
                      .fn()
                      .mockReturnValue({_key: '123', _id: 'users/123'}),
                  },
                  loaders: {
                    loadOrgByKey: loadOrgByKey({
                      query,
                      language: 'en',
                      i18n,
                      userKey: '123',
                    }),
                    loadUserByKey: {
                      load: jest.fn().mockReturnValue({_key: '123'}),
                    },
                  },
                  validators: {cleanseInput},
                },
              )

              const error = [
                new GraphQLError('Unable to close account. Please try again.'),
              ]

              expect(response.errors).toEqual(error)
              expect(consoleOutput).toEqual([
                `Trx step error occurred when removing dmarc summaries when user: 123 attempted to close account: users/123: Error: trx step error`,
              ])
            })
          })
          describe('when removing ownership info', () => {
            it('throws an error', async () => {
              const mockedCursor = {
                all: jest.fn().mockReturnValue([{}]),
              }

              const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

              const mockedTransaction = jest.fn().mockReturnValue({
                step: jest
                  .fn()
                  .mockReturnValueOnce()
                  .mockRejectedValue(new Error('trx step error')),
                commit: jest.fn(),
              })

              const response = await graphql(
                schema,
                `
                  mutation {
                    closeAccount(input: {}) {
                      result {
                        ... on CloseAccountResult {
                          status
                        }
                        ... on CloseAccountError {
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
                  collections: collectionNames,
                  transaction: mockedTransaction,
                  userKey: '123',
                  auth: {
                    checkSuperAdmin: jest.fn().mockReturnValue(true),
                    userRequired: jest
                      .fn()
                      .mockReturnValue({_key: '123', _id: 'users/123'}),
                  },
                  loaders: {
                    loadOrgByKey: loadOrgByKey({
                      query,
                      language: 'en',
                      i18n,
                      userKey: '123',
                    }),
                    loadUserByKey: {
                      load: jest.fn().mockReturnValue({_key: '123'}),
                    },
                  },
                  validators: {cleanseInput},
                },
              )

              const error = [
                new GraphQLError('Unable to close account. Please try again.'),
              ]

              expect(response.errors).toEqual(error)
              expect(consoleOutput).toEqual([
                `Trx step error occurred when removing ownerships when user: 123 attempted to close account: users/123: Error: trx step error`,
              ])
            })
          })
          describe('when removing web scan result data', () => {
            it('throws an error', async () => {
              const mockedCursor = {
                all: jest.fn().
                mockReturnValue([{count: 1, domain: "test.gc.ca", _from: "organizations/123"}]),
              }

              const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

              const mockedTransaction = jest.fn().mockReturnValue({
                step: jest
                  .fn()
                  .mockReturnValueOnce()
                  .mockReturnValueOnce()
                  .mockRejectedValue(new Error('trx step error')),
                commit: jest.fn(),
              })

              const response = await graphql(
                schema,
                `
                  mutation {
                    closeAccount(input: {}) {
                      result {
                        ... on CloseAccountResult {
                          status
                        }
                        ... on CloseAccountError {
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
                  collections: collectionNames,
                  transaction: mockedTransaction,
                  userKey: '123',
                  auth: {
                    checkSuperAdmin: jest.fn().mockReturnValue(true),
                    userRequired: jest
                      .fn()
                      .mockReturnValue({_key: '123', _id: 'users/123'}),
                  },
                  loaders: {
                    loadOrgByKey: loadOrgByKey({
                      query,
                      language: 'en',
                      i18n,
                      userKey: '123',
                    }),
                    loadUserByKey: {
                      load: jest.fn().mockReturnValue({_key: '123'}),
                    },
                  },
                  validators: {cleanseInput},
                },
              )

              const error = [
                new GraphQLError('Unable to close account. Please try again.'),
              ]

              expect(response.errors).toEqual(error)
              expect(consoleOutput).toEqual([
                `Trx step error occurred while user: users/123 attempted to remove web data for test.gc.ca in org: organizations/123 while closing account, Error: trx step error`,
              ])
            })
          })
          describe('when removing scan data', () => {
            it('throws an error', async () => {
              const mockedCursor = {
                all: jest.fn().
                mockReturnValue([{count: 1, domain: "test.gc.ca", _from: "organizations/123"}]),
              }

              const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

              const mockedTransaction = jest.fn().mockReturnValue({
                step: jest
                  .fn()
                  .mockReturnValueOnce()
                  .mockReturnValueOnce()
                  .mockRejectedValue(new Error('trx step error')),
                commit: jest.fn(),
              })

              const response = await graphql(
                schema,
                `
                  mutation {
                    closeAccount(input: {}) {
                      result {
                        ... on CloseAccountResult {
                          status
                        }
                        ... on CloseAccountError {
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
                  collections: collectionNames,
                  transaction: mockedTransaction,
                  userKey: '123',
                  auth: {
                    checkSuperAdmin: jest.fn().mockReturnValue(true),
                    userRequired: jest
                      .fn()
                      .mockReturnValue({_key: '123', _id: 'users/123'}),
                  },
                  loaders: {
                    loadOrgByKey: loadOrgByKey({
                      query,
                      language: 'en',
                      i18n,
                      userKey: '123',
                    }),
                    loadUserByKey: {
                      load: jest.fn().mockReturnValue({_key: '123'}),
                    },
                  },
                  validators: {cleanseInput},
                },
              )

              const error = [
                new GraphQLError('Unable to close account. Please try again.'),
              ]

              expect(response.errors).toEqual(error)
              expect(consoleOutput).toEqual([
                `Trx step error occurred while user: users/123 attempted to remove web data for test.gc.ca in org: organizations/123 while closing account, Error: trx step error`,
              ])
            })
          })
          describe('when removing domain info', () => {
            it('throws an error', async () => {
              const mockedCursor = {
                all: jest.fn().
                mockReturnValue([{count: 1, domain: "test.gc.ca", _from: "organizations/123"}]),
              }

              const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

              const mockedTransaction = jest.fn().mockReturnValue({
                step: jest
                  .fn()
                  .mockReturnValueOnce()
                  .mockReturnValueOnce()
                  .mockReturnValueOnce()
                  .mockReturnValueOnce()
                  .mockRejectedValue(new Error('trx step error')),
                commit: jest.fn(),
              })

              const response = await graphql(
                schema,
                `
                  mutation {
                    closeAccount(input: {}) {
                      result {
                        ... on CloseAccountResult {
                          status
                        }
                        ... on CloseAccountError {
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
                  collections: collectionNames,
                  transaction: mockedTransaction,
                  userKey: '123',
                  auth: {
                    checkSuperAdmin: jest.fn().mockReturnValue(true),
                    userRequired: jest
                      .fn()
                      .mockReturnValue({_key: '123', _id: 'users/123'}),
                  },
                  loaders: {
                    loadOrgByKey: loadOrgByKey({
                      query,
                      language: 'en',
                      i18n,
                      userKey: '123',
                    }),
                    loadUserByKey: {
                      load: jest.fn().mockReturnValue({_key: '123'}),
                    },
                  },
                  validators: {cleanseInput},
                },
              )

              const error = [
                new GraphQLError('Unable to close account. Please try again.'),
              ]

              expect(response.errors).toEqual(error)
              expect(consoleOutput).toEqual([
                `Trx step error occurred when removing domains and claims when user: 123 attempted to close account: users/123: Error: trx step error`,
              ])
            })
          })
        })
        describe('domain is claimed by multiple orgs', () => {
          describe('when removing domain claim', () => {
            it('throws an error', async () => {
              const mockedCursor = {
                all: jest.fn().mockReturnValue([{count: 2}]),
              }

              const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

              const mockedTransaction = jest.fn().mockReturnValue({
                step: jest
                  .fn()
                  .mockReturnValueOnce()
                  .mockReturnValueOnce()
                  .mockRejectedValue(new Error('trx step error')),
                commit: jest.fn(),
              })

              const response = await graphql(
                schema,
                `
                  mutation {
                    closeAccount(input: {}) {
                      result {
                        ... on CloseAccountResult {
                          status
                        }
                        ... on CloseAccountError {
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
                  collections: collectionNames,
                  transaction: mockedTransaction,
                  userKey: '123',
                  auth: {
                    checkSuperAdmin: jest.fn().mockReturnValue(true),
                    userRequired: jest
                      .fn()
                      .mockReturnValue({_key: '123', _id: 'users/123'}),
                  },
                  loaders: {
                    loadOrgByKey: loadOrgByKey({
                      query,
                      language: 'en',
                      i18n,
                      userKey: '123',
                    }),
                    loadUserByKey: {
                      load: jest.fn().mockReturnValue({_key: '123'}),
                    },
                  },
                  validators: {cleanseInput},
                },
              )

              const error = [
                new GraphQLError('Unable to close account. Please try again.'),
              ]

              expect(response.errors).toEqual(error)
              expect(consoleOutput).toEqual([
                `Trx step error occurred when removing domain claims when user: 123 attempted to close account: users/123: Error: trx step error`,
              ])
            })
          })
        })
        describe('when removing ownership orgs, and affiliations', () => {
          it('throws an error', async () => {
            const mockedCursor = {
              all: jest.fn().mockReturnValue([{count: 2}]),
            }

            const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest
                .fn()
                .mockReturnValueOnce()
                .mockReturnValueOnce()
                .mockRejectedValue(new Error('trx step error')),
              commit: jest.fn(),
            })

            const response = await graphql(
              schema,
              `
                mutation {
                  closeAccount(input: {}) {
                    result {
                      ... on CloseAccountResult {
                        status
                      }
                      ... on CloseAccountError {
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
                collections: collectionNames,
                transaction: mockedTransaction,
                userKey: '123',
                auth: {
                  checkSuperAdmin: jest.fn().mockReturnValue(true),
                  userRequired: jest
                    .fn()
                    .mockReturnValue({_key: '123', _id: 'users/123'}),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    i18n,
                    userKey: '123',
                  }),
                  loadUserByKey: {
                    load: jest.fn().mockReturnValue({_key: '123'}),
                  },
                },
                validators: {cleanseInput},
              },
            )

            const error = [
              new GraphQLError('Unable to close account. Please try again.'),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred when removing domain claims when user: 123 attempted to close account: users/123: Error: trx step error`,
            ])
          })
        })
        describe('when removing the orgs remaining affiliations', () => {
          it('throws an error', async () => {
            const mockedCursor = {
              all: jest.fn().mockReturnValue([{count: 2}]),
            }

            const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest
                .fn()
                .mockReturnValueOnce()
                .mockReturnValueOnce()
                .mockReturnValueOnce()
                .mockRejectedValue(new Error('trx step error')),
              commit: jest.fn(),
            })

            const response = await graphql(
              schema,
              `
                mutation {
                  closeAccount(input: {}) {
                    result {
                      ... on CloseAccountResult {
                        status
                      }
                      ... on CloseAccountError {
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
                collections: collectionNames,
                transaction: mockedTransaction,
                userKey: '123',
                auth: {
                  checkSuperAdmin: jest.fn().mockReturnValue(true),
                  userRequired: jest
                    .fn()
                    .mockReturnValue({_key: '123', _id: 'users/123'}),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    i18n,
                    userKey: '123',
                  }),
                  loadUserByKey: {
                    load: jest.fn().mockReturnValue({_key: '123'}),
                  },
                },
                validators: {cleanseInput},
              },
            )

            const error = [
              new GraphQLError('Unable to close account. Please try again.'),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred when removing ownership org and users affiliations when user: 123 attempted to close account: users/123: Error: trx step error`,
            ])
          })
        })
        describe('when removing the users affiliations', () => {
          it('throws an error', async () => {
            const mockedCursor = {
              all: jest.fn().mockReturnValue([{count: 2}]),
            }

            const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest
                .fn()
                .mockReturnValueOnce()
                .mockReturnValueOnce()
                .mockReturnValueOnce()
                .mockReturnValueOnce()
                .mockReturnValueOnce()
                .mockRejectedValue(new Error('trx step error')),
              commit: jest.fn(),
            })

            const response = await graphql(
              schema,
              `
                mutation {
                  closeAccount(input: {}) {
                    result {
                      ... on CloseAccountResult {
                        status
                      }
                      ... on CloseAccountError {
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
                collections: collectionNames,
                transaction: mockedTransaction,
                userKey: '123',
                auth: {
                  checkSuperAdmin: jest.fn().mockReturnValue(true),
                  userRequired: jest
                    .fn()
                    .mockReturnValue({_key: '123', _id: 'users/123'}),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    i18n,
                    userKey: '123',
                  }),
                  loadUserByKey: {
                    load: jest.fn().mockReturnValue({_key: '123'}),
                  },
                },
                validators: {cleanseInput},
              },
            )

            const error = [
              new GraphQLError('Unable to close account. Please try again.'),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred when removing users remaining affiliations when user: 123 attempted to close account: users/123: Error: trx step error`,
            ])
          })
        })
        describe('when removing the user', () => {
          it('throws an error', async () => {
            const mockedCursor = {
              all: jest.fn().mockReturnValue([{count: 2}]),
            }

            const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest
                .fn()
                .mockReturnValueOnce()
                .mockReturnValueOnce()
                .mockReturnValueOnce()
                .mockReturnValueOnce()
                .mockReturnValueOnce()
                .mockReturnValueOnce()
                .mockRejectedValue(new Error('trx step error')),
              commit: jest.fn(),
            })

            const response = await graphql(
              schema,
              `
                mutation {
                  closeAccount(input: {}) {
                    result {
                      ... on CloseAccountResult {
                        status
                      }
                      ... on CloseAccountError {
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
                collections: collectionNames,
                transaction: mockedTransaction,
                userKey: '123',
                auth: {
                  checkSuperAdmin: jest.fn().mockReturnValue(true),
                  userRequired: jest
                    .fn()
                    .mockReturnValue({_key: '123', _id: 'users/123'}),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    i18n,
                    userKey: '123',
                  }),
                  loadUserByKey: {
                    load: jest.fn().mockReturnValue({_key: '123'}),
                  },
                },
                validators: {cleanseInput},
              },
            )

            const error = [
              new GraphQLError('Unable to close account. Please try again.'),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred when removing user: 123 attempted to close account: users/123: Error: trx step error`,
            ])
          })
        })
      })
      describe('trx commit error occurs', () => {
        it('throws an error', async () => {
          const mockedCursor = {
            all: jest.fn().mockReturnValue([{count: 2}]),
          }

          const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

          const mockedTransaction = jest.fn().mockReturnValue({
            step: jest.fn().mockReturnValue(),
            commit: jest.fn().mockRejectedValue(new Error('trx commit error')),
          })

          const response = await graphql(
            schema,
            `
              mutation {
                closeAccount(input: {}) {
                  result {
                    ... on CloseAccountResult {
                      status
                    }
                    ... on CloseAccountError {
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
              collections: collectionNames,
              transaction: mockedTransaction,
              userKey: '123',
              auth: {
                checkSuperAdmin: jest.fn().mockReturnValue(true),
                userRequired: jest
                  .fn()
                  .mockReturnValue({_key: '123', _id: 'users/123'}),
              },
              loaders: {
                loadOrgByKey: loadOrgByKey({
                  query,
                  language: 'en',
                  i18n,
                  userKey: '123',
                }),
                loadUserByKey: {
                  load: jest.fn().mockReturnValue({_key: '123'}),
                },
              },
              validators: {cleanseInput},
            },
          )

          const error = [
            new GraphQLError('Unable to close account. Please try again.'),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Trx commit error occurred when user: 123 attempted to close account: users/123: Error: trx commit error`,
          ])
        })
      })
    })
    describe('language is set to french', () => {
      beforeAll(() => {
        i18n = setupI18n({
          locale: 'fr',
          localeData: {
            en: {plurals: {}},
            fr: {plurals: {}},
          },
          locales: ['en', 'fr'],
          messages: {
            en: englishMessages.messages,
            fr: frenchMessages.messages,
          },
        })
      })
      describe('user attempts to close another users account', () => {
        describe('requesting user is not a super admin', () => {
          it('returns an error', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  closeAccount(input: {
                    userId: "${toGlobalId('user', '456')}"
                  }) {
                    result {
                      ... on CloseAccountResult {
                        status
                      }
                      ... on CloseAccountError {
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
                userKey: '123',
                auth: {
                  checkSuperAdmin: jest.fn().mockReturnValue(false),
                  userRequired: jest.fn().mockReturnValue({_key: '123'}),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    i18n,
                    userKey: '123',
                  }),
                },
                validators: {cleanseInput},
              },
            )

            const expectedResponse = {
              data: {
                closeAccount: {
                  result: {
                    code: 400,
                    description:
                      "Erreur de permission: Impossible de fermer le compte d'un autre utilisateur.",
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: 123 attempted to close user: 456 account, but requesting user is not a super admin.`,
            ])
          })
        })
        describe('requested user is undefined', () => {
          it('returns an error', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  closeAccount(input: {
                    userId: "${toGlobalId('user', '456')}"
                  }) {
                    result {
                      ... on CloseAccountResult {
                        status
                      }
                      ... on CloseAccountError {
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
                userKey: '123',
                auth: {
                  checkSuperAdmin: jest.fn().mockReturnValue(true),
                  userRequired: jest.fn().mockReturnValue({_key: '123'}),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    i18n,
                    userKey: '123',
                  }),
                  loadUserByKey: {
                    load: jest.fn().mockReturnValue(undefined),
                  },
                },
                validators: {cleanseInput},
              },
            )

            const expectedResponse = {
              data: {
                closeAccount: {
                  result: {
                    code: 400,
                    description:
                      "Impossible de fermer le compte d'un utilisateur non défini.",
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: 123 attempted to close user: 456 account, but requested user is undefined.`,
            ])
          })
        })
      })
      describe('database error occurs', () => {
        describe('when getting affiliation info', () => {
          it('throws an error', async () => {
            const mockedQuery = jest
              .fn()
              .mockRejectedValue(new Error('database error'))

            const response = await graphql(
              schema,
              `
                mutation {
                  closeAccount(input: {}) {
                    result {
                      ... on CloseAccountResult {
                        status
                      }
                      ... on CloseAccountError {
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
                collections: collectionNames,
                transaction,
                userKey: '123',
                auth: {
                  checkSuperAdmin: jest.fn().mockReturnValue(true),
                  userRequired: jest
                    .fn()
                    .mockReturnValue({_key: '123', _id: 'users/123'}),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    i18n,
                    userKey: '123',
                  }),
                  loadUserByKey: {
                    load: jest.fn().mockReturnValue({_key: '123'}),
                  },
                },
                validators: {cleanseInput},
              },
            )

            const error = [
              new GraphQLError(
                'Impossible de fermer le compte. Veuillez réessayer.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Database error occurred when getting affiliations when user: 123 attempted to close account: users/123: Error: database error`,
            ])
          })
        })
        describe('when getting ownership info', () => {
          it('throws an error', async () => {
            const mockedCursor = {
              all: jest.fn().mockReturnValue([{}]),
            }

            const mockedQuery = jest
              .fn()
              .mockReturnValueOnce(mockedCursor)
              .mockRejectedValue(new Error('database error'))

            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest.fn().mockReturnValue(),
              commit: jest.fn(),
            })

            const response = await graphql(
              schema,
              `
                mutation {
                  closeAccount(input: {}) {
                    result {
                      ... on CloseAccountResult {
                        status
                      }
                      ... on CloseAccountError {
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
                collections: collectionNames,
                transaction: mockedTransaction,
                userKey: '123',
                auth: {
                  checkSuperAdmin: jest.fn().mockReturnValue(true),
                  userRequired: jest
                    .fn()
                    .mockReturnValue({_key: '123', _id: 'users/123'}),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    i18n,
                    userKey: '123',
                  }),
                  loadUserByKey: {
                    load: jest.fn().mockReturnValue({_key: '123'}),
                  },
                },
                validators: {cleanseInput},
              },
            )

            const error = [
              new GraphQLError(
                'Impossible de fermer le compte. Veuillez réessayer.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Database error occurred when getting ownership info when user: 123 attempted to close account: users/123: Error: database error`,
            ])
          })
        })
        describe('when gathering domain claim info', () => {
          it('throws an error', async () => {
            const mockedCursor = {
              all: jest.fn().mockReturnValue([{}]),
            }

            const mockedQuery = jest
              .fn()
              .mockReturnValueOnce(mockedCursor)
              .mockReturnValueOnce(mockedCursor)
              .mockRejectedValue(new Error('database error'))

            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest.fn().mockReturnValue(),
              commit: jest.fn(),
            })

            const response = await graphql(
              schema,
              `
                mutation {
                  closeAccount(input: {}) {
                    result {
                      ... on CloseAccountResult {
                        status
                      }
                      ... on CloseAccountError {
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
                collections: collectionNames,
                transaction: mockedTransaction,
                userKey: '123',
                auth: {
                  checkSuperAdmin: jest.fn().mockReturnValue(true),
                  userRequired: jest
                    .fn()
                    .mockReturnValue({_key: '123', _id: 'users/123'}),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    i18n,
                    userKey: '123',
                  }),
                  loadUserByKey: {
                    load: jest.fn().mockReturnValue({_key: '123'}),
                  },
                },
                validators: {cleanseInput},
              },
            )

            const error = [
              new GraphQLError(
                'Impossible de fermer le compte. Veuillez réessayer.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Database error occurred when getting claim info when user: 123 attempted to close account: users/123: Error: database error`,
            ])
          })
        })
      })
      describe('cursor error occurs', () => {
        describe('when getting affiliation info', () => {
          it('throws an error', async () => {
            const mockedCursor = {
              all: jest.fn().mockRejectedValue(new Error('cursor error')),
            }

            const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest.fn().mockReturnValue(),
              commit: jest.fn(),
            })

            const response = await graphql(
              schema,
              `
                mutation {
                  closeAccount(input: {}) {
                    result {
                      ... on CloseAccountResult {
                        status
                      }
                      ... on CloseAccountError {
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
                collections: collectionNames,
                transaction: mockedTransaction,
                userKey: '123',
                auth: {
                  checkSuperAdmin: jest.fn().mockReturnValue(true),
                  userRequired: jest
                    .fn()
                    .mockReturnValue({_key: '123', _id: 'users/123'}),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    i18n,
                    userKey: '123',
                  }),
                  loadUserByKey: {
                    load: jest.fn().mockReturnValue({_key: '123'}),
                  },
                },
                validators: {cleanseInput},
              },
            )

            const error = [
              new GraphQLError(
                'Impossible de fermer le compte. Veuillez réessayer.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Cursor error occurred when getting affiliations when user: 123 attempted to close account: users/123: Error: cursor error`,
            ])
          })
        })
        describe('when getting ownership info', () => {
          it('throws an error', async () => {
            const mockedCursor = {
              all: jest
                .fn()
                .mockReturnValueOnce([{}])
                .mockRejectedValue(new Error('cursor error')),
            }

            const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest.fn().mockReturnValue(),
              commit: jest.fn(),
            })

            const response = await graphql(
              schema,
              `
                mutation {
                  closeAccount(input: {}) {
                    result {
                      ... on CloseAccountResult {
                        status
                      }
                      ... on CloseAccountError {
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
                collections: collectionNames,
                transaction: mockedTransaction,
                userKey: '123',
                auth: {
                  checkSuperAdmin: jest.fn().mockReturnValue(true),
                  userRequired: jest
                    .fn()
                    .mockReturnValue({_key: '123', _id: 'users/123'}),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    i18n,
                    userKey: '123',
                  }),
                  loadUserByKey: {
                    load: jest.fn().mockReturnValue({_key: '123'}),
                  },
                },
                validators: {cleanseInput},
              },
            )

            const error = [
              new GraphQLError(
                'Impossible de fermer le compte. Veuillez réessayer.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Cursor error occurred when getting ownership info when user: 123 attempted to close account: users/123: Error: cursor error`,
            ])
          })
        })
        describe('when getting claim info', () => {
          it('throws an error', async () => {
            const mockedCursor = {
              all: jest
                .fn()
                .mockReturnValueOnce([{}])
                .mockReturnValueOnce([{}])
                .mockRejectedValue(new Error('cursor error')),
            }

            const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest.fn().mockReturnValue(),
              commit: jest.fn(),
            })

            const response = await graphql(
              schema,
              `
                mutation {
                  closeAccount(input: {}) {
                    result {
                      ... on CloseAccountResult {
                        status
                      }
                      ... on CloseAccountError {
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
                collections: collectionNames,
                transaction: mockedTransaction,
                userKey: '123',
                auth: {
                  checkSuperAdmin: jest.fn().mockReturnValue(true),
                  userRequired: jest
                    .fn()
                    .mockReturnValue({_key: '123', _id: 'users/123'}),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    i18n,
                    userKey: '123',
                  }),
                  loadUserByKey: {
                    load: jest.fn().mockReturnValue({_key: '123'}),
                  },
                },
                validators: {cleanseInput},
              },
            )

            const error = [
              new GraphQLError(
                'Impossible de fermer le compte. Veuillez réessayer.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Cursor error occurred when getting claim info when user: 123 attempted to close account: users/123: Error: cursor error`,
            ])
          })
        })
      })
      describe('trx step error occurs', () => {
        describe('domain is only claimed by one org', () => {
          describe('when removing dmarc summary info', () => {
            it('throws an error', async () => {
              const mockedCursor = {
                all: jest.fn().mockReturnValue([{}]),
              }

              const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

              const mockedTransaction = jest.fn().mockReturnValue({
                step: jest.fn().mockRejectedValue(new Error('trx step error')),
                commit: jest.fn(),
              })

              const response = await graphql(
                schema,
                `
                  mutation {
                    closeAccount(input: {}) {
                      result {
                        ... on CloseAccountResult {
                          status
                        }
                        ... on CloseAccountError {
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
                  collections: collectionNames,
                  transaction: mockedTransaction,
                  userKey: '123',
                  auth: {
                    checkSuperAdmin: jest.fn().mockReturnValue(true),
                    userRequired: jest
                      .fn()
                      .mockReturnValue({_key: '123', _id: 'users/123'}),
                  },
                  loaders: {
                    loadOrgByKey: loadOrgByKey({
                      query,
                      language: 'en',
                      i18n,
                      userKey: '123',
                    }),
                    loadUserByKey: {
                      load: jest.fn().mockReturnValue({_key: '123'}),
                    },
                  },
                  validators: {cleanseInput},
                },
              )

              const error = [
                new GraphQLError(
                  'Impossible de fermer le compte. Veuillez réessayer.',
                ),
              ]

              expect(response.errors).toEqual(error)
              expect(consoleOutput).toEqual([
                `Trx step error occurred when removing dmarc summaries when user: 123 attempted to close account: users/123: Error: trx step error`,
              ])
            })
          })
          describe('when removing ownership info', () => {
            it('throws an error', async () => {
              const mockedCursor = {
                all: jest.fn().mockReturnValue([{}]),
              }

              const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

              const mockedTransaction = jest.fn().mockReturnValue({
                step: jest
                  .fn()
                  .mockReturnValueOnce()
                  .mockRejectedValue(new Error('trx step error')),
                commit: jest.fn(),
              })

              const response = await graphql(
                schema,
                `
                  mutation {
                    closeAccount(input: {}) {
                      result {
                        ... on CloseAccountResult {
                          status
                        }
                        ... on CloseAccountError {
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
                  collections: collectionNames,
                  transaction: mockedTransaction,
                  userKey: '123',
                  auth: {
                    checkSuperAdmin: jest.fn().mockReturnValue(true),
                    userRequired: jest
                      .fn()
                      .mockReturnValue({_key: '123', _id: 'users/123'}),
                  },
                  loaders: {
                    loadOrgByKey: loadOrgByKey({
                      query,
                      language: 'en',
                      i18n,
                      userKey: '123',
                    }),
                    loadUserByKey: {
                      load: jest.fn().mockReturnValue({_key: '123'}),
                    },
                  },
                  validators: {cleanseInput},
                },
              )

              const error = [
                new GraphQLError(
                  'Impossible de fermer le compte. Veuillez réessayer.',
                ),
              ]

              expect(response.errors).toEqual(error)
              expect(consoleOutput).toEqual([
                `Trx step error occurred when removing ownerships when user: 123 attempted to close account: users/123: Error: trx step error`,
              ])
            })
          })
          describe('when removing web scan result data', () => {
            it('throws an error', async () => {
              const mockedCursor = {
                all: jest.fn().
                mockReturnValue([{count: 1, domain: "test.gc.ca", _from: "organizations/123"}]),
              }

              const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

              const mockedTransaction = jest.fn().mockReturnValue({
                step: jest
                  .fn()
                  .mockReturnValueOnce()
                  .mockReturnValueOnce()
                  .mockRejectedValue(new Error('trx step error')),
                commit: jest.fn(),
              })

              const response = await graphql(
                schema,
                `
                  mutation {
                    closeAccount(input: {}) {
                      result {
                        ... on CloseAccountResult {
                          status
                        }
                        ... on CloseAccountError {
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
                  collections: collectionNames,
                  transaction: mockedTransaction,
                  userKey: '123',
                  auth: {
                    checkSuperAdmin: jest.fn().mockReturnValue(true),
                    userRequired: jest
                      .fn()
                      .mockReturnValue({_key: '123', _id: 'users/123'}),
                  },
                  loaders: {
                    loadOrgByKey: loadOrgByKey({
                      query,
                      language: 'en',
                      i18n,
                      userKey: '123',
                    }),
                    loadUserByKey: {
                      load: jest.fn().mockReturnValue({_key: '123'}),
                    },
                  },
                  validators: {cleanseInput},
                },
              )

              const error = [
                new GraphQLError(
                  'Impossible de fermer le compte. Veuillez réessayer.',
                ),
              ]

              expect(response.errors).toEqual(error)
              expect(consoleOutput).toEqual([
                `Trx step error occurred while user: users/123 attempted to remove web data for test.gc.ca in org: organizations/123 while closing account, Error: trx step error`,
              ])
            })
          })
          describe('when removing scan data', () => {
            it('throws an error', async () => {
              const mockedCursor = {
                all: jest.fn().
                mockReturnValue([{count: 1, domain: "test.gc.ca", _from: "organizations/123"}]),
              }

              const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

              const mockedTransaction = jest.fn().mockReturnValue({
                step: jest
                  .fn()
                  .mockReturnValueOnce()
                  .mockReturnValueOnce()
                  .mockRejectedValue(new Error('trx step error')),
                commit: jest.fn(),
              })

              const response = await graphql(
                schema,
                `
                  mutation {
                    closeAccount(input: {}) {
                      result {
                        ... on CloseAccountResult {
                          status
                        }
                        ... on CloseAccountError {
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
                  collections: collectionNames,
                  transaction: mockedTransaction,
                  userKey: '123',
                  auth: {
                    checkSuperAdmin: jest.fn().mockReturnValue(true),
                    userRequired: jest
                      .fn()
                      .mockReturnValue({_key: '123', _id: 'users/123'}),
                  },
                  loaders: {
                    loadOrgByKey: loadOrgByKey({
                      query,
                      language: 'en',
                      i18n,
                      userKey: '123',
                    }),
                    loadUserByKey: {
                      load: jest.fn().mockReturnValue({_key: '123'}),
                    },
                  },
                  validators: {cleanseInput},
                },
              )

              const error = [
                new GraphQLError(
                  'Impossible de fermer le compte. Veuillez réessayer.',
                ),
              ]

              expect(response.errors).toEqual(error)
              expect(consoleOutput).toEqual([
                `Trx step error occurred while user: users/123 attempted to remove web data for test.gc.ca in org: organizations/123 while closing account, Error: trx step error`,
              ])
            })
          })
          describe('when removing domain info', () => {
            it('throws an error', async () => {
              const mockedCursor = {
                all: jest.fn().
                mockReturnValue([{count: 1, domain: "test.gc.ca", _from: "organizations/123"}]),
              }

              const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

              const mockedTransaction = jest.fn().mockReturnValue({
                step: jest
                  .fn()
                  .mockReturnValueOnce()
                  .mockReturnValueOnce()
                  .mockReturnValueOnce()
                  .mockReturnValueOnce()
                  .mockRejectedValue(new Error('trx step error')),
                commit: jest.fn(),
              })

              const response = await graphql(
                schema,
                `
                  mutation {
                    closeAccount(input: {}) {
                      result {
                        ... on CloseAccountResult {
                          status
                        }
                        ... on CloseAccountError {
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
                  collections: collectionNames,
                  transaction: mockedTransaction,
                  userKey: '123',
                  auth: {
                    checkSuperAdmin: jest.fn().mockReturnValue(true),
                    userRequired: jest
                      .fn()
                      .mockReturnValue({_key: '123', _id: 'users/123'}),
                  },
                  loaders: {
                    loadOrgByKey: loadOrgByKey({
                      query,
                      language: 'en',
                      i18n,
                      userKey: '123',
                    }),
                    loadUserByKey: {
                      load: jest.fn().mockReturnValue({_key: '123'}),
                    },
                  },
                  validators: {cleanseInput},
                },
              )

              const error = [
                new GraphQLError(
                  'Impossible de fermer le compte. Veuillez réessayer.',
                ),
              ]

              expect(response.errors).toEqual(error)
              expect(consoleOutput).toEqual([
                `Trx step error occurred when removing domains and claims when user: 123 attempted to close account: users/123: Error: trx step error`,
              ])
            })
          })
        })
        describe('domain is claimed by multiple orgs', () => {
          describe('when removing domain claim', () => {
            it('throws an error', async () => {
              const mockedCursor = {
                all: jest.fn().mockReturnValue([{count: 2}]),
              }

              const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

              const mockedTransaction = jest.fn().mockReturnValue({
                step: jest
                  .fn()
                  .mockReturnValueOnce()
                  .mockReturnValueOnce()
                  .mockRejectedValue(new Error('trx step error')),
                commit: jest.fn(),
              })

              const response = await graphql(
                schema,
                `
                  mutation {
                    closeAccount(input: {}) {
                      result {
                        ... on CloseAccountResult {
                          status
                        }
                        ... on CloseAccountError {
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
                  collections: collectionNames,
                  transaction: mockedTransaction,
                  userKey: '123',
                  auth: {
                    checkSuperAdmin: jest.fn().mockReturnValue(true),
                    userRequired: jest
                      .fn()
                      .mockReturnValue({_key: '123', _id: 'users/123'}),
                  },
                  loaders: {
                    loadOrgByKey: loadOrgByKey({
                      query,
                      language: 'en',
                      i18n,
                      userKey: '123',
                    }),
                    loadUserByKey: {
                      load: jest.fn().mockReturnValue({_key: '123'}),
                    },
                  },
                  validators: {cleanseInput},
                },
              )

              const error = [
                new GraphQLError(
                  'Impossible de fermer le compte. Veuillez réessayer.',
                ),
              ]

              expect(response.errors).toEqual(error)
              expect(consoleOutput).toEqual([
                `Trx step error occurred when removing domain claims when user: 123 attempted to close account: users/123: Error: trx step error`,
              ])
            })
          })
        })
        describe('when removing ownership orgs, and affiliations', () => {
          it('throws an error', async () => {
            const mockedCursor = {
              all: jest.fn().mockReturnValue([{count: 2}]),
            }

            const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest
                .fn()
                .mockReturnValueOnce()
                .mockReturnValueOnce()
                .mockRejectedValue(new Error('trx step error')),
              commit: jest.fn(),
            })

            const response = await graphql(
              schema,
              `
                mutation {
                  closeAccount(input: {}) {
                    result {
                      ... on CloseAccountResult {
                        status
                      }
                      ... on CloseAccountError {
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
                collections: collectionNames,
                transaction: mockedTransaction,
                userKey: '123',
                auth: {
                  checkSuperAdmin: jest.fn().mockReturnValue(true),
                  userRequired: jest
                    .fn()
                    .mockReturnValue({_key: '123', _id: 'users/123'}),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    i18n,
                    userKey: '123',
                  }),
                  loadUserByKey: {
                    load: jest.fn().mockReturnValue({_key: '123'}),
                  },
                },
                validators: {cleanseInput},
              },
            )

            const error = [
              new GraphQLError(
                'Impossible de fermer le compte. Veuillez réessayer.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred when removing domain claims when user: 123 attempted to close account: users/123: Error: trx step error`,
            ])
          })
        })
        describe('when removing the orgs remaining affiliations', () => {
          it('throws an error', async () => {
            const mockedCursor = {
              all: jest.fn().mockReturnValue([{count: 2}]),
            }

            const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest
                .fn()
                .mockReturnValueOnce()
                .mockReturnValueOnce()
                .mockReturnValueOnce()
                .mockRejectedValue(new Error('trx step error')),
              commit: jest.fn(),
            })

            const response = await graphql(
              schema,
              `
                mutation {
                  closeAccount(input: {}) {
                    result {
                      ... on CloseAccountResult {
                        status
                      }
                      ... on CloseAccountError {
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
                collections: collectionNames,
                transaction: mockedTransaction,
                userKey: '123',
                auth: {
                  checkSuperAdmin: jest.fn().mockReturnValue(true),
                  userRequired: jest
                    .fn()
                    .mockReturnValue({_key: '123', _id: 'users/123'}),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    i18n,
                    userKey: '123',
                  }),
                  loadUserByKey: {
                    load: jest.fn().mockReturnValue({_key: '123'}),
                  },
                },
                validators: {cleanseInput},
              },
            )

            const error = [
              new GraphQLError(
                'Impossible de fermer le compte. Veuillez réessayer.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred when removing ownership org and users affiliations when user: 123 attempted to close account: users/123: Error: trx step error`,
            ])
          })
        })
        describe('when removing the users affiliations', () => {
          it('throws an error', async () => {
            const mockedCursor = {
              all: jest.fn().mockReturnValue([{count: 2}]),
            }

            const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest
                .fn()
                .mockReturnValueOnce()
                .mockReturnValueOnce()
                .mockReturnValueOnce()
                .mockReturnValueOnce()
                .mockReturnValueOnce()
                .mockRejectedValue(new Error('trx step error')),
              commit: jest.fn(),
            })

            const response = await graphql(
              schema,
              `
                mutation {
                  closeAccount(input: {}) {
                    result {
                      ... on CloseAccountResult {
                        status
                      }
                      ... on CloseAccountError {
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
                collections: collectionNames,
                transaction: mockedTransaction,
                userKey: '123',
                auth: {
                  checkSuperAdmin: jest.fn().mockReturnValue(true),
                  userRequired: jest
                    .fn()
                    .mockReturnValue({_key: '123', _id: 'users/123'}),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    i18n,
                    userKey: '123',
                  }),
                  loadUserByKey: {
                    load: jest.fn().mockReturnValue({_key: '123'}),
                  },
                },
                validators: {cleanseInput},
              },
            )

            const error = [
              new GraphQLError(
                'Impossible de fermer le compte. Veuillez réessayer.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred when removing users remaining affiliations when user: 123 attempted to close account: users/123: Error: trx step error`,
            ])
          })
        })
        describe('when removing the user', () => {
          it('throws an error', async () => {
            const mockedCursor = {
              all: jest.fn().mockReturnValue([{count: 2}]),
            }

            const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest
                .fn()
                .mockReturnValueOnce()
                .mockReturnValueOnce()
                .mockReturnValueOnce()
                .mockReturnValueOnce()
                .mockReturnValueOnce()
                .mockReturnValueOnce()
                .mockRejectedValue(new Error('trx step error')),
              commit: jest.fn(),
            })

            const response = await graphql(
              schema,
              `
                mutation {
                  closeAccount(input: {}) {
                    result {
                      ... on CloseAccountResult {
                        status
                      }
                      ... on CloseAccountError {
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
                collections: collectionNames,
                transaction: mockedTransaction,
                userKey: '123',
                auth: {
                  checkSuperAdmin: jest.fn().mockReturnValue(true),
                  userRequired: jest
                    .fn()
                    .mockReturnValue({_key: '123', _id: 'users/123'}),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    i18n,
                    userKey: '123',
                  }),
                  loadUserByKey: {
                    load: jest.fn().mockReturnValue({_key: '123'}),
                  },
                },
                validators: {cleanseInput},
              },
            )

            const error = [
              new GraphQLError(
                'Impossible de fermer le compte. Veuillez réessayer.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred when removing user: 123 attempted to close account: users/123: Error: trx step error`,
            ])
          })
        })
      })
      describe('trx commit error occurs', () => {
        it('throws an error', async () => {
          const mockedCursor = {
            all: jest.fn().mockReturnValue([{count: 2}]),
          }

          const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

          const mockedTransaction = jest.fn().mockReturnValue({
            step: jest.fn().mockReturnValue(),
            commit: jest.fn().mockRejectedValue(new Error('trx commit error')),
          })

          const response = await graphql(
            schema,
            `
              mutation {
                closeAccount(input: {}) {
                  result {
                    ... on CloseAccountResult {
                      status
                    }
                    ... on CloseAccountError {
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
              collections: collectionNames,
              transaction: mockedTransaction,
              userKey: '123',
              auth: {
                checkSuperAdmin: jest.fn().mockReturnValue(true),
                userRequired: jest
                  .fn()
                  .mockReturnValue({_key: '123', _id: 'users/123'}),
              },
              loaders: {
                loadOrgByKey: loadOrgByKey({
                  query,
                  language: 'en',
                  i18n,
                  userKey: '123',
                }),
                loadUserByKey: {
                  load: jest.fn().mockReturnValue({_key: '123'}),
                },
              },
              validators: {cleanseInput},
            },
          )

          const error = [
            new GraphQLError(
              'Impossible de fermer le compte. Veuillez réessayer.',
            ),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Trx commit error occurred when user: 123 attempted to close account: users/123: Error: trx commit error`,
          ])
        })
      })
    })
  })
})
