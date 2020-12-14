const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { graphql, GraphQLSchema, GraphQLError } = require('graphql')
const { makeMigrations } = require('../../../../migrations')
const { createQuerySchema } = require('../../../queries')
const { createMutationSchema } = require('../..')
const { toGlobalId } = require('graphql-relay')
const bcrypt = require('bcrypt')
const { setupI18n } = require('@lingui/core')
const englishMessages = require('../../../locale/en/messages')
const frenchMessages = require('../../../locale/fr/messages')

const { cleanseInput } = require('../../../validators')
const { checkPermission, tokenize, userRequired } = require('../../../auth')
const {
  domainLoaderByKey,
  orgLoaderByKey,
  userLoaderByKey,
  userLoaderByUserName,
} = require('../../../loaders')

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('removing a domain', () => {
  let query, drop, truncate, migrate, schema, collections, transaction, i18n

  let consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  const mockedError = (output) => consoleOutput.push(output)

  beforeAll(async () => {
    // Create GQL Schema
    schema = new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createMutationSchema(),
    })
    // Generate DB Items
    ;({ migrate } = await ArangoTools({ rootPass, url }))
    ;({ query, drop, truncate, collections, transaction } = await migrate(
      makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
    ))
  })

  beforeEach(async () => {
    console.info = mockedInfo
    console.warn = mockedWarn
    console.error = mockedError
    await graphql(
      schema,
      `
        mutation {
          signUp(
            input: {
              displayName: "Test Account"
              userName: "test.account@istio.actually.exists"
              password: "testpassword123"
              confirmPassword: "testpassword123"
              preferredLang: FRENCH
            }
          ) {
            authResult {
              user {
                id
              }
            }
          }
        }
      `,
      null,
      {
        query,
        auth: {
          bcrypt,
          tokenize,
        },
        validators: {
          cleanseInput,
        },
        loaders: {
          userLoaderByUserName: userLoaderByUserName(query),
        },
      },
    )
    consoleOutput = []
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
        language: 'en',
        locales: ['en', 'fr'],
        missing: 'Traduction manquante',
        catalogs: {
          en: englishMessages,
          fr: frenchMessages,
        },
      })
    })
    describe('given a successful domain removal', () => {
      describe('users permission is super admin', () => {
        let org, domain, user, secondOrg, superAdminOrg
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

          const userCursor = await query`
          FOR user IN users
            RETURN user
        `
          user = await userCursor.next()
          await collections.affiliations.save({
            _from: superAdminOrg._id,
            _to: user._id,
            permission: 'super_admin',
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
                      orgId: "${toGlobalId('organizations', secondOrg._key)}"
                    }
                  ) {
                    status
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
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    domainLoaderByKey: domainLoaderByKey(query),
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
                  },
                },
              )

              const expectedResponse = {
                data: {
                  removeDomain: {
                    status: `Successfully removed domain: test-gc-ca from communications-security-establishment.`,
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully removed domain: ${domain._key} from org: ${secondOrg._key}.`,
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
                    status
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
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    domainLoaderByKey: domainLoaderByKey(query),
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
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
                    status
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
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    domainLoaderByKey: domainLoaderByKey(query),
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
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
                    status
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
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    domainLoaderByKey: domainLoaderByKey(query),
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
                  },
                },
              )

              const expectedResponse = {
                data: {
                  removeDomain: {
                    status: `Successfully removed domain: test-gc-ca from treasury-board-secretariat.`,
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully removed domain: ${domain._key} from org: ${org._key}.`,
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
                    status
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
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    domainLoaderByKey: domainLoaderByKey(query),
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
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
                    status
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
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    domainLoaderByKey: domainLoaderByKey(query),
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
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
        let org, domain, user, secondOrg
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
                    status
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
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    domainLoaderByKey: domainLoaderByKey(query),
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
                  },
                },
              )

              const expectedResponse = {
                data: {
                  removeDomain: {
                    status: `Successfully removed domain: test-gc-ca from treasury-board-secretariat.`,
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully removed domain: ${domain._key} from org: ${org._key}.`,
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
                    status
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
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    domainLoaderByKey: domainLoaderByKey(query),
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
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
                    status
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
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    domainLoaderByKey: domainLoaderByKey(query),
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
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
                    status
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
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    domainLoaderByKey: domainLoaderByKey(query),
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
                  },
                },
              )

              const expectedResponse = {
                data: {
                  removeDomain: {
                    status: `Successfully removed domain: test-gc-ca from treasury-board-secretariat.`,
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully removed domain: ${domain._key} from org: ${org._key}.`,
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
                    status
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
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    domainLoaderByKey: domainLoaderByKey(query),
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
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
                    status
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
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    domainLoaderByKey: domainLoaderByKey(query),
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
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
      describe('user attempts to remove domain from org', () => {
        let org, domain, user
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
        describe('user is an org user', () => {
          beforeEach(async () => {
            const userCursor = await query`
              FOR user IN users
                RETURN user
            `
            user = await userCursor.next()
            await collections.affiliations.save({
              _from: org._id,
              _to: user._id,
              permission: 'user',
            })
          })
          it('returns an error message', async () => {
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
                  status
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
                    userLoaderByKey: userLoaderByKey(query),
                  }),
                },
                validators: { cleanseInput },
                loaders: {
                  domainLoaderByKey: domainLoaderByKey(query),
                  orgLoaderByKey: orgLoaderByKey(query, 'en'),
                  userLoaderByKey: userLoaderByKey(query),
                },
              },
            )

            const error = [
              new GraphQLError('Unable to remove domain. Please try again.'),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to remove domain: ${domain._key} in org: ${org._key} however they do not have permission in that org.`,
            ])
          })
        })
      })
      describe('domain cannot be found', () => {
        let user
        beforeEach(async () => {
          const userCursor = await query`
            FOR user IN users
              RETURN user
          `
          user = await userCursor.next()
        })
        it('returns an error message', async () => {
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
                status
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
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              validators: { cleanseInput },
              loaders: {
                domainLoaderByKey: domainLoaderByKey(query),
                orgLoaderByKey: orgLoaderByKey(query, 'en'),
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const error = [
            new GraphQLError('Unable to remove domain. Please try again.'),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to remove domain: 1 however no domain is associated with that id.`,
          ])
        })
      })
      describe('org cannot be found', () => {
        let domain, user
        beforeEach(async () => {
          domain = await collections.domains.save({
            domain: 'test.gc.ca',
            slug: 'test-gc-ca',
          })
          const userCursor = await query`
            FOR user IN users
              RETURN user
          `
          user = await userCursor.next()
        })
        it('returns an error message', async () => {
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
                status
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
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              validators: { cleanseInput },
              loaders: {
                domainLoaderByKey: domainLoaderByKey(query),
                orgLoaderByKey: orgLoaderByKey(query, 'en'),
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const error = [
            new GraphQLError('Unable to remove domain. Please try again.'),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to remove domain: ${domain._key} in org: 1 however there is no organization associated with that id.`,
          ])
        })
      })
      describe('user attempts to remove domain from verified org', () => {
        let org, domain, user
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
        describe('user is a super admin', () => {
          beforeEach(async () => {
            const userCursor = await query`
              FOR user IN users
                RETURN user
            `
            user = await userCursor.next()
            await collections.affiliations.save({
              _from: org._id,
              _to: user._id,
              permission: 'super_admin',
            })
          })
          it('returns an error message', async () => {
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
                  status
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
                    userLoaderByKey: userLoaderByKey(query),
                  }),
                },
                validators: { cleanseInput },
                loaders: {
                  domainLoaderByKey: domainLoaderByKey(query),
                  orgLoaderByKey: orgLoaderByKey(query, 'en'),
                  userLoaderByKey: userLoaderByKey(query),
                },
              },
            )

            const error = [
              new GraphQLError(
                'Unable to remove domains belonging to verified organizations.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to remove a domain from an organization: ${org._key} that is verified.`,
            ])
          })
        })
        describe('user is an org admin', () => {
          beforeEach(async () => {
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
          it('returns an error message', async () => {
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
                  status
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
                    userLoaderByKey: userLoaderByKey(query),
                  }),
                },
                validators: { cleanseInput },
                loaders: {
                  domainLoaderByKey: domainLoaderByKey(query),
                  orgLoaderByKey: orgLoaderByKey(query, 'en'),
                  userLoaderByKey: userLoaderByKey(query),
                },
              },
            )

            const error = [
              new GraphQLError(
                'Unable to remove domains belonging to verified organizations.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to remove a domain from an organization: ${org._key} that is verified.`,
            ])
          })
        })
        describe('user is an org user', () => {
          beforeEach(async () => {
            const userCursor = await query`
              FOR user IN users
                RETURN user
            `
            user = await userCursor.next()
            await collections.affiliations.save({
              _from: org._id,
              _to: user._id,
              permission: 'user',
            })
          })
          it('returns an error message', async () => {
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
                  status
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
                    userLoaderByKey: userLoaderByKey(query),
                  }),
                },
                validators: { cleanseInput },
                loaders: {
                  domainLoaderByKey: domainLoaderByKey(query),
                  orgLoaderByKey: orgLoaderByKey(query, 'en'),
                  userLoaderByKey: userLoaderByKey(query),
                },
              },
            )

            const error = [
              new GraphQLError(
                'Unable to remove domains belonging to verified organizations.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to remove a domain from an organization: ${org._key} that is verified.`,
            ])
          })
        })
      })
      describe('database error occurs', () => {
        let org, domain, user
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
            permission: 'super_admin',
          })
        })
        describe('when checking to see if domain belongs to more then one org', () => {
          it('returns an error message', async () => {
            const mockedQuery = jest
              .fn()
              .mockRejectedValue(new Error('Database Error occurred'))

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
                  status
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
                    query,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    userLoaderByKey: userLoaderByKey(query),
                  }),
                },
                validators: { cleanseInput },
                loaders: {
                  domainLoaderByKey: domainLoaderByKey(query),
                  orgLoaderByKey: orgLoaderByKey(query, 'en'),
                  userLoaderByKey: userLoaderByKey(query),
                },
              },
            )

            const error = [
              new GraphQLError('Unable to remove domain. Please try again.'),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Database error occurred for user: ${user._key}, when counting domain claims for domain: ${domain._key}, error: Error: Database Error occurred`,
            ])
          })
        })
      })
      describe('transaction error occurs', () => {
        let org, domain, user
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
            permission: 'super_admin',
          })
        })
        describe('when removing scan data', () => {
          it('returns an error message', async () => {
            const mockedTransaction = jest.fn().mockReturnValue({
              run() {
                throw new Error('Transaction error occurred')
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
                  status
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
                    userLoaderByKey: userLoaderByKey(query),
                  }),
                },
                validators: { cleanseInput },
                loaders: {
                  domainLoaderByKey: domainLoaderByKey(query),
                  orgLoaderByKey: orgLoaderByKey(query, 'en'),
                  userLoaderByKey: userLoaderByKey(query),
                },
              },
            )

            const error = [
              new GraphQLError('Unable to remove domain. Please try again.'),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Transaction run error occurred for user: ${user._key} when removing scan data for domain: ${domain._key}, error: Error: Transaction error occurred`,
            ])
          })
        })
        describe('when removing domain', () => {
          describe('domain belongs only to one org', () => {
            it('returns an error', async () => {
              const run = jest
                .fn()
                .mockReturnValueOnce(undefined)
                .mockReturnValueOnce(undefined)
                .mockReturnValueOnce(undefined)
                .mockReturnValueOnce(undefined)
                .mockReturnValueOnce(undefined)
                .mockRejectedValue(new Error('Transaction error occurred.'))

              const mockedTransaction = jest.fn().mockReturnValue({
                run,
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
                      status
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
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    domainLoaderByKey: domainLoaderByKey(query),
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
                  },
                },
              )

              const error = [
                new GraphQLError('Unable to remove domain. Please try again.'),
              ]

              expect(response.errors).toEqual(error)
              expect(consoleOutput).toEqual([
                `Transaction run error occurred for user: ${user._key} removing domain: ${domain._key} from org: ${org._key}, error: Error: Transaction error occurred.`,
              ])
            })
          })
          describe('domain belongs to multiple orgs', () => {
            let orgTwo
            beforeEach(async () => {
              orgTwo = await collections.organizations.save({
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
              await collections.claims.save({
                _from: orgTwo._id,
                _to: domain._id,
              })
            })
            it('returns an error message', async () => {
              const run = jest
                .fn()
                .mockRejectedValue(new Error('Transaction error occurred.'))

              const mockedTransaction = jest.fn().mockReturnValue({
                run,
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
                      status
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
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    domainLoaderByKey: domainLoaderByKey(query),
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
                  },
                },
              )

              const error = [
                new GraphQLError('Unable to remove domain. Please try again.'),
              ]

              expect(response.errors).toEqual(error)
              expect(consoleOutput).toEqual([
                `Transaction run error occurred for user: ${user._key} removing claim for domain: ${domain._key} in org: ${org._key}, error: Error: Transaction error occurred.`,
              ])
            })
          })
        })
        describe('when committing transaction', () => {
          it('returns an error message', async () => {
            const run = jest.fn().mockReturnValueOnce(undefined)

            const commit = jest
              .fn()
              .mockRejectedValue(new Error('Transaction error occurred.'))

            const mockedTransaction = jest.fn().mockReturnValue({
              run,
              commit,
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
                      status
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
                    userLoaderByKey: userLoaderByKey(query),
                  }),
                },
                validators: { cleanseInput },
                loaders: {
                  domainLoaderByKey: domainLoaderByKey(query),
                  orgLoaderByKey: orgLoaderByKey(query, 'en'),
                  userLoaderByKey: userLoaderByKey(query),
                },
              },
            )

            const error = [
              new GraphQLError('Unable to remove domain. Please try again.'),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Transaction commit error occurred for user: ${user._key} removing domain: ${domain._key} from org: ${org._key}, error: Error: Transaction error occurred.`,
            ])
          })
        })
      })
    })
  })
  describe('users language is set to french', () => {
    beforeAll(() => {
      i18n = setupI18n({
        language: 'fr',
        locales: ['en', 'fr'],
        missing: 'Traduction manquante',
        catalogs: {
          en: englishMessages,
          fr: frenchMessages,
        },
      })
    })
    describe('given a successful domain removal', () => {
      describe('users permission is super admin', () => {
        let org, domain, user, secondOrg, superAdminOrg
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

          const userCursor = await query`
          FOR user IN users
            RETURN user
        `
          user = await userCursor.next()
          await collections.affiliations.save({
            _from: superAdminOrg._id,
            _to: user._id,
            permission: 'super_admin',
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
                      orgId: "${toGlobalId('organizations', secondOrg._key)}"
                    }
                  ) {
                    status
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
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    domainLoaderByKey: domainLoaderByKey(query),
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
                  },
                },
              )

              const expectedResponse = {
                data: {
                  removeDomain: {
                    status: `todo`,
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully removed domain: ${domain._key} from org: ${secondOrg._key}.`,
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
                    status
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
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    domainLoaderByKey: domainLoaderByKey(query),
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
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
                    status
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
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    domainLoaderByKey: domainLoaderByKey(query),
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
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
                    status
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
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    domainLoaderByKey: domainLoaderByKey(query),
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
                  },
                },
              )

              const expectedResponse = {
                data: {
                  removeDomain: {
                    status: `todo`,
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully removed domain: ${domain._key} from org: ${org._key}.`,
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
                    status
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
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    domainLoaderByKey: domainLoaderByKey(query),
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
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
                    status
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
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    domainLoaderByKey: domainLoaderByKey(query),
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
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
        let org, domain, user, secondOrg
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
                    status
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
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    domainLoaderByKey: domainLoaderByKey(query),
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
                  },
                },
              )

              const expectedResponse = {
                data: {
                  removeDomain: {
                    status: `todo`,
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully removed domain: ${domain._key} from org: ${org._key}.`,
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
                    status
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
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    domainLoaderByKey: domainLoaderByKey(query),
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
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
                    status
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
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    domainLoaderByKey: domainLoaderByKey(query),
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
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
                    status
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
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    domainLoaderByKey: domainLoaderByKey(query),
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
                  },
                },
              )

              const expectedResponse = {
                data: {
                  removeDomain: {
                    status: `todo`,
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully removed domain: ${domain._key} from org: ${org._key}.`,
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
                    status
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
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    domainLoaderByKey: domainLoaderByKey(query),
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
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
                    status
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
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    domainLoaderByKey: domainLoaderByKey(query),
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
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
      describe('user attempts to remove domain from org', () => {
        let org, domain, user
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
        describe('user is an org user', () => {
          beforeEach(async () => {
            const userCursor = await query`
              FOR user IN users
                RETURN user
            `
            user = await userCursor.next()
            await collections.affiliations.save({
              _from: org._id,
              _to: user._id,
              permission: 'user',
            })
          })
          it('returns an error message', async () => {
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
                  status
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
                    userLoaderByKey: userLoaderByKey(query),
                  }),
                },
                validators: { cleanseInput },
                loaders: {
                  domainLoaderByKey: domainLoaderByKey(query),
                  orgLoaderByKey: orgLoaderByKey(query, 'en'),
                  userLoaderByKey: userLoaderByKey(query),
                },
              },
            )

            const error = [new GraphQLError('todo')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to remove domain: ${domain._key} in org: ${org._key} however they do not have permission in that org.`,
            ])
          })
        })
      })
      describe('domain cannot be found', () => {
        let user
        beforeEach(async () => {
          const userCursor = await query`
            FOR user IN users
              RETURN user
          `
          user = await userCursor.next()
        })
        it('returns an error message', async () => {
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
                status
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
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              validators: { cleanseInput },
              loaders: {
                domainLoaderByKey: domainLoaderByKey(query),
                orgLoaderByKey: orgLoaderByKey(query, 'en'),
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to remove domain: 1 however no domain is associated with that id.`,
          ])
        })
      })
      describe('org cannot be found', () => {
        let domain, user
        beforeEach(async () => {
          domain = await collections.domains.save({
            domain: 'test.gc.ca',
            slug: 'test-gc-ca',
          })
          const userCursor = await query`
            FOR user IN users
              RETURN user
          `
          user = await userCursor.next()
        })
        it('returns an error message', async () => {
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
                status
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
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              validators: { cleanseInput },
              loaders: {
                domainLoaderByKey: domainLoaderByKey(query),
                orgLoaderByKey: orgLoaderByKey(query, 'en'),
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to remove domain: ${domain._key} in org: 1 however there is no organization associated with that id.`,
          ])
        })
      })
      describe('user attempts to remove domain from verified org', () => {
        let org, domain, user
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
        describe('user is a super admin', () => {
          beforeEach(async () => {
            const userCursor = await query`
              FOR user IN users
                RETURN user
            `
            user = await userCursor.next()
            await collections.affiliations.save({
              _from: org._id,
              _to: user._id,
              permission: 'super_admin',
            })
          })
          it('returns an error message', async () => {
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
                  status
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
                    userLoaderByKey: userLoaderByKey(query),
                  }),
                },
                validators: { cleanseInput },
                loaders: {
                  domainLoaderByKey: domainLoaderByKey(query),
                  orgLoaderByKey: orgLoaderByKey(query, 'en'),
                  userLoaderByKey: userLoaderByKey(query),
                },
              },
            )

            const error = [new GraphQLError('todo')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to remove a domain from an organization: ${org._key} that is verified.`,
            ])
          })
        })
        describe('user is an org admin', () => {
          beforeEach(async () => {
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
          it('returns an error message', async () => {
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
                  status
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
                    userLoaderByKey: userLoaderByKey(query),
                  }),
                },
                validators: { cleanseInput },
                loaders: {
                  domainLoaderByKey: domainLoaderByKey(query),
                  orgLoaderByKey: orgLoaderByKey(query, 'en'),
                  userLoaderByKey: userLoaderByKey(query),
                },
              },
            )

            const error = [new GraphQLError('todo')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to remove a domain from an organization: ${org._key} that is verified.`,
            ])
          })
        })
        describe('user is an org user', () => {
          beforeEach(async () => {
            const userCursor = await query`
              FOR user IN users
                RETURN user
            `
            user = await userCursor.next()
            await collections.affiliations.save({
              _from: org._id,
              _to: user._id,
              permission: 'user',
            })
          })
          it('returns an error message', async () => {
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
                  status
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
                    userLoaderByKey: userLoaderByKey(query),
                  }),
                },
                validators: { cleanseInput },
                loaders: {
                  domainLoaderByKey: domainLoaderByKey(query),
                  orgLoaderByKey: orgLoaderByKey(query, 'en'),
                  userLoaderByKey: userLoaderByKey(query),
                },
              },
            )

            const error = [new GraphQLError('todo')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to remove a domain from an organization: ${org._key} that is verified.`,
            ])
          })
        })
      })
      describe('database error occurs', () => {
        let org, domain, user
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
            permission: 'super_admin',
          })
        })
        describe('when checking to see if domain belongs to more then one org', () => {
          it('returns an error message', async () => {
            const mockedQuery = jest
              .fn()
              .mockRejectedValue(new Error('Database Error occurred'))

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
                  status
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
                    query,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    userLoaderByKey: userLoaderByKey(query),
                  }),
                },
                validators: { cleanseInput },
                loaders: {
                  domainLoaderByKey: domainLoaderByKey(query),
                  orgLoaderByKey: orgLoaderByKey(query, 'en'),
                  userLoaderByKey: userLoaderByKey(query),
                },
              },
            )

            const error = [new GraphQLError('todo')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Database error occurred for user: ${user._key}, when counting domain claims for domain: ${domain._key}, error: Error: Database Error occurred`,
            ])
          })
        })
      })
      describe('transaction error occurs', () => {
        let org, domain, user
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
            permission: 'super_admin',
          })
        })
        describe('when removing scan data', () => {
          it('returns an error message', async () => {
            const mockedTransaction = jest.fn().mockReturnValue({
              run() {
                throw new Error('Transaction error occurred')
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
                  status
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
                    userLoaderByKey: userLoaderByKey(query),
                  }),
                },
                validators: { cleanseInput },
                loaders: {
                  domainLoaderByKey: domainLoaderByKey(query),
                  orgLoaderByKey: orgLoaderByKey(query, 'en'),
                  userLoaderByKey: userLoaderByKey(query),
                },
              },
            )

            const error = [new GraphQLError('todo')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Transaction run error occurred for user: ${user._key} when removing scan data for domain: ${domain._key}, error: Error: Transaction error occurred`,
            ])
          })
        })
        describe('when removing domain', () => {
          describe('domain belongs only to one org', () => {
            it('returns an error', async () => {
              const run = jest
                .fn()
                .mockReturnValueOnce(undefined)
                .mockReturnValueOnce(undefined)
                .mockReturnValueOnce(undefined)
                .mockReturnValueOnce(undefined)
                .mockReturnValueOnce(undefined)
                .mockRejectedValue(new Error('Transaction error occurred.'))

              const mockedTransaction = jest.fn().mockReturnValue({
                run,
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
                      status
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
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    domainLoaderByKey: domainLoaderByKey(query),
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
                  },
                },
              )

              const error = [new GraphQLError('todo')]

              expect(response.errors).toEqual(error)
              expect(consoleOutput).toEqual([
                `Transaction run error occurred for user: ${user._key} removing domain: ${domain._key} from org: ${org._key}, error: Error: Transaction error occurred.`,
              ])
            })
          })
          describe('domain belongs to multiple orgs', () => {
            let orgTwo
            beforeEach(async () => {
              orgTwo = await collections.organizations.save({
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
              await collections.claims.save({
                _from: orgTwo._id,
                _to: domain._id,
              })
            })
            it('returns an error message', async () => {
              const run = jest
                .fn()
                .mockRejectedValue(new Error('Transaction error occurred.'))

              const mockedTransaction = jest.fn().mockReturnValue({
                run,
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
                      status
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
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    domainLoaderByKey: domainLoaderByKey(query),
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
                  },
                },
              )

              const error = [new GraphQLError('todo')]

              expect(response.errors).toEqual(error)
              expect(consoleOutput).toEqual([
                `Transaction run error occurred for user: ${user._key} removing claim for domain: ${domain._key} in org: ${org._key}, error: Error: Transaction error occurred.`,
              ])
            })
          })
        })
        describe('when committing transaction', () => {
          it('returns an error message', async () => {
            const run = jest.fn().mockReturnValueOnce(undefined)

            const commit = jest
              .fn()
              .mockRejectedValue(new Error('Transaction error occurred.'))

            const mockedTransaction = jest.fn().mockReturnValue({
              run,
              commit,
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
                      status
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
                    userLoaderByKey: userLoaderByKey(query),
                  }),
                },
                validators: { cleanseInput },
                loaders: {
                  domainLoaderByKey: domainLoaderByKey(query),
                  orgLoaderByKey: orgLoaderByKey(query, 'en'),
                  userLoaderByKey: userLoaderByKey(query),
                },
              },
            )

            const error = [new GraphQLError('todo')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Transaction commit error occurred for user: ${user._key} removing domain: ${domain._key} from org: ${org._key}, error: Error: Transaction error occurred.`,
            ])
          })
        })
      })
    })
  })
})
