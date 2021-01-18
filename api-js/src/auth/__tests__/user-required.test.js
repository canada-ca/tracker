import { ArangoTools, dbNameFromFile } from 'arango-tools'
import { setupI18n } from '@lingui/core'

import { makeMigrations } from '../../../migrations'
import { userLoaderByKey, userLoaderByUserName } from '../../user/loaders'
import { userRequired } from '../index'
import englishMessages from '../../locale/en/messages'
import frenchMessages from '../../locale/fr/messages'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given a userLoaderByKey dataloader', () => {
  let query, drop, truncate, migrate, collections, i18n

  let consoleOutput = []
  const mockedWarn = (output) => consoleOutput.push(output)
  const mockedError = (output) => consoleOutput.push(output)
  beforeAll(async () => {
    console.warn = mockedWarn
    console.error = mockedError
  })

  beforeEach(async () => {
    ;({ migrate } = await ArangoTools({ rootPass, url }))
    ;({ query, drop, truncate, collections } = await migrate(
      makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
    ))
    await truncate()
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
    await drop()
  })

  describe('provided a user id', () => {
    it('returns the user', async () => {
      // Get User From db
      const expectedUser = await userLoaderByUserName(query, '1', {}).load('test.account@istio.actually.exists')

      const testUserRequired = userRequired({
        userKey: expectedUser._key,
        userLoaderByKey: userLoaderByKey(query),
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
        missing: 'Traduction manquante',
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
            userLoaderByKey: userLoaderByKey(query),
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
            userLoaderByKey: userLoaderByKey(query),
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
            userLoaderByKey: testLoader(),
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
        missing: 'Traduction manquante',
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
            userLoaderByKey: userLoaderByKey(query),
          })
          await testUserRequired()
        } catch (err) {
          expect(err).toEqual(new Error('todo'))
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
            userLoaderByKey: userLoaderByKey(query),
          })
          await testUserRequired()
        } catch (err) {
          expect(err).toEqual(new Error('todo'))
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
            userLoaderByKey: testLoader(),
          })
          await testUserRequired()
        } catch (err) {
          expect(err).toEqual(new Error('todo'))
        }

        expect(consoleOutput).toEqual([
          `Database error occurred when running userRequired: Error: Database error occurred.`,
        ])
      })
    })
  })
})
