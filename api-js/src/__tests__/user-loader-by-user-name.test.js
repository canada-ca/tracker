const dotenv = require('dotenv-safe')
dotenv.config()
const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { makeMigrations } = require('../../migrations')
const { userLoaderByUserName } = require('../loaders')

describe('given a userLoaderByUserName dataloader', () => {
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

  describe('provided a single username', () => {
    it('returns a single user', async () => {
      const userName = 'random@email.ca'

      const loader = userLoaderByUserName(query)

      const users = await loader.load(userName)

      // Get Query User
      const cursor = await query`
        FOR user IN users
          FILTER user.userName == ${userName}
          RETURN user
      `
      const expectedUsers = await cursor.next()

      expect(users).toEqual(expectedUsers)
    })
  })

  describe('provided a list of usernames', () => {
    it('returns a list of users', async () => {
      const expectedUsers = []
      const userNames = [
        'random@email.ca',
        'test.account@istio.actually.exists',
      ]

      const loader = userLoaderByUserName(query)

      const users = await loader.loadMany(userNames)

      for (const i in userNames) {
        // Get Query User
        const cursor = await query`
          FOR user IN users
            FILTER user.userName == ${userNames[i]}
            RETURN user
        `
        expectedUsers.push(await cursor.next())
      }

      expect(users).toEqual(expectedUsers)
    })
  })
})
