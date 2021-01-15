import { ArangoTools, dbNameFromFile } from 'arango-tools'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { makeMigrations } from '../../../../migrations'
import { domainLoaderByKey } from '../index'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given a domainLoaderByKey dataloader', () => {
  let query, drop, truncate, migrate, collections, i18n

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
    it('returns a single domain', async () => {
      // Get Domain From db
      const expectedCursor = await query`
        FOR domain IN domains
          FILTER domain.domain == "test.canada.ca"
          RETURN MERGE({ id: domain._key}, domain)
      `
      const expectedDomain = await expectedCursor.next()

      const loader = domainLoaderByKey(query)
      const domain = await loader.load(expectedDomain._key)

      expect(domain).toEqual(expectedDomain)
    })
  })
  describe('provided a list of ids', () => {
    it('returns a list of domains', async () => {
      const domainIds = []
      const expectedDomains = []
      const expectedCursor = await query`
        FOR domain IN domains
          RETURN MERGE({ id: domain._key}, domain)
      `

      while (expectedCursor.hasNext()) {
        const tempDomain = await expectedCursor.next()
        domainIds.push(tempDomain._key)
        expectedDomains.push(tempDomain)
      }

      const loader = domainLoaderByKey(query)
      const domains = await loader.loadMany(domainIds)
      expect(domains).toEqual(expectedDomains)
    })
  })
  describe('users language is set to english', () => {
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
    describe('database error is raised', () => {
      it('returns an error', async () => {
        const expectedCursor = await query`
          FOR domain IN domains
            FILTER domain.domain == "test.canada.ca"
            RETURN MERGE({ id: domain._key}, domain)
        `
        const expectedDomain = await expectedCursor.next()

        query = jest
          .fn()
          .mockRejectedValue(new Error('Database error occurred.'))
        const loader = domainLoaderByKey(query, '1234', i18n)

        try {
          await loader.load(expectedDomain._key)
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to find domain. Please try again.'),
          )
        }

        expect(consoleOutput).toEqual([
          `Database error occurred when user: 1234 running domainLoaderByKey: Error: Database error occurred.`,
        ])
      })
    })
    describe('cursor error is raised', () => {
      it('throws an error', async () => {
        const expectedCursor = await query`
          FOR domain IN domains
            FILTER domain.domain == "test.canada.ca"
            RETURN MERGE({ id: domain._key}, domain)
        `
        const expectedDomain = await expectedCursor.next()

        const cursor = {
          each() {
            throw new Error('Cursor error occurred.')
          },
        }
        query = jest.fn().mockReturnValue(cursor)
        const loader = domainLoaderByKey(query, '1234', i18n)

        try {
          await loader.load(expectedDomain._key)
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to find domain. Please try again.'),
          )
        }

        expect(consoleOutput).toEqual([
          `Cursor error occurred when user: 1234 running domainLoaderByKey: Error: Cursor error occurred.`,
        ])
      })
    })
  })
  describe('users language is set to french', () => {
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
    describe('database error is raised', () => {
      it('returns an error', async () => {
        const expectedCursor = await query`
          FOR domain IN domains
            FILTER domain.domain == "test.canada.ca"
            RETURN MERGE({ id: domain._key}, domain)
        `
        const expectedDomain = await expectedCursor.next()

        query = jest
          .fn()
          .mockRejectedValue(new Error('Database error occurred.'))
        const loader = domainLoaderByKey(query, '1234', i18n)

        try {
          await loader.load(expectedDomain._key)
        } catch (err) {
          expect(err).toEqual(new Error('todo'))
        }

        expect(consoleOutput).toEqual([
          `Database error occurred when user: 1234 running domainLoaderByKey: Error: Database error occurred.`,
        ])
      })
    })
    describe('cursor error is raised', () => {
      it('throws an error', async () => {
        const expectedCursor = await query`
          FOR domain IN domains
            FILTER domain.domain == "test.canada.ca"
            RETURN MERGE({ id: domain._key}, domain)
        `
        const expectedDomain = await expectedCursor.next()

        const cursor = {
          each() {
            throw new Error('Cursor error occurred.')
          },
        }
        query = jest.fn().mockReturnValue(cursor)
        const loader = domainLoaderByKey(query, '1234', i18n)

        try {
          await loader.load(expectedDomain._key)
        } catch (err) {
          expect(err).toEqual(new Error('todo'))
        }

        expect(consoleOutput).toEqual([
          `Cursor error occurred when user: 1234 running domainLoaderByKey: Error: Cursor error occurred.`,
        ])
      })
    })
  })
})
