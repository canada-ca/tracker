import { ensure, dbNameFromFile } from 'arango-tools'
import { setupI18n } from '@lingui/core'

import { databaseOptions } from '../../../database-options'
import { checkDomainPermission } from '../index'
import englishMessages from '../../locale/en/messages'
import frenchMessages from '../../locale/fr/messages'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the check domain permission function', () => {
  let query, drop, truncate, collections, org, domain, i18n

  let consoleOutput = []
  const mockedError = (output) => consoleOutput.push(output)
  beforeAll(async () => {
    console.error = mockedError
    ;({ query, drop, truncate, collections } = await ensure({
      type: 'database',
      name: dbNameFromFile(__filename),
      url,
      rootPassword: rootPass,
      options: databaseOptions({ rootPass }),
    }))
  })

  beforeEach(async () => {
    await collections.users.save({
      userName: 'test.account@istio.actually.exists',
      displayName: 'Test Account',
      preferredLang: 'french',
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
    })
    domain = await collections.domains.save({
      domain: 'test.gc.ca',
      slug: 'test-gc-ca',
      lastRan: null,
      selectors: ['selector1', 'selector2'],
    })
    await collections.claims.save({
      _to: domain._id,
      _from: org._id,
    })
    consoleOutput = []
  })

  afterEach(async () => {
    await truncate()
  })

  afterAll(async () => {
    await drop()
  })

  describe('given a successful domain permission check', () => {
    let user, permitted
    beforeEach(async () => {
      const userCursor = await query`
        FOR user IN users
          FILTER user.userName == "test.account@istio.actually.exists"
          RETURN user
      `
      user = await userCursor.next()
    })
    describe('user is a super admin', () => {
      beforeEach(async () => {
        await collections.affiliations.save({
          _from: 'organizations/SA',
          _to: user._id,
          permission: 'super_admin',
        })
      })
      it('will return true', async () => {
        const testCheckDomainPermission = checkDomainPermission({
          query,
          userKey: user._key,
        })
        permitted = await testCheckDomainPermission({ domainId: domain._id })
        expect(permitted).toEqual(true)
      })
    })
    describe('if the user belongs to an org which has a claim for a given organization', () => {
      describe('if the user has admin-level permissions', () => {
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'admin',
          })
        })
        it('will return true', async () => {
          const testCheckDomainPermission = checkDomainPermission({
            query,
            userKey: user._key,
          })
          permitted = await testCheckDomainPermission({ domainId: domain._id })
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
          const testCheckDomainPermission = checkDomainPermission({
            query,
            userKey: user._key,
          })
          permitted = await testCheckDomainPermission({ domainId: domain._id })
          expect(permitted).toEqual(true)
        })
      })
    })
  })

  describe('given an unsuccessful domain permission check', () => {
    let user
    beforeEach(async () => {
      const userCursor = await query`
        FOR user IN users
          FILTER user.userName == "test.account@istio.actually.exists"
          RETURN user
      `
      user = await userCursor.next()
    })
    describe('if the user does not belong to an org which has a claim for a given organization', () => {
      let permitted
      it('will return false', async () => {
        const testCheckDomainPermission = checkDomainPermission({
          query,
          userKey: user._key,
        })
        permitted = await testCheckDomainPermission({ domainId: domain._id })
        expect(permitted).toEqual(false)
      })
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
      describe('if a database error is encountered during super admin permission check', () => {
        let mockQuery
        it('returns an appropriate error message', async () => {
          mockQuery = jest
            .fn()
            .mockRejectedValue(new Error('Database error occurred.'))
          try {
            const testCheckDomainPermission = checkDomainPermission({
              i18n,
              query: mockQuery,
              userKey: user._key,
            })
            await testCheckDomainPermission({ domainId: domain._id })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'Permission check error. Unable to request domain information.',
              ),
            )
            expect(consoleOutput).toEqual([
              `Database error when retrieving super admin claims for user: ${user._id} and domain: ${domain._id}: Error: Database error occurred.`,
            ])
          }
        })
      })
      describe('if a database error is encountered during permission check', () => {
        let mockQuery
        it('returns an appropriate error message', async () => {
          mockQuery = jest
            .fn()
            .mockReturnValueOnce({ count: 0 })
            .mockRejectedValue(new Error('Database error occurred.'))
          try {
            const testCheckDomainPermission = checkDomainPermission({
              i18n,
              query: mockQuery,
              userKey: user._key,
            })
            await testCheckDomainPermission({ domainId: domain._id })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'Permission check error. Unable to request domain information.',
              ),
            )
            expect(consoleOutput).toEqual([
              `Database error when retrieving affiliated organization claims for user: ${user._id} and domain: ${domain._id}: Error: Database error occurred.`,
            ])
          }
        })
      })
      describe('if a cursor error is encountered during permission check', () => {
        let mockQuery
        it('returns an appropriate error message', async () => {
          const cursor = {
            next() {
              throw new Error('Cursor error occurred.')
            },
          }
          mockQuery = jest
            .fn()
            .mockReturnValueOnce({ count: 0 })
            .mockReturnValue(cursor)
          try {
            const testCheckDomainPermission = checkDomainPermission({
              i18n,
              query: mockQuery,
              userKey: user._key,
            })
            await testCheckDomainPermission({ domainId: domain._id })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'Permission check error. Unable to request domain information.',
              ),
            )
            expect(consoleOutput).toEqual([
              `Cursor error when retrieving affiliated organization claims for user: ${user._id} and domain: ${domain._id}: Error: Cursor error occurred.`,
            ])
          }
        })
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
      describe('if a database error is encountered during super admin permission check', () => {
        let mockQuery
        it('returns an appropriate error message', async () => {
          mockQuery = jest
            .fn()
            .mockRejectedValue(new Error('Database error occurred.'))
          try {
            const testCheckDomainPermission = checkDomainPermission({
              i18n,
              query: mockQuery,
              userKey: user._key,
            })
            await testCheckDomainPermission({ domainId: domain._id })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'Erreur de vérification des permissions. Impossible de demander des informations sur le domaine.',
              ),
            )
            expect(consoleOutput).toEqual([
              `Database error when retrieving super admin claims for user: ${user._id} and domain: ${domain._id}: Error: Database error occurred.`,
            ])
          }
        })
      })
      describe('if a database error is encountered during permission check', () => {
        let mockQuery
        it('returns an appropriate error message', async () => {
          mockQuery = jest
            .fn()
            .mockReturnValueOnce({ count: 0 })
            .mockRejectedValue(new Error('Database error occurred.'))
          try {
            const testCheckDomainPermission = checkDomainPermission({
              i18n,
              query: mockQuery,
              userKey: user._key,
            })
            await testCheckDomainPermission({ domainId: domain._id })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'Erreur de vérification des permissions. Impossible de demander des informations sur le domaine.',
              ),
            )
            expect(consoleOutput).toEqual([
              `Database error when retrieving affiliated organization claims for user: ${user._id} and domain: ${domain._id}: Error: Database error occurred.`,
            ])
          }
        })
      })
      describe('if a cursor error is encountered during permission check', () => {
        let mockQuery
        it('returns an appropriate error message', async () => {
          const cursor = {
            next() {
              throw new Error('Cursor error occurred.')
            },
          }
          mockQuery = jest
            .fn()
            .mockReturnValueOnce({ count: 1 })
            .mockReturnValue(cursor)
          try {
            const testCheckDomainPermission = checkDomainPermission({
              i18n,
              query: mockQuery,
              userKey: user._key,
            })
            await testCheckDomainPermission({ domainId: domain._id })
          } catch (err) {
            expect(err).toEqual(new Error('todo'))
            expect(consoleOutput).toEqual([
              `Cursor error when retrieving affiliated organization claims for user: ${user._id} and domain:${domain._id}: Error: Cursor error occurred.`,
            ])
          }
        })
      })
    })
  })
})
