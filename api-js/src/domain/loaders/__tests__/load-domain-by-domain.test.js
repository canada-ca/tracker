import { ensure, dbNameFromFile } from 'arango-tools'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { databaseOptions } from '../../../../database-options'
import { loadDomainByDomain } from '../index'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given a loadDomainByDomain dataloader', () => {
  let query, drop, truncate, collections, i18n
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
        type: 'database',
        name: dbNameFromFile(__filename),
        url,
        rootPassword: rootPass,
        options: databaseOptions({ rootPass }),
      }))
    })
    beforeEach(async () => {
      await collections.domains.save({
        domain: 'test.canada.ca',
      })
      await collections.domains.save({
        domain: 'test.gc.ca',
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
            RETURN MERGE({ id: domain._key, _type: "domain" }, domain)
        `
        const expectedDomain = await expectedCursor.next()

        const loader = loadDomainByDomain({ query })
        const domain = await loader.load(expectedDomain.domain)

        expect(domain).toEqual(expectedDomain)
      })
    })
    describe('provided a list of ids', () => {
      it('returns a list of domains', async () => {
        const domainDomains = []
        const expectedDomains = []
        const expectedCursor = await query`
          FOR domain IN domains
            RETURN MERGE({ id: domain._key, _type: "domain" }, domain)
        `

        while (expectedCursor.hasMore) {
          const tempDomain = await expectedCursor.next()
          domainDomains.push(tempDomain.domain)
          expectedDomains.push(tempDomain)
        }

        const loader = loadDomainByDomain({ query })
        const domains = await loader.loadMany(domainDomains)
        expect(domains).toEqual(expectedDomains)
      })
    })
  })
  describe('users language is set to english', () => {
    beforeAll(() => {
      i18n = setupI18n({
        locale: 'en',
        localeData: {
          en: {},
          fr: {},
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
        const loader = loadDomainByDomain({
          query: mockedQuery,
          userKey: '1234',
          i18n,
        })

        try {
          await loader.load('1')
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to load domain. Please try again.'),
          )
        }

        expect(consoleOutput).toEqual([
          `Database error occurred when user: 1234 running loadDomainByDomain: Error: Database error occurred.`,
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
        const loader = loadDomainByDomain({
          query: mockedQuery,
          userKey: '1234',
          i18n,
        })

        try {
          await loader.load('1')
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to load domain. Please try again.'),
          )
        }

        expect(consoleOutput).toEqual([
          `Cursor error occurred when user: 1234 running loadDomainByDomain: Error: Cursor error occurred.`,
        ])
      })
    })
  })
  describe('users language is set to french', () => {
    beforeAll(() => {
      i18n = setupI18n({
        locale: 'fr',
        localeData: {
          en: {},
          fr: {},
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
        const loader = loadDomainByDomain({
          query: mockedQuery,
          userKey: '1234',
          i18n,
        })

        try {
          await loader.load('1')
        } catch (err) {
          expect(err).toEqual(new Error('todo'))
        }

        expect(consoleOutput).toEqual([
          `Database error occurred when user: 1234 running loadDomainByDomain: Error: Database error occurred.`,
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
        const loader = loadDomainByDomain({
          query: mockedQuery,
          userKey: '1234',
          i18n,
        })

        try {
          await loader.load('1')
        } catch (err) {
          expect(err).toEqual(new Error('todo'))
        }

        expect(consoleOutput).toEqual([
          `Cursor error occurred when user: 1234 running loadDomainByDomain: Error: Cursor error occurred.`,
        ])
      })
    })
  })
})
