const dotenv = require('dotenv-safe')
dotenv.config()
const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { makeMigrations } = require('../../migrations')
const { orgLoaderByDomainId } = require('../loaders')

describe('given a orgLoaderById dataloader', () => {
  let query, drop, truncate, migrate, collections, domain, org

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
      blueCheck: true,
      orgDetails: {
        en: {
          slug: 'treasury-board-secretariat',
          acronym: 'TBS',
          name: 'Treasury Board of Canada Secretariat',
          zone: 'FED',
          sector: 'TBS',
          country: 'Canada',
          province: 'Ontario',
          city: 'Ottawa',
        },
        fr: {
          slug: 'secretariat-conseil-tresor',
          acronym: 'SCT',
          name: 'Secrétariat du Conseil Trésor du Canada',
          zone: 'FED',
          sector: 'TBS',
          country: 'Canada',
          province: 'Ontario',
          city: 'Ottawa',
        },
      },
    })
    await collections.organizations.save({
      blueCheck: true,
      orgDetails: {
        en: {
          slug: 'communications-security-establishment',
          acronym: 'CSE',
          name: 'Communications Security Establishment',
          zone: 'FED',
          sector: 'DND',
          country: 'Canada',
          province: 'Ontario',
          city: 'Ottawa',
        },
        fr: {
          slug: 'centre-de-la-securite-des-telecommunications',
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
    const orgCursor = await query`
      FOR org IN organizations
        FILTER (LOWER("treasury-board-secretariat") == LOWER(TRANSLATE("en", org.orgDetails).slug))
        RETURN MERGE({ _id: org._id, _key: org._key, _rev: org._rev, blueCheck: org.blueCheck }, TRANSLATE("en", org.orgDetails))
    `
    org = await orgCursor.next()
    consoleOutput = []
  })

  afterEach(async () => {
    await drop()
  })

  describe('provided a singled domain', () => {
    beforeEach(async () => {
      await collections.domains.save({
        url: 'test.gc.ca',
      })
      const domainCursor = await query`
        FOR domain IN domains
          FILTER domain.url == "test.gc.ca"
          RETURN domain
      `
      domain = await domainCursor.next()

      await collections.claims.save({
        _to: domain._id,
        _from: org._id,
      })
    })
    describe('language is set to english', () => {
      it('returns a single org', async () => {
        const expectedDomainCursor = await query`
          FOR domain IN domains
            FILTER domain.url == 'test.gc.ca'
            RETURN domain
        `
        const expectedDomain = await expectedDomainCursor.next()

        const expectedOrgCursor = await query`
          FOR org IN organizations
          FILTER org.orgDetails.en.slug == "treasury-board-secretariat"
          RETURN MERGE({ _id: org._id, _key: org._key, _rev: org._rev, blueCheck: org.blueCheck }, TRANSLATE("en", org.orgDetails))
        `
        const expectedOrg = await expectedOrgCursor.next()

        const loader = orgLoaderByDomainId(query, 'en')
        const org = await loader.load(expectedDomain._id)
        expect(org).toEqual(expectedOrg)
      })
    })
    describe('language is set to french', () => {
      it('returns a single org', async () => {
        const expectedDomainCursor = await query`
          FOR domain IN domains
            FILTER domain.url == 'test.gc.ca'
            RETURN domain
        `
        const expectedDomain = await expectedDomainCursor.next()

        const expectedOrgCursor = await query`
          FOR org IN organizations
          FILTER org.orgDetails.en.slug == "treasury-board-secretariat"
          RETURN MERGE({ _id: org._id, _key: org._key, _rev: org._rev, blueCheck: org.blueCheck }, TRANSLATE("fr", org.orgDetails))
        `
        const expectedOrg = await expectedOrgCursor.next()

        const loader = orgLoaderByDomainId(query, 'fr')
        const org = await loader.load(expectedDomain._id)
        expect(org).toEqual(expectedOrg)
      })
    })
  })
  describe('provided a list of domains', () => {
    describe('domains belong to one org', () => {
      beforeEach(async () => {
        await collections.domains.save({
          url: 'test.gc.ca',
        })
        let domainCursor = await query`
          FOR domain IN domains
            FILTER domain.url == 'test.gc.ca'
            RETURN domain
        `
        domain = await domainCursor.next()
        await collections.claims.save({
          _to: domain._id,
          _from: org._id,
        })

        await collections.domains.save({
          url: 'test.canada.ca',
        })
        domainCursor = await query`
          FOR domain IN domains
            FILTER domain.url == 'test.canada.ca'
            RETURN domain
        `
        domain = await domainCursor.next()
        await collections.claims.save({
          _to: domain._id,
          _from: org._id,
        })
      })
      describe('language is set to english', () => {
        it('returns a list of orgs', async () => {
          const domainIds = []
          const expectedDomains = []
          const expectedDomainCursor = await query`
            FOR domain IN domains
              RETURN domain
          `
          while (expectedDomainCursor.hasNext()) {
            const tempDomain = await expectedDomainCursor.next()
            domainIds.push(tempDomain._id)
            expectedDomains.push(tempDomain)
          }

          const expectedOrgCursor = await query`
            FOR org IN organizations
            FILTER org.orgDetails.en.slug == "treasury-board-secretariat"
            RETURN MERGE({ _id: org._id, _key: org._key, _rev: org._rev, blueCheck: org.blueCheck }, TRANSLATE("en", org.orgDetails))
          `
          const expectedOrg = await expectedOrgCursor.next()
          const expectedOrgs = []
          for (let i = 0; i < 2; i++) {
            expectedOrgs.push(expectedOrg)
          }

          const loader = orgLoaderByDomainId(query, 'en')
          const orgs = await loader.loadMany(domainIds)
          expect(orgs).toEqual(expectedOrgs)
        })
      })
      describe('language is set to french', () => {
        it('returns a list of orgs', async () => {
          const domainIds = []
          const expectedDomains = []
          const expectedDomainCursor = await query`
            FOR domain IN domains
              RETURN domain
          `
          while (expectedDomainCursor.hasNext()) {
            const tempDomain = await expectedDomainCursor.next()
            domainIds.push(tempDomain._id)
            expectedDomains.push(tempDomain)
          }

          const expectedOrgCursor = await query`
            FOR org IN organizations
            FILTER org.orgDetails.en.slug == "treasury-board-secretariat"
            RETURN MERGE({ _id: org._id, _key: org._key, _rev: org._rev, blueCheck: org.blueCheck }, TRANSLATE("fr", org.orgDetails))
          `
          const expectedOrg = await expectedOrgCursor.next()
          const expectedOrgs = []
          for (let i = 0; i < 2; i++) {
            expectedOrgs.push(expectedOrg)
          }

          const loader = orgLoaderByDomainId(query, 'fr')
          const orgs = await loader.loadMany(domainIds)
          expect(orgs).toEqual(expectedOrgs)
        })
      })
    })
    describe('domains belong to different orgs', () => {
      beforeEach(async () => {
        await collections.domains.save({
          url: 'test.gc.ca',
        })
        let domainCursor = await query`
          FOR domain IN domains
            FILTER domain.url == 'test.gc.ca'
            RETURN domain
        `
        domain = await domainCursor.next()
        await collections.claims.save({
          _to: domain._id,
          _from: org._id,
        })

        const orgCursor = await query`
          FOR org IN organizations
            FILTER (LOWER("centre-de-la-securite-des-telecommunications") == LOWER(TRANSLATE("fr", org.orgDetails).slug))
            RETURN MERGE({ _id: org._id, _key: org._key, _rev: org._rev, blueCheck: org.blueCheck }, TRANSLATE("en", org.orgDetails))
        `
        org = await orgCursor.next()

        await collections.domains.save({
          url: 'test.canada.ca',
        })
        domainCursor = await query`
          FOR domain IN domains
            FILTER domain.url == 'test.canada.ca'
            RETURN domain
        `
        domain = await domainCursor.next()
        await collections.claims.save({
          _to: domain._id,
          _from: org._id,
        })
      })
      describe('language is set to english', () => {
        it('returns a list of orgs', async () => {
          const domainIds = []
          const expectedDomains = []
          const expectedDomainCursor = await query`
            FOR domain IN domains
              RETURN domain
          `
          while (expectedDomainCursor.hasNext()) {
            const tempDomain = await expectedDomainCursor.next()
            domainIds.push(tempDomain._id)
            expectedDomains.push(tempDomain)
          }

          const orgIds = []
          const expectedOrgs = []
          const expectedOrgCursor = await query`
            FOR org IN organizations
              RETURN MERGE({ _id: org._id, _key: org._key, _rev: org._rev, blueCheck: org.blueCheck }, TRANSLATE("en", org.orgDetails))
          `
          while (expectedOrgCursor.hasNext()) {
            const tempOrg = await expectedOrgCursor.next()
            orgIds.push(tempOrg._key)
            expectedOrgs.push(tempOrg)
          }

          const loader = orgLoaderByDomainId(query, 'en')
          const orgs = await loader.loadMany(domainIds)
          expect(orgs).toEqual(expectedOrgs)
        })
      })
      describe('language is set to french', () => {
        it('returns a list of orgs', async () => {
          const domainIds = []
          const expectedDomains = []
          const expectedDomainCursor = await query`
            FOR domain IN domains
              RETURN domain
          `
          while (expectedDomainCursor.hasNext()) {
            const tempDomain = await expectedDomainCursor.next()
            domainIds.push(tempDomain._id)
            expectedDomains.push(tempDomain)
          }

          const orgIds = []
          const expectedOrgs = []
          const expectedOrgCursor = await query`
            FOR org IN organizations
              RETURN MERGE({ _id: org._id, _key: org._key, _rev: org._rev, blueCheck: org.blueCheck }, TRANSLATE("fr", org.orgDetails))
          `
          while (expectedOrgCursor.hasNext()) {
            const tempOrg = await expectedOrgCursor.next()
            orgIds.push(tempOrg._key)
            expectedOrgs.push(tempOrg)
          }

          const loader = orgLoaderByDomainId(query, 'fr')
          const orgs = await loader.loadMany(domainIds)
          expect(orgs).toEqual(expectedOrgs)
        })
      })
    })
  })
  describe('database error is raised', () => {
    it('returns an error', async () => {
      query = jest.fn().mockRejectedValue(new Error('Database error occurred.'))
      const loader = orgLoaderByDomainId(query)

      try {
        await loader.load('1')
      } catch (err) {
        expect(err).toEqual(
          new Error('Unable to find organization. Please try again.'),
        )
      }

      expect(consoleOutput).toEqual([
        `Database error occurred while running orgLoaderByDomainId: Error: Database error occurred.`,
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
      const loader = orgLoaderByDomainId(query)
      try {
        await loader.load('1')
      } catch (err) {
        expect(err).toEqual(
          new Error('Unable to find organization. Please try again.'),
        )
      }

      expect(consoleOutput).toEqual([
        `Cursor error occurred during orgLoaderByDomainId: Error: Cursor error occurred.`,
      ])
    })
  })
})
