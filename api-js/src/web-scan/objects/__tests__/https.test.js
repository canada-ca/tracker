import { GraphQLID, GraphQLNonNull, GraphQLString } from 'graphql'
import { toGlobalId } from 'graphql-relay'
import { GraphQLDate, GraphQLJSON } from 'graphql-scalars'

import { domainType } from '../../../domain/objects'
import { guidanceTagConnection } from '../../../guidance-tag/objects'
import { httpsType } from '../index'

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
      expect(demoType.timestamp.type).toMatchObject(GraphQLDate)
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
    it('has a negativeGuidanceTags field', () => {
      const demoType = httpsType.getFields()

      expect(demoType).toHaveProperty('negativeGuidanceTags')
      expect(demoType.negativeGuidanceTags.type).toMatchObject(
        guidanceTagConnection.connectionType,
      )
    })
    it('has a neutralGuidanceTags field', () => {
      const demoType = httpsType.getFields()

      expect(demoType).toHaveProperty('neutralGuidanceTags')
      expect(demoType.neutralGuidanceTags.type).toMatchObject(
        guidanceTagConnection.connectionType,
      )
    })
    it('has a positiveGuidanceTags field', () => {
      const demoType = httpsType.getFields()

      expect(demoType).toHaveProperty('positiveGuidanceTags')
      expect(demoType.positiveGuidanceTags.type).toMatchObject(
        guidanceTagConnection.connectionType,
      )
    })
  })
  describe('testing the field resolvers', () => {
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

        const expectedResult = {
          _id: 'domains/1',
          _key: '1',
          _rev: 'rev',
          _type: 'domain',
          id: '1',
          domain: 'test.domain.gc.ca',
          slug: 'test-domain-gc-ca',
        }

        await expect(
          demoType.domain.resolve(
            { domainId: 'domains/1' },
            {},
            {
              loaders: {
                loadDomainByKey: {
                  load: jest.fn().mockReturnValue(expectedResult),
                },
              },
            },
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
        const guidanceTags = ['https1']

        const expectedResult = {
          edges: [
            {
              cursor: toGlobalId('guidanceTags', 'https1'),
              node: {
                _id: 'httpsGuidanceTags/https1',
                _key: 'https1',
                _rev: 'rev',
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
            startCursor: toGlobalId('guidanceTags', 'https1'),
            endCursor: toGlobalId('guidanceTags', 'https1'),
          },
        }

        expect(
          await demoType.guidanceTags.resolve(
            { guidanceTags },
            { first: 1 },
            {
              loaders: {
                loadHttpsGuidanceTagConnectionsByTagId: jest
                  .fn()
                  .mockReturnValue(expectedResult),
              },
            },
          ),
        ).toEqual(expectedResult)
      })
    })
    describe('testing the negativeGuidanceTags resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = httpsType.getFields()
        const negativeTags = ['https1']

        const expectedResult = {
          edges: [
            {
              cursor: toGlobalId('guidanceTags', 'https1'),
              node: {
                _id: 'httpsGuidanceTags/https1',
                _key: 'https1',
                _rev: 'rev',
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
            startCursor: toGlobalId('guidanceTags', 'https1'),
            endCursor: toGlobalId('guidanceTags', 'https1'),
          },
        }

        expect(
          await demoType.negativeGuidanceTags.resolve(
            { negativeTags },
            { first: 1 },
            {
              loaders: {
                loadHttpsGuidanceTagConnectionsByTagId: jest
                  .fn()
                  .mockReturnValue(expectedResult),
              },
            },
          ),
        ).toEqual(expectedResult)
      })
    })
    describe('testing the neutralGuidanceTags resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = httpsType.getFields()
        const neutralTags = ['https1']

        const expectedResult = {
          edges: [
            {
              cursor: toGlobalId('guidanceTags', 'https1'),
              node: {
                _id: 'httpsGuidanceTags/https1',
                _key: 'https1',
                _rev: 'rev',
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
            startCursor: toGlobalId('guidanceTags', 'https1'),
            endCursor: toGlobalId('guidanceTags', 'https1'),
          },
        }

        expect(
          await demoType.neutralGuidanceTags.resolve(
            { neutralTags },
            { first: 1 },
            {
              loaders: {
                loadHttpsGuidanceTagConnectionsByTagId: jest
                  .fn()
                  .mockReturnValue(expectedResult),
              },
            },
          ),
        ).toEqual(expectedResult)
      })
    })
    describe('testing the positiveGuidanceTags resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = httpsType.getFields()
        const positiveTags = ['https1']

        const expectedResult = {
          edges: [
            {
              cursor: toGlobalId('guidanceTags', 'https1'),
              node: {
                _id: 'httpsGuidanceTags/https1',
                _key: 'https1',
                _rev: 'rev',
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
            startCursor: toGlobalId('guidanceTags', 'https1'),
            endCursor: toGlobalId('guidanceTags', 'https1'),
          },
        }

        expect(
          await demoType.positiveGuidanceTags.resolve(
            { positiveTags },
            { first: 1 },
            {
              loaders: {
                loadHttpsGuidanceTagConnectionsByTagId: jest
                  .fn()
                  .mockReturnValue(expectedResult),
              },
            },
          ),
        ).toEqual(expectedResult)
      })
    })
  })
})
