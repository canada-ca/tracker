import { dbNameFromFile } from 'arango-tools'
import { ensureDatabase as ensure } from '../../../testUtilities'
import { setupI18n } from '@lingui/core'

import { loadOrgOwnerByOrgId } from '../load-org-owner-by-org-id'
import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import dbschema from '../../../../database.json'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the loadOrgOwnerByOrgId loader', () => {
  let query, drop, truncate, collections, user, org, i18n

  const consoleOutput = []
  const mockedError = (output) => consoleOutput.push(output)

  beforeAll(() => {
    console.error = mockedError
  })
  afterEach(() => {
    consoleOutput.length = 0
  })

  describe('given a successful org owner load', () => {
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

    describe('when user is the owner', () => {
      beforeEach(async () => {
        await collections.affiliations.save({ _from: org._id, _to: user._id, permission: 'owner' })
      })

      it('returns true', async () => {
        const loader = loadOrgOwnerByOrgId({ query, userKey: user._key, i18n: {} })
        const result = await loader.load(org._id)
        expect(result).toBe(true)
      })
    })

    describe('when user is not the owner', () => {
      beforeEach(async () => {
        await collections.affiliations.save({ _from: org._id, _to: user._id, permission: 'admin' })
      })

      it('returns false', async () => {
        const loader = loadOrgOwnerByOrgId({ query, userKey: user._key, i18n: {} })
        const result = await loader.load(org._id)
        expect(result).toBe(false)
      })
    })

    describe('when user has no affiliation', () => {
      it('returns false', async () => {
        const loader = loadOrgOwnerByOrgId({ query, userKey: user._key, i18n: {} })
        const result = await loader.load(org._id)
        expect(result).toBe(false)
      })
    })

    describe('when loading multiple org IDs in one batch', () => {
      let org2

      beforeEach(async () => {
        org2 = await collections.organizations.save({
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
        await collections.affiliations.save({ _from: org._id, _to: user._id, permission: 'owner' })
        await collections.affiliations.save({ _from: org2._id, _to: user._id, permission: 'admin' })
      })

      it('returns correct ownership status for each org in a single batch', async () => {
        const loader = loadOrgOwnerByOrgId({ query, userKey: user._key, i18n: {} })
        const [isOwner1, isOwner2] = await loader.loadMany([org._id, org2._id])
        expect(isOwner1).toBe(true)
        expect(isOwner2).toBe(false)
      })
    })
  })

  describe('given an unsuccessful org owner load', () => {
    describe('language is set to english', () => {
      beforeAll(() => {
        i18n = setupI18n({
          locale: 'en',
          localeData: { en: { plurals: {} }, fr: { plurals: {} } },
          locales: ['en', 'fr'],
          messages: { en: englishMessages.messages, fr: frenchMessages.messages },
        })
      })

      describe('database error occurs', () => {
        it('throws an error', async () => {
          const mockQuery = jest.fn().mockRejectedValue(new Error('Database error occurred.'))
          const loader = loadOrgOwnerByOrgId({ query: mockQuery, userKey: '1', i18n })

          await expect(loader.load('organizations/1')).rejects.toThrow(
            'Unable to load owner information. Please try again.',
          )

          expect(consoleOutput).toEqual([
            `Database error when checking org ownership for user: 1: Error: Database error occurred.`,
          ])
        })
      })

      describe('cursor error occurs', () => {
        it('throws an error', async () => {
          const errorCursor = {
            forEach() {
              throw new Error('Cursor error occurred.')
            },
          }
          const mockQuery = jest.fn().mockResolvedValue(errorCursor)
          const loader = loadOrgOwnerByOrgId({ query: mockQuery, userKey: '1', i18n })

          await expect(loader.load('organizations/1')).rejects.toThrow(
            'Unable to load owner information. Please try again.',
          )

          expect(consoleOutput).toEqual([
            `Cursor error when checking org ownership for user: 1: Error: Cursor error occurred.`,
          ])
        })
      })
    })
  })
})
