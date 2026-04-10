import { dbNameFromFile } from 'arango-tools'
import { ensureDatabase as ensure } from '../../../testUtilities'
import { setupI18n } from '@lingui/core'

import { loadDomainPermissionByDomainId } from '../load-domain-permission-by-domain-id'
import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import dbschema from '../../../../database.json'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the loadDomainPermissionByDomainId loader', () => {
  let query, drop, truncate, collections, org, domain, i18n

  const consoleOutput = []
  const mockedError = (output) => consoleOutput.push(output)

  beforeAll(() => {
    console.error = mockedError
  })
  afterEach(() => {
    consoleOutput.length = 0
  })

  describe('given a successful domain permission load', () => {
    let user

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
      user = await collections.users.save({
        userName: 'test.account@istio.actually.exists',
        displayName: 'Test Account',
        tfaValidated: false,
        emailValidated: false,
      })
      org = await collections.organizations.save({
        verified: false,
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
      domain = await collections.domains.save({
        domain: 'test.gc.ca',
        slug: 'test-gc-ca',
        lastRan: null,
        selectors: [],
      })
      await collections.claims.save({ _from: org._id, _to: domain._id })
    })

    afterEach(async () => {
      await truncate()
    })

    afterAll(async () => {
      await drop()
    })

    describe('when user is affiliated with an org that claims the domain', () => {
      beforeEach(async () => {
        await collections.affiliations.save({
          _from: org._id,
          _to: user._id,
          permission: 'user',
        })
      })

      it('returns true', async () => {
        const loader = loadDomainPermissionByDomainId({ query, userKey: user._key, i18n: {} })
        const result = await loader.load(domain._id)
        expect(result).toBe(true)
      })
    })

    describe('when user has no affiliation with any org claiming the domain', () => {
      it('returns false', async () => {
        const loader = loadDomainPermissionByDomainId({ query, userKey: user._key, i18n: {} })
        const result = await loader.load(domain._id)
        expect(result).toBe(false)
      })
    })

    describe('when loading multiple domain IDs in one batch', () => {
      let domain2

      beforeEach(async () => {
        domain2 = await collections.domains.save({
          domain: 'test2.gc.ca',
          slug: 'test2-gc-ca',
          lastRan: null,
          selectors: [],
        })
        await collections.affiliations.save({ _from: org._id, _to: user._id, permission: 'user' })
      })

      it('returns correct permissions for each domain in a single batch', async () => {
        const loader = loadDomainPermissionByDomainId({ query, userKey: user._key, i18n: {} })
        const [perm1, perm2] = await loader.loadMany([domain._id, domain2._id])
        expect(perm1).toBe(true)
        expect(perm2).toBe(false)
      })
    })
  })

  describe('given an unsuccessful domain permission load', () => {
    describe('language is set to english', () => {
      beforeAll(() => {
        i18n = setupI18n({
          locale: 'en',
          localeData: { en: { plurals: {} }, fr: { plurals: {} } },
          locales: ['en', 'fr'],
          messages: { en: englishMessages.messages, fr: frenchMessages.messages },
        })
      })

      describe('database error on super admin check', () => {
        it('throws an error', async () => {
          const mockQuery = jest.fn().mockRejectedValue(new Error('Database error occurred.'))
          const loader = loadDomainPermissionByDomainId({ query: mockQuery, userKey: '1', i18n })

          await expect(loader.load('domains/1')).rejects.toThrow(
            'Permission check error. Unable to request domain information.',
          )

          expect(consoleOutput).toEqual([
            `Database error when checking super admin permission for user: users/1: Error: Database error occurred.`,
          ])
        })
      })

      describe('database error on batch domain permission check', () => {
        it('throws an error', async () => {
          const mockQuery = jest
            .fn()
            .mockResolvedValueOnce({ count: undefined })
            .mockRejectedValue(new Error('Database error occurred.'))

          const loader = loadDomainPermissionByDomainId({ query: mockQuery, userKey: '1', i18n })

          await expect(loader.load('domains/1')).rejects.toThrow(
            'Permission check error. Unable to request domain information.',
          )

          expect(consoleOutput).toEqual([
            `Database error when checking domain permissions for user: users/1: Error: Database error occurred.`,
          ])
        })
      })

      describe('cursor error on batch domain permission check', () => {
        it('throws an error', async () => {
          const errorCursor = {
            forEach() {
              throw new Error('Cursor error occurred.')
            },
          }
          const mockQuery = jest
            .fn()
            .mockResolvedValueOnce({ count: undefined })
            .mockResolvedValue(errorCursor)

          const loader = loadDomainPermissionByDomainId({ query: mockQuery, userKey: '1', i18n })

          await expect(loader.load('domains/1')).rejects.toThrow(
            'Permission check error. Unable to request domain information.',
          )

          expect(consoleOutput).toEqual([
            `Cursor error when checking domain permissions for user: users/1: Error: Cursor error occurred.`,
          ])
        })
      })
    })
  })
})
