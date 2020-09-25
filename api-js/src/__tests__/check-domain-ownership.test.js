const dotenv = require('dotenv-safe')
dotenv.config()
const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { makeMigrations } = require('../../migrations')
const { checkDomainOwnership } = require('../auth')

describe('given the check domain ownership function', () => {
  let query, drop, truncate, migrate, collections, org, domain

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
    await collections.ownership.save({
      _to: domain._id,
      _from: org._id,
    })
    consoleOutput = []
  })

  afterAll(async () => {
    await drop()
  })

  describe('given a successful domain ownership check', () => {
    let user, permitted
    beforeEach(async () => {
      const userCursor = await query`
        FOR user IN users
          FILTER user.userName == "test.account@istio.actually.exists"
          RETURN user
      `
      user = await userCursor.next()
    })
    describe('if the user belongs to an org which has a ownership for a given organization', () => {
      afterEach(async () => {
        await query`
          LET userEdges = (FOR v, e IN 1..1 ANY ${org._id} affiliations RETURN { edgeKey: e._key, userId: e._to })
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
          permitted = await checkDomainOwnership({ userId: user._id, domainId: domain._id, query})
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
          permitted = await checkDomainOwnership({ userId: user._id, domainId: domain._id, query})
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
          permitted = await checkDomainOwnership({ userId: user._id, domainId: domain._id, query})
          expect(permitted).toEqual(true)
        })
      })
    })
  })

  describe('given an unsuccessful domain ownership check', () => {
    let user
    beforeEach(async () => {
      const userCursor = await query`
        FOR user IN users
          FILTER user.userName == "test.account@istio.actually.exists"
          RETURN user
      `
      user = await userCursor.next()
    })
    describe('if the user does not belong to an org which has a ownership for a given domain', () => {
      let permitted
      it('will return false', async () => {
        permitted = await checkDomainOwnership({ userId: user._id, domainId: domain._id, query})
        expect(permitted).toEqual(false)
      })
    })
    describe('if a database error is encountered during ownership check', () => {
      let mockQuery
      it('returns an appropriate error message', async () => {
        mockQuery = jest
          .fn()
          .mockRejectedValue(new Error('Database error occurred.'))
        try {
          await checkDomainOwnership({ userId: user._id, domainId: domain._id, query: mockQuery})
        } catch (err) {
          expect(err).toEqual(
            new Error('Error when retrieving dmarc report information. Please try again.'),
          )
          expect(consoleOutput).toEqual([
            `Database error when retrieving affiliated organization ownership for user: ${user._id} and the domain: ${domain._id}: Error: Database error occurred.`,
          ])
        }
      })
    })
    describe('if a cursor error is encountered during ownership check', () => {
      let mockQuery
      it('returns an appropriate error message', async () => {
        const cursor = {
          next() {
            throw new Error('Cursor error occurred.')
          },
        }
        mockQuery = jest.fn().mockReturnValue(cursor)
        try {
          await checkDomainOwnership({ userId: user._id, domainId: domain._id, query: mockQuery})
        } catch (err) {
          expect(err).toEqual(
            new Error('Error when retrieving dmarc report information. Please try again.'),
          )
          expect(consoleOutput).toEqual([
            `Cursor error when retrieving affiliated organization ownership for user: ${user._id} and the domain: ${domain._id}: Error: Cursor error occurred.`,
          ])
        }
      })
    })
  })
})
