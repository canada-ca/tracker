import { ArangoTools, dbNameFromFile } from 'arango-tools'
import { makeMigrations } from '../../../../migrations'
import { affiliationLoaderByKey } from '../../loaders'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given a affiliationLoaderByKey dataloader', () => {
  let query,
    drop,
    truncate,
    migrate,
    collections,
    orgOne,
    orgTwo,
    affOne,
    user,
    i18n

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
    user = await collections.users.save({
      userName: 'test.account@istio.actually.exists',
      displayName: 'Test Account',
      preferredLang: 'french',
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
    consoleOutput = []
  })

  afterEach(async () => {
    await drop()
  })

  describe('language is set to english', () => {
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
    describe('given a single id', () => {
      it('returns a single user affiliation', async () => {
        // Get affiliation From db
        const expectedCursor = await query`
          FOR affiliation IN affiliations
            FILTER affiliation._id == ${affOne._id}
            LET orgKey = PARSE_IDENTIFIER(affiliation._from).key
            LET userKey = PARSE_IDENTIFIER(affiliation._to).key
            RETURN MERGE(affiliation, { id: affiliation._key, orgKey: orgKey, userKey: userKey })
        `
        const expectedAffiliation = await expectedCursor.next()

        const loader = affiliationLoaderByKey(query, i18n)
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
            RETURN MERGE(affiliation, { id: affiliation._key, orgKey: orgKey, userKey: userKey })
        `

        while (expectedCursor.hasNext()) {
          const tempAff = await expectedCursor.next()
          affiliationIds.push(tempAff._key)
          expectedAffiliations.push(tempAff)
        }

        const loader = affiliationLoaderByKey(query, i18n)
        const affiliations = await loader.loadMany(affiliationIds)
        expect(affiliations).toEqual(expectedAffiliations)
      })
    })
    describe('database error is raised', () => {
      it('throws an error', async () => {
        const expectedCursor = await query`
        FOR affiliation IN affiliations
          FILTER affiliation._id == ${affOne._id}
          LET orgKey = PARSE_IDENTIFIER(affiliation._from).key
          LET userKey = PARSE_IDENTIFIER(affiliation._to).key
          RETURN MERGE(affiliation, { id: affiliation._key, orgKey: orgKey, userKey: userKey })
      `
        const expectedAffiliation = await expectedCursor.next()

        query = jest
          .fn()
          .mockRejectedValue(new Error('Database error occurred.'))
        const loader = affiliationLoaderByKey(query, '1234', i18n)

        try {
          await loader.load(expectedAffiliation._key)
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to find user affiliation(s). Please try again.'),
          )
        }

        expect(consoleOutput).toEqual([
          `Database error occurred when user: 1234 running affiliationLoaderByKey: Error: Database error occurred.`,
        ])
      })
    })
    describe('cursor error is raised', () => {
      it('throws an error', async () => {
        const expectedCursor = await query`
        FOR affiliation IN affiliations
          FILTER affiliation._id == ${affOne._id}
          LET orgKey = PARSE_IDENTIFIER(affiliation._from).key
          LET userKey = PARSE_IDENTIFIER(affiliation._to).key
          RETURN MERGE(affiliation, { id: affiliation._key, orgKey: orgKey, userKey: userKey })
      `
        const expectedAffiliation = await expectedCursor.next()

        const cursor = {
          each() {
            throw new Error('Cursor error occurred.')
          },
        }
        query = jest.fn().mockReturnValue(cursor)
        const loader = affiliationLoaderByKey(query, '1234', i18n)

        try {
          await loader.load(expectedAffiliation._key)
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to find user affiliation(s). Please try again.'),
          )
        }

        expect(consoleOutput).toEqual([
          `Cursor error occurred when user: 1234 running affiliationLoaderByKey: Error: Cursor error occurred.`,
        ])
      })
    })
  })
  describe('language is set to french', () => {
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
    describe('given a single id', () => {
      it('returns a single user affiliation', async () => {
        // Get affiliation From db
        const expectedCursor = await query`
          FOR affiliation IN affiliations
            FILTER affiliation._id == ${affOne._id}
            LET orgKey = PARSE_IDENTIFIER(affiliation._from).key
            LET userKey = PARSE_IDENTIFIER(affiliation._to).key
            RETURN MERGE(affiliation, { id: affiliation._key, orgKey: orgKey, userKey: userKey })
        `
        const expectedAffiliation = await expectedCursor.next()

        const loader = affiliationLoaderByKey(query, i18n)
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
            RETURN MERGE(affiliation, { id: affiliation._key, orgKey: orgKey, userKey: userKey })
        `

        while (expectedCursor.hasNext()) {
          const tempAff = await expectedCursor.next()
          affiliationIds.push(tempAff._key)
          expectedAffiliations.push(tempAff)
        }

        const loader = affiliationLoaderByKey(query, i18n)
        const affiliations = await loader.loadMany(affiliationIds)
        expect(affiliations).toEqual(expectedAffiliations)
      })
    })
    describe('database error is raised', () => {
      it('throws an error', async () => {
        const expectedCursor = await query`
        FOR affiliation IN affiliations
          FILTER affiliation._id == ${affOne._id}
          LET orgKey = PARSE_IDENTIFIER(affiliation._from).key
          LET userKey = PARSE_IDENTIFIER(affiliation._to).key
          RETURN MERGE(affiliation, { id: affiliation._key, orgKey: orgKey, userKey: userKey })
      `
        const expectedAffiliation = await expectedCursor.next()

        query = jest
          .fn()
          .mockRejectedValue(new Error('Database error occurred.'))
        const loader = affiliationLoaderByKey(query, '1234', i18n)

        try {
          await loader.load(expectedAffiliation._key)
        } catch (err) {
          expect(err).toEqual(new Error('todo'))
        }

        expect(consoleOutput).toEqual([
          `Database error occurred when user: 1234 running affiliationLoaderByKey: Error: Database error occurred.`,
        ])
      })
    })
    describe('cursor error is raised', () => {
      it('throws an error', async () => {
        const expectedCursor = await query`
        FOR affiliation IN affiliations
          FILTER affiliation._id == ${affOne._id}
          LET orgKey = PARSE_IDENTIFIER(affiliation._from).key
          LET userKey = PARSE_IDENTIFIER(affiliation._to).key
          RETURN MERGE(affiliation, { id: affiliation._key, orgKey: orgKey, userKey: userKey })
      `
        const expectedAffiliation = await expectedCursor.next()

        const cursor = {
          each() {
            throw new Error('Cursor error occurred.')
          },
        }
        query = jest.fn().mockReturnValue(cursor)
        const loader = affiliationLoaderByKey(query, '1234', i18n)

        try {
          await loader.load(expectedAffiliation._key)
        } catch (err) {
          expect(err).toEqual(new Error('todo'))
        }

        expect(consoleOutput).toEqual([
          `Cursor error occurred when user: 1234 running affiliationLoaderByKey: Error: Cursor error occurred.`,
        ])
      })
    })
  })
})
