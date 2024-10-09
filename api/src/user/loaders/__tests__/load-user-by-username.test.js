import { dbNameFromFile } from 'arango-tools'
import { ensureDatabase as ensure } from '../../../testUtilities'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { loadUserByUserName } from '../index'
import dbschema from '../../../../database.json'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given a loadUserByUserName dataloader', () => {
  let query, drop, truncate, collections, i18n
  const consoleOutput = []
  const mockedError = (output) => consoleOutput.push(output)
  beforeAll(() => {
    console.error = mockedError
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
  afterEach(() => {
    consoleOutput.length = 0
  })

  describe('given a successful load', () => {
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
      await collections.users.save({
        userName: 'random@email.ca',
        displayName: 'Random Name',
        tfaValidated: false,
        emailValidated: false,
      })
    })
    afterEach(async () => {
      await truncate()
    })
    afterAll(async () => {
      await drop()
    })
    describe('provided a single username', () => {
      it('returns a single user', async () => {
        const userName = 'random@email.ca'
        const loader = loadUserByUserName({ query, i18n })

        // Get Query User
        const cursor = await query`
          FOR user IN users
            FILTER user.userName == ${userName}
            RETURN MERGE({ id: user._key, _type: "user" }, user)
        `
        const expectedUser = await cursor.next()

        const user = await loader.load(userName)
        expect(user).toEqual(expectedUser)
      })
    })
    describe('provided a list of usernames', () => {
      it('returns a list of users', async () => {
        const expectedUsers = []
        const userNames = ['random@email.ca', 'test.account@istio.actually.exists']
        const loader = loadUserByUserName({ query, i18n })

        for (const i in userNames) {
          // Get Query User
          const cursor = await query`
            FOR user IN users
              FILTER user.userName == ${userNames[i]}
              RETURN MERGE({ id: user._key, _type: "user" }, user)
          `
          expectedUsers.push(await cursor.next())
        }

        const users = await loader.loadMany(userNames)
        expect(users).toEqual(expectedUsers)
      })
    })
  })
  describe('given an unsuccessful load', () => {
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
      describe('database issue is raise', () => {
        it('throws an error', async () => {
          const userName = 'random@email.ca'

          query = jest.fn().mockRejectedValue(new Error('Database error occurred.'))
          const loader = loadUserByUserName({ query, userKey: '1234', i18n })

          try {
            await loader.load(userName)
          } catch (err) {
            expect(err).toEqual(new Error('Unable to load user(s). Please try again.'))
          }

          expect(consoleOutput).toEqual([
            `Database error occurred when user: 1234 running loadUserByUserName: Error: Database error occurred.`,
          ])
        })
      })
      describe('cursor issue is raised', () => {
        it('throws an error', async () => {
          const userName = 'random@email.ca'

          const cursor = {
            forEach() {
              throw new Error('Cursor error occurred.')
            },
          }
          query = jest.fn().mockReturnValue(cursor)
          const loader = loadUserByUserName({ query, userKey: '1234', i18n })

          try {
            await loader.load(userName)
          } catch (err) {
            expect(err).toEqual(new Error('Unable to load user(s). Please try again.'))
          }

          expect(consoleOutput).toEqual([
            `Cursor error occurred when user: 1234 running loadUserByUserName: Error: Cursor error occurred.`,
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
      describe('database issue is raise', () => {
        it('throws an error', async () => {
          const userName = 'random@email.ca'

          query = jest.fn().mockRejectedValue(new Error('Database error occurred.'))
          const loader = loadUserByUserName({ query, userKey: '1234', i18n })

          try {
            await loader.load(userName)
          } catch (err) {
            expect(err).toEqual(new Error('Impossible de charger le(s) utilisateur(s). Veuillez réessayer.'))
          }

          expect(consoleOutput).toEqual([
            `Database error occurred when user: 1234 running loadUserByUserName: Error: Database error occurred.`,
          ])
        })
      })
      describe('cursor issue is raised', () => {
        it('throws an error', async () => {
          const userName = 'random@email.ca'

          const cursor = {
            forEach() {
              throw new Error('Cursor error occurred.')
            },
          }
          query = jest.fn().mockReturnValue(cursor)
          const loader = loadUserByUserName({ query, userKey: '1234', i18n })

          try {
            await loader.load(userName)
          } catch (err) {
            expect(err).toEqual(new Error('Impossible de charger le(s) utilisateur(s). Veuillez réessayer.'))
          }

          expect(consoleOutput).toEqual([
            `Cursor error occurred when user: 1234 running loadUserByUserName: Error: Cursor error occurred.`,
          ])
        })
      })
    })
  })
})
