const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { GraphQLList } = require('graphql')

const { makeMigrations } = require('../../../../migrations')
const { guidanceTagType } = require('../../base/guidance-tags')
const { sslSubType } = require('../ssl-sub')
const { sslGuidanceTagLoader } = require('../../../loaders')

describe('given the sslSubType object', () => {
  describe('testing its field definitions', () => {
    it('has guidanceTags field', () => {
      const demoType = sslSubType.getFields()

      expect(demoType).toHaveProperty('guidanceTags')
      expect(demoType.guidanceTags.type).toMatchObject(
        GraphQLList(guidanceTagType),
      )
    })
  })
  describe('testing its field resolvers', () => {
    describe('testing the guidanceTags resolver', () => {
      let query, drop, truncate, migrate, collections, sslGT

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
        sslGT = await collections.sslGuidanceTags.save({
          _key: 'ssl1',
          tagName: 'SSL-TAG',
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
        const demoType = sslSubType.getFields()

        const loader = sslGuidanceTagLoader(query, '1', {})
        const guidanceTags = ['ssl1']

        expect(
          await demoType.guidanceTags.resolve(
            { guidanceTags },
            {},
            { loaders: { sslGuidanceTagLoader: loader } },
          ),
        ).toEqual([
          {
            _id: sslGT._id,
            _key: sslGT._key,
            _rev: sslGT._rev,
            guidance: 'Some Interesting Guidance',
            id: 'ssl1',
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
            tagId: 'ssl1',
            tagName: 'SSL-TAG',
          },
        ])
      })
    })
  })
})
