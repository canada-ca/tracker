import { ensure, dbNameFromFile } from 'arango-tools'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { databaseOptions } from '../../../../database-options'
import { loadUserByKey } from '../index'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given a loadUserByKey dataloader', () => {
  let query, drop, truncate, collections, i18n

  const consoleOutput = []
  const mockedError = (output) => consoleOutput.push(output)
  beforeAll(async () => {
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
    await collections.users.save({
      userName: 'random@email.ca',
      displayName: 'Random Name',
      preferredLang: 'english',
      tfaValidated: false,
      emailValidated: false,
    })
    consoleOutput.length = 0
  })

  afterEach(async () => {
    await truncate()
  })

  afterAll(async () => {
    await drop()
  })

  describe('provided a single id', () => {
    it('returns a single user', async () => {
      // Get User From db
      const expectedCursor = await query`
        FOR user IN users
          FILTER user.userName == "random@email.ca"
          RETURN MERGE({ id: user._key, _type: "user" }, user)
      `
      const expectedUser = await expectedCursor.next()

      const loader = loadUserByKey({ query })
      const user = await loader.load(expectedUser._key)

      expect(user).toEqual(expectedUser)
    })
  })
  describe('provided a list of ids', () => {
    it('returns a list of users', async () => {
      const userKeys = []
      const expectedUsers = []
      const expectedCursor = await query`
        FOR user IN users
          RETURN MERGE({ id: user._key, _type: "user" }, user)
      `

      while (expectedCursor.hasMore) {
        const tempUser = await expectedCursor.next()
        userKeys.push(tempUser._key)
        expectedUsers.push(tempUser)
      }

      const loader = loadUserByKey({ query })
      const users = await loader.loadMany(userKeys)
      expect(users).toEqual(expectedUsers)
    })
  })
  describe('users language is set to english', () => {
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
    describe('database error is raised', () => {
      it('returns an error', async () => {
        const expectedCursor = await query`
          FOR user IN users
            FILTER user.userName == "random@email.ca"
            RETURN MERGE({ id: user._key, _type: "user" }, user)
        `
        const expectedUser = await expectedCursor.next()

        const mockedQuery = jest
          .fn()
          .mockRejectedValue(new Error('Database error occurred.'))
        const loader = loadUserByKey({
          query: mockedQuery,
          userKey: '1234',
          i18n,
        })

        try {
          await loader.load(expectedUser._key)
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to load user(s). Please try again.'),
          )
        }

        expect(consoleOutput).toEqual([
          `Database error occurred when user: 1234 running loadUserByKey: Error: Database error occurred.`,
        ])
      })
    })
    describe('cursor error is raised', () => {
      it('throws an error', async () => {
        const expectedCursor = await query`
          FOR user IN users
            FILTER user.userName == "random@email.ca"
            RETURN MERGE({ id: user._key, _type: "user" }, user)
        `
        const expectedUser = await expectedCursor.next()

        const cursor = {
          forEach() {
            throw new Error('Cursor error occurred.')
          },
        }
        const mockedQuery = jest.fn().mockReturnValue(cursor)
        const loader = loadUserByKey({
          query: mockedQuery,
          userKey: '1234',
          i18n,
        })

        try {
          await loader.load(expectedUser._key)
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to load user(s). Please try again.'),
          )
        }

        expect(consoleOutput).toEqual([
          `Cursor error occurred when user: 1234 funning loadUserByKey: Error: Cursor error occurred.`,
        ])
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
    describe('database error is raised', () => {
      it('returns an error', async () => {
        const expectedCursor = await query`
          FOR user IN users
            FILTER user.userName == "random@email.ca"
            RETURN MERGE({ id: user._key, _type: "user" }, user)
        `
        const expectedUser = await expectedCursor.next()

        const mockedQuery = jest
          .fn()
          .mockRejectedValue(new Error('Database error occurred.'))
        const loader = loadUserByKey({
          query: mockedQuery,
          userKey: '1234',
          i18n,
        })

        try {
          await loader.load(expectedUser._key)
        } catch (err) {
          expect(err).toEqual(new Error('todo'))
        }

        expect(consoleOutput).toEqual([
          `Database error occurred when user: 1234 running loadUserByKey: Error: Database error occurred.`,
        ])
      })
    })
    describe('cursor error is raised', () => {
      it('throws an error', async () => {
        const expectedCursor = await query`
          FOR user IN users
            FILTER user.userName == "random@email.ca"
            RETURN MERGE({ id: user._key, _type: "user" }, user)
        `
        const expectedUser = await expectedCursor.next()

        const cursor = {
          forEach() {
            throw new Error('Cursor error occurred.')
          },
        }
        const mockedQuery = jest.fn().mockReturnValue(cursor)
        const loader = loadUserByKey({
          query: mockedQuery,
          userKey: '1234',
          i18n,
        })

        try {
          await loader.load(expectedUser._key)
        } catch (err) {
          expect(err).toEqual(new Error('todo'))
        }

        expect(consoleOutput).toEqual([
          `Cursor error occurred when user: 1234 funning loadUserByKey: Error: Cursor error occurred.`,
        ])
      })
    })
  })
})
