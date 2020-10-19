const dotenv = require('dotenv-safe')
dotenv.config()
const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { setupI18n } = require('@lingui/core')

const englishMessages = require('../locale/en/messages')
const frenchMessages = require('../locale/fr/messages')
const { makeMigrations } = require('../../migrations')
const { userLoaderByUserName } = require('../loaders')

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
          RETURN user
      `
      const expectedUser = await cursor.next()

      /* 
        doing the following causes errors because database connection closes before promise is resolved
        expect(loader.load(userName)).resolves.toEqual(expectedUser)
        so as a work around until more testing can be done is the way it has to be done
      */
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
            RETURN user
        `
        expectedUsers.push(await cursor.next())
      }

      /* 
        doing the following causes errors because database connection closes before promise is resolved
        expect(loader.loadMany(userNames)).resolves.toEqual(expectedUsers)
        so as a work around until more testing can be done is the way it has to be done
      */
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
        const loader = userLoaderByUserName(query, i18n)

        try {
          await loader.load(userName)
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to find user. Please try again.'),
          )
        }

        expect(consoleOutput).toEqual([
          `Database error occurred when running userLoaderByUserName: Error: Database error occurred.`,
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
        const loader = userLoaderByUserName(query, i18n)

        try {
          await loader.load(userName)
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to find user. Please try again.'),
          )
        }

        expect(consoleOutput).toEqual([
          `Cursor error occurred during userLoaderByUserName: Error: Cursor error occurred.`,
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
        const loader = userLoaderByUserName(query, i18n)

        try {
          await loader.load(userName)
        } catch (err) {
          expect(err).toEqual(new Error('todo'))
        }

        expect(consoleOutput).toEqual([
          `Database error occurred when running userLoaderByUserName: Error: Database error occurred.`,
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
        const loader = userLoaderByUserName(query, i18n)

        try {
          await loader.load(userName)
        } catch (err) {
          expect(err).toEqual(new Error('todo'))
        }

        expect(consoleOutput).toEqual([
          `Cursor error occurred during userLoaderByUserName: Error: Cursor error occurred.`,
        ])
      })
    })
  })
})
