const dotenv = require('dotenv-safe')
dotenv.config()
const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { makeMigrations } = require('../../migrations')
const { checkDomainPermission } = require('../auth')

describe('given the check domain permission function', () => {
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
    await collections.claims.save({
      _to: domain._id,
      _from: org._id,
    })
    consoleOutput = []
  })

  afterAll(async () => {
    await drop()
  })

  describe('if the user belongs to an org which has a claim for a given organization', () => {
    let user, org
    beforeEach(async () => {
      const userCursor = await query`
        FOR user IN users
          FILTER user.userName == "test.account@istio.actually.exists"
          RETURN user
      `
      const orgCursor = await query`
        FOR org IN organizations
          FILTER (LOWER("treasury-board-secretariat") == LOWER(TRANSLATE("en", org.orgDetails).slug))
          RETURN MERGE({ _id: org._id, _key: org._key, _rev: org._rev }, TRANSLATE("en", org.orgDetails))
      `
      user = await userCursor.next()
      org = await orgCursor.next()
    })
      describe('if the user has super-admin-level permissions', () => {
        let domain
        beforeEach(async () => {
          await query`
            INSERT {
              _from: ${org._id},
              _to: ${user._id},
              permission: "super_admin"
            } INTO affiliations
          `

          const domainCursor = await query`
            FOR domain IN domains
              FILTER domains.domain == "test.gc.ca'"
              RETURN domain
          `
          domain = domainCursor.next()
        })
        it('will return true', async () => {
          const permitted = await checkDomainPermission(user._id, domain._id, query)
          expect(permitted).toEqual(true)
        })
      })
      describe('if the user has admin-level permissions', () => {
        let domain
        beforeEach(async () => {
          await query`
            INSERT {
              _from: ${org._id},
              _to: ${user._id},
              permission: "admin"
            } INTO affiliations
          `

          const domainCursor = await query`
            FOR domain IN domains
              FILTER domains.domain == "test.gc.ca'"
              RETURN domain
          `
          domain = domainCursor.next()
        })
        it('will return true', async () => {
          const permitted = await checkDomainPermission(user._id, domain._id, query)
          expect(permitted).toEqual(true)
        })
      })
      describe('if the user has user-level permissions', () => {
        let domain
        beforeEach(async () => {
          await query`
            INSERT {
              _from: ${org._id},
              _to: ${user._id},
              permission: "super_admin"
            } INTO affiliations
          `

          const domainCursor = await query`
            FOR domain IN domains
              FILTER domains.domain == "test.gc.ca'"
              RETURN domain
          `
          domain = domainCursor.next()
        })
        it('will return true', async () => {
          const permitted = await checkDomainPermission(user._id, domain._id, query)
          expect(permitted).toEqual(true)
        })
      })
    })

    describe('if the user does not belong to an org which has a claim for a given organization', () => {
      let user, domain
      beforeEach(async () => {
        const userCursor = await query`
          FOR user IN users
            FILTER user.userName == "test.account@istio.actually.exists"
            RETURN user
        `
        user = await userCursor.next()

        const domainCursor = await query`
          FOR domain IN domains
            FILTER domains.domain == "test.gc.ca'"
            RETURN domain
        `
        domain = domainCursor.next()
      })
      it('will return false', async () => {
        const permitted = await checkDomainPermission(user._id, domain._id, query)
        expect(permitted).toEqual(false)
      })
    })
})
