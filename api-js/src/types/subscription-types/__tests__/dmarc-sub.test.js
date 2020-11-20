const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { GraphQLString, GraphQLList, GraphQLInt } = require('graphql')

const { makeMigrations } = require('../../../../migrations')
const { guidanceTagType } = require('../../base/guidance-tags')
const { dmarcSubType } = require('../dmarc-sub')
const { dmarcGuidanceTagLoader } = require('../../../loaders')

describe('given the dmarcSubType object', () => {
  describe('testing its field definitions', () => {
    it('has dmarcPhase field', () => {
      const demoType = dmarcSubType.getFields()

      expect(demoType).toHaveProperty('dmarcPhase')
      expect(demoType.dmarcPhase.type).toMatchObject(GraphQLInt)
    })
    it('has record field', () => {
      const demoType = dmarcSubType.getFields()

      expect(demoType).toHaveProperty('record')
      expect(demoType.record.type).toMatchObject(GraphQLString)
    })
    it('has pPolicy field', () => {
      const demoType = dmarcSubType.getFields()

      expect(demoType).toHaveProperty('pPolicy')
      expect(demoType.pPolicy.type).toMatchObject(GraphQLString)
    })
    it('has spPolicy field', () => {
      const demoType = dmarcSubType.getFields()

      expect(demoType).toHaveProperty('spPolicy')
      expect(demoType.spPolicy.type).toMatchObject(GraphQLString)
    })
    it('has pct field', () => {
      const demoType = dmarcSubType.getFields()

      expect(demoType).toHaveProperty('pct')
      expect(demoType.pct.type).toMatchObject(GraphQLInt)
    })
    it('has guidanceTags field', () => {
      const demoType = dmarcSubType.getFields()

      expect(demoType).toHaveProperty('guidanceTags')
      expect(demoType.guidanceTags.type).toMatchObject(
        GraphQLList(guidanceTagType),
      )
    })
  })
  describe('testing its field resolvers', () => {
    describe('testing the dmarcPhase resolver', () => {
      it('returns the parsed value', () => {
        const demoType = dmarcSubType.getFields()

        expect(demoType.dmarcPhase.resolve({ dmarcPhase: 1 })).toEqual(1)
      })
    })
    describe('testing the record resolver', () => {
      it('returns the parsed value', () => {
        const demoType = dmarcSubType.getFields()

        expect(demoType.record.resolve({ record: 'txtRecord' })).toEqual(
          'txtRecord',
        )
      })
    })
    describe('testing the pPolicy resolver', () => {
      it('returns the parsed value', () => {
        const demoType = dmarcSubType.getFields()

        expect(demoType.pPolicy.resolve({ pPolicy: 'pPolicy' })).toEqual(
          'pPolicy',
        )
      })
    })
    describe('testing the spPolicy resolver', () => {
      it('returns the parsed value', () => {
        const demoType = dmarcSubType.getFields()

        expect(demoType.spPolicy.resolve({ spPolicy: 'spPolicy' })).toEqual(
          'spPolicy',
        )
      })
    })
    describe('testing the pct resolver', () => {
      it('returns the parsed value', () => {
        const demoType = dmarcSubType.getFields()

        expect(demoType.pct.resolve({ pct: 100 })).toEqual(100)
      })
    })
    describe('testing the guidanceTags resolver', () => {
      let query, drop, truncate, migrate, collections, dmarcGT

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
        dmarcGT = await collections.dmarcGuidanceTags.save({
          _key: 'dmarc1',
          tagName: 'DMARC-TAG',
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
        const demoType = dmarcSubType.getFields()

        const loader = dmarcGuidanceTagLoader(query, 1, {})
        const guidanceTags = ['dmarc1']

        expect(
          await demoType.guidanceTags.resolve(
            { guidanceTags },
            {},
            { loaders: { dmarcGuidanceTagLoader: loader } },
          ),
        ).toEqual([
          {
            _id: dmarcGT._id,
            _key: dmarcGT._key,
            _rev: dmarcGT._rev,
            guidance: 'Some Interesting Guidance',
            id: 'dmarc1',
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
            tagId: 'dmarc1',
            tagName: 'DMARC-TAG',
          },
        ])
      })
    })
  })
})
