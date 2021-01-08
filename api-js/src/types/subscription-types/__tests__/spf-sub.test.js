const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { GraphQLString, GraphQLList, GraphQLInt } = require('graphql')

const { makeMigrations } = require('../../../../migrations')
const { guidanceTagType } = require('../../base')
const { spfSubType } = require('../spf-sub')
const { spfGuidanceTagLoader } = require('../../../loaders')

describe('given the spfSubType object', () => {
  describe('testing its field definitions', () => {
    it('has lookups field', () => {
      const demoType = spfSubType.getFields()

      expect(demoType).toHaveProperty('lookups')
      expect(demoType.lookups.type).toMatchObject(GraphQLInt)
    })
    it('has record field', () => {
      const demoType = spfSubType.getFields()

      expect(demoType).toHaveProperty('record')
      expect(demoType.record.type).toMatchObject(GraphQLString)
    })
    it('has spfDefault field', () => {
      const demoType = spfSubType.getFields()

      expect(demoType).toHaveProperty('spfDefault')
      expect(demoType.spfDefault.type).toMatchObject(GraphQLString)
    })
    it('has guidanceTags field', () => {
      const demoType = spfSubType.getFields()

      expect(demoType).toHaveProperty('guidanceTags')
      expect(demoType.guidanceTags.type).toMatchObject(
        GraphQLList(guidanceTagType),
      )
    })
  })
  describe('testing its field resolvers', () => {
    describe('testing the lookups resolver', () => {
      it('returns the parsed value', () => {
        const demoType = spfSubType.getFields()

        expect(demoType.lookups.resolve({ lookups: 10 })).toEqual(10)
      })
    })
    describe('testing the record resolver', () => {
      it('returns the parsed value', () => {
        const demoType = spfSubType.getFields()

        expect(demoType.record.resolve({ record: 'txtRecord' })).toEqual(
          'txtRecord',
        )
      })
    })
    describe('testing the spfDefault resolver', () => {
      it('returns the parsed value', () => {
        const demoType = spfSubType.getFields()

        expect(
          demoType.spfDefault.resolve({ spfDefault: 'spfDefault' }),
        ).toEqual('spfDefault')
      })
    })
    describe('testing the guidanceTags resolver', () => {
      let query, drop, truncate, migrate, collections, spfGT

      beforeAll(async () => {
        ;({ migrate } = await ArangoTools({ rootPass, url }))
        ;({ query, drop, truncate, collections } = await migrate(
          makeMigrations({
            databaseName: dbNameFromFile(__filename),
            rootPass,
          }),
        ))
      })

      beforeEach(async () => {
        await truncate()
        spfGT = await collections.spfGuidanceTags.save({
          _key: 'spf1',
          tagName: 'SPF-TAG',
          guidance: 'Some Interesting Guidance',
          refLinksGuide: [
            {
              description: 'refLinksGuide Description',
              ref_link: 'www.refLinksGuide.ca',
            },
          ],
          refLinksTechnical: [
            {
              description: 'refLinksTechnical Description',
              ref_link: 'www.refLinksTechnical.ca',
            },
          ],
        })
      })

      afterAll(async () => {
        await drop()
      })

      it('returns the parsed value', async () => {
        const demoType = spfSubType.getFields()

        const loader = spfGuidanceTagLoader(query, '1', {})
        const guidanceTags = ['spf1']

        expect(
          await demoType.guidanceTags.resolve(
            { guidanceTags },
            {},
            { loaders: { spfGuidanceTagLoader: loader } },
          ),
        ).toEqual([
          {
            _id: spfGT._id,
            _key: spfGT._key,
            _rev: spfGT._rev,
            guidance: 'Some Interesting Guidance',
            id: 'spf1',
            refLinksGuide: [
              {
                description: 'refLinksGuide Description',
                ref_link: 'www.refLinksGuide.ca',
              },
            ],
            refLinksTechnical: [
              {
                description: 'refLinksTechnical Description',
                ref_link: 'www.refLinksTechnical.ca',
              },
            ],
            tagId: 'spf1',
            tagName: 'SPF-TAG',
          },
        ])
      })
    })
  })
})
