const dotenv = require('dotenv-safe')
dotenv.config()
const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { makeMigrations } = require('../../migrations')
const { userLoaderById } = require('../loaders')

describe('given a userLoaderById dataloader', () => {
  let query, drop, truncate, migrate, collections

  beforeAll(async () => {
    ;({ migrate } = await ArangoTools({ rootPass, url }))
    ;({ query, drop, truncate, collections } = await migrate(
      makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
    ))
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
          RETURN user
      `
      const expectedUser = await expectedCursor.next()

      const loader = userLoaderById(query)
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

      while(expectedCursor.hasNext()) {
        const tempUser = await expectedCursor.next()
        userIds.push(tempUser._key)
        expectedUsers.push(tempUser)
      }

      const loader = userLoaderById(query)
      const users = await loader.loadMany(userIds)
      expect(users).toEqual(expectedUsers)
    })
  })
})