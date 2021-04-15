import { ArangoTools, dbNameFromFile } from 'arango-tools'
import { GraphQLList } from 'graphql'

import { makeMigrations } from '../../../../migrations'
import { loadSslGuidanceTagByTagId } from '../../../guidance-tag/loaders'
import { guidanceTagType } from '../../../guidance-tag/objects'
import { sslSubType } from '../index'

const { DB_PASS: rootPass, DB_URL: url } = process.env

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

        const loader = loadSslGuidanceTagByTagId({
          query,
          userKey: '1',
          i18n: {},
        })
        const guidanceTags = ['ssl1']

        expect(
          await demoType.guidanceTags.resolve(
            { guidanceTags },
            {},
            { loaders: { loadSslGuidanceTagByTagId: loader } },
          ),
        ).toEqual([
          {
            _id: sslGT._id,
            _key: sslGT._key,
            _rev: sslGT._rev,
            _type: 'guidanceTag',
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
