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
import { loadUserByKey } from '../../../user/loaders'
import { loadOrgByKey } from '../../loaders'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('removing an organization', () => {
  let query, drop, truncate, schema, collections, transaction, user

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
  describe('given a successful org removal', () => {
    let org, domain, i18n
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
      describe('super admin can remove any org', () => {
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'super_admin',
          })
        })
        describe('org is a verified check', () => {
          beforeEach(async () => {
            await query`
              UPSERT { _key: ${org._key} }
                INSERT { verified: true }
                UPDATE { verified: true }
                IN organizations
            `
          })
          it('returns status message', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organizations', org._key)}"
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
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            )

            const expectedResponse = {
              data: {
                removeOrganization: {
                  result: {
                    status:
                      'Successfully removed organization: treasury-board-secretariat.',
                    organization: {
                      name: 'Treasury Board of Canada Secretariat',
                    },
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: ${user._key} successfully removed org: ${org._key}.`,
            ])
          })
          it('removes all data from db', async () => {
            await graphql(
              schema,
              `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organizations', org._key)}"
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
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            )

            const testOrgCursor =
              await query`FOR org IN organizations RETURN org`
            const testOrg = await testOrgCursor.next()
            expect(testOrg).toEqual(undefined)

            const testDomainCursor =
              await query`FOR domain IN domains RETURN domain`
            const testDomain = await testDomainCursor.next()
            expect(testDomain).toEqual(undefined)

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
        })
        describe('org is just a regular org', () => {
          it('returns status message', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organizations', org._key)}"
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
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            )

            const expectedResponse = {
              data: {
                removeOrganization: {
                  result: {
                    status:
                      'Successfully removed organization: treasury-board-secretariat.',
                    organization: {
                      name: 'Treasury Board of Canada Secretariat',
                    },
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: ${user._key} successfully removed org: ${org._key}.`,
            ])
          })
          it('removes all data from db', async () => {
            await graphql(
              schema,
              `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organizations', org._key)}"
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
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            )

            const testOrgCursor =
              await query`FOR org IN organizations RETURN org`
            const testOrg = await testOrgCursor.next()
            expect(testOrg).toEqual(undefined)

            const testDomainCursor =
              await query`FOR domain IN domains RETURN domain`
            const testDomain = await testDomainCursor.next()
            expect(testDomain).toEqual(undefined)

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
        })
      })
      describe('admin can remove a regular org', () => {
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'admin',
          })
        })
        it('returns status message', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                removeOrganization(
                  input: {
                    orgId: "${toGlobalId('organizations', org._key)}"
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
                verifiedRequired: verifiedRequired({}),
              },
              validators: { cleanseInput },
              loaders: {
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const expectedResponse = {
            data: {
              removeOrganization: {
                result: {
                  status:
                    'Successfully removed organization: treasury-board-secretariat.',
                  organization: {
                    name: 'Treasury Board of Canada Secretariat',
                  },
                },
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully removed org: ${org._key}.`,
          ])
        })
        it('removes all data from db', async () => {
          await graphql(
            schema,
            `
              mutation {
                removeOrganization(
                  input: {
                    orgId: "${toGlobalId('organizations', org._key)}"
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
                verifiedRequired: verifiedRequired({}),
              },
              validators: { cleanseInput },
              loaders: {
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const testOrgCursor = await query`FOR org IN organizations RETURN org`
          const testOrg = await testOrgCursor.next()
          expect(testOrg).toEqual(undefined)

          const testDomainCursor =
            await query`FOR domain IN domains RETURN domain`
          const testDomain = await testDomainCursor.next()
          expect(testDomain).toEqual(undefined)

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
      describe('super admin can remove any org', () => {
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'super_admin',
          })
        })
        describe('org is a verified check', () => {
          beforeEach(async () => {
            await query`
              UPSERT { _key: ${org._key} }
                INSERT { verified: true }
                UPDATE { verified: true }
                IN organizations
            `
          })
          it('returns status message', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organizations', org._key)}"
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
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'fr' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            )

            const expectedResponse = {
              data: {
                removeOrganization: {
                  result: {
                    status: 'todo',
                    organization: {
                      name: 'Secrétariat du Conseil Trésor du Canada',
                    },
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: ${user._key} successfully removed org: ${org._key}.`,
            ])
          })
          it('removes all data from db', async () => {
            await graphql(
              schema,
              `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organizations', org._key)}"
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
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'fr' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            )

            const testOrgCursor =
              await query`FOR org IN organizations RETURN org`
            const testOrg = await testOrgCursor.next()
            expect(testOrg).toEqual(undefined)

            const testDomainCursor =
              await query`FOR domain IN domains RETURN domain`
            const testDomain = await testDomainCursor.next()
            expect(testDomain).toEqual(undefined)

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
        })
        describe('org is just a regular org', () => {
          it('returns status message', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organizations', org._key)}"
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
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'fr' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            )

            const expectedResponse = {
              data: {
                removeOrganization: {
                  result: {
                    status: 'todo',
                    organization: {
                      name: 'Secrétariat du Conseil Trésor du Canada',
                    },
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: ${user._key} successfully removed org: ${org._key}.`,
            ])
          })
          it('removes all data from db', async () => {
            await graphql(
              schema,
              `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organizations', org._key)}"
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
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'fr' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            )

            const testOrgCursor =
              await query`FOR org IN organizations RETURN org`
            const testOrg = await testOrgCursor.next()
            expect(testOrg).toEqual(undefined)

            const testDomainCursor =
              await query`FOR domain IN domains RETURN domain`
            const testDomain = await testDomainCursor.next()
            expect(testDomain).toEqual(undefined)

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
        })
      })
      describe('admin can remove a regular org', () => {
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'admin',
          })
        })
        it('returns status message', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                removeOrganization(
                  input: {
                    orgId: "${toGlobalId('organizations', org._key)}"
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
                verifiedRequired: verifiedRequired({}),
              },
              validators: { cleanseInput },
              loaders: {
                loadOrgByKey: loadOrgByKey({ query, language: 'fr' }),
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const expectedResponse = {
            data: {
              removeOrganization: {
                result: {
                  status: 'todo',
                  organization: {
                    name: 'Secrétariat du Conseil Trésor du Canada',
                  },
                },
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully removed org: ${org._key}.`,
          ])
        })
        it('removes all data from db', async () => {
          await graphql(
            schema,
            `
              mutation {
                removeOrganization(
                  input: {
                    orgId: "${toGlobalId('organizations', org._key)}"
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
                verifiedRequired: verifiedRequired({}),
              },
              validators: { cleanseInput },
              loaders: {
                loadOrgByKey: loadOrgByKey({ query, language: 'fr' }),
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const testOrgCursor = await query`FOR org IN organizations RETURN org`
          const testOrg = await testOrgCursor.next()
          expect(testOrg).toEqual(undefined)

          const testDomainCursor =
            await query`FOR domain IN domains RETURN domain`
          const testDomain = await testDomainCursor.next()
          expect(testDomain).toEqual(undefined)

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
      })
    })
  })
  describe('given an unsuccessful org removal', () => {
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
      describe('organization does not exist', () => {
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                removeOrganization(
                  input: {
                    orgId: "${toGlobalId('organizations', 1)}"
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
                verifiedRequired: verifiedRequired({}),
              },
              validators: { cleanseInput },
              loaders: {
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const error = {
            data: {
              removeOrganization: {
                result: {
                  code: 400,
                  description: 'Unable to remove unknown organization.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to remove org: 1, but there is no org associated with that id.`,
          ])
        })
      })
      describe('user does not have permission', () => {
        let org, secondOrg
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
        })
        describe('org to be removed is verified check', () => {
          beforeEach(async () => {
            await collections.affiliations.save({
              _from: org._id,
              _to: user._id,
              permission: 'admin',
            })
          })
          it('returns an error message', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organizations', org._key)}"
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
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            )

            const error = {
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

            expect(response).toEqual(error)
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to remove ${org._key}, however the user is not a super admin.`,
            ])
          })
        })
        describe('user is an admin in a different organization', () => {
          beforeEach(async () => {
            await collections.affiliations.save({
              _from: org._id,
              _to: user._id,
              permission: 'admin',
            })
          })
          it('returns an error message', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organizations', secondOrg._key)}"
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
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            )

            const error = {
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

            expect(response).toEqual(error)
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to remove ${secondOrg._key}, however the user does not have permission to this organization.`,
            ])
          })
        })
      })
      describe('transaction error occurs', () => {
        let org
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
            permission: 'super_admin',
          })
        })
        describe('when running scan transactions', () => {
          it('returns an error message', async () => {
            const mockedTransaction = jest.fn().mockReturnValue({
              step() {
                throw new Error('Database error occurred.')
              },
            })

            const response = await graphql(
              schema,
              `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organizations', org._key)}"
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
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            )

            const error = [
              new GraphQLError(
                'Unable to remove organization. Please try again.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Transaction error occurred while attempting to remove scan results for org: ${org._key}, error: Error: Database error occurred.`,
            ])
          })
        })
        describe('when running domain, affiliations, org transactions', () => {
          it('returns an error message', async () => {
            const mockedQuery = jest
              .fn()
              .mockReturnValueOnce(undefined)
              .mockReturnValueOnce(undefined)
              .mockReturnValueOnce(undefined)
              .mockReturnValueOnce(undefined)
              .mockReturnValueOnce(undefined)
              .mockRejectedValue(new Error('Database error occurred.'))

            const response = await graphql(
              schema,
              `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organizations', org._key)}"
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
                    query: query,
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
            )

            const error = [
              new GraphQLError(
                'Unable to remove organization. Please try again.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Transaction error occurred while attempting to remove domain, affiliations, and the org for org: ${org._key}, error: Error: Database error occurred.`,
            ])
          })
        })
        describe('when committing transaction', () => {
          it('returns an error message', async () => {
            const mockedTransaction = jest.fn().mockReturnValue({
              step() {
                return undefined
              },
              commit() {
                throw new Error('Database error occurred.')
              },
            })

            const response = await graphql(
              schema,
              `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organizations', org._key)}"
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
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            )

            const error = [
              new GraphQLError(
                'Unable to remove organization. Please try again.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Transaction error occurred while attempting to commit removal of org: ${org._key}, error: Error: Database error occurred.`,
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
      describe('organization does not exist', () => {
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                removeOrganization(
                  input: {
                    orgId: "${toGlobalId('organizations', 1)}"
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
                verifiedRequired: verifiedRequired({}),
              },
              validators: { cleanseInput },
              loaders: {
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const error = {
            data: {
              removeOrganization: {
                result: {
                  code: 400,
                  description: 'todo',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to remove org: 1, but there is no org associated with that id.`,
          ])
        })
      })
      describe('user does not have permission', () => {
        let org, secondOrg
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
        })
        describe('org to be removed is verified check', () => {
          beforeEach(async () => {
            await collections.affiliations.save({
              _from: org._id,
              _to: user._id,
              permission: 'admin',
            })
          })
          it('returns an error message', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organizations', org._key)}"
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
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            )

            const error = {
              data: {
                removeOrganization: {
                  result: {
                    code: 403,
                    description: 'todo',
                  },
                },
              },
            }

            expect(response).toEqual(error)
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to remove ${org._key}, however the user is not a super admin.`,
            ])
          })
        })
        describe('user is an admin in a different organization', () => {
          beforeEach(async () => {
            await collections.affiliations.save({
              _from: org._id,
              _to: user._id,
              permission: 'admin',
            })
          })
          it('returns an error message', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organizations', secondOrg._key)}"
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
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            )

            const error = {
              data: {
                removeOrganization: {
                  result: {
                    code: 403,
                    description: 'todo',
                  },
                },
              },
            }

            expect(response).toEqual(error)
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to remove ${secondOrg._key}, however the user does not have permission to this organization.`,
            ])
          })
        })
      })
      describe('transaction error occurs', () => {
        let org
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
            permission: 'super_admin',
          })
        })
        describe('when running scan transactions', () => {
          it('returns an error message', async () => {
            const mockedTransaction = jest.fn().mockReturnValue({
              step() {
                throw new Error('Database error occurred.')
              },
            })

            const response = await graphql(
              schema,
              `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organizations', org._key)}"
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
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            )

            const error = [new GraphQLError('todo')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Transaction error occurred while attempting to remove scan results for org: ${org._key}, error: Error: Database error occurred.`,
            ])
          })
        })
        describe('when running domain, affiliations, org transactions', () => {
          it('returns an error message', async () => {
            const mockedQuery = jest
              .fn()
              .mockReturnValueOnce(undefined)
              .mockReturnValueOnce(undefined)
              .mockReturnValueOnce(undefined)
              .mockReturnValueOnce(undefined)
              .mockReturnValueOnce(undefined)
              .mockRejectedValue(new Error('Database error occurred.'))

            const response = await graphql(
              schema,
              `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organizations', org._key)}"
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
                    query: query,
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
            )

            const error = [new GraphQLError('todo')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Transaction error occurred while attempting to remove domain, affiliations, and the org for org: ${org._key}, error: Error: Database error occurred.`,
            ])
          })
        })
        describe('when committing transaction', () => {
          it('returns an error message', async () => {
            const mockedTransaction = jest.fn().mockReturnValue({
              step() {
                return undefined
              },
              commit() {
                throw new Error('Database error occurred.')
              },
            })

            const response = await graphql(
              schema,
              `
                mutation {
                  removeOrganization(
                    input: {
                      orgId: "${toGlobalId('organizations', org._key)}"
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
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            )

            const error = [new GraphQLError('todo')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Transaction error occurred while attempting to commit removal of org: ${org._key}, error: Error: Database error occurred.`,
            ])
          })
        })
      })
    })
  })
})
