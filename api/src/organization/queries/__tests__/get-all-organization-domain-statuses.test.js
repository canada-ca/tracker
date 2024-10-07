import { dbNameFromFile } from 'arango-tools'
import { ensureDatabase as ensure } from '../../../testUtilities'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'

import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { checkSuperAdmin, superAdminRequired, userRequired, verifiedRequired } from '../../../auth'
import { loadUserByKey } from '../../../user/loaders'
import { loadAllOrganizationDomainStatuses } from '../../loaders'
import dbschema from '../../../../database.json'
import { setupI18n } from '@lingui/core'
import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given getAllOrganizationDomainStatuses', () => {
  // eslint-disable-next-line no-unused-vars
  let query, drop, truncate, schema, collections, superAdminOrg, domainOne, domainTwo, i18n, user, orgOne

  const consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  const mockedError = (output) => consoleOutput.push(output)
  beforeAll(async () => {
    // Create GQL Schema
    schema = new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createMutationSchema(),
    })
  })
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
  beforeAll(async () => {
    // Generate DB Items
    ;({ query, drop, truncate, collections } = await ensure({
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
    console.info = mockedInfo
    console.warn = mockedWarn
    console.error = mockedError
    consoleOutput.length = 0
  })
  beforeEach(async () => {
    user = await collections.users.save({
      displayName: 'Test Account',
      userName: 'test.account@istio.actually.exists',
      emailValidated: true,
    })
    superAdminOrg = await collections.organizations.save({
      orgDetails: {
        en: {
          slug: 'super-admin',
          acronym: 'SA',
          name: 'Super Admin',
          zone: 'NFED',
          sector: 'NTBS',
          country: 'Canada',
          province: 'Ontario',
          city: 'Ottawa',
        },
        fr: {
          slug: 'super-admin',
          acronym: 'SA',
          name: 'Super Admin',
          zone: 'NPFED',
          sector: 'NPTBS',
          country: 'Canada',
          province: 'Ontario',
          city: 'Ottawa',
        },
      },
    })

    domainOne = await collections.domains.save({
      domain: 'domain.one',
      status: {
        https: 'fail',
        hsts: 'pass',
        certificates: 'pass',
        ciphers: 'pass',
        curves: 'pass',
        protocols: 'pass',
        spf: 'pass',
        dkim: 'pass',
        dmarc: 'pass',
      },
      rcode: 'NOERROR',
      blocked: false,
      wildcardSibling: false,
      hasEntrustCertificate: false,
      cveDetected: false,
    })
    domainTwo = await collections.domains.save({
      domain: 'domain.two',
      status: {
        https: 'pass',
        hsts: 'fail',
        certificates: 'pass',
        ciphers: 'fail',
        curves: 'pass',
        protocols: 'fail',
        spf: 'pass',
        dkim: 'pass',
        dmarc: 'fail',
      },
      rcode: 'NOERROR',
      blocked: false,
      wildcardSibling: false,
      hasEntrustCertificate: false,
      cveDetected: false,
    })

    orgOne = await collections.organizations.save({
      orgDetails: {
        en: {
          name: 'Org One',
          acronym: 'OO',
        },
      },
      verified: true,
    })

    await collections.claims.save({
      _to: domainOne._id,
      _from: orgOne._id,
    })
    await collections.claims.save({
      _to: domainTwo._id,
      _from: orgOne._id,
    })
  })
  afterEach(async () => {
    await truncate()
  })
  afterAll(async () => {
    await drop()
  })
  let loginRequiredBool
  describe('login is not required', () => {
    beforeEach(async () => {
      loginRequiredBool = false
    })
    describe('the user is not a super admin', () => {
      it('returns a permission error', async () => {
        const response = await graphql({
          schema,
          source: `
            query {
              getAllOrganizationDomainStatuses(filters: [])
            }
          `,
          rootValue: null,
          contextValue: {
            i18n,
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
              verifiedRequired: verifiedRequired({}),
              superAdminRequired: superAdminRequired({ i18n }),
              loginRequiredBool: loginRequiredBool,
            },
            loaders: {
              loadAllOrganizationDomainStatuses: loadAllOrganizationDomainStatuses({
                query,
                userKey: user._key,
                i18n,
              }),
            },
          },
        })
        const error = [
          new GraphQLError('Permissions error. You do not have sufficient permissions to access this data.'),
        ]
        expect(response.errors).toEqual(error)
        expect(consoleOutput).toEqual([
          `User: ${user._key} attempted to access controlled functionality without sufficient privileges.`,
        ])
      })
    })
    describe('the user is a super admin', () => {
      beforeEach(async () => {
        await collections.affiliations.save({
          _from: superAdminOrg._id,
          _to: user._id,
          permission: 'super_admin',
        })
      })

      it('returns all domain status results', async () => {
        const response = await graphql({
          schema,
          source: `
            query {
              getAllOrganizationDomainStatuses(filters: [])
            }
          `,
          rootValue: null,
          contextValue: {
            i18n,
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
              verifiedRequired: verifiedRequired({}),
              superAdminRequired: superAdminRequired({ i18n }),
              loginRequiredBool: loginRequiredBool,
            },
            loaders: {
              loadAllOrganizationDomainStatuses: loadAllOrganizationDomainStatuses({
                query,
                userKey: user._key,
                i18n,
                language: 'en',
              }),
            },
          },
        })

        const expectedResponse = {
          data: {
            getAllOrganizationDomainStatuses: `domain,orgName,orgAcronym,ipAddresses,https,hsts,certificates,ciphers,curves,protocols,spf,dkim,dmarc,rcode,blocked,wildcardSibling,hasEntrustCertificate,top25Vulnerabilities
"domain.one","Org One","OO",,"fail","pass","pass","pass","pass","pass","pass","pass","pass","NOERROR","false","false","false",
"domain.two","Org One","OO",,"pass","fail","pass","fail","pass","fail","pass","pass","fail","NOERROR","false","false","false",`,
          },
        }

        expect(response).toEqual(expectedResponse)
        expect(consoleOutput).toEqual([`User ${user._key} successfully retrieved all domain statuses.`])
      })
    })
  })
  describe('login is required', () => {
    beforeEach(async () => {
      loginRequiredBool = true
    })
    describe('the user is not a super admin', () => {
      it('returns a permission error', async () => {
        const response = await graphql({
          schema,
          source: `
            query {
              getAllOrganizationDomainStatuses(filters: [])
            }
          `,
          rootValue: null,
          contextValue: {
            i18n,
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
              verifiedRequired: verifiedRequired({}),
              superAdminRequired: superAdminRequired({ i18n }),
              loginRequiredBool: loginRequiredBool,
            },
            loaders: {
              loadAllOrganizationDomainStatuses: loadAllOrganizationDomainStatuses({
                query,
                userKey: user._key,
                i18n,
              }),
            },
          },
        })
        const error = [
          new GraphQLError('Permissions error. You do not have sufficient permissions to access this data.'),
        ]

        expect(response.errors).toEqual(error)
        expect(consoleOutput).toEqual([
          `User: ${user._key} attempted to access controlled functionality without sufficient privileges.`,
        ])
      })
    })
    describe('the user is a super admin', () => {
      beforeEach(async () => {
        await collections.affiliations.save({
          _from: superAdminOrg._id,
          _to: user._id,
          permission: 'super_admin',
        })
      })

      it('returns all domain status results', async () => {
        const response = await graphql({
          schema,
          source: `
            query {
              getAllOrganizationDomainStatuses(filters: [])
            }
          `,
          rootValue: null,
          contextValue: {
            i18n,
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
              verifiedRequired: verifiedRequired({}),
              superAdminRequired: superAdminRequired({ i18n }),
              loginRequiredBool: loginRequiredBool,
            },
            loaders: {
              loadAllOrganizationDomainStatuses: loadAllOrganizationDomainStatuses({
                query,
                userKey: user._key,
                i18n,
                language: 'en',
              }),
            },
          },
        })
        const expectedResponse = {
          data: {
            getAllOrganizationDomainStatuses: `domain,orgName,orgAcronym,ipAddresses,https,hsts,certificates,ciphers,curves,protocols,spf,dkim,dmarc,rcode,blocked,wildcardSibling,hasEntrustCertificate,top25Vulnerabilities
"domain.one","Org One","OO",,"fail","pass","pass","pass","pass","pass","pass","pass","pass","NOERROR","false","false","false",
"domain.two","Org One","OO",,"pass","fail","pass","fail","pass","fail","pass","pass","fail","NOERROR","false","false","false",`,
          },
        }
        expect(response).toEqual(expectedResponse)
        expect(consoleOutput).toEqual([`User ${user._key} successfully retrieved all domain statuses.`])
      })
    })
  })
})
