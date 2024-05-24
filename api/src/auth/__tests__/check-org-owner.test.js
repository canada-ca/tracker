import { ensure, dbNameFromFile } from 'arango-tools'
import { setupI18n } from '@lingui/core'

import { checkOrgOwner } from '../check-org-owner'
import englishMessages from '../../locale/en/messages'
import frenchMessages from '../../locale/fr/messages'
import dbschema from '../../../database.json'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the checkOrgOwner function', () => {
  describe('given a successful check', () => {
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
        preferredLang: 'french',
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
        const testCheckOrgOwner = checkOrgOwner({ query, userKey: user._key })

        const result = await testCheckOrgOwner({ orgId: org._id })

        expect(result).toEqual(true)
      })
    })
    describe('user is not the owner of the org', () => {
      beforeEach(async () => {
        await collections.affiliations.save({
          _from: org._id,
          _to: user._id,
          permission: 'admin',
        })
      })
      it('returns false', async () => {
        const testCheckOrgOwner = checkOrgOwner({ query, userKey: user._key })

        const result = await testCheckOrgOwner({ orgId: org._id })

        expect(result).toEqual(false)
      })
    })
  })
  describe('given an unsuccessful check', () => {
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

          const testCheckOrgOwner = checkOrgOwner({
            i18n,
            query: mockedQuery,
            userKey: '123',
          })

          try {
            await testCheckOrgOwner({ orgId: '123' })
          } catch (err) {
            expect(err).toEqual(new Error(`Unable to load owner information. Please try again.`))
          }
          expect(consoleOutput).toEqual([
            `Database error when checking to see if user: 123 is the owner of: 123: Error: Database error occurred`,
          ])
        })
      })
      describe('cursor error occurs', () => {
        it('throws an error', async () => {
          const mockedQuery = jest.fn().mockReturnValue({
            next: jest.fn().mockRejectedValue(new Error('Cursor error occurred')),
          })

          const testCheckOrgOwner = checkOrgOwner({
            i18n,
            query: mockedQuery,
            userKey: '123',
          })

          try {
            await testCheckOrgOwner({ orgId: '123' })
          } catch (err) {
            expect(err).toEqual(new Error(`Unable to load owner information. Please try again.`))
          }
          expect(consoleOutput).toEqual([
            `Cursor error when checking to see if user: 123 is the owner of: 123: Error: Cursor error occurred`,
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

          const testCheckOrgOwner = checkOrgOwner({
            i18n,
            query: mockedQuery,
            userKey: '123',
          })

          try {
            await testCheckOrgOwner({ orgId: '123' })
          } catch (err) {
            expect(err).toEqual(
              new Error(`Impossible de charger les informations sur le propriétaire. Veuillez réessayer.`),
            )
          }
          expect(consoleOutput).toEqual([
            `Database error when checking to see if user: 123 is the owner of: 123: Error: Database error occurred`,
          ])
        })
      })
      describe('cursor error occurs', () => {
        it('throws an error', async () => {
          const mockedQuery = jest.fn().mockReturnValue({
            next: jest.fn().mockRejectedValue(new Error('Cursor error occurred')),
          })

          const testCheckOrgOwner = checkOrgOwner({
            i18n,
            query: mockedQuery,
            userKey: '123',
          })

          try {
            await testCheckOrgOwner({ orgId: '123' })
          } catch (err) {
            expect(err).toEqual(
              new Error(`Impossible de charger les informations sur le propriétaire. Veuillez réessayer.`),
            )
          }
          expect(consoleOutput).toEqual([
            `Cursor error when checking to see if user: 123 is the owner of: 123: Error: Cursor error occurred`,
          ])
        })
      })
    })
  })
})
