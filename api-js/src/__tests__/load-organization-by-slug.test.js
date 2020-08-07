const dotenv = require('dotenv-safe')
dotenv.config()
const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { makeMigrations } = require('../../migrations')
const { orgLoaderBySlug } = require('../loaders')

describe('given a orgLoaderById dataloader', () => {
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
    await collections.organizations.save({
      slugEN: 'communications-security-establishment',
      slugFR: 'centre-de-la-securite-des-telecommunications',
      orgInformation: {
        EN: {
          acronym: 'CSE',
          name: 'Communications Security Establishment',
          zone: 'FED',
          sector: 'DND',
          country: 'Canada',
          province: 'Ontario',
          city: 'Ottawa',
        },
        FR: {
          acronym: 'CST',
          name: 'Centre de la Securite des Telecommunications',
          zone: 'FED',
          sector: 'DND',
          country: 'Canada',
          province: 'Ontario',
          city: 'Ottawa',
        },
      },
    })
    await collections.users.save({
      slugEN: 'treasury-board-secretariat',
      slugFR: 'secretariat-conseil-tresor',
      orgInformation: {
        EN: {
          acronym: 'TBS',
          name: 'Treasury Board of Canada Secretariat',
          zone: 'FED',
          sector: 'TBS',
          country: 'Canada',
          province: 'Ontario',
          city: 'Ottawa',
        },
        FR: {
          acronym: 'CST',
          name: 'Secrétariat du Conseil Trésor du Canada',
          zone: 'FED',
          sector: 'DND',
          country: 'Canada',
          province: 'Ontario',
          city: 'Ottawa',
        },
      },
    })
    consoleOutput = []
  })

  afterEach(async () => {
    await drop()
  })

  describe('provided a single slug', () => {
    describe('slug is in english', () => {
      it('returns a single org', async () => {
        // Get Org From db
        const expectedCursor = await query`
          FOR org IN organizations
            FILTER org.slugFR == "centre-de-la-securite-des-telecommunications"
            RETURN org
        `
        const expectedOrg = await expectedCursor.next()
  
        const loader = orgLoaderBySlug(query)
        const org = await loader.load(expectedOrg.slugEN)
  
        expect(org).toEqual(expectedOrg)
      })
    })
    describe('slug is in french', () => {
      it('returns a single org', async () => {
        // Get Org From db
        const expectedCursor = await query`
          FOR org IN organizations
            FILTER org.slugEN == "communications-security-establishment"
            RETURN org
        `
        const expectedOrg = await expectedCursor.next()
  
        const loader = orgLoaderBySlug(query)
        const org = await loader.load(expectedOrg.slugFR)
  
        expect(org).toEqual(expectedOrg)
      })
    })
  })
  describe('provided a list of ids', () => {
    describe('slug is in english', () => {
      it('returns a list of orgs', async () => {
        const orgSlugs = []
        const expectedOrgs = []
        const expectedCursor = await query`
          FOR org IN organizations
            RETURN org
        `
  
        while (expectedCursor.hasNext()) {
          const tempOrg = await expectedCursor.next()
          orgSlugs.push(tempOrg.slugEN)
          expectedOrgs.push(tempOrg)
        }
  
        const loader = orgLoaderBySlug(query)
        const orgs = await loader.loadMany(orgSlugs)
        expect(orgs).toEqual(expectedOrgs)
      })
    })
    describe('slug is in french', () => {
      it('returns a list of orgs', async () => {
        const orgSlugs = []
        const expectedOrgs = []
        const expectedCursor = await query`
          FOR org IN organizations
            RETURN org
        `
  
        while (expectedCursor.hasNext()) {
          const tempOrg = await expectedCursor.next()
          orgSlugs.push(tempOrg.slugFR)
          expectedOrgs.push(tempOrg)
        }
  
        const loader = orgLoaderBySlug(query)
        const orgs = await loader.loadMany(orgSlugs)
        expect(orgs).toEqual(expectedOrgs)
      })
    })
  })
  describe('database error is raised', () => {
    it('returns an error', async () => {
      query = jest.fn().mockRejectedValue(new Error('Database error occurred.'))
      const loader = orgLoaderBySlug(query)

      try {
        await loader.load('slug')
      } catch (err) {
        expect(err).toEqual(new Error('Unable to find organization. Please try again.'))
      }

      expect(consoleOutput).toEqual([
        `Database error when running orgLoaderBySlug: Error: Database error occurred.`,
      ])
    })
  })
  describe('cursor error is raised', () => {
    it('returns an error', async () => {
      const cursor = {
        each() {
          throw new Error('Cursor error occurred.')
        },
      }
      query = jest.fn().mockReturnValue(cursor)
      const loader = orgLoaderBySlug(query)

      try {
        await loader.load('slug')
      } catch (err) {
        expect(err).toEqual(new Error('Unable to find organization. Please try again.'))
      }

      expect(consoleOutput).toEqual([
        `Cursor error during orgLoaderBySlug: Error: Cursor error occurred.`,
      ])
    })
  })
})
