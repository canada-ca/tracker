const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const {
  GraphQLNonNull,
  GraphQLID,
  GraphQLString,
  GraphQLBoolean,
} = require('graphql')
const { toGlobalId } = require('graphql-relay')
const { GraphQLEmailAddress } = require('graphql-scalars')

const { makeMigrations } = require('../../../../migrations')
const { affiliationLoaderByUserId } = require('../../../loaders')
const { cleanseInput } = require('../../../validators')
const { userType, userAffiliationsConnection } = require('../../index')
const { LanguageEnums } = require('../../../enums')

describe('given the user object', () => {
  describe('testing the field definitions', () => {
    it('has an id field', () => {
      const demoType = userType.getFields()

      expect(demoType).toHaveProperty('id')
      expect(demoType.id.type).toMatchObject(GraphQLNonNull(GraphQLID))
    })
    it('has a userName field', () => {
      const demoType = userType.getFields()

      expect(demoType).toHaveProperty('userName')
      expect(demoType.userName.type).toMatchObject(GraphQLEmailAddress)
    })
    it('has a displayName field', () => {
      const demoType = userType.getFields()

      expect(demoType).toHaveProperty('displayName')
      expect(demoType.displayName.type).toMatchObject(GraphQLString)
    })
    it('has a preferredLang field', () => {
      const demoType = userType.getFields()

      expect(demoType).toHaveProperty('preferredLang')
      expect(demoType.preferredLang.type).toMatchObject(LanguageEnums)
    })
    it('has a tfaValidated field', () => {
      const demoType = userType.getFields()

      expect(demoType).toHaveProperty('tfaValidated')
      expect(demoType.tfaValidated.type).toMatchObject(GraphQLBoolean)
    })
    it('has a emailValidated field', () => {
      const demoType = userType.getFields()

      expect(demoType).toHaveProperty('emailValidated')
      expect(demoType.emailValidated.type).toMatchObject(GraphQLBoolean)
    })
    it('has an affiliations field', () => {
      const demoType = userType.getFields()

      expect(demoType).toHaveProperty('affiliations')
      expect(demoType.affiliations.type).toMatchObject(
        userAffiliationsConnection.connectionType,
      )
    })
  })

  describe('testing the field resolvers', () => {
    let query, drop, truncate, migrate, collections, user, org, affiliation

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
      affiliation = await collections.affiliations.save({
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
      it('returns the resolved field', () => {
        const demoType = userType.getFields()

        expect(demoType.id.resolve({ id: '1' })).toEqual(
          toGlobalId('users', '1'),
        )
      })
    })
    describe('testing the userName field', () => {
      it('returns the resolved value', () => {
        const demoType = userType.getFields()

        expect(
          demoType.userName.resolve({ userName: 'test@email.gc.ca' }),
        ).toEqual('test@email.gc.ca')
      })
    })
    describe('testing the displayName field', () => {
      it('returns the resolved value', () => {
        const demoType = userType.getFields()

        expect(
          demoType.displayName.resolve({ displayName: 'display name' }),
        ).toEqual('display name')
      })
    })
    describe('testing the preferredLang field', () => {
      it('returns the resolved value', () => {
        const demoType = userType.getFields()

        expect(
          demoType.preferredLang.resolve({ preferredLang: 'english' }),
        ).toEqual('english')
      })
    })
    describe('testing the tfaValidated field', () => {
      it('returns the resolved value', () => {
        const demoType = userType.getFields()

        expect(demoType.tfaValidated.resolve({ tfaValidated: true })).toEqual(
          true,
        )
      })
    })
    describe('testing the emailValidated field', () => {
      it('returns the resolved value', () => {
        const demoType = userType.getFields()

        expect(
          demoType.emailValidated.resolve({ emailValidated: true }),
        ).toEqual(true)
      })
    })
    describe('testing the affiliations field', () => {
      it('returns the resolved value', async () => {
        const demoType = userType.getFields()

        const loader = affiliationLoaderByUserId(
          query,
          user._key,
          cleanseInput,
          {},
        )

        const expectedResult = {
          edges: [
            {
              cursor: toGlobalId('affiliations', affiliation._key),
              node: {
                _from: org._id,
                _id: affiliation._id,
                _key: affiliation._key,
                _rev: affiliation._rev,
                _to: user._id,
                id: affiliation._key,
                orgKey: org._key,
                permission: 'user',
                userKey: user._key,
              },
            },
          ],
          totalCount: 1,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('affiliations', affiliation._key),
            endCursor: toGlobalId('affiliations', affiliation._key),
          },
        }

        await expect(
          demoType.affiliations.resolve(
            { _id: user._id },
            { first: 1 },
            { loaders: { affiliationLoaderByUserId: loader } },
          ),
        ).resolves.toEqual(expectedResult)
      })
    })
  })
})
