import { ArangoTools, dbNameFromFile } from 'arango-tools'
import { GraphQLString, GraphQLList } from 'graphql'

import { makeMigrations } from '../../../../migrations'
import { httpsGuidanceTagLoader } from '../../../guidance-tag/loaders'
import { guidanceTagType } from '../../../guidance-tag/objects'
import { httpsSubType } from '../index'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the httpsSubType object', () => {
  describe('testing its field definitions', () => {
    it('has implementation field', () => {
      const demoType = httpsSubType.getFields()

      expect(demoType).toHaveProperty('implementation')
      expect(demoType.implementation.type).toMatchObject(GraphQLString)
    })
    it('has enforced field', () => {
      const demoType = httpsSubType.getFields()

      expect(demoType).toHaveProperty('enforced')
      expect(demoType.enforced.type).toMatchObject(GraphQLString)
    })
    it('has hsts field', () => {
      const demoType = httpsSubType.getFields()

      expect(demoType).toHaveProperty('hsts')
      expect(demoType.hsts.type).toMatchObject(GraphQLString)
    })
    it('has hstsAge field', () => {
      const demoType = httpsSubType.getFields()

      expect(demoType).toHaveProperty('hstsAge')
      expect(demoType.hstsAge.type).toMatchObject(GraphQLString)
    })
    it('has preloaded field', () => {
      const demoType = httpsSubType.getFields()

      expect(demoType).toHaveProperty('preloaded')
      expect(demoType.preloaded.type).toMatchObject(GraphQLString)
    })
    it('has guidanceTags field', () => {
      const demoType = httpsSubType.getFields()

      expect(demoType).toHaveProperty('guidanceTags')
      expect(demoType.guidanceTags.type).toMatchObject(
        GraphQLList(guidanceTagType),
      )
    })
  })
  describe('testing its field resolvers', () => {
    describe('testing the implementation resolver', () => {
      it('returns the parsed value', () => {
        const demoType = httpsSubType.getFields()

        expect(
          demoType.implementation.resolve({ implementation: 'implementation' }),
        ).toEqual('implementation')
      })
    })
    describe('testing the enforced resolver', () => {
      it('returns the parsed value', () => {
        const demoType = httpsSubType.getFields()

        expect(demoType.enforced.resolve({ enforced: 'enforced' })).toEqual(
          'enforced',
        )
      })
    })
    describe('testing the hsts resolver', () => {
      it('returns the parsed value', () => {
        const demoType = httpsSubType.getFields()

        expect(demoType.hsts.resolve({ hsts: 'hsts' })).toEqual('hsts')
      })
    })
    describe('testing the hstsAge resolver', () => {
      it('returns the parsed value', () => {
        const demoType = httpsSubType.getFields()

        expect(demoType.hstsAge.resolve({ hstsAge: 'hstsAge' })).toEqual(
          'hstsAge',
        )
      })
    })
    describe('testing the preloaded resolver', () => {
      it('returns the parsed value', () => {
        const demoType = httpsSubType.getFields()

        expect(demoType.preloaded.resolve({ preloaded: 'preloaded' })).toEqual(
          'preloaded',
        )
      })
    })
    describe('testing the guidanceTags resolver', () => {
      let query, drop, truncate, migrate, collections, httpsGT

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
        httpsGT = await collections.httpsGuidanceTags.save({
          _key: 'https1',
          tagName: 'HTTPS-TAG',
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
        const demoType = httpsSubType.getFields()

        const loader = httpsGuidanceTagLoader(query, '1', {})
        const guidanceTags = ['https1']

        expect(
          await demoType.guidanceTags.resolve(
            { guidanceTags },
            {},
            { loaders: { httpsGuidanceTagLoader: loader } },
          ),
        ).toEqual([
          {
            _id: httpsGT._id,
            _key: httpsGT._key,
            _rev: httpsGT._rev,
            guidance: 'Some Interesting Guidance',
            id: 'https1',
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
            tagId: 'https1',
            tagName: 'HTTPS-TAG',
          },
        ])
      })
    })
  })
})
