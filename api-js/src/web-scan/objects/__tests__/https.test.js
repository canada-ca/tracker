import { ArangoTools, dbNameFromFile } from 'arango-tools'
import { GraphQLID, GraphQLNonNull, GraphQLString } from 'graphql'
import { toGlobalId } from 'graphql-relay'
import { GraphQLDateTime, GraphQLJSON } from 'graphql-scalars'

import { makeMigrations } from '../../../../migrations'
import { cleanseInput } from '../../../validators'
import { domainLoaderByKey } from '../../../domain/loaders'
import { domainType } from '../../../domain/objects'
import { httpsGuidanceTagConnectionsLoader } from '../../../guidance-tag/loaders'
import { guidanceTagConnection } from '../../../guidance-tag/objects'
import { httpsType } from '../index'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the https gql object', () => {
  describe('testing the field definitions', () => {
    it('has an id field', () => {
      const demoType = httpsType.getFields()

      expect(demoType).toHaveProperty('id')
      expect(demoType.id.type).toMatchObject(GraphQLNonNull(GraphQLID))
    })
    it('has a domain field', () => {
      const demoType = httpsType.getFields()

      expect(demoType).toHaveProperty('domain')
      expect(demoType.domain.type).toMatchObject(domainType)
    })
    it('has a timestamp field', () => {
      const demoType = httpsType.getFields()

      expect(demoType).toHaveProperty('timestamp')
      expect(demoType.timestamp.type).toMatchObject(GraphQLDateTime)
    })
    it('has a implementation field', () => {
      const demoType = httpsType.getFields()

      expect(demoType).toHaveProperty('implementation')
      expect(demoType.implementation.type).toMatchObject(GraphQLString)
    })
    it('has an enforced field', () => {
      const demoType = httpsType.getFields()

      expect(demoType).toHaveProperty('enforced')
      expect(demoType.enforced.type).toMatchObject(GraphQLString)
    })
    it('has a hsts field', () => {
      const demoType = httpsType.getFields()

      expect(demoType).toHaveProperty('hsts')
      expect(demoType.hsts.type).toMatchObject(GraphQLString)
    })
    it('has a hstsAge field', () => {
      const demoType = httpsType.getFields()

      expect(demoType).toHaveProperty('hstsAge')
      expect(demoType.hstsAge.type).toMatchObject(GraphQLString)
    })
    it('has a preloaded field', () => {
      const demoType = httpsType.getFields()

      expect(demoType).toHaveProperty('preloaded')
      expect(demoType.preloaded.type).toMatchObject(GraphQLString)
    })
    it('has a rawJson field', () => {
      const demoType = httpsType.getFields()

      expect(demoType).toHaveProperty('rawJson')
      expect(demoType.rawJson.type).toEqual(GraphQLJSON)
    })
    it('has a guidanceTags field', () => {
      const demoType = httpsType.getFields()

      expect(demoType).toHaveProperty('guidanceTags')
      expect(demoType.guidanceTags.type).toMatchObject(
        guidanceTagConnection.connectionType,
      )
    })
  })
  describe('testing the field resolvers', () => {
    let query,
      drop,
      truncate,
      migrate,
      collections,
      user,
      domain,
      https,
      httpsGT

    beforeAll(async () => {
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
      domain = await collections.domains.save({
        domain: 'test.domain.gc.ca',
        slug: 'test-domain-gc-ca',
      })
      https = await collections.https.save({
        timestamp: '2020-10-02T12:43:39Z',
        implementation: 'Valid HTTPS',
        enforced: 'Strict',
        hsts: 'HSTS Max Age Too Short',
        hstsAge: '31622400',
        preloaded: 'HSTS Preloaded',
        guidanceTags: ['https1'],
      })
      await collections.domainsHTTPS.save({
        _from: domain._id,
        _to: https._id,
      })
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

    afterEach(async () => {
      await truncate()
    })

    afterAll(async () => {
      await drop()
    })

    describe('testing the id resolver', () => {
      it('returns the resolved value', () => {
        const demoType = httpsType.getFields()

        expect(demoType.id.resolve({ id: '1' })).toEqual(
          toGlobalId('https', '1'),
        )
      })
    })
    describe('testing the domain resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = httpsType.getFields()

        const loader = domainLoaderByKey(query, user._key, {})

        const expectedResult = {
          _id: domain._id,
          _key: domain._key,
          _rev: domain._rev,
          _type: 'domain',
          id: domain._key,
          domain: 'test.domain.gc.ca',
          slug: 'test-domain-gc-ca',
        }

        await expect(
          demoType.domain.resolve(
            { domainId: domain._id },
            {},
            { loaders: { domainLoaderByKey: loader } },
          ),
        ).resolves.toEqual(expectedResult)
      })
    })
    describe('testing the timestamp resolver', () => {
      it('returns the resolved value', () => {
        const demoType = httpsType.getFields()

        expect(
          demoType.timestamp.resolve({ timestamp: '2020-10-02T12:43:39Z' }),
        ).toEqual(new Date('2020-10-02T12:43:39.000Z'))
      })
    })
    describe('testing the implementation resolver', () => {
      it('returns the resolved value', () => {
        const demoType = httpsType.getFields()

        expect(
          demoType.implementation.resolve({ implementation: 'implementation' }),
        ).toEqual('implementation')
      })
    })
    describe('testing the enforced resolver', () => {
      it('returns the resolved value', () => {
        const demoType = httpsType.getFields()

        expect(demoType.enforced.resolve({ enforced: 'enforced' })).toEqual(
          'enforced',
        )
      })
    })
    describe('testing the hsts resolver', () => {
      it('returns the resolved value', () => {
        const demoType = httpsType.getFields()

        expect(demoType.hsts.resolve({ hsts: 'hsts' })).toEqual('hsts')
      })
    })
    describe('testing the hstsAge resolver', () => {
      it('returns the resolved value', () => {
        const demoType = httpsType.getFields()

        expect(demoType.hstsAge.resolve({ hstsAge: 'hstsAge' })).toEqual(
          'hstsAge',
        )
      })
    })
    describe('testing the preloaded resolver', () => {
      it('returns the resolved value', () => {
        const demoType = httpsType.getFields()

        expect(demoType.preloaded.resolve({ preloaded: 'preloaded' })).toEqual(
          'preloaded',
        )
      })
    })
    describe('testing the rawJSON resolver', () => {
      it('returns the resolved value', () => {
        const demoType = httpsType.getFields()

        const rawJson = { item: 1234 }

        expect(demoType.rawJson.resolve({ rawJson })).toEqual(
          JSON.stringify(rawJson),
        )
      })
    })
    describe('testing the guidanceTags resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = httpsType.getFields()

        const loader = httpsGuidanceTagConnectionsLoader(
          query,
          '1',
          cleanseInput,
          {},
        )
        const guidanceTags = ['https1']

        const expectedResult = {
          edges: [
            {
              cursor: toGlobalId('guidanceTags', httpsGT._key),
              node: {
                _id: httpsGT._id,
                _key: httpsGT._key,
                _rev: httpsGT._rev,
                _type: 'guidanceTag',
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
            },
          ],
          totalCount: 1,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('guidanceTags', httpsGT._key),
            endCursor: toGlobalId('guidanceTags', httpsGT._key),
          },
        }

        expect(
          await demoType.guidanceTags.resolve(
            { guidanceTags },
            { first: 1 },
            { loaders: { httpsGuidanceTagConnectionsLoader: loader } },
          ),
        ).toEqual(expectedResult)
      })
    })
  })
})
