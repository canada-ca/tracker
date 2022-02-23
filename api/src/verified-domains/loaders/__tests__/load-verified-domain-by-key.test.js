import { ensure, dbNameFromFile } from 'arango-tools'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { loadVerifiedDomainByKey } from '../../loaders'
import dbschema from '../../../../database.json';

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given a loadVerifiedDomainByKey dataloader', () => {
  let query, drop, truncate, collections, i18n, domain1, domain2, org
  const consoleOutput = []
  const mockedError = (output) => consoleOutput.push(output)
  beforeAll(() => {
    console.error = mockedError
  })
  afterEach(() => {
    consoleOutput.length = 0
  })

  describe('given a successful load', () => {
    beforeAll(async () => {
      ;({ query, drop, truncate, collections } = await ensure({
      variables: {
        dbname: dbNameFromFile(__filename),
        username: 'root',
        rootPassword: rootPass,
        password: rootPass,
        url,
      },

      schema: dbschema,
    }))
    })
    beforeEach(async () => {
      org = await collections.organizations.save({
        verified: true,
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
      domain1 = await collections.domains.save({
        domain: 'test.canada.ca',
      })
      domain2 = await collections.domains.save({
        domain: 'test.gc.ca',
      })
      await collections.claims.save({
        _from: org._id,
        _to: domain1._id,
      })
      await collections.claims.save({
        _from: org._id,
        _to: domain2._id,
      })
    })
    afterEach(async () => {
      await truncate()
    })
    afterAll(async () => {
      await drop()
    })
    describe('provided a single id', () => {
      it('returns a single domain', async () => {
        // Get Domain From db
        const expectedCursor = await query`
          FOR domain IN domains
            FILTER domain.domain == "test.canada.ca"
            RETURN MERGE(domain, { id: domain._key, _type: "verifiedDomain" })
        `
        const expectedDomain = await expectedCursor.next()

        const loader = loadVerifiedDomainByKey({ query })
        const user = await loader.load(expectedDomain._key)

        expect(user).toEqual(expectedDomain)
      })
    })
    describe('provided a list of ids', () => {
      it('returns a list of domains', async () => {
        const domainIds = []
        const expectedDomains = []
        const expectedCursor = await query`
          FOR domain IN domains
            RETURN MERGE(domain, { id: domain._key, _type: "verifiedDomain" })
        `

        while (expectedCursor.hasMore) {
          const tempUser = await expectedCursor.next()
          domainIds.push(tempUser._key)
          expectedDomains.push(tempUser)
        }

        const loader = loadVerifiedDomainByKey({ query })
        const users = await loader.loadMany(domainIds)
        expect(users).toEqual(expectedDomains)
      })
    })
  })
  describe('given an unsuccessful load', () => {
    describe('users language is set to english', () => {
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
      describe('database error is raised', () => {
        it('returns an error', async () => {
          const mockedQuery = jest
            .fn()
            .mockRejectedValue(new Error('Database error occurred.'))
          const loader = loadVerifiedDomainByKey({ query: mockedQuery, i18n })

          try {
            await loader.load('1')
          } catch (err) {
            expect(err).toEqual(
              new Error('Unable to load verified domain(s). Please try again.'),
            )
          }

          expect(consoleOutput).toEqual([
            `Database error occurred when running loadVerifiedDomainByKey: Error: Database error occurred.`,
          ])
        })
      })
      describe('cursor error is raised', () => {
        it('throws an error', async () => {
          const cursor = {
            forEach() {
              throw new Error('Cursor error occurred.')
            },
          }
          const mockedQuery = jest.fn().mockReturnValue(cursor)
          const loader = loadVerifiedDomainByKey({ query: mockedQuery, i18n })

          try {
            await loader.load('1')
          } catch (err) {
            expect(err).toEqual(
              new Error('Unable to load verified domain(s). Please try again.'),
            )
          }

          expect(consoleOutput).toEqual([
            `Cursor error occurred during loadVerifiedDomainByKey: Error: Cursor error occurred.`,
          ])
        })
      })
    })
    describe('users language is set to french', () => {
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
      describe('database error is raised', () => {
        it('returns an error', async () => {
          const mockedQuery = jest
            .fn()
            .mockRejectedValue(new Error('Database error occurred.'))
          const loader = loadVerifiedDomainByKey({ query: mockedQuery, i18n })

          try {
            await loader.load('1')
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'Impossible de charger le(s) domaine(s) vérifié(s). Veuillez réessayer.',
              ),
            )
          }

          expect(consoleOutput).toEqual([
            `Database error occurred when running loadVerifiedDomainByKey: Error: Database error occurred.`,
          ])
        })
      })
      describe('cursor error is raised', () => {
        it('throws an error', async () => {
          const cursor = {
            forEach() {
              throw new Error('Cursor error occurred.')
            },
          }
          const mockedQuery = jest.fn().mockReturnValue(cursor)
          const loader = loadVerifiedDomainByKey({ query: mockedQuery, i18n })

          try {
            await loader.load('1')
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'Impossible de charger le(s) domaine(s) vérifié(s). Veuillez réessayer.',
              ),
            )
          }

          expect(consoleOutput).toEqual([
            `Cursor error occurred during loadVerifiedDomainByKey: Error: Cursor error occurred.`,
          ])
        })
      })
    })
  })
})
