import { setupI18n } from '@lingui/core'
import { ensure, dbNameFromFile } from 'arango-tools'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { toGlobalId } from 'graphql-relay'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { databaseOptions } from '../../../../database-options'
import { checkOrgOwner, userRequired, verifiedRequired } from '../../../auth'
import { loadOrgByKey } from '../../../organization/loaders'
import { loadUserByKey } from '../../../user/loaders'
import { cleanseInput } from '../../../validators'
import { createMutationSchema } from '../../../mutation'
import { createQuerySchema } from '../../../query'

const { DB_PASS: rootPass, DB_URL: url, SIGN_IN_KEY } = process.env

describe('given a successful leave', () => {
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
  })
  afterEach(async () => {
    await truncate()
    consoleOutput.length = 0
  })
  afterAll(async () => {
    await drop()
  })

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
          collections,
          transaction,
          userKey: user._key,
          auth: {
            checkOrgOwner: checkOrgOwner({ i18n, query, userKey: user._key }),
            userRequired: userRequired({
              i18n,
              userKey: user._key,
              loadUserByKey: loadUserByKey({
                query,
                userKey: user._key,
                i18n,
              }),
            }),
            verifiedRequired: verifiedRequired({ i18n }),
          },
          loaders: {
            loadOrgByKey: loadOrgByKey({
              query,
              language: 'en',
              i18n,
              userKey: user._key,
            }),
          },
          validators: { cleanseInput },
        },
      )

      const testDkimResultCursor =
        await query`FOR dkimResult IN dkimResults RETURN dkimResult`
      const testDkimResult = await testDkimResultCursor.next()
      expect(testDkimResult).toEqual(undefined)

      const testDkimCursor = await query`FOR dkimScan IN dkim RETURN dkimScan`
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
          collections,
          transaction,
          userKey: user._key,
          auth: {
            checkOrgOwner: checkOrgOwner({ i18n, query, userKey: user._key }),
            userRequired: userRequired({
              i18n,
              userKey: user._key,
              loadUserByKey: loadUserByKey({
                query,
                userKey: user._key,
                i18n,
              }),
            }),
            verifiedRequired: verifiedRequired({ i18n }),
          },
          loaders: {
            loadOrgByKey: loadOrgByKey({
              query,
              language: 'en',
              i18n,
              userKey: user._key,
            }),
          },
          validators: { cleanseInput },
        },
      )

      const testOrgCursor = await query`FOR org IN organizations RETURN org`
      const testOrg = await testOrgCursor.next()
      expect(testOrg).toEqual(undefined)

      const testDomainCursor = await query`FOR domain IN domains RETURN domain`
      const testDomain = await testDomainCursor.next()
      expect(testDomain).toEqual(undefined)

      const testAffiliationCursor =
        await query`FOR aff IN affiliations RETURN aff`
      const testAffiliation = await testAffiliationCursor.next()
      expect(testAffiliation).toEqual(undefined)
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
            collections,
            transaction,
            userKey: user._key,
            auth: {
              checkOrgOwner: checkOrgOwner({ i18n, query, userKey: user._key }),
              userRequired: userRequired({
                i18n,
                userKey: user._key,
                loadUserByKey: loadUserByKey({
                  query,
                  userKey: user._key,
                  i18n,
                }),
              }),
              verifiedRequired: verifiedRequired({ i18n }),
            },
            loaders: {
              loadOrgByKey: loadOrgByKey({
                query,
                language: 'en',
                i18n,
                userKey: user._key,
              }),
            },
            validators: { cleanseInput },
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
            collections,
            transaction,
            userKey: user._key,
            auth: {
              checkOrgOwner: checkOrgOwner({ i18n, query, userKey: user._key }),
              userRequired: userRequired({
                i18n,
                userKey: user._key,
                loadUserByKey: loadUserByKey({
                  query,
                  userKey: user._key,
                  i18n,
                }),
              }),
              verifiedRequired: verifiedRequired({ i18n }),
            },
            loaders: {
              loadOrgByKey: loadOrgByKey({
                query,
                language: 'en',
                i18n,
                userKey: user._key,
              }),
            },
            validators: { cleanseInput },
          },
        )

        const expectedResult = {
          data: {
            leaveOrganization: {
              result: {
                status:
                "L'organisation a été quittée avec succès : treasury-board-secretariat",
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
  describe('user is not an org owner', () => {
    beforeEach(async () => {
      await collections.affiliations.save({
        _from: org._id,
        _to: user._id,
        permission: 'admin',
        owner: false,
      })
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
          collections,
          transaction,
          userKey: user._key,
          auth: {
            checkOrgOwner: checkOrgOwner({ i18n, query, userKey: user._key }),
            userRequired: userRequired({
              i18n,
              userKey: user._key,
              loadUserByKey: loadUserByKey({
                query,
                userKey: user._key,
                i18n,
              }),
            }),
            verifiedRequired: verifiedRequired({ i18n }),
          },
          loaders: {
            loadOrgByKey: loadOrgByKey({
              query,
              language: 'en',
              i18n,
              userKey: user._key,
            }),
          },
          validators: { cleanseInput },
        },
      )

      const testDkimResultCursor =
        await query`FOR dkimResult IN dkimResults RETURN dkimResult`
      const testDkimResult = await testDkimResultCursor.next()
      expect(testDkimResult).toBeDefined()

      const testDkimCursor = await query`FOR dkimScan IN dkim RETURN dkimScan`
      const testDkim = await testDkimCursor.next()
      expect(testDkim).toBeDefined()

      const testDmarcCursor =
        await query`FOR dmarcScan IN dmarc RETURN dmarcScan`
      const testDmarc = await testDmarcCursor.next()
      expect(testDmarc).toBeDefined()

      const testSpfCursor = await query`FOR spfScan IN spf RETURN spfScan`
      const testSpf = await testSpfCursor.next()
      expect(testSpf).toBeDefined()

      const testHttpsCursor =
        await query`FOR httpsScan IN https RETURN httpsScan`
      const testHttps = await testHttpsCursor.next()
      expect(testHttps).toBeDefined()

      const testSslCursor = await query`FOR sslScan IN ssl RETURN sslScan`
      const testSsl = await testSslCursor.next()
      expect(testSsl).toBeDefined()
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
          collections,
          transaction,
          userKey: user._key,
          auth: {
            checkOrgOwner: checkOrgOwner({ i18n, query, userKey: user._key }),
            userRequired: userRequired({
              i18n,
              userKey: user._key,
              loadUserByKey: loadUserByKey({
                query,
                userKey: user._key,
                i18n,
              }),
            }),
            verifiedRequired: verifiedRequired({ i18n }),
          },
          loaders: {
            loadOrgByKey: loadOrgByKey({
              query,
              language: 'en',
              i18n,
              userKey: user._key,
            }),
          },
          validators: { cleanseInput },
        },
      )

      const testOrgCursor = await query`FOR org IN organizations RETURN org`
      const testOrg = await testOrgCursor.next()
      expect(testOrg).toBeDefined()

      const testDomainCursor = await query`FOR domain IN domains RETURN domain`
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
          collections,
          transaction,
          userKey: user._key,
          auth: {
            checkOrgOwner: checkOrgOwner({ i18n, query, userKey: user._key }),
            userRequired: userRequired({
              i18n,
              userKey: user._key,
              loadUserByKey: loadUserByKey({
                query,
                userKey: user._key,
                i18n,
              }),
            }),
            verifiedRequired: verifiedRequired({ i18n }),
          },
          loaders: {
            loadOrgByKey: loadOrgByKey({
              query,
              language: 'en',
              i18n,
              userKey: user._key,
            }),
          },
          validators: { cleanseInput },
        },
      )
      const testAffiliationCursor =
        await query`FOR aff IN affiliations RETURN aff`
      const testAffiliation = await testAffiliationCursor.next()
      expect(testAffiliation).toEqual(undefined)
    })
    describe('language is set to english', () => {
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
            collections,
            transaction,
            userKey: user._key,
            auth: {
              checkOrgOwner: checkOrgOwner({ i18n, query, userKey: user._key }),
              userRequired: userRequired({
                i18n,
                userKey: user._key,
                loadUserByKey: loadUserByKey({
                  query,
                  userKey: user._key,
                  i18n,
                }),
              }),
              verifiedRequired: verifiedRequired({ i18n }),
            },
            loaders: {
              loadOrgByKey: loadOrgByKey({
                query,
                language: 'en',
                i18n,
                userKey: user._key,
              }),
            },
            validators: { cleanseInput },
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
            collections,
            transaction,
            userKey: user._key,
            auth: {
              checkOrgOwner: checkOrgOwner({ i18n, query, userKey: user._key }),
              userRequired: userRequired({
                i18n,
                userKey: user._key,
                loadUserByKey: loadUserByKey({
                  query,
                  userKey: user._key,
                  i18n,
                }),
              }),
              verifiedRequired: verifiedRequired({ i18n }),
            },
            loaders: {
              loadOrgByKey: loadOrgByKey({
                query,
                language: 'en',
                i18n,
                userKey: user._key,
              }),
            },
            validators: { cleanseInput },
          },
        )

        const expectedResult = {
          data: {
            leaveOrganization: {
              result: {
                status:
                  "L'organisation a été quittée avec succès : treasury-board-secretariat",
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
  describe('language is set to english', () => {
    describe('org cannot be found', () => {
      it('returns an error message', async () => {})
    })
    describe('user is an org owner', () => {
      describe('transaction step error occurs', () => {
        describe('when removing scan data', () => {
          it('throws an error', async () => {})
        })
        describe('when removing domain, affiliation, and org data', () => {
          it('throws an error', async () => {})
        })
      })
    })
    describe('user is not an org owner', () => {
      describe('when removing affiliation information', () => {
        it('throws an error', async () => {})
      })
    })
    describe('transaction commit error occurs', () => {
      it('throws an error', async () => {})
    })
  })
})
