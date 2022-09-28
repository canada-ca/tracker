import { ensure, dbNameFromFile } from 'arango-tools'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'

import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { checkSuperAdmin, userRequired, verifiedRequired } from '../../../auth'
import { loadUserByKey } from '../../../user/loaders'
import {
  loadAllOrganizationDomainStatuses,
} from '../../loaders'
import dbschema from '../../../../database.json'
import { setupI18n } from '@lingui/core'
import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given getAllOrganizationDomainStatuses', () => {
  let query,
    drop,
    truncate,
    schema,
    collections,
    orgOne,
    orgTwo,
    superAdminOrg,
    domainOne,
    domainTwo,
    i18n,
    user

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
      preferredLang: 'english',
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
    orgOne = await collections.organizations.save({
      orgDetails: {
        en: {
          slug: 'definitely-treasury-board-secretariat',
          acronym: 'NTBS',
          name: 'Definitely Treasury Board of Canada Secretariat',
          zone: 'NFED',
          sector: 'NTBS',
          country: 'Canada',
          province: 'Ontario',
          city: 'Ottawa',
        },
        fr: {
          slug: 'definitivement-secretariat-conseil-tresor',
          acronym: 'NPSCT',
          name: 'Définitivement Secrétariat du Conseil du Trésor du Canada',
          zone: 'NPFED',
          sector: 'NPTBS',
          country: 'Canada',
          province: 'Ontario',
          city: 'Ottawa',
        },
      },
    })
    orgTwo = await collections.organizations.save({
      orgDetails: {
        en: {
          slug: 'not-treasury-board-secretariat',
          acronym: 'NTBS',
          name: 'Not Treasury Board of Canada Secretariat',
          zone: 'NFED',
          sector: 'NTBS',
          country: 'Canada',
          province: 'Ontario',
          city: 'Ottawa',
        },
        fr: {
          slug: 'ne-pas-secretariat-conseil-tresor',
          acronym: 'NPSCT',
          name: 'Ne Pas Secrétariat du Conseil Trésor du Canada',
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
        ciphers: 'pass',
        curves: 'pass',
        protocols: 'pass',
        spf: 'pass',
        dkim: 'pass',
        dmarc: 'pass',
      },
    })
    domainTwo = await collections.domains.save({
      domain: 'domain.two',
      status: {
        https: 'pass',
        hsts: 'fail',
        ciphers: 'fail',
        curves: 'pass',
        protocols: 'fail',
        spf: 'pass',
        dkim: 'pass',
        dmarc: 'fail',
      },
    })
    await collections.claims.save({
      _from: orgOne._id,
      _to: domainOne._id,
    })
    await collections.claims.save({
      _from: orgTwo._id,
      _to: domainTwo._id,
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
      it('returns all domain status results', async () => {
        const response = await graphql(
          schema,
          `
            query {
              getAllOrganizationDomainStatuses
            }
          `,
          null,
          {
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
              loginRequiredBool: loginRequiredBool,
            },
            loaders: {
              loadAllOrganizationDomainStatuses:
                loadAllOrganizationDomainStatuses({
                  query,
                  userKey: user._key,
                  i18n,
                }),
            },
          },
        )
        const expectedResponse = {
          data: {
            getAllOrganizationDomainStatuses: `Organization name (English),Nom de l'organisation (Français),Domain,ITPIN,HTTPS,HSTS,Ciphers,Curves,Protocols,SPF,DKIM,DMARC
Definitely Treasury Board of Canada Secretariat,Définitivement Secrétariat du Conseil du Trésor du Canada,domain.one,fail,fail,pass,pass,pass,pass,pass,pass,pass
Not Treasury Board of Canada Secretariat,Ne Pas Secrétariat du Conseil Trésor du Canada,domain.two,fail,pass,fail,fail,pass,fail,pass,pass,fail`,
          },
        }
        expect(response).toEqual(expectedResponse)
        expect(consoleOutput).toEqual([
          `User ${user._key} successfully retrieved all domain statuses.`,
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
        const response = await graphql(
          schema,
          `
            query {
              getAllOrganizationDomainStatuses
            }
          `,
          null,
          {
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
              loginRequiredBool: loginRequiredBool,
            },
            loaders: {
              loadAllOrganizationDomainStatuses:
                loadAllOrganizationDomainStatuses({
                  query,
                  userKey: user._key,
                  i18n,
                }),
            },
          },
        )
        const expectedResponse = {
          data: {
            getAllOrganizationDomainStatuses: `Organization name (English),Nom de l'organisation (Français),Domain,ITPIN,HTTPS,HSTS,Ciphers,Curves,Protocols,SPF,DKIM,DMARC
Definitely Treasury Board of Canada Secretariat,Définitivement Secrétariat du Conseil du Trésor du Canada,domain.one,fail,fail,pass,pass,pass,pass,pass,pass,pass
Not Treasury Board of Canada Secretariat,Ne Pas Secrétariat du Conseil Trésor du Canada,domain.two,fail,pass,fail,fail,pass,fail,pass,pass,fail`,
          },
        }
        expect(response).toEqual(expectedResponse)
        expect(consoleOutput).toEqual([
          `User ${user._key} successfully retrieved all domain statuses.`,
        ])
      })
    })
  })
    describe('login is required', () => {
    beforeEach(async () => {
      loginRequiredBool = true
    })
    describe('the user is not a super admin', () => {
      it('returns a permission error', async () => {
        const response = await graphql(
          schema,
          `
            query {
              getAllOrganizationDomainStatuses
            }
          `,
          null,
          {
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
              loginRequiredBool: loginRequiredBool,
            },
            loaders: {
              loadAllOrganizationDomainStatuses:
                loadAllOrganizationDomainStatuses({
                  query,
                  userKey: user._key,
                  i18n,
                }),
            },
          },
        )
                  const error = [
            new GraphQLError(
              "Permissions error. You do not have sufficient permissions to access this data.",
            ),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to load all organization statuses but login is required and they are not a super admin.`,
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
        const response = await graphql(
          schema,
          `
            query {
              getAllOrganizationDomainStatuses
            }
          `,
          null,
          {
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
              loginRequiredBool: loginRequiredBool,
            },
            loaders: {
              loadAllOrganizationDomainStatuses:
                loadAllOrganizationDomainStatuses({
                  query,
                  userKey: user._key,
                  i18n,
                }),
            },
          },
        )
        const expectedResponse = {
          data: {
            getAllOrganizationDomainStatuses: `Organization name (English),Nom de l'organisation (Français),Domain,ITPIN,HTTPS,HSTS,Ciphers,Curves,Protocols,SPF,DKIM,DMARC
Definitely Treasury Board of Canada Secretariat,Définitivement Secrétariat du Conseil du Trésor du Canada,domain.one,fail,fail,pass,pass,pass,pass,pass,pass,pass
Not Treasury Board of Canada Secretariat,Ne Pas Secrétariat du Conseil Trésor du Canada,domain.two,fail,pass,fail,fail,pass,fail,pass,pass,fail`,
          },
        }
        expect(response).toEqual(expectedResponse)
        expect(consoleOutput).toEqual([
          `User ${user._key} successfully retrieved all domain statuses.`,
        ])
      })
    })
  })
})
