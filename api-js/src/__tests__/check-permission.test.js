const dotenv = require('dotenv-safe')
dotenv.config()
const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { makeMigrations } = require('../../migrations')
const { checkPermission } = require('../auth')

describe('given the check permission function', () => {
  let query, drop, truncate, migrate, collections

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
    await collections.organizations.save({
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
    consoleOutput = []
  })

  afterAll(async () => {
    await drop()
  })

  describe('given a successful permission check', () => {
    describe('if the user is a super admin for a given organization', () => {
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

        await query`
          INSERT {
            _from: ${org._id},
            _to: ${user._id},
            permission: "super_admin"
          } INTO affiliations
        `
      })
      it('will return the users permission level', async () => {
        const permission = await checkPermission(user._id, org._id, query)
        expect(permission).toEqual('super_admin')
      })
    })
    describe('if the user is an admin for a given organization', () => {
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

        await query`
          INSERT {
            _from: ${org._id},
            _to: ${user._id},
            permission: "admin"
          } INTO affiliations
        `
      })
      it('will return the users permission level', async () => {
        const permission = await checkPermission(user._id, org._id, query)
        expect(permission).toEqual('admin')
      })
    })
    describe('if the user is a user for a given organization', () => {
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

        await query`
          INSERT {
            _from: ${org._id},
            _to: ${user._id},
            permission: "user"
          } INTO affiliations
        `
      })
      it('will return the users permission level', async () => {
        const permission = await checkPermission(user._id, org._id, query)
        expect(permission).toEqual('user')
      })
    })
  })
  describe('given an unsuccessful permission check', () => {
    describe('user does not belong to that organization', () => {
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
      it('will return the users permission level', async () => {
        const permission = await checkPermission(user._id, org._id, query)
        expect(permission).toEqual(undefined)
      })
    })
    describe('database error occurs', () => {
      it('throws an error', async () => {
        query = jest
          .fn()
          .mockRejectedValue(new Error('Database error occurred.'))

        try {
          await checkPermission('users/1', 'organizations/1', query)
        } catch (err) {
          expect(err).toEqual(
            new Error('Authentication error. Please sign in again.'),
          )
        }

        expect(consoleOutput).toEqual([
          `Database error occurred when checking users/1's permission: Error: Database error occurred.`,
        ])
      })
    })
  })
})
