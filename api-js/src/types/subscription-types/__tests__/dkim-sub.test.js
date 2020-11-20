const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { GraphQLList } = require('graphql')

const { makeMigrations } = require('../../../../migrations')
const { dkimResultSubType, dkimSubType } = require('../index')

describe('given the dkimSubType object', () => {
  describe('testing its field definitions', () => {
    it('has results field', () => {
      const demoType = dkimSubType.getFields()

      expect(demoType).toHaveProperty('results')
      expect(demoType.results.type).toMatchObject(
        GraphQLList(dkimResultSubType),
      )
    })
  })
  describe('testing its field resolvers', () => {
    describe('testing the results resolver', () => {
      let drop, truncate, migrate, collections, dkimGT

      beforeAll(async () => {
        ;({ migrate } = await ArangoTools({ rootPass, url }))
        ;({ drop, truncate, collections } = await migrate(
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
        const demoType = dkimSubType.getFields()

        const resultObj = [
          {
            selector: 'selector._dkim1',
            record: 'txtRecord',
            keyLength: '2048',
            guidanceTags: [
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
            ],
          },
        ]

        expect(demoType.results.resolve({ results: resultObj })).toEqual([
          {
            guidanceTags: [
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
            ],
            keyLength: '2048',
            record: 'txtRecord',
            selector: 'selector._dkim1',
          },
        ])
      })
    })
  })
})
