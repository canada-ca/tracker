import { dbNameFromFile } from 'arango-tools'
import { ensureDatabase as ensure } from '../../testUtilities'
import { setupI18n } from '@lingui/core'

import { checkDomainOwnership } from '../index'
import englishMessages from '../../locale/en/messages'
import frenchMessages from '../../locale/fr/messages'
import dbschema from '../../../database.json'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the check domain ownership function', () => {
  let query, drop, truncate, collections, org, verifiedOrg, unverifiedOrg, domain, i18n, user
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
  const consoleOutput = []
  const mockedError = (output) => consoleOutput.push(output)

  beforeAll(() => {
    console.error = mockedError
  })
  afterEach(() => {
    consoleOutput.length = 0
  })

  beforeAll(async () => {
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
    user = await collections.users.save({
      userName: 'test.account@istio.actually.exists',
      displayName: 'Test Account',
      tfaValidated: false,
      emailValidated: false,
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
      verified: true,
    })
    verifiedOrg = await collections.organizations.save({
      orgDetails: {
        en: {
          slug: 'other-org',
          acronym: 'OO',
          name: 'Other Org',
          zone: 'FED',
          sector: 'TBS',
          country: 'Canada',
          province: 'Ontario',
          city: 'Ottawa',
        },
        fr: {
          slug: 'autre-org',
          acronym: 'AO',
          name: 'Autre Org',
          zone: 'FED',
          sector: 'TBS',
          country: 'Canada',
          province: 'Ontario',
          city: 'Ottawa',
        },
      },
      verified: true,
    })
    unverifiedOrg = await collections.organizations.save({
      orgDetails: {
        en: {
          slug: 'unverified-org',
          acronym: 'UO',
          name: 'Unverified Org',
          zone: 'FED',
          sector: 'TBS',
          country: 'Canada',
          province: 'Ontario',
          city: 'Ottawa',
        },
        fr: {
          slug: 'unverified-org',
          acronym: 'UO',
          name: 'Unverified Org',
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
      lastRan: null,
      selectors: ['selector1', 'selector2'],
    })
    await collections.ownership.save({
      _to: domain._id,
      _from: org._id,
    })
  })
  afterEach(async () => {
    await truncate()
  })
  afterAll(async () => {
    await drop()
  })

  describe('given a successful domain ownership call', () => {
    let permitted
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

    describe('if the user belongs to an org which is verified and the org in question is also verified', () => {
      beforeEach(async () => {
        await collections.affiliations.save({
          _from: verifiedOrg._id,
          _to: user._id,
          permission: 'user',
        })
      })
      it('will return true', async () => {
        const testCheckDomainOwnerShip = checkDomainOwnership({
          i18n,
          query,
          userKey: user._key,
        })
        permitted = await testCheckDomainOwnerShip({
          domainId: domain._id,
        })
        expect(permitted).toEqual(true)
      })
    })

    describe('if the user belongs to an org which has a ownership for a given organization', () => {
      afterEach(async () => {
        await query`
          LET userEdges = (FOR v, e IN 1..1 ANY ${org._id} affiliations RETURN { edgeKey: e._key, userKey: e._to })
          LET removeUserEdges = (FOR userEdge IN userEdges REMOVE userEdge.edgeKey IN affiliations)
          RETURN true
        `
        await query`
          FOR affiliation IN affiliations
            REMOVE affiliation IN affiliations
        `
      })
      describe('if the user has super-admin-level permissions', () => {
        describe('domain has dmarc reports', () => {
          beforeEach(async () => {
            await collections.affiliations.save({
              _from: org._id,
              _to: user._id,
              permission: 'super_admin',
            })
          })
          it('will return true', async () => {
            const testCheckDomainOwnerShip = checkDomainOwnership({
              query,
              userKey: user._key,
              auth: { loginRequiredBool: true },
            })
            permitted = await testCheckDomainOwnerShip({
              domainId: domain._id,
            })
            expect(permitted).toEqual(true)
          })
        })
      })
      describe('if the user has admin-level permissions', () => {
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'admin',
          })
        })
        it('will return true', async () => {
          const testCheckDomainOwnerShip = checkDomainOwnership({
            i18n,
            query,
            userKey: user._key,
            auth: { loginRequiredBool: true },
          })
          permitted = await testCheckDomainOwnerShip({
            domainId: domain._id,
          })
          expect(permitted).toEqual(true)
        })
      })
      describe('if the user has user-level permissions', () => {
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'user',
          })
        })
        it('will return true', async () => {
          const testCheckDomainOwnerShip = checkDomainOwnership({
            query,
            userKey: user._key,
            auth: { loginRequiredBool: true },
          })
          permitted = await testCheckDomainOwnerShip({
            domainId: domain._id,
          })
          expect(permitted).toEqual(true)
        })
      })
    })
  })
  describe('given an unsuccessful domain ownership call', () => {
    describe('user is a super admin, but domain does not have any dmarc reports', () => {
      describe('domain does not have dmarc reports', () => {
        it('will return false', async () => {
          const testCheckDomainOwnerShip = checkDomainOwnership({
            query: jest.fn().mockReturnValue({
              next: jest.fn().mockReturnValue({ superAdmin: true, domainOwnership: false }),
            }),
            userKey: 123,
            auth: { loginRequiredBool: true },
          })
          const permitted = await testCheckDomainOwnerShip({
            domainId: 'domains/123',
          })
          expect(permitted).toEqual(false)
        })
      })
    })
    describe('if the user does not belong to an org which has a ownership for a given domain', () => {
      let permitted
      beforeEach(async () => {
        await collections.affiliations.save({
          _from: unverifiedOrg._id,
          _to: user._id,
          permission: 'user',
        })
      })
      it('will return false', async () => {
        const testCheckDomainOwnerShip = checkDomainOwnership({
          i18n: i18n,
          query: query,
          userKey: '123',
        })
        permitted = await testCheckDomainOwnerShip({
          domainId: 'domains/123',
        })
        expect(permitted).toEqual(false)
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
      describe('if a cursor error is encountered during super admin ownership check', () => {
        let mockQuery
        it('returns an appropriate error message', async () => {
          const firstCursor = {
            next: jest.fn().mockRejectedValue(new Error('Cursor error occurred.')),
          }
          mockQuery = jest.fn().mockReturnValueOnce(firstCursor)
          try {
            const testCheckDomainOwnerShip = checkDomainOwnership({
              i18n,
              auth: { loginRequired: true },
              query: mockQuery,
              userKey: user._key,
            })
            await testCheckDomainOwnerShip({
              domainId: domain._id,
            })
          } catch (err) {
            expect(err).toEqual(new Error('Ownership check error. Unable to request domain information.'))
            expect(consoleOutput).toEqual([
              `Cursor error when retrieving super admin affiliated organization ownership for user: ${user._key} and domain: ${domain._id}: Error: Cursor error occurred.`,
            ])
          }
        })
      })
      describe('if a cursor error is encountered during ownership check', () => {
        let mockQuery
        it('returns an appropriate error message', async () => {
          const firstCursor = {
            next: jest.fn().mockReturnValue({
              superAdmin: false,
              domainOwnership: false,
            }),
          }
          const secondCursor = {
            next: jest.fn().mockRejectedValue(new Error('Cursor error occurred.')),
          }
          mockQuery = jest.fn().mockReturnValueOnce(firstCursor).mockReturnValue(secondCursor)
          try {
            const testCheckDomainOwnerShip = checkDomainOwnership({
              i18n,
              auth: { loginRequired: true },
              query: mockQuery,
              userKey: user._key,
            })
            await testCheckDomainOwnerShip({
              domainId: domain._id,
            })
          } catch (err) {
            expect(err).toEqual(new Error('Ownership check error. Unable to request domain information.'))
            expect(consoleOutput).toEqual([
              `Cursor error when retrieving affiliated organization ownership for user: ${user._key} and domain: ${domain._id}: Error: Cursor error occurred.`,
            ])
          }
        })
      })
      describe('if a database error is encountered during super admin check', () => {
        let mockQuery
        it('returns an appropriate error message', async () => {
          mockQuery = jest.fn().mockRejectedValue(new Error('Database error occurred.'))
          try {
            const testCheckDomainOwnerShip = checkDomainOwnership({
              i18n,
              auth: { loginRequired: true },
              query: mockQuery,
              userKey: user._key,
            })
            await testCheckDomainOwnerShip({
              domainId: domain._id,
            })
          } catch (err) {
            expect(err).toEqual(new Error('Ownership check error. Unable to request domain information.'))
            expect(consoleOutput).toEqual([
              `Database error when retrieving super admin affiliated organization ownership for user: ${user._key} and domain: ${domain._id}: Error: Database error occurred.`,
            ])
          }
        })
      })
      describe('if a database error is encountered during ownership check', () => {
        let mockQuery
        it('returns an appropriate error message', async () => {
          mockQuery = jest
            .fn()
            .mockReturnValueOnce({
              next() {
                return {
                  superAdmin: false,
                  domainOwnership: false,
                }
              },
            })
            .mockRejectedValue(new Error('Database error occurred.'))
          try {
            const testCheckDomainOwnerShip = checkDomainOwnership({
              i18n,
              auth: { loginRequired: true },
              query: mockQuery,
              userKey: user._key,
            })
            await testCheckDomainOwnerShip({
              domainId: domain._id,
            })
          } catch (err) {
            expect(err).toEqual(new Error('Ownership check error. Unable to request domain information.'))
            expect(consoleOutput).toEqual([
              `Database error when retrieving affiliated organization ownership for user: ${user._key} and domain: ${domain._id}: Error: Database error occurred.`,
            ])
          }
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
      describe('if a cursor error is encountered during super admin ownership check', () => {
        let mockQuery
        it('returns an appropriate error message', async () => {
          const firstCursor = {
            next: jest.fn().mockRejectedValue(new Error('Cursor error occurred.')),
          }
          mockQuery = jest.fn().mockReturnValueOnce(firstCursor)
          try {
            const testCheckDomainOwnerShip = checkDomainOwnership({
              i18n,
              auth: { loginRequired: true },
              query: mockQuery,
              userKey: user._key,
            })
            await testCheckDomainOwnerShip({
              domainId: domain._id,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'Erreur de vérification de la propriété. Impossible de demander des informations sur le domaine.',
              ),
            )
            expect(consoleOutput).toEqual([
              `Cursor error when retrieving super admin affiliated organization ownership for user: ${user._key} and domain: ${domain._id}: Error: Cursor error occurred.`,
            ])
          }
        })
      })
      describe('if a cursor error is encountered during ownership check', () => {
        let mockQuery
        it('returns an appropriate error message', async () => {
          const firstCursor = {
            next: jest.fn().mockReturnValue({
              superAdmin: false,
              domainOwnership: false,
            }),
          }
          const secondCursor = {
            next: jest.fn().mockRejectedValue(new Error('Cursor error occurred.')),
          }
          mockQuery = jest.fn().mockReturnValueOnce(firstCursor).mockReturnValue(secondCursor)
          try {
            const testCheckDomainOwnerShip = checkDomainOwnership({
              i18n,
              auth: { loginRequired: true },
              query: mockQuery,
              userKey: user._key,
            })
            await testCheckDomainOwnerShip({
              domainId: domain._id,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'Erreur de vérification de la propriété. Impossible de demander des informations sur le domaine.',
              ),
            )
            expect(consoleOutput).toEqual([
              `Cursor error when retrieving affiliated organization ownership for user: ${user._key} and domain: ${domain._id}: Error: Cursor error occurred.`,
            ])
          }
        })
      })
      describe('if a database error is encountered during super admin check', () => {
        let mockQuery
        it('returns an appropriate error message', async () => {
          mockQuery = jest.fn().mockRejectedValue(new Error('Database error occurred.'))
          try {
            const testCheckDomainOwnerShip = checkDomainOwnership({
              i18n,
              auth: { loginRequired: true },
              query: mockQuery,
              userKey: user._key,
            })
            await testCheckDomainOwnerShip({
              domainId: domain._id,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'Erreur de vérification de la propriété. Impossible de demander des informations sur le domaine.',
              ),
            )
            expect(consoleOutput).toEqual([
              `Database error when retrieving super admin affiliated organization ownership for user: ${user._key} and domain: ${domain._id}: Error: Database error occurred.`,
            ])
          }
        })
      })
      describe('if a database error is encountered during ownership check', () => {
        let mockQuery
        it('returns an appropriate error message', async () => {
          mockQuery = jest
            .fn()
            .mockReturnValueOnce({
              next() {
                return {
                  superAdmin: false,
                  domainOwnership: false,
                }
              },
            })
            .mockRejectedValue(new Error('Database error occurred.'))
          try {
            const testCheckDomainOwnerShip = checkDomainOwnership({
              i18n,
              auth: { loginRequired: true },
              query: mockQuery,
              userKey: user._key,
            })
            await testCheckDomainOwnerShip({
              domainId: domain._id,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'Erreur de vérification de la propriété. Impossible de demander des informations sur le domaine.',
              ),
            )
            expect(consoleOutput).toEqual([
              `Database error when retrieving affiliated organization ownership for user: ${user._key} and domain: ${domain._id}: Error: Database error occurred.`,
            ])
          }
        })
      })
    })
  })
})
