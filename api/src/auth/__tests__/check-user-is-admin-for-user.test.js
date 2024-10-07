import { dbNameFromFile } from 'arango-tools'
import { ensureDatabase as ensure } from '../../testUtilities'
import { setupI18n } from '@lingui/core'

import { checkUserIsAdminForUser } from '../index'
import englishMessages from '../../locale/en/messages'
import frenchMessages from '../../locale/fr/messages'
import dbschema from '../../../database.json'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the checkUserIsAdminForUser', () => {
  let query, drop, truncate, collections, i18n, user1, user2, org
  const consoleOutput = []
  const mockedError = (output) => consoleOutput.push(output)

  beforeAll(() => {
    console.error = mockedError
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
      user1 = await collections.users.save({
        userName: 'test.account@istio.actually.exists',
        displayName: 'Test Account',
        tfaValidated: false,
        emailValidated: false,
      })
      user2 = await collections.users.save({
        userName: 'test.account2@istio.actually.exists',
        displayName: 'Test Account2',
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
      await collections.affiliations.save({
        _from: org._id,
        _to: user2._id,
        permission: 'user',
      })
    })
    afterEach(async () => {
      await truncate()
    })
    afterAll(async () => {
      await drop()
    })
    describe('user is a super admin', () => {
      beforeEach(async () => {
        await collections.affiliations.save({
          _from: org._id,
          _to: user1._id,
          permission: 'super_admin',
        })
      })
      it('returns true', async () => {
        const testCheck = checkUserIsAdminForUser({
          i18n,
          userKey: user1._key,
          query,
        })

        const check = await testCheck({
          userName: 'test.account2@istio.actually.exists',
        })
        expect(check).toEqual(true)
      })
    })
    describe('requesting user is an admin in the same org', () => {
      beforeEach(async () => {
        await collections.affiliations.save({
          _from: org._id,
          _to: user1._id,
          permission: 'admin',
        })
      })
      it('returns true', async () => {
        const testCheck = checkUserIsAdminForUser({
          i18n,
          userKey: user1._key,
          query,
        })

        const check = await testCheck({
          userName: 'test.account2@istio.actually.exists',
        })
        expect(check).toEqual(true)
      })
    })
    describe('requesting user is an admin in a different org', () => {
      let org2
      beforeEach(async () => {
        org2 = await collections.organizations.save({
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
        await collections.affiliations.save({
          _from: org2._id,
          _to: user1._id,
          permission: 'admin',
        })
      })
      it('returns true', async () => {
        const testCheck = checkUserIsAdminForUser({
          i18n,
          userKey: user1._key,
          query,
        })

        const check = await testCheck({
          userName: 'test.account2@istio.actually.exists',
        })
        expect(check).toEqual(false)
      })
    })
    describe('requesting user is not an admin', () => {
      beforeEach(async () => {
        await collections.affiliations.save({
          _from: org._id,
          _to: user1._id,
          permission: 'user',
        })
      })
      it('returns true', async () => {
        const testCheck = checkUserIsAdminForUser({
          i18n,
          userKey: user1._key,
          query,
        })

        const check = await testCheck({
          userName: 'test.account2@istio.actually.exists',
        })
        expect(check).toEqual(false)
      })
    })
  })
  describe('given an unsuccessful call', () => {
    describe('user language is set to english', () => {
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
        describe('when checking for super admin permission', () => {
          it('throws an error', async () => {
            const testCheck = checkUserIsAdminForUser({
              i18n,
              userKey: user1._key,
              query: jest.fn().mockRejectedValue(new Error('Database error occurred.')),
            })

            try {
              await testCheck({
                userName: 'test.account2@istio.actually.exists',
              })
            } catch (err) {
              expect(err).toEqual(Error('Permission error, not an admin for this user.'))
            }
            expect(consoleOutput).toEqual([
              `Database error when checking to see if user: ${user1._key} has super admin permission for user: test.account2@istio.actually.exists, error: Error: Database error occurred.`,
            ])
          })
        })
        describe('when checking for matching org admin permission', () => {
          it('throws an error', async () => {
            const testCheck = checkUserIsAdminForUser({
              i18n,
              userKey: user1._key,
              query: jest
                .fn()
                .mockReturnValueOnce({
                  next() {
                    return 'test'
                  },
                })
                .mockRejectedValue(new Error('Database error occurred.')),
            })

            try {
              await testCheck({
                userName: 'test.account2@istio.actually.exists',
              })
            } catch (err) {
              expect(err).toEqual(Error('Permission error, not an admin for this user.'))
            }
            expect(consoleOutput).toEqual([
              `Database error when checking to see if user: ${user1._key} has admin permission for user: test.account2@istio.actually.exists, error: Error: Database error occurred.`,
            ])
          })
        })
      })
      describe('cursor error occurs', () => {
        describe('when checking for super admin permission', () => {
          it('throws an error', async () => {
            const cursor = {
              next() {
                throw new Error('Cursor error occurred.')
              },
            }

            const testCheck = checkUserIsAdminForUser({
              i18n,
              userKey: user1._key,
              query: jest.fn().mockReturnValue(cursor),
            })

            try {
              await testCheck({
                userName: 'test.account2@istio.actually.exists',
              })
            } catch (err) {
              expect(err).toEqual(Error('Permission error, not an admin for this user.'))
            }
            expect(consoleOutput).toEqual([
              `Cursor error when checking to see if user: ${user1._key} has super admin permission for user: test.account2@istio.actually.exists, error: Error: Cursor error occurred.`,
            ])
          })
        })
        describe('when checking for matching org admin permission', () => {
          it('throws an error', async () => {
            const cursor = {
              next() {
                throw new Error('Cursor error occurred.')
              },
            }

            const testCheck = checkUserIsAdminForUser({
              i18n,
              userKey: user1._key,
              query: jest
                .fn()
                .mockReturnValueOnce({
                  next() {
                    return 'user'
                  },
                })
                .mockReturnValue(cursor),
            })

            try {
              await testCheck({
                userName: 'test.account2@istio.actually.exists',
              })
            } catch (err) {
              expect(err).toEqual(Error('Permission error, not an admin for this user.'))
            }
            expect(consoleOutput).toEqual([
              `Cursor error when checking to see if user: ${user1._key} has admin permission for user: test.account2@istio.actually.exists, error: Error: Cursor error occurred.`,
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
      describe('database error occurs', () => {
        describe('when checking for super admin permission', () => {
          it('throws an error', async () => {
            const testCheck = checkUserIsAdminForUser({
              i18n,
              userKey: user1._key,
              query: jest.fn().mockRejectedValue(new Error('Database error occurred.')),
            })

            try {
              await testCheck({
                userName: 'test.account2@istio.actually.exists',
              })
            } catch (err) {
              expect(err).toEqual(Error("Erreur de permission, pas d'administrateur pour cet utilisateur."))
            }
            expect(consoleOutput).toEqual([
              `Database error when checking to see if user: ${user1._key} has super admin permission for user: test.account2@istio.actually.exists, error: Error: Database error occurred.`,
            ])
          })
        })
        describe('when checking for matching org admin permission', () => {
          it('throws an error', async () => {
            const testCheck = checkUserIsAdminForUser({
              i18n,
              userKey: user1._key,
              query: jest
                .fn()
                .mockReturnValueOnce({
                  next() {
                    return 'test'
                  },
                })
                .mockRejectedValue(new Error('Database error occurred.')),
            })

            try {
              await testCheck({
                userName: 'test.account2@istio.actually.exists',
              })
            } catch (err) {
              expect(err).toEqual(Error("Erreur de permission, pas d'administrateur pour cet utilisateur."))
            }
            expect(consoleOutput).toEqual([
              `Database error when checking to see if user: ${user1._key} has admin permission for user: test.account2@istio.actually.exists, error: Error: Database error occurred.`,
            ])
          })
        })
      })
      describe('cursor error occurs', () => {
        describe('when checking for super admin permission', () => {
          it('throws an error', async () => {
            const cursor = {
              next() {
                throw new Error('Cursor error occurred.')
              },
            }

            const testCheck = checkUserIsAdminForUser({
              i18n,
              userKey: user1._key,
              query: jest.fn().mockReturnValue(cursor),
            })

            try {
              await testCheck({
                userName: 'test.account2@istio.actually.exists',
              })
            } catch (err) {
              expect(err).toEqual(Error("Erreur de permission, pas d'administrateur pour cet utilisateur."))
            }
            expect(consoleOutput).toEqual([
              `Cursor error when checking to see if user: ${user1._key} has super admin permission for user: test.account2@istio.actually.exists, error: Error: Cursor error occurred.`,
            ])
          })
        })
        describe('when checking for matching org admin permission', () => {
          it('throws an error', async () => {
            const cursor = {
              next() {
                throw new Error('Cursor error occurred.')
              },
            }

            const testCheck = checkUserIsAdminForUser({
              i18n,
              userKey: user1._key,
              query: jest
                .fn()
                .mockReturnValueOnce({
                  next() {
                    return 'user'
                  },
                })
                .mockReturnValue(cursor),
            })

            try {
              await testCheck({
                userName: 'test.account2@istio.actually.exists',
              })
            } catch (err) {
              expect(err).toEqual(Error("Erreur de permission, pas d'administrateur pour cet utilisateur."))
            }
            expect(consoleOutput).toEqual([
              `Cursor error when checking to see if user: ${user1._key} has admin permission for user: test.account2@istio.actually.exists, error: Error: Cursor error occurred.`,
            ])
          })
        })
      })
    })
  })
})
