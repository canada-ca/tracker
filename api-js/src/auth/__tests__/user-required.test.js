import { ensure, dbNameFromFile } from 'arango-tools'
import { setupI18n } from '@lingui/core'

import { databaseOptions } from '../../../database-options'
import { loadUserByKey, loadUserByUserName } from '../../user/loaders'
import { userRequired } from '../index'
import englishMessages from '../../locale/en/messages'
import frenchMessages from '../../locale/fr/messages'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given a loadUserByKey dataloader', () => {
  let query, drop, truncate, collections, i18n

  let consoleOutput = []
  const mockedWarn = (output) => consoleOutput.push(output)
  const mockedError = (output) => consoleOutput.push(output)
  beforeAll(async () => {
    console.warn = mockedWarn
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
    consoleOutput = []
  })

  afterEach(async () => {
    await truncate()
  })

  afterAll(async () => {
    await drop()
  })

  describe('provided a user id', () => {
    it('returns the user', async () => {
      // Get User From db
      const expectedUser = await loadUserByUserName({
        query,
        userKey: '1',
        i18n: {},
      }).load('test.account@istio.actually.exists')

      const testUserRequired = userRequired({
        userKey: expectedUser._key,
        loadUserByKey: loadUserByKey({ query }),
      })
      const user = await testUserRequired()

      expect(user).toEqual(expectedUser)
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
    describe('user id is undefined', () => {
      it('throws an error', async () => {
        try {
          const testUserRequired = userRequired({
            i18n,
            userKey: undefined,
            loadUserByKey: loadUserByKey({ query }),
          })
          await testUserRequired()
        } catch (err) {
          expect(err).toEqual(
            new Error('Authentication error. Please sign in.'),
          )
        }

        expect(consoleOutput).toEqual([
          `User attempted to access controlled content, but userKey was undefined.`,
        ])
      })
    })
    describe('user cannot be found in database', () => {
      it('throws an error', async () => {
        await truncate()

        try {
          const testUserRequired = userRequired({
            i18n,
            userKey: '1',
            loadUserByKey: loadUserByKey({ query }),
          })
          await testUserRequired()
        } catch (err) {
          expect(err).toEqual(
            new Error('Authentication error. Please sign in.'),
          )
        }

        expect(consoleOutput).toEqual([
          `User: 1 attempted to access controlled content, but no user is associated with that id.`,
        ])
      })
    })
    describe('database error occurs', () => {
      it('throws an error', async () => {
        const testLoader = () => {
          return {
            load() {
              throw new Error('Database error occurred.')
            },
          }
        }

        try {
          const testUserRequired = userRequired({
            i18n,
            userKey: '1',
            loadUserByKey: testLoader(),
          })
          await testUserRequired()
        } catch (err) {
          expect(err).toEqual(
            new Error('Authentication error. Please sign in.'),
          )
        }

        expect(consoleOutput).toEqual([
          `Database error occurred when running userRequired: Error: Database error occurred.`,
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
    describe('user id is undefined', () => {
      it('throws an error', async () => {
        try {
          const testUserRequired = userRequired({
            i18n,
            userKey: undefined,
            loadUserByKey: loadUserByKey({ query }),
          })
          await testUserRequired()
        } catch (err) {
          expect(err).toEqual(
            new Error("Erreur d'authentification. Veuillez vous connecter."),
          )
        }

        expect(consoleOutput).toEqual([
          `User attempted to access controlled content, but userKey was undefined.`,
        ])
      })
    })
    describe('user cannot be found in database', () => {
      it('throws an error', async () => {
        await truncate()

        try {
          const testUserRequired = userRequired({
            i18n,
            userKey: '1',
            loadUserByKey: loadUserByKey({ query }),
          })
          await testUserRequired()
        } catch (err) {
          expect(err).toEqual(
            new Error("Erreur d'authentification. Veuillez vous connecter."),
          )
        }

        expect(consoleOutput).toEqual([
          `User: 1 attempted to access controlled content, but no user is associated with that id.`,
        ])
      })
    })
    describe('database error occurs', () => {
      it('throws an error', async () => {
        const testLoader = () => {
          return {
            load() {
              throw new Error('Database error occurred.')
            },
          }
        }

        try {
          const testUserRequired = userRequired({
            i18n,
            userKey: '1',
            loadUserByKey: testLoader(),
          })
          await testUserRequired()
        } catch (err) {
          expect(err).toEqual(
            new Error("Erreur d'authentification. Veuillez vous connecter."),
          )
        }

        expect(consoleOutput).toEqual([
          `Database error occurred when running userRequired: Error: Database error occurred.`,
        ])
      })
    })
  })
})
