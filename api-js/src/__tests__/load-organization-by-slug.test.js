const dotenv = require('dotenv-safe')
dotenv.config()
const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { setupI18n } = require('@lingui/core')

const englishMessages = require('../locale/en/messages')
const frenchMessages = require('../locale/fr/messages')
const { makeMigrations } = require('../../migrations')
const { orgLoaderBySlug } = require('../loaders')

describe('given a orgLoaderByKey dataloader', () => {
  let query, drop, truncate, migrate, collections, i18n

  let consoleOutput = []
  const mockedError = (output) => consoleOutput.push(output)
  beforeAll(async () => {
    console.error = mockedError
    ;({ migrate } = await ArangoTools({ rootPass, url }))
    ;({ query, drop, truncate, collections } = await migrate(
      makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
    ))
  })

  beforeEach(async () => {
    await truncate()
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
    consoleOutput = []
  })

  afterAll(async () => {
    await drop()
  })

  describe('language is set to english', () => {
    beforeAll(() => {
      i18n = setupI18n({
        language: 'en',
        locales: ['en', 'fr'],
        missing: 'Traduction manquante',
        catalogs: {
          en: englishMessages,
          fr: frenchMessages,
        },
      })
    })
    describe('provided a single slug', () => {
      it('returns a single org', async () => {
        // Get Org From db
        const expectedCursor = await query`
          FOR org IN organizations
            FILTER org.orgDetails.en.slug == "communications-security-establishment"
            LET domains = (FOR v, e IN 1..1 OUTBOUND org._id claims RETURN e._to)
            RETURN MERGE({ _id: org._id, _key: org._key, _rev: org._rev, blueCheck: org.blueCheck, domainCount: COUNT(domains) }, TRANSLATE("en", org.orgDetails))
        `
        const expectedOrg = await expectedCursor.next()

        const loader = orgLoaderBySlug(query, 'en', i18n)
        const org = await loader.load(expectedOrg.slug)

        expect(org).toEqual(expectedOrg)
      })
    })
    describe('provided a list of slugs', () => {
      it('returns a list of orgs', async () => {
        const orgSlugs = []
        const expectedOrgs = []
        const expectedCursor = await query`
          FOR org IN organizations
            LET domains = (FOR v, e IN 1..1 OUTBOUND org._id claims RETURN e._to)
            RETURN MERGE({ _id: org._id, _key: org._key, _rev: org._rev, blueCheck: org.blueCheck, domainCount: COUNT(domains) }, TRANSLATE("en", org.orgDetails))
        `

        while (expectedCursor.hasNext()) {
          const tempOrg = await expectedCursor.next()
          orgSlugs.push(tempOrg.slug)
          expectedOrgs.push(tempOrg)
        }

        const loader = orgLoaderBySlug(query, 'en', i18n)
        const orgs = await loader.loadMany(orgSlugs)
        expect(orgs).toEqual(expectedOrgs)
      })
    })
    describe('database error is raised', () => {
      it('returns an error', async () => {
        const mockedQuery = jest
          .fn()
          .mockRejectedValue(new Error('Database error occurred.'))
        const loader = orgLoaderBySlug(mockedQuery, 'en', i18n)

        try {
          await loader.load('slug')
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to find organization. Please try again.'),
          )
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
        const mockedQuery = jest.fn().mockReturnValue(cursor)
        const loader = orgLoaderBySlug(mockedQuery, 'fr', i18n)

        try {
          await loader.load('slug')
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to find organization. Please try again.'),
          )
        }

        expect(consoleOutput).toEqual([
          `Cursor error during orgLoaderBySlug: Error: Cursor error occurred.`,
        ])
      })
    })
  })
  describe('language is set to french', () => {
    beforeAll(() => {
      i18n = setupI18n({
        language: 'fr',
        locales: ['en', 'fr'],
        missing: 'Traduction manquante',
        catalogs: {
          en: englishMessages,
          fr: frenchMessages,
        },
      })
    })
    describe('provided a single slug', () => {
      it('returns a single org', async () => {
        // Get Org From db
        const expectedCursor = await query`
          FOR org IN organizations
            FILTER org.orgDetails.fr.slug == "centre-de-la-securite-des-telecommunications"
            LET domains = (FOR v, e IN 1..1 OUTBOUND org._id claims RETURN e._to)
            RETURN MERGE({ _id: org._id, _key: org._key, _rev: org._rev, blueCheck: org.blueCheck, domainCount: COUNT(domains) }, TRANSLATE("fr", org.orgDetails))
        `
        const expectedOrg = await expectedCursor.next()

        const loader = orgLoaderBySlug(query, 'fr', i18n)
        const org = await loader.load(expectedOrg.slug)

        expect(org).toEqual(expectedOrg)
      })
    })
    describe('provided a list of slugs', () => {
      it('returns a list of orgs', async () => {
        const orgSlugs = []
        const expectedOrgs = []
        const expectedCursor = await query`
          FOR org IN organizations
            LET domains = (FOR v, e IN 1..1 OUTBOUND org._id claims RETURN e._to)
            RETURN MERGE({ _id: org._id, _key: org._key, _rev: org._rev, blueCheck: org.blueCheck, domainCount: COUNT(domains) }, TRANSLATE("fr", org.orgDetails))
        `

        while (expectedCursor.hasNext()) {
          const tempOrg = await expectedCursor.next()
          orgSlugs.push(tempOrg.slug)
          expectedOrgs.push(tempOrg)
        }

        const loader = orgLoaderBySlug(query, 'fr', i18n)
        const orgs = await loader.loadMany(orgSlugs)
        expect(orgs).toEqual(expectedOrgs)
      })
    })
    describe('database error is raised', () => {
      it('returns an error', async () => {
        const mockedQuery = jest
          .fn()
          .mockRejectedValue(new Error('Database error occurred.'))
        const loader = orgLoaderBySlug(mockedQuery, 'en', i18n)

        try {
          await loader.load('slug')
        } catch (err) {
          expect(err).toEqual(new Error('todo'))
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
        const mockedQuery = jest.fn().mockReturnValue(cursor)
        const loader = orgLoaderBySlug(mockedQuery, 'fr', i18n)

        try {
          await loader.load('slug')
        } catch (err) {
          expect(err).toEqual(new Error('todo'))
        }

        expect(consoleOutput).toEqual([
          `Cursor error during orgLoaderBySlug: Error: Cursor error occurred.`,
        ])
      })
    })
  })
})
