require('dotenv-safe').config({
  allowEmptyValues: true,
  example: '.env.example',
})

const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { makeMigrations } = require('../../migrations')

const { upsertOwnership } = require('../database')

describe('given the upsertOwnership function', () => {
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

  describe('given a successful upseration operation', () => {
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
    })
    describe('ownership to domains is assigned to org', () => {
      it('returns the upserted item, with type being set to insert', async () => {
        const ownerships = {
          TEST: ['test.gc.ca'],
        }

        await upsertOwnership({ ownerships, query })

        const cursor = await query`
            FOR item IN ownership RETURN { _from: item._from, _to: item._to }
          `

        const expectedOwnership = {
          _to: domain._id,
          _from: org._id,
        }
        setTimeout(async () => {
          await expect(cursor.next()).resolves.toEqual(expectedOwnership)
        }, 1000)
      })
    })
    describe('domain is not reassigned', () => {
      beforeEach(async () => {
        await collections.ownership.save({
          _to: domain._id,
          _from: org._id,
        })
      })
      it('returns the upserted item, with type being set to update', async () => {
        const ownerships = {
          TEST: ['test.gc.ca'],
        }

        await upsertOwnership({ ownerships, query })

        const expectedOwnership = {
          _to: domain._id,
          _from: org._id,
        }

        const cursor = await query`
            FOR item IN ownership RETURN { _from: item._from, _to: item._to }
          `
        setTimeout(async () => {
          await expect(cursor.next()).resolves.toEqual(expectedOwnership)
        }, 1000)
      })
    })
    describe('domain is reassigned to a different organization', () => {
      let org2
      beforeEach(async () => {
        await collections.ownership.save({
          _to: domain._id,
          _from: org._id,
        })

        org2 = await collections.organizations.save({
          orgDetails: {
            en: {
              slug: 'test2-org',
              acronym: 'TEST2',
              name: 'Test2 Org',
              zone: 'TEST2',
              sector: 'TEST2',
              country: 'Test2',
              province: 'Test2',
              city: 'Test2',
            },
            fr: {
              slug: 'test2-org',
              acronym: 'TEST2',
              name: 'Test2 Org',
              zone: 'TEST2',
              sector: 'TEST2',
              country: 'Test2',
              province: 'Test2',
              city: 'Test2',
            },
          },
        })
      })
      it('returns the upserted item, with type being set to update', async () => {
        const ownerships = {
          TEST2: ['test.gc.ca'],
        }

        await upsertOwnership({ ownerships, query })

        const expectedOwnership = {
          _to: domain._id,
          _from: org2._id,
        }

        const cursor = await query`
            FOR item IN ownership RETURN { _from: item._from, _to: item._to }
          `
        setTimeout(async () => {
          await expect(cursor.next()).resolves.toEqual(expectedOwnership)
        }, 1000)
      })
    })
  })
  describe('database error occurs', () => {
    it('logs to the console', async () => {
      const queryMock = jest
        .fn()
        .mockRejectedValue(new Error('Database error occurred.'))

      const ownerships = {
        TEST: ['test.gc.ca'],
      }

      await upsertOwnership({ ownerships, query: queryMock })

      setTimeout(async () => {
        expect(consoleErrorOutput).toEqual([
          `Error occurred while inserting/updating ownerships for TEST: Error: Database error occurred.`,
        ])
      }, 1000)
    })
  })
})
