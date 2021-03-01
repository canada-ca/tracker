import { ensure, dbNameFromFile } from 'arango-tools'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { databaseOptions } from '../../../../database-options'
import { verifiedOrgLoaderBySlug } from '../../loaders'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given a verifiedOrgLoaderBySlug dataloader', () => {
  let query, drop, truncate, collections, i18n

  let consoleOutput = []
  const mockedError = (output) => consoleOutput.push(output)
  beforeAll(async () => {
    console.error = mockedError
    ;({ query, drop, truncate, collections } = await ensure({
      type: 'database',
      name: dbNameFromFile(__filename),
      url,
      rootPassword: rootPass,
      options: databaseOptions({ rootPass }),
    }))
  })

  beforeEach(async () => {
    await collections.organizations.save({
      verified: true,
      summaries: {
        web: {
          pass: 50,
          fail: 1000,
          total: 1050,
        },
        mail: {
          pass: 50,
          fail: 1000,
          total: 1050,
        },
      },
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
      verified: true,
      summaries: {
        web: {
          pass: 50,
          fail: 1000,
          total: 1050,
        },
        mail: {
          pass: 50,
          fail: 1000,
          total: 1050,
        },
      },
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
  })

  afterEach(async () => {
    consoleOutput = []
    await truncate()
  })

  afterAll(async () => {
    await drop()
  })

  describe('language is set to english', () => {
    beforeAll(() => {
      i18n = setupI18n({
        locale: 'en',
        localeData: {
          en: { plurals: {} },
          fr: { plurals: {} },
        },
        locales: ['en', 'fr'],
        messages: {
          en: englishMessages.messages,
          fr: frenchMessages.messages,
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
            RETURN MERGE({ _id: org._id, _key: org._key, id: org._key, _rev: org._rev, _type: "verifiedOrganization", verified: org.verified, domainCount: COUNT(domains), summaries: org.summaries }, TRANSLATE("en", org.orgDetails))
        `
        const expectedOrg = await expectedCursor.next()

        const loader = verifiedOrgLoaderBySlug(query, 'en', i18n)
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
            RETURN MERGE({ _id: org._id, _key: org._key, id: org._key, _rev: org._rev, _type: "verifiedOrganization", verified: org.verified, domainCount: COUNT(domains), summaries: org.summaries }, TRANSLATE("en", org.orgDetails))
        `

        while (expectedCursor.hasMore) {
          const tempOrg = await expectedCursor.next()
          orgSlugs.push(tempOrg.slug)
          expectedOrgs.push(tempOrg)
        }

        const loader = verifiedOrgLoaderBySlug(query, 'en', i18n)
        const orgs = await loader.loadMany(orgSlugs)
        expect(orgs).toEqual(expectedOrgs)
      })
    })
    describe('database error is raised', () => {
      it('returns an error', async () => {
        const mockedQuery = jest
          .fn()
          .mockRejectedValue(new Error('Database error occurred.'))
        const loader = verifiedOrgLoaderBySlug(mockedQuery, 'en', i18n)

        try {
          await loader.load('slug')
        } catch (err) {
          expect(err).toEqual(
            new Error(
              'Unable to find verified organization. Please try again.',
            ),
          )
        }

        expect(consoleOutput).toEqual([
          `Database error when running verifiedOrgLoaderBySlug: Error: Database error occurred.`,
        ])
      })
    })
    describe('cursor error is raised', () => {
      it('returns an error', async () => {
        const cursor = {
          forEach() {
            throw new Error('Cursor error occurred.')
          },
        }
        const mockedQuery = jest.fn().mockReturnValue(cursor)
        const loader = verifiedOrgLoaderBySlug(mockedQuery, 'fr', i18n)

        try {
          await loader.load('slug')
        } catch (err) {
          expect(err).toEqual(
            new Error(
              'Unable to find verified organization. Please try again.',
            ),
          )
        }

        expect(consoleOutput).toEqual([
          `Cursor error during verifiedOrgLoaderBySlug: Error: Cursor error occurred.`,
        ])
      })
    })
  })
  describe('language is set to french', () => {
    beforeAll(() => {
      i18n = setupI18n({
        locale: 'fr',
        localeData: {
          en: { plurals: {} },
          fr: { plurals: {} },
        },
        locales: ['en', 'fr'],
        messages: {
          en: englishMessages.messages,
          fr: frenchMessages.messages,
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
            RETURN MERGE({ _id: org._id, _key: org._key, id: org._key, _rev: org._rev, _type: "verifiedOrganization", verified: org.verified, domainCount: COUNT(domains), summaries: org.summaries }, TRANSLATE("fr", org.orgDetails))
        `
        const expectedOrg = await expectedCursor.next()

        const loader = verifiedOrgLoaderBySlug(query, 'fr', i18n)
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
            RETURN MERGE({ _id: org._id, _key: org._key, id: org._key, _rev: org._rev, _type: "verifiedOrganization", verified: org.verified, domainCount: COUNT(domains), summaries: org.summaries }, TRANSLATE("fr", org.orgDetails))
        `

        while (expectedCursor.hasMore) {
          const tempOrg = await expectedCursor.next()
          orgSlugs.push(tempOrg.slug)
          expectedOrgs.push(tempOrg)
        }

        const loader = verifiedOrgLoaderBySlug(query, 'fr', i18n)
        const orgs = await loader.loadMany(orgSlugs)
        expect(orgs).toEqual(expectedOrgs)
      })
    })
    describe('database error is raised', () => {
      it('returns an error', async () => {
        const mockedQuery = jest
          .fn()
          .mockRejectedValue(new Error('Database error occurred.'))
        const loader = verifiedOrgLoaderBySlug(mockedQuery, 'en', i18n)

        try {
          await loader.load('slug')
        } catch (err) {
          expect(err).toEqual(new Error('todo'))
        }

        expect(consoleOutput).toEqual([
          `Database error when running verifiedOrgLoaderBySlug: Error: Database error occurred.`,
        ])
      })
    })
    describe('cursor error is raised', () => {
      it('returns an error', async () => {
        const cursor = {
          forEach() {
            throw new Error('Cursor error occurred.')
          },
        }
        const mockedQuery = jest.fn().mockReturnValue(cursor)
        const loader = verifiedOrgLoaderBySlug(mockedQuery, 'fr', i18n)

        try {
          await loader.load('slug')
        } catch (err) {
          expect(err).toEqual(new Error('todo'))
        }

        expect(consoleOutput).toEqual([
          `Cursor error during verifiedOrgLoaderBySlug: Error: Cursor error occurred.`,
        ])
      })
    })
  })
})
