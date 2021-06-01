require('dotenv-safe').config({
  allowEmptyValues: true,
  example: '.env.example',
})

const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ensure, dbNameFromFile } = require('arango-tools')
const { databaseOptions } = require('../../../database-options')

const { upsertOwnership } = require('..')

describe('given the upsertOwnership function', () => {
  const consoleErrorOutput = []
  const consoleInfoOutput = []
  const mockedError = (output) => consoleErrorOutput.push(output)
  const mockedInfo = (output) => consoleInfoOutput.push(output)

  beforeEach(() => {
    console.error = mockedError
    console.info = mockedInfo
  })
  afterEach(() => {
    consoleErrorOutput.length = 0
    consoleInfoOutput.length = 0
  })

  describe('given a successful upseration operation', () => {
    let org, domain, query, drop, truncate, collections
    beforeAll(async () => {
      // Generate DB Items
      ;({ query, drop, truncate, collections } = await ensure({
        type: 'database',
        name: dbNameFromFile(__filename),
        url,
        rootPassword: rootPass,
        options: databaseOptions({ rootPass }),
      }))
    })
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
    afterEach(async () => {
      await truncate()
    })
    afterAll(async () => {
      await drop()
    })
    describe('ownership to domains is assigned to org', () => {
      it('returns the upserted item, with type being set to insert', async () => {
        const ownership = {
          TEST: ['test.gc.ca'],
        }

        await upsertOwnership({ ownership: ownership.TEST, key: 'TEST', query })

        const expectedOwnership = {
          _to: domain._id,
          _from: org._id,
        }

        const cursor = await query`
          FOR item IN ownership
            FILTER item._to == ${domain._id} AND item._from == ${org._id}
            RETURN { _from: item._from, _to: item._to }
        `

        const data = await cursor.next()

        expect(data).toEqual(expectedOwnership)
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
        const ownership = {
          TEST: ['test.gc.ca'],
        }

        await upsertOwnership({ ownership: ownership.TEST, key: 'TEST', query })

        const expectedOwnership = {
          _to: domain._id,
          _from: org._id,
        }

        const cursor = await query`
          FOR item IN ownership 
            FILTER item._to == ${domain._id} AND item._from == ${org._id}
            RETURN { _from: item._from, _to: item._to }
        `

        const data = await cursor.next()

        expect(data).toEqual(expectedOwnership)
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
        const ownership = {
          TEST2: ['test.gc.ca'],
        }

        await upsertOwnership({ ownership: ownership.TEST2, key: 'TEST2', query })

        const expectedOwnership = {
          _to: domain._id,
          _from: org2._id,
        }

        const cursor = await query`
          FOR item IN ownership 
            FILTER item._to == ${domain._id} AND item._from == ${org2._id}
            RETURN { _from: item._from, _to: item._to }
        `
        const data = await cursor.next()

        expect(data).toEqual(expectedOwnership)
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

      await upsertOwnership({ ownerships, key: 'TEST', query: queryMock })

      expect(consoleErrorOutput).toEqual([
        `Error occurred while inserting/updating ownerships for TEST: Error: Database error occurred.`,
      ])
    })
  })
})
