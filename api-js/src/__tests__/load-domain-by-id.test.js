const dotenv = require('dotenv-safe')
dotenv.config()
const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { makeMigrations } = require('../../migrations')
const { domainLoaderById } = require('../loaders')

describe('given a domainLoaderById dataloader', () => {
  let query, drop, truncate, migrate, collections

  let consoleOutput = []
  const mockedError = (output) => consoleOutput.push(output)
  beforeAll(async () => {
    console.error = mockedError
  })

  beforeEach(async () => {
    ;({ migrate } = await ArangoTools({ rootPass, url }))
    ;({ query, drop, truncate, collections } = await migrate(
      makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
    ))
    await truncate()
    await collections.domains.save({
      url: 'test.canada.ca',
      slug: 'test-canada-ca',
    })
    await collections.domains.save({
      url: 'test.gc.ca',
      slug: 'test-gc-ca',
    })
    consoleOutput = []
  })

  afterEach(async () => {
    await drop()
  })

  describe('provided a single id', () => {
    it('returns a single user', async () => {
      // Get Domain From db
      const expectedCursor = await query`
        FOR domain IN domains
          FILTER domain.url == "test.canada.ca"
          RETURN domain
      `
      const expectedDomain = await expectedCursor.next()

      const loader = domainLoaderById(query)
      const user = await loader.load(expectedDomain._key)

      expect(user).toEqual(expectedDomain)
    })
  })
  describe('provided a list of ids', () => {
    it('returns a list of users', async () => {
      const domainIds = []
      const expectedDomains = []
      const expectedCursor = await query`
        FOR domain IN domains
          RETURN domain
      `

      while (expectedCursor.hasNext()) {
        const tempUser = await expectedCursor.next()
        domainIds.push(tempUser._key)
        expectedDomains.push(tempUser)
      }

      const loader = domainLoaderById(query)
      const users = await loader.loadMany(domainIds)
      expect(users).toEqual(expectedDomains)
    })
  })
  describe('database error is raised', () => {
    it('returns an error', async () => {
      const expectedCursor = await query`
        FOR domain IN domains
          FILTER domain.url == "test.canada.ca"
          RETURN domain
      `
      const expectedDomain = await expectedCursor.next()

      query = jest.fn().mockRejectedValue(new Error('Database error occurred.'))
      const loader = domainLoaderById(query)

      try {
        await loader.load(expectedDomain._key)
      } catch (err) {
        expect(err).toEqual(new Error('Unable to find domain. Please try again.'))
      }

      expect(consoleOutput).toEqual([
        `Database error occurred when running domainLoaderById: Error: Database error occurred.`,
      ])
    })
  })
  describe('cursor error is raised', () => {
    it('throws an error', async () => {
      const expectedCursor = await query`
        FOR domain IN domains
          FILTER domain.url == "test.canada.ca"
          RETURN domain
      `
      const expectedDomain = await expectedCursor.next()

      const cursor = {
        each() {
          throw new Error('Cursor error occurred.')
        },
      }
      query = jest.fn().mockReturnValue(cursor)
      const loader = domainLoaderById(query)

      try {
        await loader.load(expectedDomain._key)
      } catch (err) {
        expect(err).toEqual(new Error('Unable to find domain. Please try again.'))
      }

      expect(consoleOutput).toEqual([
        `Cursor error occurred during domainLoaderById: Error: Cursor error occurred.`,
      ])
    })
  })
})
