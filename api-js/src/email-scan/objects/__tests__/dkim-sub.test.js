import { ensure, dbNameFromFile } from 'arango-tools'
import { GraphQLID, GraphQLList } from 'graphql'

import { databaseOptions } from '../../../../database-options'
import { dkimResultSubType, dkimSubType } from '../index'
import { domainType } from '../../../domain/objects'
import { StatusEnum } from '../../../enums'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the dkimSubType object', () => {
  describe('testing its field definitions', () => {
    it('has sharedId field', () => {
      const demoType = dkimSubType.getFields()

      expect(demoType).toHaveProperty('sharedId')
      expect(demoType.sharedId.type).toMatchObject(GraphQLID)
    })
    it('has a domain field', () => {
      const demoType = dkimSubType.getFields()

      expect(demoType).toHaveProperty('domain')
      expect(demoType.domain.type).toMatchObject(domainType)
    })
    it('has a status field', () => {
      const demoType = dkimSubType.getFields()

      expect(demoType).toHaveProperty('status')
      expect(demoType.status.type).toMatchObject(StatusEnum)
    })
    it('has results field', () => {
      const demoType = dkimSubType.getFields()

      expect(demoType).toHaveProperty('results')
      expect(demoType.results.type).toMatchObject(
        GraphQLList(dkimResultSubType),
      )
    })
  })
  describe('testing its field resolvers', () => {
    describe('testing the sharedId resolver', () => {
      it('returns the parsed value', () => {
        const demoType = dkimSubType.getFields()

        expect(demoType.sharedId.resolve({ sharedId: 'sharedId' })).toEqual(
          'sharedId',
        )
      })
    })
    describe('testing the domain resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = dkimSubType.getFields()
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
            { domainKey: '1' },
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
    describe('testing the status resolver', () => {
      it('returns the parsed value', () => {
        const demoType = dkimSubType.getFields()

        expect(demoType.status.resolve({ status: 'status' })).toEqual('status')
      })
    })
    describe('testing the results resolver', () => {
      let drop, truncate, collections, dkimGT

      beforeAll(async () => {
        ;({ drop, truncate, collections } = await ensure({
          type: 'database',
          name: dbNameFromFile(__filename),
          url,
          rootPassword: rootPass,
          options: databaseOptions({ rootPass }),
        }))
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
