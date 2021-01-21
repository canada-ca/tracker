require('dotenv-safe').config({
  allowEmptyValues: true,
  example: '.env.example',
})

const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { makeMigrations } = require('../../../migrations')

const { removeOwnerships } = require('..')

describe('given the removeOwnership function', () => {
  const consoleErrorOutput = []
  const consoleInfoOutput = []
  const mockedError = (output) => consoleErrorOutput.push(output)
  const mockedInfo = (output) => consoleInfoOutput.push(output)

  let query, drop, truncate, migrate, collections

  beforeEach(async () => {
    console.error = mockedError
    console.info = mockedInfo
    consoleErrorOutput.length = 0
    consoleInfoOutput.length = 0

    // Generate DB Items
    ;({ migrate } = await ArangoTools({ rootPass, url }))
    ;({ query, drop, truncate, collections } = await migrate(
      makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
    ))

    await truncate()
  })

  afterEach(async () => {
    await drop()
  })

  describe('given a successful removal', () => {
    let org, domain
    beforeEach(async () => {
      org = await collections.organizations.save({
        orgDetails: {
          en: {
            slug: 'test-org',
            acronym: 'TEST',
            name: 'Test Org',
            zone: 'TEST',
            sector: 'TEST',
            country: 'Test',
            province: 'Test',
            city: 'Test',
          },
          fr: {
            slug: 'test-org',
            acronym: 'TEST',
            name: 'Test Org',
            zone: 'TEST',
            sector: 'TEST',
            country: 'Test',
            province: 'Test',
            city: 'Test',
          },
        },
      })
      domain = await collections.domains.save({
        domain: 'test.gc.ca',
        slug: 'test-gc-ca',
        lastRan: null,
        selectors: ['selector1._domainkey', 'selector2._domainkey'],
      })
      await collections.ownership.save({
        _to: domain._id,
        _from: org._id,
      })
    })
    it('leaves the ownership collection empty', async () => {
      await removeOwnerships({ query })

      const cursor = await query`
          FOR item IN ownership
            RETURN item
        `
      expect(cursor.count).toBe(0)
    })
  })
  describe('given an unsuccessful removal', () => {
    describe('database error occurs', () => {
      it('logs an error', async () => {
        const mockedQuery = jest
          .fn()
          .mockRejectedValue(new Error('Database Error Occurred'))
        await removeOwnerships({ query: mockedQuery })

        expect(consoleErrorOutput).toEqual([
          `Error occurred while removing current ownerships: Error: Database Error Occurred`,
        ])
      })
    })
  })
})
