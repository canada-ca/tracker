const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { setupI18n } = require('@lingui/core')

const { makeMigrations } = require('../../../migrations')
const { checkDomainPermission } = require('..')
const englishMessages = require('../../locale/en/messages')
const frenchMessages = require('../../locale/fr/messages')

describe('given the check domain permission function', () => {
  let query, drop, truncate, migrate, collections, org, domain, i18n

  let consoleOutput = []
  const mockedError = (output) => consoleOutput.push(output)
  beforeAll(async () => {
    console.error = mockedError
    ;({ migrate } = await ArangoTools({ rootPass, url }))
    ;({ query, drop, truncate, collections } = await migrate(
      makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
    ))
  })

  beforeEach(async () => {
    await truncate()
    await collections.users.save({
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
    domain = await collections.domains.save({
      domain: 'test.gc.ca',
      slug: 'test-gc-ca',
      lastRan: null,
      selectors: ['selector1', 'selector2'],
    })
    await collections.claims.save({
      _to: domain._id,
      _from: org._id,
    })
    consoleOutput = []
  })

  afterAll(async () => {
    await drop()
  })

  describe('given a successful domain permission check', () => {
    let user, permitted
    beforeEach(async () => {
      const userCursor = await query`
        FOR user IN users
          FILTER user.userName == "test.account@istio.actually.exists"
          RETURN user
      `
      user = await userCursor.next()
    })
    describe('if the user belongs to an org which has a claim for a given organization', () => {
      afterEach(async () => {
        await query`
          LET userEdges = (FOR v, e IN 1..1 ANY ${org._id} affiliations RETURN { edgeKey: e._key, userKey: e._to })
          LET removeUserEdges = (FOR userEdge IN userEdges REMOVE userEdge.edgeKey IN affiliations)
          RETURN true
        `
        await query`
          FOR affiliation IN affiliations
            REMOVE affiliation IN affiliations
        `
      })
      describe('if the user has super-admin-level permissions', () => {
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'super_admin',
          })
        })
        it('will return true', async () => {
          const testCheckDomainPermission = checkDomainPermission({
            query,
            userKey: user._key,
          })
          permitted = await testCheckDomainPermission({ domainId: domain._id })
          expect(permitted).toEqual(true)
        })
      })
      describe('if the user has admin-level permissions', () => {
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'admin',
          })
        })
        it('will return true', async () => {
          const testCheckDomainPermission = checkDomainPermission({
            query,
            userKey: user._key,
          })
          permitted = await testCheckDomainPermission({ domainId: domain._id })
          expect(permitted).toEqual(true)
        })
      })
      describe('if the user has user-level permissions', () => {
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'user',
          })
        })
        it('will return true', async () => {
          const testCheckDomainPermission = checkDomainPermission({
            query,
            userKey: user._key,
          })
          permitted = await testCheckDomainPermission({ domainId: domain._id })
          expect(permitted).toEqual(true)
        })
      })
    })
  })

  describe('given an unsuccessful domain permission check', () => {
    let user
    beforeEach(async () => {
      const userCursor = await query`
        FOR user IN users
          FILTER user.userName == "test.account@istio.actually.exists"
          RETURN user
      `
      user = await userCursor.next()
    })
    describe('if the user does not belong to an org which has a claim for a given organization', () => {
      let permitted
      it('will return false', async () => {
        const testCheckDomainPermission = checkDomainPermission({
          query,
          userKey: user._key,
        })
        permitted = await testCheckDomainPermission({ domainId: domain._id })
        expect(permitted).toEqual(false)
      })
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
      describe('if a database error is encountered during permission check', () => {
        let mockQuery
        it('returns an appropriate error message', async () => {
          mockQuery = jest
            .fn()
            .mockRejectedValue(new Error('Database error occurred.'))
          try {
            const testCheckDomainPermission = checkDomainPermission({
              i18n,
              query: mockQuery,
              userKey: user._key,
            })
            await testCheckDomainPermission({ domainId: domain._id })
          } catch (err) {
            expect(err).toEqual(
              new Error('Authentication error. Please sign in again.'),
            )
            expect(consoleOutput).toEqual([
              `Error when retrieving affiliated organization claims for user with ID ${user._id} and domain with ID ${domain._id}: Error: Database error occurred.`,
            ])
          }
        })
      })
      describe('if a cursor error is encountered during permission check', () => {
        let mockQuery
        it('returns an appropriate error message', async () => {
          const cursor = {
            next() {
              throw new Error('Cursor error occurred.')
            },
          }
          mockQuery = jest.fn().mockReturnValue(cursor)
          try {
            const testCheckDomainPermission = checkDomainPermission({
              i18n,
              query: mockQuery,
              userKey: user._key,
            })
            await testCheckDomainPermission({ domainId: domain._id })
          } catch (err) {
            expect(err).toEqual(
              new Error('Unable to find domain. Please try again.'),
            )
            expect(consoleOutput).toEqual([
              `Error when retrieving affiliated organization claims for user with ID ${user._id} and domain with ID ${domain._id}: Error: Cursor error occurred.`,
            ])
          }
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
      describe('if a database error is encountered during permission check', () => {
        let mockQuery
        it('returns an appropriate error message', async () => {
          mockQuery = jest
            .fn()
            .mockRejectedValue(new Error('Database error occurred.'))
          try {
            const testCheckDomainPermission = checkDomainPermission({
              i18n,
              query: mockQuery,
              userKey: user._key,
            })
            await testCheckDomainPermission({ domainId: domain._id })
          } catch (err) {
            expect(err).toEqual(new Error('todo'))
            expect(consoleOutput).toEqual([
              `Error when retrieving affiliated organization claims for user with ID ${user._id} and domain with ID ${domain._id}: Error: Database error occurred.`,
            ])
          }
        })
      })
      describe('if a cursor error is encountered during permission check', () => {
        let mockQuery
        it('returns an appropriate error message', async () => {
          const cursor = {
            next() {
              throw new Error('Cursor error occurred.')
            },
          }
          mockQuery = jest.fn().mockReturnValue(cursor)
          try {
            const testCheckDomainPermission = checkDomainPermission({
              i18n,
              query: mockQuery,
              userKey: user._key,
            })
            await testCheckDomainPermission({ domainId: domain._id })
          } catch (err) {
            expect(err).toEqual(new Error('todo'))
            expect(consoleOutput).toEqual([
              `Error when retrieving affiliated organization claims for user with ID ${user._id} and domain with ID ${domain._id}: Error: Cursor error occurred.`,
            ])
          }
        })
      })
    })
  })
})
