import { dbNameFromFile } from 'arango-tools'
import { ensureDatabase as ensure } from '../../../testUtilities'
import { loadAffiliationByKey } from '..'
import { setupI18n } from '@lingui/core'
import englishMessages from '../../../locale/en/messages'

import frenchMessages from '../../../locale/fr/messages'
import dbschema from '../../../../database.json'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given a loadAffiliationByKey dataloader', () => {
  let i18n
  const consoleOutput = []
  const mockedError = (output) => consoleOutput.push(output)
  beforeAll(() => {
    console.error = mockedError
  })

  afterEach(() => {
    consoleOutput.length = 0
  })

  describe('given a successful load', () => {
    let query, drop, truncate, collections, orgOne, orgTwo, affOne, user

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
      orgOne = await collections.organizations.save({
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
      orgTwo = await collections.organizations.save({
        orgDetails: {
          en: {
            slug: 'not-treasury-board-secretariat',
            acronym: 'NTBS',
            name: 'Not Treasury Board of Canada Secretariat',
            zone: 'NFED',
            sector: 'NTBS',
            country: 'Canada',
            province: 'Ontario',
            city: 'Ottawa',
          },
          fr: {
            slug: 'ne-pas-secretariat-conseil-tresor',
            acronym: 'NPSCT',
            name: 'Ne Pas Secrétariat du Conseil Trésor du Canada',
            zone: 'NPFED',
            sector: 'NPTBS',
            country: 'Canada',
            province: 'Ontario',
            city: 'Ottawa',
          },
        },
      })
      affOne = await collections.affiliations.save({
        _from: orgOne._id,
        _to: user._id,
        permission: 'user',
      })
      await collections.affiliations.save({
        _from: orgTwo._id,
        _to: user._id,
        permission: 'user',
      })
    })

    afterEach(async () => {
      await truncate()
    })

    afterAll(async () => {
      await drop()
    })

    describe('given a single id', () => {
      it('returns a single user affiliation', async () => {
        // Get affiliation From db
        const expectedCursor = await query`
          FOR affiliation IN affiliations
            FILTER affiliation._id == ${affOne._id}
            LET orgKey = PARSE_IDENTIFIER(affiliation._from).key
            LET userKey = PARSE_IDENTIFIER(affiliation._to).key
            RETURN MERGE(affiliation, { id: affiliation._key, orgKey: orgKey, userKey: userKey, _type: "affiliation" })
        `
        const expectedAffiliation = await expectedCursor.next()

        const loader = loadAffiliationByKey({ query, i18n })
        const affiliation = await loader.load(expectedAffiliation._key)

        expect(affiliation).toEqual(expectedAffiliation)
      })
    })
    describe('provided a list of ids', () => {
      it('returns a list of user affiliations', async () => {
        const affiliationIds = []
        const expectedAffiliations = []
        const expectedCursor = await query`
          FOR affiliation IN affiliations
            LET orgKey = PARSE_IDENTIFIER(affiliation._from).key
            LET userKey = PARSE_IDENTIFIER(affiliation._to).key
            RETURN MERGE(affiliation, { id: affiliation._key, orgKey: orgKey, userKey: userKey, _type: "affiliation" })
        `

        while (expectedCursor.hasMore) {
          const tempAff = await expectedCursor.next()
          affiliationIds.push(tempAff._key)
          expectedAffiliations.push(tempAff)
        }

        const loader = loadAffiliationByKey({ query, i18n })
        const affiliations = await loader.loadMany(affiliationIds)
        expect(affiliations).toEqual(expectedAffiliations)
      })
    })
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
    describe('database error is raised', () => {
      it('throws an error', async () => {
        const mockedQuery = jest.fn().mockRejectedValue(new Error('Database error occurred.'))
        const loader = loadAffiliationByKey({
          query: mockedQuery,
          userKey: '1234',
          i18n,
        })

        try {
          await loader.load('1')
        } catch (err) {
          expect(err).toEqual(new Error('Unable to find user affiliation(s). Please try again.'))
        }

        expect(consoleOutput).toEqual([
          `Database error occurred when user: 1234 running loadAffiliationByKey: Error: Database error occurred.`,
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
        const loader = loadAffiliationByKey({
          query: mockedQuery,
          userKey: '1234',
          i18n,
        })

        try {
          await loader.load('1')
        } catch (err) {
          expect(err).toEqual(new Error('Unable to find user affiliation(s). Please try again.'))
        }

        expect(consoleOutput).toEqual([
          `Cursor error occurred when user: 1234 running loadAffiliationByKey: Error: Cursor error occurred.`,
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
    describe('database error is raised', () => {
      it('throws an error', async () => {
        const mockedQuery = jest.fn().mockRejectedValue(new Error('Database error occurred.'))
        const loader = loadAffiliationByKey({
          query: mockedQuery,
          userKey: '1234',
          i18n,
        })

        try {
          await loader.load('1')
        } catch (err) {
          expect(err).toEqual(
            new Error(`Impossible de trouver l'affiliation de l'utilisateur (s). Veuillez réessayer.`),
          )
        }

        expect(consoleOutput).toEqual([
          `Database error occurred when user: 1234 running loadAffiliationByKey: Error: Database error occurred.`,
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
        const loader = loadAffiliationByKey({
          query: mockedQuery,
          userKey: '1234',
          i18n,
        })

        try {
          await loader.load('1')
        } catch (err) {
          expect(err).toEqual(
            new Error(`Impossible de trouver l'affiliation de l'utilisateur (s). Veuillez réessayer.`),
          )
        }

        expect(consoleOutput).toEqual([
          `Cursor error occurred when user: 1234 running loadAffiliationByKey: Error: Cursor error occurred.`,
        ])
      })
    })
  })
})
