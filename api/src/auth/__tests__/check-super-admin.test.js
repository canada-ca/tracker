import { dbNameFromFile } from 'arango-tools'
import { ensureDatabase as ensure } from '../../testUtilities'
import { setupI18n } from '@lingui/core'

import { checkSuperAdmin } from '../check-super-admin'
import englishMessages from '../../locale/en/messages'
import frenchMessages from '../../locale/fr/messages'
import dbschema from '../../../database.json'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the check super admin function', () => {
  let query, drop, truncate, collections, i18n, user, org
  const consoleOutput = []
  const mockedError = (output) => consoleOutput.push(output)

  beforeAll(() => {
    console.error = mockedError
  })
  afterEach(() => {
    consoleOutput.length = 0
  })

  describe('given a successful call', () => {
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
            slug: 'super-admin',
            acronym: 'SA',
            name: 'Super Admin',
            zone: 'FED',
            sector: 'SA',
            country: 'Canada',
            province: 'Ontario',
            city: 'Ottawa',
          },
          fr: {
            slug: 'super-admin',
            acronym: 'SA',
            name: 'Super Admin',
            zone: 'FED',
            sector: 'SA',
            country: 'Canada',
            province: 'Ontario',
            city: 'Ottawa',
          },
        },
      })
    })
    afterEach(async () => {
      await truncate()
    })
    afterAll(async () => {
      await drop()
    })
    describe('user has super admin permission', () => {
      beforeEach(async () => {
        await collections.affiliations.save({
          _from: org._id,
          _to: user._id,
          permission: 'super_admin',
        })
      })
      it('returns true', async () => {
        const permissionCheck = checkSuperAdmin({
          i18n,
          userKey: user._key,
          query,
        })

        const isSuperAdmin = await permissionCheck()

        expect(isSuperAdmin).toEqual(true)
      })
    })
    describe('user does not have super admin permission', () => {
      describe('user is an admin', () => {
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'admin',
          })
        })
        it('returns false', async () => {
          const permissionCheck = checkSuperAdmin({
            i18n,
            userKey: user._key,
            query,
          })

          const isSuperAdmin = await permissionCheck()

          expect(isSuperAdmin).toEqual(false)
        })
      })
      describe('user is a user', () => {
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'user',
          })
        })
        it('returns false', async () => {
          const permissionCheck = checkSuperAdmin({
            i18n,
            userKey: user._key,
            query,
          })

          const isSuperAdmin = await permissionCheck()

          expect(isSuperAdmin).toEqual(false)
        })
      })
      describe('user does not have a role', () => {
        it('returns false', async () => {
          const permissionCheck = checkSuperAdmin({
            i18n,
            userKey: user._key,
            query,
          })

          const isSuperAdmin = await permissionCheck()

          expect(isSuperAdmin).toEqual(false)
        })
      })
    })
  })
  describe('given an unsuccessful call', () => {
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
      describe('given a database error', () => {
        it('raises an error', async () => {
          const mockedQuery = jest.fn().mockRejectedValue(new Error('Database error occurred.'))

          try {
            const testSuperAdmin = checkSuperAdmin({
              i18n,
              userKey: '1',
              query: mockedQuery,
            })
            await testSuperAdmin()
          } catch (err) {
            expect(err).toEqual(new Error('Unable to check permission. Please try again.'))
          }

          expect(consoleOutput).toEqual([
            `Database error when checking to see if user: users/1 has super admin permission: Error: Database error occurred.`,
          ])
        })
      })
      describe('given a cursor error', () => {
        it('raises an error', async () => {
          const cursor = {
            next() {
              throw new Error('Cursor error occurred.')
            },
          }
          const mockedQuery = jest.fn().mockReturnValue(cursor)

          try {
            const testSuperAdmin = checkSuperAdmin({
              i18n,
              userKey: '1',
              query: mockedQuery,
            })
            await testSuperAdmin()
          } catch (err) {
            expect(err).toEqual(new Error('Unable to check permission. Please try again.'))
          }

          expect(consoleOutput).toEqual([
            `Cursor error when checking to see if user users/1 has super admin permission: Error: Cursor error occurred.`,
          ])
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
      describe('given a database error', () => {
        it('raises an error', async () => {
          const mockedQuery = jest.fn().mockRejectedValue(new Error('Database error occurred.'))

          try {
            const testSuperAdmin = checkSuperAdmin({
              i18n,
              userKey: '1',
              query: mockedQuery,
            })
            await testSuperAdmin()
          } catch (err) {
            expect(err).toEqual(new Error("Impossible de vérifier l'autorisation. Veuillez réessayer."))
          }

          expect(consoleOutput).toEqual([
            `Database error when checking to see if user: users/1 has super admin permission: Error: Database error occurred.`,
          ])
        })
      })
      describe('given a cursor error', () => {
        it('raises an error', async () => {
          const cursor = {
            next() {
              throw new Error('Cursor error occurred.')
            },
          }
          const mockedQuery = jest.fn().mockReturnValue(cursor)

          try {
            const testSuperAdmin = checkSuperAdmin({
              i18n,
              userKey: '1',
              query: mockedQuery,
            })
            await testSuperAdmin()
          } catch (err) {
            expect(err).toEqual(new Error("Impossible de vérifier l'autorisation. Veuillez réessayer."))
          }

          expect(consoleOutput).toEqual([
            `Cursor error when checking to see if user users/1 has super admin permission: Error: Cursor error occurred.`,
          ])
        })
      })
    })
  })
})
