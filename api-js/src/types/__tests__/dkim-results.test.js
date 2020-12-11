const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { toGlobalId } = require('graphql-relay')
const { GraphQLID, GraphQLNonNull, GraphQLString } = require('graphql')
const { GraphQLJSON } = require('graphql-scalars')

const { makeMigrations } = require('../../../migrations')
const { cleanseInput } = require('../../validators')
const {
  dkimLoaderByKey,
  dkimGuidanceTagConnectionsLoader,
} = require('../../loaders')
const { dkimResultType, dkimType, guidanceTagConnection } = require('../index')

describe('given the dkim result object', () => {
  describe('testing its field definitions', () => {
    it('has an id field', () => {
      const demoType = dkimResultType.getFields()

      expect(demoType).toHaveProperty('id')
      expect(demoType.id.type).toMatchObject(GraphQLNonNull(GraphQLID))
    })
    it('has a dkim field', () => {
      const demoType = dkimResultType.getFields()

      expect(demoType).toHaveProperty('dkim')
      expect(demoType.dkim.type).toEqual(dkimType)
    })
    it('has a selector field', () => {
      const demoType = dkimResultType.getFields()

      expect(demoType).toHaveProperty('selector')
      expect(demoType.selector.type).toEqual(GraphQLString)
    })
    it('has a record field', () => {
      const demoType = dkimResultType.getFields()

      expect(demoType).toHaveProperty('record')
      expect(demoType.record.type).toMatchObject(GraphQLString)
    })
    it('has a keyLength field', () => {
      const demoType = dkimResultType.getFields()

      expect(demoType).toHaveProperty('keyLength')
      expect(demoType.keyLength.type).toMatchObject(GraphQLString)
    })
    it('has a rawJson field', () => {
      const demoType = dkimResultType.getFields()

      expect(demoType).toHaveProperty('rawJson')
      expect(demoType.rawJson.type).toEqual(GraphQLJSON)
    })
    it('has a guidanceTags field', () => {
      const demoType = dkimResultType.getFields()

      expect(demoType).toHaveProperty('guidanceTags')
      expect(demoType.guidanceTags.type).toEqual(
        guidanceTagConnection.connectionType,
      )
    })
  })
  describe('testing its field resolvers', () => {
    let query, drop, truncate, migrate, collections, dkim, dkimResult, dkimGT

    beforeAll(async () => {
      ;({ migrate } = await ArangoTools({ rootPass, url }))
      ;({ query, drop, truncate, collections } = await migrate(
        makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
      ))
    })

    beforeEach(async () => {
      await truncate()
      dkim = await collections.dkim.save({
        timestamp: '2020-10-02T12:43:39Z',
      })
      dkimResult = await collections.dkimResults.save({
        selector: 'selector._dkim1',
        record: 'txtRecord',
        keyLength: '2048',
        guidanceTags: ['dkim1'],
      })
      await collections.dkimToDkimResults.save({
        _to: dkimResult._id,
        _from: dkim._id,
      })
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

    describe('testing the id resolver', () => {
      it('returns the resolved value', () => {
        const demoType = dkimResultType.getFields()

        expect(demoType.id.resolve({ id: '1' })).toEqual(
          toGlobalId('dkimResult', 1),
        )
      })
    })
    describe('testing the dkim resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = dkimResultType.getFields()

        const loader = dkimLoaderByKey(query, '1', {})

        expect(
          await demoType.dkim.resolve(
            { dkimId: dkim._id },
            {},
            { loaders: { dkimLoaderByKey: loader } },
          ),
        ).toEqual({
          _id: dkim._id,
          _key: dkim._key,
          _rev: dkim._rev,
          id: dkim._key,
          timestamp: '2020-10-02T12:43:39Z',
        })
      })
    })
    describe('testing the selector field', () => {
      it('returns the resolved value', () => {
        const demoType = dkimResultType.getFields()

        expect(
          demoType.selector.resolve({ selector: 'selector._dkim1' }),
        ).toEqual('selector._dkim1')
      })
    })
    describe('testing the record resolver', () => {
      it('returns the resolved value', () => {
        const demoType = dkimResultType.getFields()

        expect(demoType.record.resolve({ record: 'txtRecord' })).toEqual(
          'txtRecord',
        )
      })
    })
    describe('testing the keyLength resolver', () => {
      it('returns the resolved value', () => {
        const demoType = dkimResultType.getFields()

        expect(demoType.keyLength.resolve({ keyLength: '2048' })).toEqual(
          '2048',
        )
      })
    })
    describe('testing the rawJSON resolver', () => {
      it('returns the resolved value', () => {
        const demoType = dkimResultType.getFields()

        const rawJson = { item: 1234 }

        expect(demoType.rawJson.resolve({ rawJson })).toEqual(JSON.stringify(rawJson))
      })
    })
    describe('testing the guidanceTags resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = dkimResultType.getFields()

        const loader = dkimGuidanceTagConnectionsLoader(
          query,
          '1',
          cleanseInput,
          {},
        )
        const guidanceTags = ['dkim1']

        const expectedResult = {
          edges: [
            {
              cursor: toGlobalId('guidanceTags', dkimGT._key),
              node: {
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
            },
          ],
          totalCount: 1,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('guidanceTags', 'dkim1'),
            endCursor: toGlobalId('guidanceTags', 'dkim1'),
          },
        }

        expect(
          await demoType.guidanceTags.resolve(
            { guidanceTags },
            { first: 1 },
            { loaders: { dkimGuidanceTagConnectionsLoader: loader } },
          ),
        ).toEqual(expectedResult)
      })
    })
  })
})
