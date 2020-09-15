const dotenv = require('dotenv-safe')
dotenv.config()
const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { makeMigrations } = require('../../migrations')
const { domainLoaderBySlug } = require('../loaders')

describe('given a domainLoaderBySlug dataloader', () => {
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
      domain: 'test.canada.ca',
      slug: 'test-canada-ca',
    })
    await collections.domains.save({
      domain: 'test.gc.ca',
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
          FILTER domain.domain == "test.canada.ca"
          RETURN domain
      `
      const expectedDomain = await expectedCursor.next()

      const loader = domainLoaderBySlug(query)
      const user = await loader.load(expectedDomain.slug)

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
        domainIds.push(tempUser.slug)
        expectedDomains.push(tempUser)
      }

      const loader = domainLoaderBySlug(query)
      const users = await loader.loadMany(domainIds)
      expect(users).toEqual(expectedDomains)
    })
  })
  describe('database error is raised', () => {
    it('returns an error', async () => {
      const expectedCursor = await query`
        FOR domain IN domains
          FILTER domain.domain == "test.canada.ca"
          RETURN domain
      `
      const expectedDomain = await expectedCursor.next()

      query = jest.fn().mockRejectedValue(new Error('Database error occurred.'))
      const loader = domainLoaderBySlug(query)

      try {
        await loader.load(expectedDomain.slug)
      } catch (err) {
        expect(err).toEqual(
          new Error('Unable to find domain. Please try again.'),
        )
      }

      expect(consoleOutput).toEqual([
        `Database error occurred when running domainLoaderBySlug: Error: Database error occurred.`,
      ])
    })
  })
  describe('cursor error is raised', () => {
    it('throws an error', async () => {
      const expectedCursor = await query`
        FOR domain IN domains
          FILTER domain.domain == "test.canada.ca"
          RETURN domain
      `
      const expectedDomain = await expectedCursor.next()

      const cursor = {
        each() {
          throw new Error('Cursor error occurred.')
        },
      }
      query = jest.fn().mockReturnValue(cursor)
      const loader = domainLoaderBySlug(query)

      try {
        await loader.load(expectedDomain.slug)
      } catch (err) {
        expect(err).toEqual(
          new Error('Unable to find domain. Please try again.'),
        )
      }

      expect(consoleOutput).toEqual([
        `Cursor error occurred during domainLoaderBySlug: Error: Cursor error occurred.`,
      ])
    })
  })
})
