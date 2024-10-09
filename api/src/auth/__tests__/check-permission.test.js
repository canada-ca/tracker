import { dbNameFromFile } from 'arango-tools'
import { ensureDatabase as ensure } from '../../testUtilities'
import { setupI18n } from '@lingui/core'

import { checkPermission } from '..'
import englishMessages from '../../locale/en/messages'
import frenchMessages from '../../locale/fr/messages'
import dbschema from '../../../database.json'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the check permission function', () => {
  let query, drop, truncate, collections, i18n
  const consoleOutput = []
  const mockedError = (output) => consoleOutput.push(output)

  beforeAll(() => {
    console.error = mockedError
  })
  afterEach(() => {
    consoleOutput.length = 0
  })

  describe('given a successful permission call', () => {
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
      await collections.users.save({
        userName: 'test.account@istio.actually.exists',
        displayName: 'Test Account',
        tfaValidated: false,
        emailValidated: false,
      })
      await collections.organizations.save({
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
    })
    afterEach(async () => {
      await truncate()
    })
    afterAll(async () => {
      await drop()
    })
    describe('if the user is a super admin for a given organization', () => {
      let user, org
      beforeEach(async () => {
        const userCursor = await query`
          FOR user IN users
            FILTER user.userName == "test.account@istio.actually.exists"
            RETURN user
        `
        const orgCursor = await query`
          FOR org IN organizations
            FILTER (LOWER("treasury-board-secretariat") == LOWER(TRANSLATE("en", org.orgDetails).slug))
            RETURN MERGE({ _id: org._id, _key: org._key, _rev: org._rev }, TRANSLATE("en", org.orgDetails))
        `
        user = await userCursor.next()
        org = await orgCursor.next()

        await query`
          INSERT {
            _from: ${org._id},
            _to: ${user._id},
            permission: "super_admin"
          } INTO affiliations
        `
      })
      it('will return the users permission level', async () => {
        const testCheckPermission = checkPermission({
          userKey: user._key,
          query,
        })
        const permission = await testCheckPermission({ orgId: org._id })
        expect(permission).toEqual('super_admin')
      })
    })
    describe('if the user is an admin for a given organization', () => {
      let user, org
      beforeEach(async () => {
        const userCursor = await query`
          FOR user IN users
            FILTER user.userName == "test.account@istio.actually.exists"
            RETURN user
        `
        const orgCursor = await query`
          FOR org IN organizations
            FILTER (LOWER("treasury-board-secretariat") == LOWER(TRANSLATE("en", org.orgDetails).slug))
            RETURN MERGE({ _id: org._id, _key: org._key, _rev: org._rev }, TRANSLATE("en", org.orgDetails))
        `
        user = await userCursor.next()
        org = await orgCursor.next()

        await query`
          INSERT {
            _from: ${org._id},
            _to: ${user._id},
            permission: "admin"
          } INTO affiliations
        `
      })
      it('will return the users permission level', async () => {
        const testCheckPermission = checkPermission({
          userKey: user._key,
          query,
        })
        const permission = await testCheckPermission({ orgId: org._id })
        expect(permission).toEqual('admin')
      })
    })
    describe('if the user is a user for a given organization', () => {
      let user, org
      beforeEach(async () => {
        const userCursor = await query`
          FOR user IN users
            FILTER user.userName == "test.account@istio.actually.exists"
            RETURN user
        `
        const orgCursor = await query`
          FOR org IN organizations
            FILTER (LOWER("treasury-board-secretariat") == LOWER(TRANSLATE("en", org.orgDetails).slug))
            RETURN MERGE({ _id: org._id, _key: org._key, _rev: org._rev }, TRANSLATE("en", org.orgDetails))
        `
        user = await userCursor.next()
        org = await orgCursor.next()

        await query`
          INSERT {
            _from: ${org._id},
            _to: ${user._id},
            permission: "user"
          } INTO affiliations
        `
      })
      it('will return the users permission level', async () => {
        const testCheckPermission = checkPermission({
          userKey: user._key,
          query,
        })
        const permission = await testCheckPermission({ orgId: org._id })
        expect(permission).toEqual('user')
      })
    })
    describe('user does not belong to that organization', () => {
      let user, org
      beforeEach(async () => {
        const userCursor = await query`
          FOR user IN users
            FILTER user.userName == "test.account@istio.actually.exists"
            RETURN user
        `
        const orgCursor = await query`
          FOR org IN organizations
            FILTER (LOWER("treasury-board-secretariat") == LOWER(TRANSLATE("en", org.orgDetails).slug))
            RETURN MERGE({ _id: org._id, _key: org._key, _rev: org._rev }, TRANSLATE("en", org.orgDetails))
        `
        user = await userCursor.next()
        org = await orgCursor.next()
      })
      it('will return the users permission level', async () => {
        const testCheckPermission = checkPermission({
          userKey: user._key,
          query,
        })
        const permission = await testCheckPermission({ orgId: org._id })
        expect(permission).toEqual(null)
      })
    })
  })
  describe('given an unsuccessful permission call', () => {
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
      describe('database error occurs', () => {
        describe('when checking if super admin', () => {
          it('throws an error', async () => {
            query = jest.fn().mockRejectedValue(new Error('Database error occurred.'))

            try {
              const testCheckPermission = checkPermission({
                i18n,
                userKey: '1',
                query,
              })
              await testCheckPermission({ orgId: 'organizations/1' })
            } catch (err) {
              expect(err).toEqual(new Error('Authentication error. Please sign in.'))
            }

            expect(consoleOutput).toEqual([
              `Database error when checking to see if user: users/1 has super admin permission: Error: Database error occurred.`,
            ])
          })
        })
        describe('when checking for other roles', () => {
          it('throws an error', async () => {
            query = jest
              .fn()
              .mockReturnValueOnce({
                next() {
                  return 'test'
                },
              })
              .mockRejectedValue(new Error('Database error occurred.'))

            try {
              const testCheckPermission = checkPermission({
                i18n,
                userKey: '1',
                query,
              })
              await testCheckPermission({ orgId: 'organizations/1' })
            } catch (err) {
              expect(err).toEqual(new Error('Authentication error. Please sign in.'))
            }

            expect(consoleOutput).toEqual([
              `Database error occurred when checking users/1's permission: Error: Database error occurred.`,
            ])
          })
        })
      })
      describe('cursor error occurs', () => {
        describe('when checking if super admin', () => {
          it('throws an error', async () => {
            const cursor = {
              next() {
                throw new Error('Cursor error occurred.')
              },
            }
            query = jest.fn().mockReturnValue(cursor)

            try {
              const testCheckPermission = checkPermission({
                i18n,
                userKey: '1',
                query,
              })
              await testCheckPermission({ orgId: 'organizations/1' })
            } catch (err) {
              expect(err).toEqual(new Error('Unable to check permission. Please try again.'))
            }

            expect(consoleOutput).toEqual([
              `Cursor error when checking to see if user users/1 has super admin permission: Error: Cursor error occurred.`,
            ])
          })
        })
        describe('when checking for other roles', () => {
          it('throws an error', async () => {
            const cursor = {
              next() {
                throw new Error('Cursor error occurred.')
              },
            }
            query = jest
              .fn()
              .mockReturnValueOnce({
                next() {
                  return 'user'
                },
              })
              .mockReturnValue(cursor)

            try {
              const testCheckPermission = checkPermission({
                i18n,
                userKey: '1',
                query,
              })
              await testCheckPermission({ orgId: 'organizations/1' })
            } catch (err) {
              expect(err).toEqual(new Error('Unable to check permission. Please try again.'))
            }

            expect(consoleOutput).toEqual([
              `Cursor error when checking users/1's permission: Error: Cursor error occurred.`,
            ])
          })
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
      describe('database error occurs', () => {
        describe('when checking if super admin', () => {
          it('throws an error', async () => {
            query = jest.fn().mockRejectedValue(new Error('Database error occurred.'))

            try {
              const testCheckPermission = checkPermission({
                i18n,
                userKey: '1',
                query,
              })
              await testCheckPermission({ orgId: 'organizations/1' })
            } catch (err) {
              expect(err).toEqual(new Error("Erreur d'authentification. Veuillez vous connecter."))
            }

            expect(consoleOutput).toEqual([
              `Database error when checking to see if user: users/1 has super admin permission: Error: Database error occurred.`,
            ])
          })
        })
        describe('when checking for other roles', () => {
          it('throws an error', async () => {
            query = jest
              .fn()
              .mockReturnValueOnce({
                next() {
                  return 'test'
                },
              })
              .mockRejectedValue(new Error('Database error occurred.'))

            try {
              const testCheckPermission = checkPermission({
                i18n,
                userKey: '1',
                query,
              })
              await testCheckPermission({ orgId: 'organizations/1' })
            } catch (err) {
              expect(err).toEqual(new Error("Erreur d'authentification. Veuillez vous connecter."))
            }

            expect(consoleOutput).toEqual([
              `Database error occurred when checking users/1's permission: Error: Database error occurred.`,
            ])
          })
        })
      })
      describe('cursor error occurs', () => {
        describe('when checking if super admin', () => {
          it('throws an error', async () => {
            const cursor = {
              next() {
                throw new Error('Cursor error occurred.')
              },
            }
            query = jest.fn().mockReturnValue(cursor)

            try {
              const testCheckPermission = checkPermission({
                i18n,
                userKey: '1',
                query,
              })
              await testCheckPermission({ orgId: 'organizations/1' })
            } catch (err) {
              expect(err).toEqual(new Error("Impossible de vérifier l'autorisation. Veuillez réessayer."))
            }

            expect(consoleOutput).toEqual([
              `Cursor error when checking to see if user users/1 has super admin permission: Error: Cursor error occurred.`,
            ])
          })
        })
        describe('when checking for other roles', () => {
          it('throws an error', async () => {
            const cursor = {
              next() {
                throw new Error('Cursor error occurred.')
              },
            }
            query = jest
              .fn()
              .mockReturnValueOnce({
                next() {
                  return 'user'
                },
              })
              .mockReturnValue(cursor)

            try {
              const testCheckPermission = checkPermission({
                i18n,
                userKey: '1',
                query,
              })
              await testCheckPermission({ orgId: 'organizations/1' })
            } catch (err) {
              expect(err).toEqual(new Error("Impossible de vérifier l'autorisation. Veuillez réessayer."))
            }

            expect(consoleOutput).toEqual([
              `Cursor error when checking users/1's permission: Error: Cursor error occurred.`,
            ])
          })
        })
      })
    })
  })
})
