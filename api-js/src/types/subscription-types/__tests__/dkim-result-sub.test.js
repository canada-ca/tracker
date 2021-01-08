const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { GraphQLString, GraphQLList } = require('graphql')

const { makeMigrations } = require('../../../../migrations')
const { guidanceTagType } = require('../../base')
const { dkimResultSubType } = require('../dkim-result-sub')
const { dkimGuidanceTagLoader } = require('../../../loaders')

describe('Given The dkimResultSubType object', () => {
  describe('testing its field definitions', () => {
    it('has selector field', () => {
      const demoType = dkimResultSubType.getFields()

      expect(demoType).toHaveProperty('selector')
      expect(demoType.selector.type).toMatchObject(GraphQLString)
    })
    it('has record field', () => {
      const demoType = dkimResultSubType.getFields()

      expect(demoType).toHaveProperty('record')
      expect(demoType.record.type).toMatchObject(GraphQLString)
    })
    it('has keyLength field', () => {
      const demoType = dkimResultSubType.getFields()

      expect(demoType).toHaveProperty('keyLength')
      expect(demoType.keyLength.type).toMatchObject(GraphQLString)
    })
    it('has guidanceTags field', () => {
      const demoType = dkimResultSubType.getFields()

      expect(demoType).toHaveProperty('guidanceTags')
      expect(demoType.guidanceTags.type).toMatchObject(
        GraphQLList(guidanceTagType),
      )
    })
  })
  describe('testing its field resolvers', () => {
    describe('testing the selector resolver', () => {
      it('returns the parsed value', () => {
        const demoType = dkimResultSubType.getFields()

        expect(
          demoType.selector.resolve({ selector: 'selector._dkim1' }),
        ).toEqual('selector._dkim1')
      })
    })
    describe('testing the record resolver', () => {
      it('returns the parsed value', () => {
        const demoType = dkimResultSubType.getFields()

        expect(demoType.record.resolve({ record: 'txtRecord' })).toEqual(
          'txtRecord',
        )
      })
    })
    describe('testing the keyLength resolver', () => {
      it('returns the parsed value', () => {
        const demoType = dkimResultSubType.getFields()

        expect(demoType.keyLength.resolve({ keyLength: '2048' })).toEqual(
          '2048',
        )
      })
    })
    describe('testing the guidanceTags resolver', () => {
      let query, drop, truncate, migrate, collections, dkimGT

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
        dkimGT = await collections.dkimGuidanceTags.save({
          _key: 'dkim1',
          tagName: 'DKIM-TAG',
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
        const demoType = dkimResultSubType.getFields()

        const loader = dkimGuidanceTagLoader(query, '1', {})
        const guidanceTags = ['dkim1']

        expect(
          await demoType.guidanceTags.resolve(
            { guidanceTags },
            {},
            { loaders: { dkimGuidanceTagLoader: loader } },
          ),
        ).toEqual([
          {
            _id: dkimGT._id,
            _key: dkimGT._key,
            _rev: dkimGT._rev,
            guidance: 'Some Interesting Guidance',
            id: 'dkim1',
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
            tagId: 'dkim1',
            tagName: 'DKIM-TAG',
          },
        ])
      })
    })
  })
})
