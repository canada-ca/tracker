import { dbNameFromFile } from 'arango-tools'
import { ensureDatabase as ensure } from '../../../testUtilities'
import { setupI18n } from '@lingui/core'

import { loadPermissionByOrgId } from '../load-permission-by-org-id'
import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import dbschema from '../../../../database.json'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the loadPermissionByOrgId loader', () => {
  let query, drop, truncate, collections, i18n

  const consoleOutput = []
  const mockedError = (output) => consoleOutput.push(output)

  beforeAll(() => {
    console.error = mockedError
  })
  afterEach(() => {
    consoleOutput.length = 0
  })

  describe('given a successful permission load', () => {
    let user, org

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
    })

    afterEach(async () => {
      await truncate()
    })

    afterAll(async () => {
      await drop()
    })

    describe('when user is a super admin', () => {
      beforeEach(async () => {
        await collections.affiliations.save({
          _from: org._id,
          _to: user._id,
          permission: 'super_admin',
        })
      })

      it('returns super_admin for all requested org IDs', async () => {
        const loader = loadPermissionByOrgId({ query, userKey: user._key, i18n: {} })
        const [result] = await loader.loadMany([org._id])
        expect(result).toEqual('super_admin')
      })
    })

    describe('when user is an admin', () => {
      beforeEach(async () => {
        await collections.affiliations.save({
          _from: org._id,
          _to: user._id,
          permission: 'admin',
        })
      })

      it('returns admin', async () => {
        const loader = loadPermissionByOrgId({ query, userKey: user._key, i18n: {} })
        const result = await loader.load(org._id)
        expect(result).toEqual('admin')
      })
    })

    describe('when user is a regular user', () => {
      beforeEach(async () => {
        await collections.affiliations.save({
          _from: org._id,
          _to: user._id,
          permission: 'user',
        })
      })

      it('returns user', async () => {
        const loader = loadPermissionByOrgId({ query, userKey: user._key, i18n: {} })
        const result = await loader.load(org._id)
        expect(result).toEqual('user')
      })
    })

    describe('when user has no affiliation with the org', () => {
      it('returns null', async () => {
        const loader = loadPermissionByOrgId({ query, userKey: user._key, i18n: {} })
        const result = await loader.load(org._id)
        expect(result).toBeNull()
      })
    })

    describe('when loading multiple org IDs in one batch', () => {
      let org2

      beforeEach(async () => {
        org2 = await collections.organizations.save({
          verified: false,
          orgDetails: {
            en: {
              slug: 'second-org',
              acronym: 'SO',
              name: 'Second Organization',
              zone: 'FED',
              sector: 'SO',
              country: 'Canada',
              province: 'Ontario',
              city: 'Ottawa',
            },
            fr: {
              slug: 'deuxieme-org',
              acronym: 'DO',
              name: 'Deuxième Organisation',
              zone: 'FED',
              sector: 'DO',
              country: 'Canada',
              province: 'Ontario',
              city: 'Ottawa',
            },
          },
        })
        await collections.affiliations.save({ _from: org._id, _to: user._id, permission: 'admin' })
        await collections.affiliations.save({ _from: org2._id, _to: user._id, permission: 'user' })
      })

      it('returns correct permissions for each org in a single batch', async () => {
        const loader = loadPermissionByOrgId({ query, userKey: user._key, i18n: {} })
        const [perm1, perm2] = await loader.loadMany([org._id, org2._id])
        expect(perm1).toEqual('admin')
        expect(perm2).toEqual('user')
      })
    })
  })

  describe('given an unsuccessful permission load', () => {
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
          const loader = loadPermissionByOrgId({ query: mockQuery, userKey: '1', i18n })

          await expect(loader.load('organizations/1')).rejects.toThrow('Authentication error. Please sign in.')

          expect(consoleOutput).toEqual([
            `Database error when checking super admin permission for user: users/1: Error: Database error occurred.`,
          ])
        })
      })

      describe('cursor error on super admin check', () => {
        it('throws an error', async () => {
          const cursor = {
            next() {
              throw new Error('Cursor error occurred.')
            },
          }
          const mockQuery = jest.fn().mockResolvedValue(cursor)
          const loader = loadPermissionByOrgId({ query: mockQuery, userKey: '1', i18n })

          await expect(loader.load('organizations/1')).rejects.toThrow('Unable to check permission. Please try again.')

          expect(consoleOutput).toEqual([
            `Cursor error when checking super admin permission for user: users/1: Error: Cursor error occurred.`,
          ])
        })
      })

      describe('database error on batch permission check', () => {
        it('throws an error', async () => {
          const mockQuery = jest
            .fn()
            .mockResolvedValueOnce({ next: () => undefined })
            .mockRejectedValue(new Error('Database error occurred.'))

          const loader = loadPermissionByOrgId({ query: mockQuery, userKey: '1', i18n })

          await expect(loader.load('organizations/1')).rejects.toThrow('Authentication error. Please sign in.')

          expect(consoleOutput).toEqual([
            `Database error when checking permissions for user: users/1: Error: Database error occurred.`,
          ])
        })
      })

      describe('cursor error on batch permission check', () => {
        it('throws an error', async () => {
          const errorCursor = {
            forEach() {
              throw new Error('Cursor error occurred.')
            },
          }
          const mockQuery = jest
            .fn()
            .mockResolvedValueOnce({ next: () => undefined })
            .mockResolvedValue(errorCursor)

          const loader = loadPermissionByOrgId({ query: mockQuery, userKey: '1', i18n })

          await expect(loader.load('organizations/1')).rejects.toThrow('Unable to check permission. Please try again.')

          expect(consoleOutput).toEqual([
            `Cursor error when checking permissions for user: users/1: Error: Cursor error occurred.`,
          ])
        })
      })
    })
  })
})
