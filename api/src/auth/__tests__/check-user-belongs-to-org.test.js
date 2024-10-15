import { dbNameFromFile } from 'arango-tools'
import { ensureDatabase as ensure } from '../../testUtilities'
import { setupI18n } from '@lingui/core'

import { checkUserBelongsToOrg } from '../check-user-belongs-to-org'
import englishMessages from '../../locale/en/messages'
import frenchMessages from '../../locale/fr/messages'
import dbschema from '../../../database.json'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the checkUserBelongsToOrg function', () => {
  describe('given a successful call', () => {
    let query, drop, truncate, collections, user, org
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
    describe('user is the owner of the org', () => {
      beforeEach(async () => {
        await collections.affiliations.save({
          _from: org._id,
          _to: user._id,
          permission: 'owner',
        })
      })
      it('returns true', async () => {
        const testCheckUserBelongsToOrg = checkUserBelongsToOrg({
          query,
          userKey: user._key,
        })

        const result = await testCheckUserBelongsToOrg({ orgId: org._id })

        expect(result).toEqual(true)
      })
    })
    describe('user is not the owner of the org', () => {
      it('returns false', async () => {
        const testCheckUserBelongsToOrg = checkUserBelongsToOrg({
          query,
          userKey: user._key,
        })

        const result = await testCheckUserBelongsToOrg({ orgId: org._id })

        expect(result).toEqual(false)
      })
    })
  })
  describe('given an unsuccessful call', () => {
    let i18n
    const consoleOutput = []
    const mockedError = (output) => consoleOutput.push(output)
    beforeAll(() => {
      console.error = mockedError
    })
    afterEach(() => {
      consoleOutput.length = 0
    })
    describe('users language is set to english', () => {
      beforeAll(() => {
        i18n = setupI18n({
          locale: 'en',
          localeData: {
            en: { plurals: {} },
          },
          locales: ['en'],
          messages: {
            en: englishMessages.messages,
          },
        })
      })
      describe('database error occurs', () => {
        it('throws an error', async () => {
          const mockedQuery = jest.fn().mockRejectedValue(new Error('Database error occurred'))

          const testCheckUserBelongsToOrg = checkUserBelongsToOrg({
            i18n,
            query: mockedQuery,
            userKey: '123',
          })

          try {
            await testCheckUserBelongsToOrg({ orgId: '123' })
          } catch (err) {
            expect(err).toEqual(new Error(`Unable to load affiliation information. Please try again.`))
          }
          expect(consoleOutput).toEqual([
            `Database error when checking to see if user: 123 belongs to org: 123: Error: Database error occurred`,
          ])
        })
      })
    })
    describe('users language is set to french', () => {
      beforeAll(() => {
        i18n = setupI18n({
          locale: 'fr',
          localeData: {
            fr: { plurals: {} },
          },
          locales: ['fr'],
          messages: {
            fr: frenchMessages.messages,
          },
        })
      })
      describe('database error occurs', () => {
        it('throws an error', async () => {
          const mockedQuery = jest.fn().mockRejectedValue(new Error('Database error occurred'))

          const testCheckUserBelongsToOrg = checkUserBelongsToOrg({
            i18n,
            query: mockedQuery,
            userKey: '123',
          })

          try {
            await testCheckUserBelongsToOrg({ orgId: '123' })
          } catch (err) {
            expect(err).toEqual(new Error(`Impossible de charger les informations d'affiliation. Veuillez réessayer.`))
          }
          expect(consoleOutput).toEqual([
            `Database error when checking to see if user: 123 belongs to org: 123: Error: Database error occurred`,
          ])
        })
      })
    })
  })
})
