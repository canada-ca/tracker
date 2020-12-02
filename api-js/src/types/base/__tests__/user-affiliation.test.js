const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { GraphQLNonNull, GraphQLID } = require('graphql')
const { toGlobalId } = require('graphql-relay')

const { makeMigrations } = require('../../../../migrations')
const { userLoaderByKey, orgLoaderByKey } = require('../../../loaders')
const {
  userAffiliationsType,
  organizationType,
  userSharedType,
} = require('../../index')
const { RoleEnums } = require('../../../enums')

describe('given the user affiliation object', () => {
  describe('testing the field definitions', () => {
    it('has an id field', () => {
      const demoType = userAffiliationsType.getFields()

      expect(demoType).toHaveProperty('id')
      expect(demoType.id.type).toMatchObject(GraphQLNonNull(GraphQLID))
    })
    it('has a permission field', () => {
      const demoType = userAffiliationsType.getFields()

      expect(demoType).toHaveProperty('permission')
      expect(demoType.permission.type).toMatchObject(RoleEnums)
    })
    it('has a user field', () => {
      const demoType = userAffiliationsType.getFields()

      expect(demoType).toHaveProperty('user')
      expect(demoType.user.type).toMatchObject(userSharedType)
    })
    it('has an organization field', () => {
      const demoType = userAffiliationsType.getFields()

      expect(demoType).toHaveProperty('organization')
      expect(demoType.organization.type).toMatchObject(organizationType)
    })
  })

  describe('testing the field resolvers', () => {
    let query, drop, truncate, migrate, collections, user, org

    beforeAll(async () => {
      // Generate DB Items
      ;({ migrate } = await ArangoTools({ rootPass, url }))
      ;({ query, drop, truncate, collections } = await migrate(
        makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
      ))
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
        verified: false,
        summaries: {
          web: {
            pass: 50,
            fail: 1000,
            total: 1050,
          },
          mail: {
            pass: 50,
            fail: 1000,
            total: 1050,
          },
        },
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
      await collections.affiliations.save({
        _to: user._id,
        _from: org._id,
        permission: 'user',
      })
    })

    afterEach(async () => {
      await truncate()
    })

    afterAll(async () => {
      await drop()
    })

    describe('testing the id resolver', () => {
      it('returns the resolved value', () => {
        const demoType = userAffiliationsType.getFields()

        expect(demoType.id.resolve({ id: '1' })).toEqual(
          toGlobalId('affiliations', '1'),
        )
      })
    })
    describe('testing the permission resolver', () => {
      it('returns the resolved value', () => {
        const demoType = userAffiliationsType.getFields()

        expect(demoType.permission.resolve({ permission: 'admin' })).toEqual(
          'admin',
        )
      })
    })
    describe('testing the user resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = userAffiliationsType.getFields()

        const loader = userLoaderByKey(query, '1', {})

        const expectedResult = {
          _id: user._id,
          _key: user._key,
          _rev: user._rev,
          id: user._key,
          displayName: 'Test Account',
          emailValidated: false,
          preferredLang: 'french',
          tfaValidated: false,
          userName: 'test.account@istio.actually.exists',
        }

        await expect(
          demoType.user.resolve(
            { _to: user._id },
            {},
            { loaders: { userLoaderByKey: loader } },
          ),
        ).resolves.toEqual(expectedResult)
      })
    })
    describe('testing the organization resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = userAffiliationsType.getFields()

        const loader = orgLoaderByKey(query, 'en', '1', {})

        const expectedResult = {
          _id: org._id,
          _key: org._key,
          _rev: org._rev,
          acronym: 'TBS',
          city: 'Ottawa',
          country: 'Canada',
          domainCount: 0,
          id: org._key,
          name: 'Treasury Board of Canada Secretariat',
          province: 'Ontario',
          sector: 'TBS',
          slug: 'treasury-board-secretariat',
          summaries: {
            mail: {
              fail: 1000,
              pass: 50,
              total: 1050,
            },
            web: {
              fail: 1000,
              pass: 50,
              total: 1050,
            },
          },
          verified: false,
          zone: 'FED',
        }

        await expect(
          demoType.organization.resolve(
            { _from: org._id },
            {},
            { loaders: { orgLoaderByKey: loader } },
          ),
        ).resolves.toEqual(expectedResult)
      })
    })
  })
})
