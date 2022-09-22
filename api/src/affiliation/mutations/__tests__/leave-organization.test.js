import {setupI18n} from '@lingui/core'
import {ensure, dbNameFromFile} from 'arango-tools'
import {graphql, GraphQLSchema, GraphQLError} from 'graphql'
import {toGlobalId} from 'graphql-relay'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import {checkOrgOwner, userRequired, verifiedRequired} from '../../../auth'
import {loadOrgByKey} from '../../../organization/loaders'
import {loadUserByKey} from '../../../user/loaders'
import {cleanseInput} from '../../../validators'
import {createMutationSchema} from '../../../mutation'
import {createQuerySchema} from '../../../query'
import dbschema from '../../../../database.json'

const {DB_PASS: rootPass, DB_URL: url, SIGN_IN_KEY} = process.env

const collectionNames = [
  'users',
  'organizations',
  'domains',
  'dns',
  'web',
  'webScan',
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
  'domainsDNS',
  'domainsWeb',
  'webToWebScans',
  'ownership',
  'domainsToDmarcSummaries',
]

describe('given a successful leave', () => {
  let query,
    drop,
    truncate,
    schema,
    collections,
    transaction,
    i18n,
    user,
    org,
    domain,
    domain2

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
    domain2 = await collections.domains.save({
      domain: 'test.canada.ca',
      slug: 'test-canada-ca',
    })
    await collections.claims.save({
      _from: org._id,
      _to: domain2._id,
    })

    const dns = await collections.dns.save({dns: true})
    await collections.domainsDNS.save({
      _from: domain._id,
      _to: dns._id,
    })

    const web = await collections.web.save({web: true})
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
    consoleOutput.length = 0
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
    describe('only one org claims the domains', () => {
      describe('org is owner of dmarc data', () => {
        beforeEach(async () => {
          await collections.ownership.save({
            _from: org._id,
            _to: domain._id,
          })
        })
        it('removes all dmarc summary data', async () => {
          await graphql(
            schema,
            `
                  mutation {
                    leaveOrganization (
                      input: {
                        orgId: "${toGlobalId('organizations', org._key)}"
                      }
                    ) {
                      result {
                        ... on LeaveOrganizationResult {
                          status
                        }
                        ... on AffiliationError {
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
                checkOrgOwner: checkOrgOwner({
                  i18n,
                  query,
                  userKey: user._key,
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
                verifiedRequired: verifiedRequired({i18n}),
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
          await query`FOR dmarcSum IN dmarcSummaries OPTIONS { waitForSync: true } RETURN dmarcSum`
          await query`FOR item IN domainsToDmarcSummaries OPTIONS { waitForSync: true } RETURN item`

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
          const testDomainsToDmarcSum = await testDomainsToDmarcSumCursor.next()
          expect(testDomainsToDmarcSum).toEqual(undefined)
        })
      })
      describe('org is not the owner of dmarc data', () => {
        beforeEach(async () => {
          await collections.ownership.save({
            _from: 'organizations/1',
            _to: domain._id,
          })
        })
        it('does not remove all dmarc summary data', async () => {
          await graphql(
            schema,
            `
                mutation {
                  leaveOrganization (
                    input: {
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on LeaveOrganizationResult {
                        status
                      }
                      ... on AffiliationError {
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
                checkOrgOwner: checkOrgOwner({
                  i18n,
                  query,
                  userKey: user._key,
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
                verifiedRequired: verifiedRequired({i18n}),
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
          await query`FOR dmarcSum IN dmarcSummaries OPTIONS { waitForSync: true } RETURN dmarcSum`
          await query`FOR item IN domainsToDmarcSummaries OPTIONS { waitForSync: true } RETURN item`

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
          const testDomainsToDmarcSum = await testDomainsToDmarcSumCursor.next()
          expect(testDomainsToDmarcSum).toBeDefined()
        })
      })
      it('removes all scan data', async () => {
        await graphql(
          schema,
          `
              mutation {
                leaveOrganization (
                  input: {
                    orgId: "${toGlobalId('organizations', org._key)}"
                  }
                ) {
                  result {
                    ... on LeaveOrganizationResult {
                      status
                    }
                    ... on AffiliationError {
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
              checkOrgOwner: checkOrgOwner({i18n, query, userKey: user._key}),
              userRequired: userRequired({
                i18n,
                userKey: user._key,
                loadUserByKey: loadUserByKey({
                  query,
                  userKey: user._key,
                  i18n,
                }),
              }),
              verifiedRequired: verifiedRequired({i18n}),
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
          await query`FOR wScan IN webScan OPTIONS { waitForSync: true } RETURN wScan.webScan`
        const testWebScan = await testWebScanCursor.next()
        expect(testWebScan).toEqual(undefined)

        const testDNSCursor =
          await query`FOR dnsResult IN dns OPTIONS { waitForSync: true } RETURN dnsResult.dns`
        const testDNS = await testDNSCursor.next()
        expect(testDNS).toEqual(undefined)

        const testWebCursor =
          await query`FOR webResult IN web OPTIONS { waitForSync: true } RETURN webResult.web`
        const testWeb = await testWebCursor.next()
        expect(testWeb).toEqual(undefined)
      })
      it('removes all domain, affiliation, and org data', async () => {
        await graphql(
          schema,
          `
              mutation {
                leaveOrganization (
                  input: {
                    orgId: "${toGlobalId('organizations', org._key)}"
                  }
                ) {
                  result {
                    ... on LeaveOrganizationResult {
                      status
                    }
                    ... on AffiliationError {
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
              checkOrgOwner: checkOrgOwner({i18n, query, userKey: user._key}),
              userRequired: userRequired({
                i18n,
                userKey: user._key,
                loadUserByKey: loadUserByKey({
                  query,
                  userKey: user._key,
                  i18n,
                }),
              }),
              verifiedRequired: verifiedRequired({i18n}),
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

        await query`FOR org IN organizations OPTIONS { waitForSync: true } RETURN org`
        await query`FOR domain IN domains OPTIONS { waitForSync: true } RETURN domain`
        await query`FOR aff IN affiliations OPTIONS { waitForSync: true } RETURN aff`

        const testOrgCursor =
          await query`FOR org IN organizations OPTIONS { waitForSync: true } RETURN org`
        const testOrg = await testOrgCursor.next()
        expect(testOrg).toEqual(undefined)

        const testDomainCursor =
          await query`FOR domain IN domains OPTIONS { waitForSync: true } RETURN domain`
        const testDomain = await testDomainCursor.next()
        expect(testDomain).toEqual(undefined)

        const testAffiliationCursor =
          await query`FOR aff IN affiliations OPTIONS { waitForSync: true } RETURN aff`
        const testAffiliation = await testAffiliationCursor.next()
        expect(testAffiliation).toEqual(undefined)
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
        it('returns status success message', async () => {
          const response = await graphql(
            schema,
            `
                mutation {
                  leaveOrganization (
                    input: {
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on LeaveOrganizationResult {
                        status
                      }
                      ... on AffiliationError {
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
                checkOrgOwner: checkOrgOwner({
                  i18n,
                  query,
                  userKey: user._key,
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
                verifiedRequired: verifiedRequired({i18n}),
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

          const expectedResult = {
            data: {
              leaveOrganization: {
                result: {
                  status:
                    'Successfully left organization: treasury-board-secretariat',
                },
              },
            },
          }

          expect(response).toEqual(expectedResult)
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully left org: treasury-board-secretariat.`,
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
        it('returns status success message', async () => {
          const response = await graphql(
            schema,
            `
                mutation {
                  leaveOrganization (
                    input: {
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on LeaveOrganizationResult {
                        status
                      }
                      ... on AffiliationError {
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
                checkOrgOwner: checkOrgOwner({
                  i18n,
                  query,
                  userKey: user._key,
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
                verifiedRequired: verifiedRequired({i18n}),
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

          const expectedResult = {
            data: {
              leaveOrganization: {
                result: {
                  status:
                    "L'organisation a été quittée avec succès: treasury-board-secretariat",
                },
              },
            },
          }

          expect(response).toEqual(expectedResult)
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully left org: treasury-board-secretariat.`,
          ])
        })
      })
    })
    describe('multiple orgs claims the domains', () => {
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
      describe('org is owner of dmarc data', () => {
        beforeEach(async () => {
          await collections.ownership.save({
            _from: org._id,
            _to: domain._id,
          })
        })
        it('removes all dmarc summary data', async () => {
          await graphql(
            schema,
            `
                  mutation {
                    leaveOrganization (
                      input: {
                        orgId: "${toGlobalId('organizations', org._key)}"
                      }
                    ) {
                      result {
                        ... on LeaveOrganizationResult {
                          status
                        }
                        ... on AffiliationError {
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
                checkOrgOwner: checkOrgOwner({
                  i18n,
                  query,
                  userKey: user._key,
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
                verifiedRequired: verifiedRequired({i18n}),
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
          await query`FOR dmarcSum IN dmarcSummaries OPTIONS { waitForSync: true } RETURN dmarcSum`
          await query`FOR item IN domainsToDmarcSummaries OPTIONS { waitForSync: true } RETURN item`

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
          const testDomainsToDmarcSum = await testDomainsToDmarcSumCursor.next()
          expect(testDomainsToDmarcSum).toEqual(undefined)
        })
      })
      describe('org is not the owner of dmarc data', () => {
        beforeEach(async () => {
          await collections.ownership.save({
            _from: org2._id,
            _to: domain._id,
          })
        })
        it('does not remove all dmarc summary data', async () => {
          await graphql(
            schema,
            `
                mutation {
                  leaveOrganization (
                    input: {
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on LeaveOrganizationResult {
                        status
                      }
                      ... on AffiliationError {
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
                checkOrgOwner: checkOrgOwner({
                  i18n,
                  query,
                  userKey: user._key,
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
                verifiedRequired: verifiedRequired({i18n}),
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
          const testDomainsToDmarcSum = await testDomainsToDmarcSumCursor.next()
          expect(testDomainsToDmarcSum).toBeDefined()
        })
      })
      it('does not remove all scan data', async () => {
        await graphql(
          schema,
          `
              mutation {
                leaveOrganization (
                  input: {
                    orgId: "${toGlobalId('organizations', org._key)}"
                  }
                ) {
                  result {
                    ... on LeaveOrganizationResult {
                      status
                    }
                    ... on AffiliationError {
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
              checkOrgOwner: checkOrgOwner({i18n, query, userKey: user._key}),
              userRequired: userRequired({
                i18n,
                userKey: user._key,
                loadUserByKey: loadUserByKey({
                  query,
                  userKey: user._key,
                  i18n,
                }),
              }),
              verifiedRequired: verifiedRequired({i18n}),
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
          await query`FOR wScan IN webScan OPTIONS { waitForSync: true } RETURN wScan.webScan`
        const testWebScan = await testWebScanCursor.next()
        expect(testWebScan).toEqual(true)

        const testDNSCursor =
          await query`FOR dnsResult IN dns OPTIONS { waitForSync: true } RETURN dnsResult.dns`
        const testDNS = await testDNSCursor.next()
        expect(testDNS).toEqual(true)

        const testWebCursor =
          await query`FOR webResult IN web OPTIONS { waitForSync: true } RETURN webResult.web`
        const testWeb = await testWebCursor.next()
        expect(testWeb).toEqual(true)

      })
      it('does not remove all domain', async () => {
        await graphql(
          schema,
          `
              mutation {
                leaveOrganization (
                  input: {
                    orgId: "${toGlobalId('organizations', org._key)}"
                  }
                ) {
                  result {
                    ... on LeaveOrganizationResult {
                      status
                    }
                    ... on AffiliationError {
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
              checkOrgOwner: checkOrgOwner({i18n, query, userKey: user._key}),
              userRequired: userRequired({
                i18n,
                userKey: user._key,
                loadUserByKey: loadUserByKey({
                  query,
                  userKey: user._key,
                  i18n,
                }),
              }),
              verifiedRequired: verifiedRequired({i18n}),
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

        const testDomainCursor =
          await query`FOR domain IN domains OPTIONS { waitForSync: true } RETURN domain`
        const testDomain = await testDomainCursor.next()
        expect(testDomain).toBeDefined()
      })
      it('removes affiliation, and org data', async () => {
        await graphql(
          schema,
          `
              mutation {
                leaveOrganization (
                  input: {
                    orgId: "${toGlobalId('organizations', org._key)}"
                  }
                ) {
                  result {
                    ... on LeaveOrganizationResult {
                      status
                    }
                    ... on AffiliationError {
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
              checkOrgOwner: checkOrgOwner({i18n, query, userKey: user._key}),
              userRequired: userRequired({
                i18n,
                userKey: user._key,
                loadUserByKey: loadUserByKey({
                  query,
                  userKey: user._key,
                  i18n,
                }),
              }),
              verifiedRequired: verifiedRequired({i18n}),
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

        await query`FOR org IN organizations OPTIONS { waitForSync: true } RETURN org`
        await query`FOR aff IN affiliations OPTIONS { waitForSync: true } RETURN aff`

        const testOrgCursor = await query`
          FOR org IN organizations
            OPTIONS { waitForSync: true }
            FILTER org.orgDetails.en.slug != "treasury-board-secretariat-2"
            RETURN org
        `
        const testOrg = await testOrgCursor.next()
        expect(testOrg).toEqual(undefined)

        const testAffiliationCursor =
          await query`FOR aff IN affiliations OPTIONS { waitForSync: true } RETURN aff`
        const testAffiliation = await testAffiliationCursor.next()
        expect(testAffiliation).toEqual(undefined)
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
        it('returns status success message', async () => {
          const response = await graphql(
            schema,
            `
                mutation {
                  leaveOrganization (
                    input: {
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on LeaveOrganizationResult {
                        status
                      }
                      ... on AffiliationError {
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
                checkOrgOwner: checkOrgOwner({
                  i18n,
                  query,
                  userKey: user._key,
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
                verifiedRequired: verifiedRequired({i18n}),
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

          const expectedResult = {
            data: {
              leaveOrganization: {
                result: {
                  status:
                    'Successfully left organization: treasury-board-secretariat',
                },
              },
            },
          }

          expect(response).toEqual(expectedResult)
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully left org: treasury-board-secretariat.`,
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
        it('returns status success message', async () => {
          const response = await graphql(
            schema,
            `
                mutation {
                  leaveOrganization (
                    input: {
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on LeaveOrganizationResult {
                        status
                      }
                      ... on AffiliationError {
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
                checkOrgOwner: checkOrgOwner({
                  i18n,
                  query,
                  userKey: user._key,
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
                verifiedRequired: verifiedRequired({i18n}),
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

          const expectedResult = {
            data: {
              leaveOrganization: {
                result: {
                  status:
                    "L'organisation a été quittée avec succès: treasury-board-secretariat",
                },
              },
            },
          }

          expect(response).toEqual(expectedResult)
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully left org: treasury-board-secretariat.`,
          ])
        })
      })
    })
  })
  describe('user is not an org owner', () => {
    beforeEach(async () => {
      await collections.affiliations.save({
        _from: org._id,
        _to: user._id,
        permission: 'admin',
        owner: false,
      })
      await collections.ownership.save({
        _from: 'organizations/1',
        _to: domain._id,
      })
    })
    it('does not remove all dmarc summary data', async () => {
      await graphql(
        schema,
        `
            mutation {
              leaveOrganization (
                input: {
                  orgId: "${toGlobalId('organizations', org._key)}"
                }
              ) {
                result {
                  ... on LeaveOrganizationResult {
                    status
                  }
                  ... on AffiliationError {
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
            checkOrgOwner: checkOrgOwner({
              i18n,
              query,
              userKey: user._key,
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
            verifiedRequired: verifiedRequired({i18n}),
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
      const testDomainsToDmarcSum = await testDomainsToDmarcSumCursor.next()
      expect(testDomainsToDmarcSum).toBeDefined()
    })
    it('does not remove scan data', async () => {
      await graphql(
        schema,
        `
            mutation {
              leaveOrganization (
                input: {
                  orgId: "${toGlobalId('organizations', org._key)}"
                }
              ) {
                result {
                  ... on LeaveOrganizationResult {
                    status
                  }
                  ... on AffiliationError {
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
            checkOrgOwner: checkOrgOwner({i18n, query, userKey: user._key}),
            userRequired: userRequired({
              i18n,
              userKey: user._key,
              loadUserByKey: loadUserByKey({
                query,
                userKey: user._key,
                i18n,
              }),
            }),
            verifiedRequired: verifiedRequired({i18n}),
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
        await query`FOR wScan IN webScan OPTIONS { waitForSync: true } RETURN wScan.webScan`
      const testWebScan = await testWebScanCursor.next()
      expect(testWebScan).toEqual(true)

      const testDNSCursor =
        await query`FOR dnsResult IN dns OPTIONS { waitForSync: true } RETURN dnsResult.dns`
      const testDNS = await testDNSCursor.next()
      expect(testDNS).toEqual(true)

      const testWebCursor =
        await query`FOR webResult IN web OPTIONS { waitForSync: true } RETURN webResult.web`
      const testWeb = await testWebCursor.next()
      expect(testWeb).toEqual(true)

    })
    it('does not remove org and domain information', async () => {
      await graphql(
        schema,
        `
            mutation {
              leaveOrganization (
                input: {
                  orgId: "${toGlobalId('organizations', org._key)}"
                }
              ) {
                result {
                  ... on LeaveOrganizationResult {
                    status
                  }
                  ... on AffiliationError {
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
            checkOrgOwner: checkOrgOwner({i18n, query, userKey: user._key}),
            userRequired: userRequired({
              i18n,
              userKey: user._key,
              loadUserByKey: loadUserByKey({
                query,
                userKey: user._key,
                i18n,
              }),
            }),
            verifiedRequired: verifiedRequired({i18n}),
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

      const testOrgCursor =
        await query`FOR org IN organizations OPTIONS { waitForSync: true } RETURN org`
      const testOrg = await testOrgCursor.next()
      expect(testOrg).toBeDefined()

      const testDomainCursor =
        await query`FOR domain IN domains OPTIONS { waitForSync: true } RETURN domain`
      const testDomain = await testDomainCursor.next()
      expect(testDomain).toBeDefined()
    })
    it('removes affiliation data', async () => {
      await graphql(
        schema,
        `
            mutation {
              leaveOrganization (
                input: {
                  orgId: "${toGlobalId('organizations', org._key)}"
                }
              ) {
                result {
                  ... on LeaveOrganizationResult {
                    status
                  }
                  ... on AffiliationError {
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
            checkOrgOwner: checkOrgOwner({i18n, query, userKey: user._key}),
            userRequired: userRequired({
              i18n,
              userKey: user._key,
              loadUserByKey: loadUserByKey({
                query,
                userKey: user._key,
                i18n,
              }),
            }),
            verifiedRequired: verifiedRequired({i18n}),
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

      const testAffiliationCursor =
        await query`FOR aff IN affiliations OPTIONS { waitForSync: true } RETURN aff`
      const testAffiliation = await testAffiliationCursor.next()
      expect(testAffiliation).toEqual(undefined)
    })
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
      it('returns status success message', async () => {
        const response = await graphql(
          schema,
          `
              mutation {
                leaveOrganization (
                  input: {
                    orgId: "${toGlobalId('organizations', org._key)}"
                  }
                ) {
                  result {
                    ... on LeaveOrganizationResult {
                      status
                    }
                    ... on AffiliationError {
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
              checkOrgOwner: checkOrgOwner({i18n, query, userKey: user._key}),
              userRequired: userRequired({
                i18n,
                userKey: user._key,
                loadUserByKey: loadUserByKey({
                  query,
                  userKey: user._key,
                  i18n,
                }),
              }),
              verifiedRequired: verifiedRequired({i18n}),
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

        const expectedResult = {
          data: {
            leaveOrganization: {
              result: {
                status:
                  'Successfully left organization: treasury-board-secretariat',
              },
            },
          },
        }

        expect(response).toEqual(expectedResult)
        expect(consoleOutput).toEqual([
          `User: ${user._key} successfully left org: treasury-board-secretariat.`,
        ])
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
      it('returns status success message', async () => {
        const response = await graphql(
          schema,
          `
              mutation {
                leaveOrganization (
                  input: {
                    orgId: "${toGlobalId('organizations', org._key)}"
                  }
                ) {
                  result {
                    ... on LeaveOrganizationResult {
                      status
                    }
                    ... on AffiliationError {
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
              checkOrgOwner: checkOrgOwner({i18n, query, userKey: user._key}),
              userRequired: userRequired({
                i18n,
                userKey: user._key,
                loadUserByKey: loadUserByKey({
                  query,
                  userKey: user._key,
                  i18n,
                }),
              }),
              verifiedRequired: verifiedRequired({i18n}),
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

        const expectedResult = {
          data: {
            leaveOrganization: {
              result: {
                status:
                  "L'organisation a été quittée avec succès: treasury-board-secretariat",
              },
            },
          },
        }

        expect(response).toEqual(expectedResult)
        expect(consoleOutput).toEqual([
          `User: ${user._key} successfully left org: treasury-board-secretariat.`,
        ])
      })
    })
  })
})
describe('given an unsuccessful leave', () => {
  let schema, i18n

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
  afterEach(async () => {
    consoleOutput.length = 0
  })
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
    describe('org cannot be found', () => {
      it('returns an error message', async () => {
        const response = await graphql(
          schema,
          `
              mutation {
                leaveOrganization (
                  input: {
                    orgId: "${toGlobalId('organizations', 123)}"
                  }
                ) {
                  result {
                    ... on LeaveOrganizationResult {
                      status
                    }
                    ... on AffiliationError {
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
            query: jest.fn(),
            collections: jest.fn(),
            transaction: jest.fn(),
            userKey: '123',
            auth: {
              checkOrgOwner: jest.fn().mockReturnValue(false),
              userRequired: jest.fn().mockReturnValue({
                _key: '123',
                emailValidated: true,
              }),
              verifiedRequired: verifiedRequired({i18n}),
            },
            loaders: {
              loadOrgByKey: {
                load: jest.fn().mockReturnValue(undefined),
              },
            },
            validators: {cleanseInput},
          },
        )

        const expectedResult = {
          data: {
            leaveOrganization: {
              result: {
                code: 400,
                description: 'Unable to leave undefined organization.',
              },
            },
          },
        }

        expect(response).toEqual(expectedResult)
        expect(consoleOutput).toEqual([
          `User 123 attempted to leave undefined organization: 123`,
        ])
      })
    })
    describe('user is an org owner', () => {
      describe('database error occurs', () => {
        describe('when querying dmarcSummaryCheck', () => {
          it('throws an error', async () => {
            const mockedQuery = jest
              .fn()
              .mockRejectedValue(new Error('Database error occurred.'))

            const mockedTransaction = jest.fn()

            const response = await graphql(
              schema,
              `
                  mutation {
                    leaveOrganization (
                      input: {
                        orgId: "${toGlobalId('organizations', 123)}"
                      }
                    ) {
                      result {
                        ... on LeaveOrganizationResult {
                          status
                        }
                        ... on AffiliationError {
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
                collections: jest.fn({property: 'string'}),
                transaction: mockedTransaction,
                userKey: '123',
                auth: {
                  checkOrgOwner: jest.fn().mockReturnValue(true),
                  userRequired: jest.fn().mockReturnValue({
                    _key: '123',
                    emailValidated: true,
                  }),
                  verifiedRequired: verifiedRequired({i18n}),
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({_key: 123}),
                  },
                },
                validators: {cleanseInput},
              },
            )

            const error = [
              new GraphQLError('Unable leave organization. Please try again.'),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Database error occurred while checking for dmarc summaries for org: 123, when user: 123 attempted to leave: Error: Database error occurred.`,
            ])
          })
        })
        describe('when querying domainInfo', () => {
          it('throws an error', async () => {
            const mockedQuery = jest
              .fn()
              .mockReturnValueOnce({
                all: jest.fn().mockReturnValue([]),
              })
              .mockRejectedValue(new Error('Database error occurred.'))

            const mockedTransaction = jest.fn()

            const response = await graphql(
              schema,
              `
                  mutation {
                    leaveOrganization (
                      input: {
                        orgId: "${toGlobalId('organizations', 123)}"
                      }
                    ) {
                      result {
                        ... on LeaveOrganizationResult {
                          status
                        }
                        ... on AffiliationError {
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
                collections: jest.fn({property: 'string'}),
                transaction: mockedTransaction,
                userKey: '123',
                auth: {
                  checkOrgOwner: jest.fn().mockReturnValue(true),
                  userRequired: jest.fn().mockReturnValue({
                    _key: '123',
                    emailValidated: true,
                  }),
                  verifiedRequired: verifiedRequired({i18n}),
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({_key: 123}),
                  },
                },
                validators: {cleanseInput},
              },
            )

            const error = [
              new GraphQLError('Unable leave organization. Please try again.'),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Database error occurred while while gathering domainInfo org: 123, when user: 123 attempted to leave: Error: Database error occurred.`,
            ])
          })
        })
      })
      describe('cursor error occurs', () => {
        describe('when getting dmarc summary info', () => {
          it('throws an error', async () => {
            const mockedQuery = jest.fn().mockReturnValue({
              all: jest
                .fn()
                .mockRejectedValue(new Error('Cursor error occurred.')),
            })

            const mockedTransaction = jest.fn()

            const response = await graphql(
              schema,
              `
                  mutation {
                    leaveOrganization (
                      input: {
                        orgId: "${toGlobalId('organizations', 123)}"
                      }
                    ) {
                      result {
                        ... on LeaveOrganizationResult {
                          status
                        }
                        ... on AffiliationError {
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
                collections: jest.fn({property: 'string'}),
                transaction: mockedTransaction,
                userKey: '123',
                auth: {
                  checkOrgOwner: jest.fn().mockReturnValue(true),
                  userRequired: jest.fn().mockReturnValue({
                    _key: '123',
                    emailValidated: true,
                  }),
                  verifiedRequired: verifiedRequired({i18n}),
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({_key: 123}),
                  },
                },
                validators: {cleanseInput},
              },
            )

            const error = [
              new GraphQLError('Unable leave organization. Please try again.'),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Cursor error occurred when getting dmarc summary info for org: 123, when user: 123 attempted to leave: Error: Cursor error occurred.`,
            ])
          })
        })
        describe('when getting domainInfo', () => {
          it('throws an error', async () => {
            const mockedQuery = jest.fn().mockReturnValue({
              all: jest
                .fn()
                .mockReturnValueOnce([])
                .mockRejectedValue(new Error('Cursor error occurred.')),
            })

            const mockedTransaction = jest.fn()

            const response = await graphql(
              schema,
              `
                  mutation {
                    leaveOrganization (
                      input: {
                        orgId: "${toGlobalId('organizations', 123)}"
                      }
                    ) {
                      result {
                        ... on LeaveOrganizationResult {
                          status
                        }
                        ... on AffiliationError {
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
                collections: jest.fn({property: 'string'}),
                transaction: mockedTransaction,
                userKey: '123',
                auth: {
                  checkOrgOwner: jest.fn().mockReturnValue(true),
                  userRequired: jest.fn().mockReturnValue({
                    _key: '123',
                    emailValidated: true,
                  }),
                  verifiedRequired: verifiedRequired({i18n}),
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({_key: 123}),
                  },
                },
                validators: {cleanseInput},
              },
            )

            const error = [
              new GraphQLError('Unable leave organization. Please try again.'),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Cursor error occurred while while gathering domainInfo org: 123, when user: 123 attempted to leave: Error: Cursor error occurred.`,
            ])
          })
        })
      })
      describe('transaction step error occurs', () => {
        describe('when removing dmarcSummary data', () => {
          it('throws an error', async () => {
            const mockedQuery = jest.fn().mockReturnValue({
              all: jest.fn().mockReturnValue([{}]),
            })

            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest
                .fn()
                .mockRejectedValue(new Error('Step error occurred.')),
            })

            const response = await graphql(
              schema,
              `
                  mutation {
                    leaveOrganization (
                      input: {
                        orgId: "${toGlobalId('organizations', 123)}"
                      }
                    ) {
                      result {
                        ... on LeaveOrganizationResult {
                          status
                        }
                        ... on AffiliationError {
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
                collections: jest.fn({property: 'string'}),
                transaction: mockedTransaction,
                userKey: '123',
                auth: {
                  checkOrgOwner: jest.fn().mockReturnValue(true),
                  userRequired: jest.fn().mockReturnValue({
                    _key: '123',
                    emailValidated: true,
                  }),
                  verifiedRequired: verifiedRequired({i18n}),
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({_key: 123}),
                  },
                },
                validators: {cleanseInput},
              },
            )

            const error = [
              new GraphQLError('Unable leave organization. Please try again.'),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred while attempting to remove dmarc summaries for org: 123, when user: 123 attempted to leave: Error: Step error occurred.`,
            ])
          })
        })
        describe('when removing ownership data', () => {
          it('throws an error', async () => {
            const mockedQuery = jest.fn().mockReturnValue({
              all: jest.fn().mockReturnValue([{}]),
            })

            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest
                .fn()
                .mockReturnValueOnce()
                .mockRejectedValue(new Error('Step error occurred.')),
            })

            const response = await graphql(
              schema,
              `
                  mutation {
                    leaveOrganization (
                      input: {
                        orgId: "${toGlobalId('organizations', 123)}"
                      }
                    ) {
                      result {
                        ... on LeaveOrganizationResult {
                          status
                        }
                        ... on AffiliationError {
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
                collections: jest.fn({property: 'string'}),
                transaction: mockedTransaction,
                userKey: '123',
                auth: {
                  checkOrgOwner: jest.fn().mockReturnValue(true),
                  userRequired: jest.fn().mockReturnValue({
                    _key: '123',
                    emailValidated: true,
                  }),
                  verifiedRequired: verifiedRequired({i18n}),
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({_key: 123}),
                  },
                },
                validators: {cleanseInput},
              },
            )

            const error = [
              new GraphQLError('Unable leave organization. Please try again.'),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred while attempting to remove ownership for org: 123, when user: 123 attempted to leave: Error: Step error occurred.`,
            ])
          })
        })
        describe('when removing web scan result data', () => {
          it('throws an error', async () => {
            const mockedQuery = jest.fn().mockReturnValue({
              all: jest
                .fn()
                .mockReturnValueOnce([])
                .mockReturnValue([{count: 1, domain: "test.gc.ca"}]),
            })

            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest
                .fn()
                .mockRejectedValue(new Error('Step error occurred.')),
            })

            const response = await graphql(
              schema,
              `
                  mutation {
                    leaveOrganization (
                      input: {
                        orgId: "${toGlobalId('organizations', 123)}"
                      }
                    ) {
                      result {
                        ... on LeaveOrganizationResult {
                          status
                        }
                        ... on AffiliationError {
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
                collections: jest.fn({property: 'string'}),
                transaction: mockedTransaction,
                userKey: '123',
                auth: {
                  checkOrgOwner: jest.fn().mockReturnValue(true),
                  userRequired: jest.fn().mockReturnValue({
                    _key: '123',
                    emailValidated: true,
                  }),
                  verifiedRequired: verifiedRequired({i18n}),
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({_key: 123}),
                  },
                },
                validators: {cleanseInput},
              },
            )

            const error = [
              new GraphQLError('Unable to leave organization. Please try again.'),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred while user: 123 attempted to remove web data for test.gc.ca in org: undefined, Error: Step error occurred.`,
            ])
          })
        })
        describe('when removing scan data', () => {
          it('throws an error', async () => {
            const mockedQuery = jest.fn().mockReturnValue({
              all: jest
                .fn()
                .mockReturnValueOnce([])
                .mockReturnValue([{count: 1, domain: "test.gc.ca"}]),
            })

            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest
                .fn()
                .mockReturnValueOnce()
                .mockRejectedValue(new Error('Step error occurred.')),
            })

            const response = await graphql(
              schema,
              `
                  mutation {
                    leaveOrganization (
                      input: {
                        orgId: "${toGlobalId('organizations', 123)}"
                      }
                    ) {
                      result {
                        ... on LeaveOrganizationResult {
                          status
                        }
                        ... on AffiliationError {
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
                collections: jest.fn({property: 'string'}),
                transaction: mockedTransaction,
                userKey: '123',
                auth: {
                  checkOrgOwner: jest.fn().mockReturnValue(true),
                  userRequired: jest.fn().mockReturnValue({
                    _key: '123',
                    emailValidated: true,
                  }),
                  verifiedRequired: verifiedRequired({i18n}),
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({_key: 123}),
                  },
                },
                validators: {cleanseInput},
              },
            )

            const error = [
              new GraphQLError('Unable to leave organization. Please try again.'),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred while user: 123 attempted to remove DNS data for test.gc.ca in org: undefined, error: Error: Step error occurred.`,
            ])
          })
        })
        describe('when removing domain', () => {
          it('throws an error', async () => {
            const mockedQuery = jest.fn().mockReturnValue({
              all: jest
                .fn()
                .mockReturnValueOnce([])
                .mockReturnValue([{count: 1, domain: "test.gc.ca"}]),
            })

            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest
                .fn()
                .mockReturnValueOnce()
                .mockReturnValueOnce()
                .mockRejectedValue(new Error('Step error occurred.')),
            })

            const response = await graphql(
              schema,
              `
                  mutation {
                    leaveOrganization (
                      input: {
                        orgId: "${toGlobalId('organizations', 123)}"
                      }
                    ) {
                      result {
                        ... on LeaveOrganizationResult {
                          status
                        }
                        ... on AffiliationError {
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
                collections: jest.fn({property: 'string'}),
                transaction: mockedTransaction,
                userKey: '123',
                auth: {
                  checkOrgOwner: jest.fn().mockReturnValue(true),
                  userRequired: jest.fn().mockReturnValue({
                    _key: '123',
                    emailValidated: true,
                  }),
                  verifiedRequired: verifiedRequired({i18n}),
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({_key: 123}),
                  },
                },
                validators: {cleanseInput},
              },
            )

            const error = [
              new GraphQLError('Unable leave organization. Please try again.'),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred while attempting to remove domains for org: 123, when user: 123 attempted to leave: Error: Step error occurred.`,
            ])
          })
        })
        describe('when removing affiliation, and org data', () => {
          it('throws an error', async () => {
            const mockedQuery = jest.fn().mockReturnValue({
              all: jest
                .fn()
                .mockReturnValueOnce([])
                .mockReturnValue([{count: 1, domain: "test.gc.ca"}]),
            })

            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest
                .fn()
                .mockReturnValueOnce()
                .mockReturnValueOnce()
                .mockReturnValueOnce()
                .mockReturnValueOnce()
                .mockRejectedValue(new Error('Step error occurred.')),
            })

            const response = await graphql(
              schema,
              `
                  mutation {
                    leaveOrganization (
                      input: {
                        orgId: "${toGlobalId('organizations', 123)}"
                      }
                    ) {
                      result {
                        ... on LeaveOrganizationResult {
                          status
                        }
                        ... on AffiliationError {
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
                collections: jest.fn({property: 'string'}),
                transaction: mockedTransaction,
                userKey: '123',
                auth: {
                  checkOrgOwner: jest.fn().mockReturnValue(true),
                  userRequired: jest.fn().mockReturnValue({
                    _key: '123',
                    emailValidated: true,
                  }),
                  verifiedRequired: verifiedRequired({i18n}),
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({_key: 123}),
                  },
                },
                validators: {cleanseInput},
              },
            )

            const error = [
              new GraphQLError('Unable leave organization. Please try again.'),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred while attempting to remove affiliations, and the org for org: 123, when user: 123 attempted to leave: Error: Step error occurred.`,
            ])
          })
        })
      })
    })
    describe('user is not an org owner', () => {
      describe('when removing affiliation information', () => {
        it('throws an error', async () => {
          const mockedQuery = jest.fn().mockReturnValue({
            count: 1,
            all: jest.fn().mockReturnValue([]),
          })

          const mockedTransaction = jest.fn().mockReturnValue({
            step: jest
              .fn()
              .mockRejectedValue(new Error('Step error occurred.')),
          })

          const response = await graphql(
            schema,
            `
                mutation {
                  leaveOrganization (
                    input: {
                      orgId: "${toGlobalId('organizations', 123)}"
                    }
                  ) {
                    result {
                      ... on LeaveOrganizationResult {
                        status
                      }
                      ... on AffiliationError {
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
              collections: jest.fn({property: 'string'}),
              transaction: mockedTransaction,
              userKey: '123',
              auth: {
                checkOrgOwner: jest.fn().mockReturnValue(false),
                userRequired: jest.fn().mockReturnValue({
                  _key: '123',
                  emailValidated: true,
                }),
                verifiedRequired: verifiedRequired({i18n}),
              },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({_key: 123}),
                },
              },
              validators: {cleanseInput},
            },
          )

          const error = [
            new GraphQLError('Unable leave organization. Please try again.'),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Trx step error occurred when removing user: 123 affiliation with org: 123: Error: Step error occurred.`,
          ])
        })
      })
    })
    describe('transaction commit error occurs', () => {
      it('throws an error', async () => {
        const mockedQuery = jest.fn().mockReturnValue({
          count: 1,
          next: jest.fn().mockReturnValue({
            count: 1,
          }),
        })

        const mockedTransaction = jest.fn().mockReturnValue({
          step: jest.fn().mockReturnValue(new Error('Step error occurred.')),
          commit: jest.fn().mockRejectedValue(new Error('Trx Commit Error')),
        })

        const response = await graphql(
          schema,
          `
              mutation {
                leaveOrganization (
                  input: {
                    orgId: "${toGlobalId('organizations', 123)}"
                  }
                ) {
                  result {
                    ... on LeaveOrganizationResult {
                      status
                    }
                    ... on AffiliationError {
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
            collections: jest.fn({property: 'string'}),
            transaction: mockedTransaction,
            userKey: '123',
            auth: {
              checkOrgOwner: jest.fn().mockReturnValue(false),
              userRequired: jest.fn().mockReturnValue({
                _key: '123',
                emailValidated: true,
              }),
              verifiedRequired: verifiedRequired({i18n}),
            },
            loaders: {
              loadOrgByKey: {
                load: jest.fn().mockReturnValue({_key: 123}),
              },
            },
            validators: {cleanseInput},
          },
        )

        const error = [
          new GraphQLError('Unable leave organization. Please try again.'),
        ]

        expect(response.errors).toEqual(error)
        expect(consoleOutput).toEqual([
          `Trx commit error occurred when user: 123 attempted to leave org: 123: Error: Trx Commit Error`,
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
    describe('org cannot be found', () => {
      it('returns an error message', async () => {
        const response = await graphql(
          schema,
          `
              mutation {
                leaveOrganization (
                  input: {
                    orgId: "${toGlobalId('organizations', 123)}"
                  }
                ) {
                  result {
                    ... on LeaveOrganizationResult {
                      status
                    }
                    ... on AffiliationError {
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
            query: jest.fn(),
            collections: jest.fn(),
            transaction: jest.fn(),
            userKey: '123',
            auth: {
              checkOrgOwner: jest.fn().mockReturnValue(false),
              userRequired: jest.fn().mockReturnValue({
                _key: '123',
                emailValidated: true,
              }),
              verifiedRequired: verifiedRequired({i18n}),
            },
            loaders: {
              loadOrgByKey: {
                load: jest.fn().mockReturnValue(undefined),
              },
            },
            validators: {cleanseInput},
          },
        )

        const expectedResult = {
          data: {
            leaveOrganization: {
              result: {
                code: 400,
                description:
                  'Impossible de quitter une organisation non définie.',
              },
            },
          },
        }

        expect(response).toEqual(expectedResult)
        expect(consoleOutput).toEqual([
          `User 123 attempted to leave undefined organization: 123`,
        ])
      })
    })
    describe('user is an org owner', () => {
      describe('database error occurs', () => {
        describe('when querying dmarcSummaryCheck', () => {
          it('throws an error', async () => {
            const mockedQuery = jest
              .fn()
              .mockRejectedValue(new Error('Database error occurred.'))

            const mockedTransaction = jest.fn()

            const response = await graphql(
              schema,
              `
                  mutation {
                    leaveOrganization (
                      input: {
                        orgId: "${toGlobalId('organizations', 123)}"
                      }
                    ) {
                      result {
                        ... on LeaveOrganizationResult {
                          status
                        }
                        ... on AffiliationError {
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
                collections: jest.fn({property: 'string'}),
                transaction: mockedTransaction,
                userKey: '123',
                auth: {
                  checkOrgOwner: jest.fn().mockReturnValue(true),
                  userRequired: jest.fn().mockReturnValue({
                    _key: '123',
                    emailValidated: true,
                  }),
                  verifiedRequired: verifiedRequired({i18n}),
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({_key: 123}),
                  },
                },
                validators: {cleanseInput},
              },
            )

            const error = [
              new GraphQLError(
                "Impossible de quitter l'organisation. Veuillez réessayer.",
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Database error occurred while checking for dmarc summaries for org: 123, when user: 123 attempted to leave: Error: Database error occurred.`,
            ])
          })
        })
        describe('when querying domainInfo', () => {
          it('throws an error', async () => {
            const mockedQuery = jest
              .fn()
              .mockReturnValueOnce({
                all: jest.fn().mockReturnValue([]),
              })
              .mockRejectedValue(new Error('Database error occurred.'))

            const mockedTransaction = jest.fn()

            const response = await graphql(
              schema,
              `
                  mutation {
                    leaveOrganization (
                      input: {
                        orgId: "${toGlobalId('organizations', 123)}"
                      }
                    ) {
                      result {
                        ... on LeaveOrganizationResult {
                          status
                        }
                        ... on AffiliationError {
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
                collections: jest.fn({property: 'string'}),
                transaction: mockedTransaction,
                userKey: '123',
                auth: {
                  checkOrgOwner: jest.fn().mockReturnValue(true),
                  userRequired: jest.fn().mockReturnValue({
                    _key: '123',
                    emailValidated: true,
                  }),
                  verifiedRequired: verifiedRequired({i18n}),
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({_key: 123}),
                  },
                },
                validators: {cleanseInput},
              },
            )

            const error = [
              new GraphQLError(
                "Impossible de quitter l'organisation. Veuillez réessayer.",
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Database error occurred while while gathering domainInfo org: 123, when user: 123 attempted to leave: Error: Database error occurred.`,
            ])
          })
        })
      })
      describe('cursor error occurs', () => {
        describe('when getting dmarc summary info', () => {
          it('throws an error', async () => {
            const mockedQuery = jest.fn().mockReturnValue({
              all: jest
                .fn()
                .mockRejectedValue(new Error('Cursor error occurred.')),
            })

            const mockedTransaction = jest.fn()

            const response = await graphql(
              schema,
              `
                  mutation {
                    leaveOrganization (
                      input: {
                        orgId: "${toGlobalId('organizations', 123)}"
                      }
                    ) {
                      result {
                        ... on LeaveOrganizationResult {
                          status
                        }
                        ... on AffiliationError {
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
                collections: jest.fn({property: 'string'}),
                transaction: mockedTransaction,
                userKey: '123',
                auth: {
                  checkOrgOwner: jest.fn().mockReturnValue(true),
                  userRequired: jest.fn().mockReturnValue({
                    _key: '123',
                    emailValidated: true,
                  }),
                  verifiedRequired: verifiedRequired({i18n}),
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({_key: 123}),
                  },
                },
                validators: {cleanseInput},
              },
            )

            const error = [
              new GraphQLError(
                "Impossible de quitter l'organisation. Veuillez réessayer.",
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Cursor error occurred when getting dmarc summary info for org: 123, when user: 123 attempted to leave: Error: Cursor error occurred.`,
            ])
          })
        })
        describe('when getting domainInfo', () => {
          it('throws an error', async () => {
            const mockedQuery = jest.fn().mockReturnValue({
              all: jest
                .fn()
                .mockReturnValueOnce([])
                .mockRejectedValue(new Error('Cursor error occurred.')),
            })

            const mockedTransaction = jest.fn()

            const response = await graphql(
              schema,
              `
                  mutation {
                    leaveOrganization (
                      input: {
                        orgId: "${toGlobalId('organizations', 123)}"
                      }
                    ) {
                      result {
                        ... on LeaveOrganizationResult {
                          status
                        }
                        ... on AffiliationError {
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
                collections: jest.fn({property: 'string'}),
                transaction: mockedTransaction,
                userKey: '123',
                auth: {
                  checkOrgOwner: jest.fn().mockReturnValue(true),
                  userRequired: jest.fn().mockReturnValue({
                    _key: '123',
                    emailValidated: true,
                  }),
                  verifiedRequired: verifiedRequired({i18n}),
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({_key: 123}),
                  },
                },
                validators: {cleanseInput},
              },
            )

            const error = [
              new GraphQLError(
                "Impossible de quitter l'organisation. Veuillez réessayer.",
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Cursor error occurred while while gathering domainInfo org: 123, when user: 123 attempted to leave: Error: Cursor error occurred.`,
            ])
          })
        })
      })
      describe('transaction step error occurs', () => {
        describe('when removing dmarcSummary data', () => {
          it('throws an error', async () => {
            const mockedQuery = jest.fn().mockReturnValue({
              all: jest.fn().mockReturnValue([{}]),
            })

            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest
                .fn()
                .mockRejectedValue(new Error('Step error occurred.')),
            })

            const response = await graphql(
              schema,
              `
                  mutation {
                    leaveOrganization (
                      input: {
                        orgId: "${toGlobalId('organizations', 123)}"
                      }
                    ) {
                      result {
                        ... on LeaveOrganizationResult {
                          status
                        }
                        ... on AffiliationError {
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
                collections: jest.fn({property: 'string'}),
                transaction: mockedTransaction,
                userKey: '123',
                auth: {
                  checkOrgOwner: jest.fn().mockReturnValue(true),
                  userRequired: jest.fn().mockReturnValue({
                    _key: '123',
                    emailValidated: true,
                  }),
                  verifiedRequired: verifiedRequired({i18n}),
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({_key: 123}),
                  },
                },
                validators: {cleanseInput},
              },
            )

            const error = [
              new GraphQLError(
                "Impossible de quitter l'organisation. Veuillez réessayer.",
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred while attempting to remove dmarc summaries for org: 123, when user: 123 attempted to leave: Error: Step error occurred.`,
            ])
          })
        })
        describe('when removing ownership data', () => {
          it('throws an error', async () => {
            const mockedQuery = jest.fn().mockReturnValue({
              all: jest.fn().mockReturnValue([{}]),
            })

            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest
                .fn()
                .mockReturnValueOnce()
                .mockRejectedValue(new Error('Step error occurred.')),
            })

            const response = await graphql(
              schema,
              `
                  mutation {
                    leaveOrganization (
                      input: {
                        orgId: "${toGlobalId('organizations', 123)}"
                      }
                    ) {
                      result {
                        ... on LeaveOrganizationResult {
                          status
                        }
                        ... on AffiliationError {
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
                collections: jest.fn({property: 'string'}),
                transaction: mockedTransaction,
                userKey: '123',
                auth: {
                  checkOrgOwner: jest.fn().mockReturnValue(true),
                  userRequired: jest.fn().mockReturnValue({
                    _key: '123',
                    emailValidated: true,
                  }),
                  verifiedRequired: verifiedRequired({i18n}),
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({_key: 123}),
                  },
                },
                validators: {cleanseInput},
              },
            )

            const error = [
              new GraphQLError(
                "Impossible de quitter l'organisation. Veuillez réessayer.",
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred while attempting to remove ownership for org: 123, when user: 123 attempted to leave: Error: Step error occurred.`,
            ])
          })
        })
        describe('when removing web result data', () => {
          it('throws an error', async () => {
            const mockedQuery = jest.fn().mockReturnValue({
              all: jest
                .fn()
                .mockReturnValueOnce([])
                .mockReturnValue([{count: 1}]),
            })

            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest
                .fn()
                .mockRejectedValue(new Error('Step error occurred.')),
            })

            const response = await graphql(
              schema,
              `
                  mutation {
                    leaveOrganization (
                      input: {
                        orgId: "${toGlobalId('organizations', 123)}"
                      }
                    ) {
                      result {
                        ... on LeaveOrganizationResult {
                          status
                        }
                        ... on AffiliationError {
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
                collections: jest.fn({property: 'string'}),
                transaction: mockedTransaction,
                userKey: '123',
                auth: {
                  checkOrgOwner: jest.fn().mockReturnValue(true),
                  userRequired: jest.fn().mockReturnValue({
                    _key: '123',
                    emailValidated: true,
                  }),
                  verifiedRequired: verifiedRequired({i18n}),
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({_key: 123}),
                  },
                },
                validators: {cleanseInput},
              },
            )

            const error = [
              new GraphQLError(
                "Impossible de quitter l'organisation. Veuillez réessayer.",
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred while user: 123 attempted to remove web data for undefined in org: undefined, Error: Step error occurred.`,
            ])
          })
        })
        describe('when removing scan data', () => {
          it('throws an error', async () => {
            const mockedQuery = jest.fn().mockReturnValue({
              all: jest
                .fn()
                .mockReturnValueOnce([])
                .mockReturnValue([{count: 1, domain: "test.gc.ca"}]),
            })

            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest
                .fn()
                .mockReturnValueOnce()
                .mockRejectedValue(new Error('Step error occurred.')),
            })

            const response = await graphql(
              schema,
              `
                  mutation {
                    leaveOrganization (
                      input: {
                        orgId: "${toGlobalId('organizations', 123)}"
                      }
                    ) {
                      result {
                        ... on LeaveOrganizationResult {
                          status
                        }
                        ... on AffiliationError {
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
                collections: jest.fn({property: 'string'}),
                transaction: mockedTransaction,
                userKey: '123',
                auth: {
                  checkOrgOwner: jest.fn().mockReturnValue(true),
                  userRequired: jest.fn().mockReturnValue({
                    _key: '123',
                    emailValidated: true,
                  }),
                  verifiedRequired: verifiedRequired({i18n}),
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({_key: 123}),
                  },
                },
                validators: {cleanseInput},
              },
            )

            const error = [
              new GraphQLError(
                "Impossible de quitter l'organisation. Veuillez réessayer.",
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred while user: 123 attempted to remove DNS data for test.gc.ca in org: undefined, error: Error: Step error occurred.`,
            ])
          })
        })
        describe('when removing domain', () => {
          it('throws an error', async () => {
            const mockedQuery = jest.fn().mockReturnValue({
              all: jest
                .fn()
                .mockReturnValueOnce([])
                .mockReturnValue([{count: 1, domain: "test.gc.ca"}]),
            })

            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest
                .fn()
                .mockReturnValueOnce()
                .mockReturnValueOnce()
                .mockRejectedValue(new Error('Step error occurred.')),
            })

            const response = await graphql(
              schema,
              `
                  mutation {
                    leaveOrganization (
                      input: {
                        orgId: "${toGlobalId('organizations', 123)}"
                      }
                    ) {
                      result {
                        ... on LeaveOrganizationResult {
                          status
                        }
                        ... on AffiliationError {
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
                collections: jest.fn({property: 'string'}),
                transaction: mockedTransaction,
                userKey: '123',
                auth: {
                  checkOrgOwner: jest.fn().mockReturnValue(true),
                  userRequired: jest.fn().mockReturnValue({
                    _key: '123',
                    emailValidated: true,
                  }),
                  verifiedRequired: verifiedRequired({i18n}),
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({_key: 123}),
                  },
                },
                validators: {cleanseInput},
              },
            )

            const error = [
              new GraphQLError(
                "Impossible de quitter l'organisation. Veuillez réessayer.",
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred while attempting to remove domains for org: 123, when user: 123 attempted to leave: Error: Step error occurred.`,
            ])
          })
        })
        describe('when removing affiliation, and org data', () => {
          it('throws an error', async () => {
            const mockedQuery = jest.fn().mockReturnValue({
              all: jest
                .fn()
                .mockReturnValueOnce([])
                .mockReturnValue([{count: 1, domain: "test.gc.ca"}]),
            })

            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest
                .fn()
                .mockReturnValueOnce()
                .mockReturnValueOnce()
                .mockReturnValueOnce()
                .mockReturnValueOnce()
                .mockRejectedValue(new Error('Step error occurred.')),
            })

            const response = await graphql(
              schema,
              `
                  mutation {
                    leaveOrganization (
                      input: {
                        orgId: "${toGlobalId('organizations', 123)}"
                      }
                    ) {
                      result {
                        ... on LeaveOrganizationResult {
                          status
                        }
                        ... on AffiliationError {
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
                collections: jest.fn({property: 'string'}),
                transaction: mockedTransaction,
                userKey: '123',
                auth: {
                  checkOrgOwner: jest.fn().mockReturnValue(true),
                  userRequired: jest.fn().mockReturnValue({
                    _key: '123',
                    emailValidated: true,
                  }),
                  verifiedRequired: verifiedRequired({i18n}),
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({_key: 123}),
                  },
                },
                validators: {cleanseInput},
              },
            )

            const error = [
              new GraphQLError(
                "Impossible de quitter l'organisation. Veuillez réessayer.",
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred while attempting to remove affiliations, and the org for org: 123, when user: 123 attempted to leave: Error: Step error occurred.`,
            ])
          })
        })
      })
    })
    describe('user is not an org owner', () => {
      describe('when removing affiliation information', () => {
        it('throws an error', async () => {
          const mockedQuery = jest.fn().mockReturnValue({
            count: 1,
            all: jest.fn().mockReturnValue([]),
          })

          const mockedTransaction = jest.fn().mockReturnValue({
            step: jest
              .fn()
              .mockRejectedValue(new Error('Step error occurred.')),
          })

          const response = await graphql(
            schema,
            `
                mutation {
                  leaveOrganization (
                    input: {
                      orgId: "${toGlobalId('organizations', 123)}"
                    }
                  ) {
                    result {
                      ... on LeaveOrganizationResult {
                        status
                      }
                      ... on AffiliationError {
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
              collections: jest.fn({property: 'string'}),
              transaction: mockedTransaction,
              userKey: '123',
              auth: {
                checkOrgOwner: jest.fn().mockReturnValue(false),
                userRequired: jest.fn().mockReturnValue({
                  _key: '123',
                  emailValidated: true,
                }),
                verifiedRequired: verifiedRequired({i18n}),
              },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({_key: 123}),
                },
              },
              validators: {cleanseInput},
            },
          )

          const error = [
            new GraphQLError(
              "Impossible de quitter l'organisation. Veuillez réessayer.",
            ),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Trx step error occurred when removing user: 123 affiliation with org: 123: Error: Step error occurred.`,
          ])
        })
      })
    })
    describe('transaction commit error occurs', () => {
      it('throws an error', async () => {
        const mockedQuery = jest.fn().mockReturnValue({
          count: 1,
          next: jest.fn().mockReturnValue({
            count: 1,
          }),
        })

        const mockedTransaction = jest.fn().mockReturnValue({
          step: jest.fn().mockReturnValue(new Error('Step error occurred.')),
          commit: jest.fn().mockRejectedValue(new Error('Trx Commit Error')),
        })

        const response = await graphql(
          schema,
          `
              mutation {
                leaveOrganization (
                  input: {
                    orgId: "${toGlobalId('organizations', 123)}"
                  }
                ) {
                  result {
                    ... on LeaveOrganizationResult {
                      status
                    }
                    ... on AffiliationError {
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
            collections: jest.fn({property: 'string'}),
            transaction: mockedTransaction,
            userKey: '123',
            auth: {
              checkOrgOwner: jest.fn().mockReturnValue(false),
              userRequired: jest.fn().mockReturnValue({
                _key: '123',
                emailValidated: true,
              }),
              verifiedRequired: verifiedRequired({i18n}),
            },
            loaders: {
              loadOrgByKey: {
                load: jest.fn().mockReturnValue({_key: 123}),
              },
            },
            validators: {cleanseInput},
          },
        )

        const error = [
          new GraphQLError(
            "Impossible de quitter l'organisation. Veuillez réessayer.",
          ),
        ]

        expect(response.errors).toEqual(error)
        expect(consoleOutput).toEqual([
          `Trx commit error occurred when user: 123 attempted to leave org: 123: Error: Trx Commit Error`,
        ])
      })
    })
  })
})
