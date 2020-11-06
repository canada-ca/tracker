const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { setupI18n } = require('@lingui/core')

const englishMessages = require('../locale/en/messages')
const frenchMessages = require('../locale/fr/messages')
const { makeMigrations } = require('../../migrations')
const { userLoaderByKey } = require('../loaders')

describe('given a userLoaderByKey dataloader', () => {
  let query, drop, truncate, migrate, collections, i18n

  let consoleOutput = []
  const mockedError = (output) => consoleOutput.push(output)
  beforeAll(async () => {
    console.error = mockedError
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
    await collections.users.save({
      userName: 'random@email.ca',
      displayName: 'Random Name',
      preferredLang: 'english',
      tfaValidated: false,
      emailValidated: false,
    })
    consoleOutput = []
  })

  afterEach(async () => {
    await drop()
  })

  describe('provided a single id', () => {
    it('returns a single user', async () => {
      // Get User From db
      const expectedCursor = await query`
        FOR user IN users
          FILTER user.userName == "random@email.ca"
          RETURN user
      `
      const expectedUser = await expectedCursor.next()

      const loader = userLoaderByKey(query)
      const user = await loader.load(expectedUser._key)

      expect(user).toEqual(expectedUser)
    })
  })
  describe('provided a list of ids', () => {
    it('returns a list of users', async () => {
      const userIds = []
      const expectedUsers = []
      const expectedCursor = await query`
        FOR user IN users
          RETURN user
      `

      while (expectedCursor.hasNext()) {
        const tempUser = await expectedCursor.next()
        userIds.push(tempUser._key)
        expectedUsers.push(tempUser)
      }

      const loader = userLoaderByKey(query)
      const users = await loader.loadMany(userIds)
      expect(users).toEqual(expectedUsers)
    })
  })
  describe('users language is set to english', () => {
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
    describe('database error is raised', () => {
      it('returns an error', async () => {
        const expectedCursor = await query`
        FOR user IN users
          FILTER user.userName == "random@email.ca"
          RETURN user
      `
        const expectedUser = await expectedCursor.next()

        query = jest
          .fn()
          .mockRejectedValue(new Error('Database error occurred.'))
        const loader = userLoaderByKey(query, i18n)

        try {
          await loader.load(expectedUser._key)
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to find user. Please try again.'),
          )
        }

        expect(consoleOutput).toEqual([
          `Database error occurred when running userLoaderByKey: Error: Database error occurred.`,
        ])
      })
    })
    describe('cursor error is raised', () => {
      it('throws an error', async () => {
        const expectedCursor = await query`
        FOR user IN users
          FILTER user.userName == "random@email.ca"
          RETURN user
      `
        const expectedUser = await expectedCursor.next()

        const cursor = {
          each() {
            throw new Error('Cursor error occurred.')
          },
        }
        query = jest.fn().mockReturnValue(cursor)
        const loader = userLoaderByKey(query, i18n)

        try {
          await loader.load(expectedUser._key)
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to find user. Please try again.'),
          )
        }

        expect(consoleOutput).toEqual([
          `Cursor error occurred during userLoaderByKey: Error: Cursor error occurred.`,
        ])
      })
    })
  })
  describe('users language is set to french', () => {
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
    describe('database error is raised', () => {
      it('returns an error', async () => {
        const expectedCursor = await query`
        FOR user IN users
          FILTER user.userName == "random@email.ca"
          RETURN user
      `
        const expectedUser = await expectedCursor.next()

        query = jest
          .fn()
          .mockRejectedValue(new Error('Database error occurred.'))
        const loader = userLoaderByKey(query, i18n)

        try {
          await loader.load(expectedUser._key)
        } catch (err) {
          expect(err).toEqual(new Error('todo'))
        }

        expect(consoleOutput).toEqual([
          `Database error occurred when running userLoaderByKey: Error: Database error occurred.`,
        ])
      })
    })
    describe('cursor error is raised', () => {
      it('throws an error', async () => {
        const expectedCursor = await query`
        FOR user IN users
          FILTER user.userName == "random@email.ca"
          RETURN user
      `
        const expectedUser = await expectedCursor.next()

        const cursor = {
          each() {
            throw new Error('Cursor error occurred.')
          },
        }
        query = jest.fn().mockReturnValue(cursor)
        const loader = userLoaderByKey(query, i18n)

        try {
          await loader.load(expectedUser._key)
        } catch (err) {
          expect(err).toEqual(new Error('todo'))
        }

        expect(consoleOutput).toEqual([
          `Cursor error occurred during userLoaderByKey: Error: Cursor error occurred.`,
        ])
      })
    })
  })
})
