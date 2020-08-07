const dotenv = require('dotenv-safe')
dotenv.config()
const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { makeMigrations } = require('../../migrations')
let { userLoaderById } = require('../loaders')
const { userRequired } = require('../auth')

describe('given a userLoaderById dataloader', () => {
  let query, drop, truncate, migrate, collections

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
    it('throws the user', async () => {
      // Get User From db
      const expectedCursor = await query`
        FOR user IN users
          FILTER user.userName == "test.account@istio.actually.exists"
          RETURN user
      `
      const expectedUser = await expectedCursor.next()

      const user = await userRequired(expectedUser._key, userLoaderById(query))

      expect(user).toEqual(expectedUser)
    })
  })
  describe('user id is undefined', () => {
    it('throws an error', async () => {
      try {
        await userRequired(undefined, userLoaderById(query))
      } catch (err) {
        expect(err).toEqual(new Error('Authentication error. Please sign in.'))
      }

      expect(consoleOutput).toEqual([
        `User attempted to access controlled content, but userId was undefined`,
      ])
    })
  })
  describe('user cannot be found in database', () => {
    it('throws an error', async () => {
      await truncate()

      try {
        await userRequired('1', userLoaderById(query))
      } catch (err) {
        expect(err).toEqual(new Error('Authentication error. Please sign in.'))
      }

      expect(consoleOutput).toEqual([
        `User: 1 attempted to access controlled content, but no user is associated with that id.`,
      ])
    })
  })
  describe('database error occurs', () => {
    it('throws an error', async () => {
      userLoaderById = () => {
        return {
          load () {
            throw new Error('Database error occurred.')
          },
        }
      } 

      try {
        await userRequired('1', userLoaderById(query))
      } catch (err) {
        expect(err).toEqual(new Error('Authentication error. Please sign in.'))
      }

      expect(consoleOutput).toEqual([
        `Database error occurred when running userRequired: Error: Database error occurred.`,
      ])
    })
  })
})
