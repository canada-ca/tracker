import { ArangoTools, dbNameFromFile } from 'arango-tools'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { makeMigrations } from '../../../../migrations'
import { userLoaderByUserName } from '../../../loaders'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given a userLoaderByUserName dataloader', () => {
  let query, drop, truncate, migrate, collections, i18n

  let consoleOutput = []
  const mockedError = (output) => consoleOutput.push(output)
  beforeAll(async () => {
    console.error = mockedError
    ;({ migrate } = await ArangoTools({ rootPass, url }))
    ;({ query, drop, truncate, collections } = await migrate(
      makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
    ))
    i18n = setupI18n({
      language: 'en',
      locales: ['en', 'fr'],
      missing: 'Traduction manquante',
      catalogs: {
        en: englishMessages,
        fr: frenchMessages,
      },
    })
  })

  beforeEach(async () => {
    await truncate()
    await collections.users.save({
      userName: 'test.account@istio.actually.exists',
      displayName: 'Test Account',
      preferredLang: 'french',
      tfaValidated: false,
      emailValidated: false,
    })
    await collections.users.save({
      userName: 'random@email.ca',
      displayName: 'Random Name',
      preferredLang: 'english',
      tfaValidated: false,
      emailValidated: false,
    })
    consoleOutput = []
  })

  afterAll(async () => {
    await drop()
  })

  describe('provided a single username', () => {
    it('returns a single user', async () => {
      const userName = 'random@email.ca'
      const loader = userLoaderByUserName(query, i18n)

      // Get Query User
      const cursor = await query`
        FOR user IN users
          FILTER user.userName == ${userName}
          RETURN MERGE({ id: user._key }, user)
      `
      const expectedUser = await cursor.next()

      const user = await loader.load(userName)
      expect(user).toEqual(expectedUser)
    })
  })
  describe('provided a list of usernames', () => {
    it('returns a list of users', async () => {
      const expectedUsers = []
      const userNames = [
        'random@email.ca',
        'test.account@istio.actually.exists',
      ]
      const loader = userLoaderByUserName(query, i18n)

      for (const i in userNames) {
        // Get Query User
        const cursor = await query`
          FOR user IN users
            FILTER user.userName == ${userNames[i]}
            RETURN MERGE({ id: user._key }, user)
        `
        expectedUsers.push(await cursor.next())
      }

      const users = await loader.loadMany(userNames)
      expect(users).toEqual(expectedUsers)
    })
  })
  describe('language is set to english', () => {
    beforeAll(() => {
      i18n = setupI18n({
        language: 'en',
        locales: ['en', 'fr'],
        missing: 'Traduction manquante',
        catalogs: {
          en: englishMessages,
          fr: frenchMessages,
        },
      })
    })
    describe('database issue is raise', () => {
      it('throws an error', async () => {
        const userName = 'random@email.ca'

        query = jest
          .fn()
          .mockRejectedValue(new Error('Database error occurred.'))
        const loader = userLoaderByUserName(query, '1234', i18n)

        try {
          await loader.load(userName)
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to find user. Please try again.'),
          )
        }

        expect(consoleOutput).toEqual([
          `Database error occurred when user: 1234 running userLoaderByUserName: Error: Database error occurred.`,
        ])
      })
    })
    describe('cursor issue is raised', () => {
      it('throws an error', async () => {
        const userName = 'random@email.ca'

        const cursor = {
          each() {
            throw new Error('Cursor error occurred.')
          },
        }
        query = jest.fn().mockReturnValue(cursor)
        const loader = userLoaderByUserName(query, '1234', i18n)

        try {
          await loader.load(userName)
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to find user. Please try again.'),
          )
        }

        expect(consoleOutput).toEqual([
          `Cursor error occurred when user: 1234 running userLoaderByUserName: Error: Cursor error occurred.`,
        ])
      })
    })
  })
  describe('language is set to french', () => {
    beforeAll(() => {
      i18n = setupI18n({
        language: 'fr',
        locales: ['en', 'fr'],
        missing: 'Traduction manquante',
        catalogs: {
          en: englishMessages,
          fr: frenchMessages,
        },
      })
    })
    describe('database issue is raise', () => {
      it('throws an error', async () => {
        const userName = 'random@email.ca'

        query = jest
          .fn()
          .mockRejectedValue(new Error('Database error occurred.'))
        const loader = userLoaderByUserName(query, '1234', i18n)

        try {
          await loader.load(userName)
        } catch (err) {
          expect(err).toEqual(new Error('todo'))
        }

        expect(consoleOutput).toEqual([
          `Database error occurred when user: 1234 running userLoaderByUserName: Error: Database error occurred.`,
        ])
      })
    })
    describe('cursor issue is raised', () => {
      it('throws an error', async () => {
        const userName = 'random@email.ca'

        const cursor = {
          each() {
            throw new Error('Cursor error occurred.')
          },
        }
        query = jest.fn().mockReturnValue(cursor)
        const loader = userLoaderByUserName(query, '1234', i18n)

        try {
          await loader.load(userName)
        } catch (err) {
          expect(err).toEqual(new Error('todo'))
        }

        expect(consoleOutput).toEqual([
          `Cursor error occurred when user: 1234 running userLoaderByUserName: Error: Cursor error occurred.`,
        ])
      })
    })
  })
})
