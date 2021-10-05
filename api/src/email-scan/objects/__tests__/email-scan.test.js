import { toGlobalId } from 'graphql-relay'

import { domainType } from '../../../domain/objects'
import {
  emailScanType,
  dkimConnection,
  dmarcConnection,
  spfConnection,
} from '../index'

describe('given the email gql object', () => {
  describe('testing its field definitions', () => {
    it('has a domain field', () => {
      const demoType = emailScanType.getFields()

      expect(demoType).toHaveProperty('domain')
      expect(demoType.domain.type).toMatchObject(domainType)
    })
    it('has a dkim field', () => {
      const demoType = emailScanType.getFields()

      expect(demoType).toHaveProperty('dkim')
      expect(demoType.dkim.type).toMatchObject(dkimConnection.connectionType)
    })
    it('has a dmarc field', () => {
      const demoType = emailScanType.getFields()

      expect(demoType).toHaveProperty('dmarc')
      expect(demoType.dmarc.type).toMatchObject(dmarcConnection.connectionType)
    })
    it('has a spf field', () => {
      const demoType = emailScanType.getFields()

      expect(demoType).toHaveProperty('spf')
      expect(demoType.spf.type).toMatchObject(spfConnection.connectionType)
    })
  })
  describe('testing field resolvers', () => {
    describe('testing the domain resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = emailScanType.getFields()

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
            { _key: '1' },
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
    describe('testing the dkim resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = emailScanType.getFields()

        const expectedResult = {
          edges: [
            {
              cursor: toGlobalId('dkim', 'dkim1'),
              node: {
                _id: 'dkimGuidanceTags/dkim1',
                _key: 'dkim1',
                _rev: 'rev',
                _type: 'dkim',
                id: 'dkim1',
                domainId: 'domains/1',
                timestamp: '2020-10-02T12:43:39Z',
              },
            },
          ],
          totalCount: 1,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('dkim', 'dkim1'),
            endCursor: toGlobalId('dkim', 'dkim1'),
          },
        }

        await expect(
          demoType.dkim.resolve(
            { _id: 'domains/1' },
            { first: 1 },
            {
              loaders: {
                loadDkimConnectionsByDomainId: jest
                  .fn()
                  .mockReturnValue(expectedResult),
              },
            },
          ),
        ).resolves.toEqual(expectedResult)
      })
    })
    describe('testing the dmarc resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = emailScanType.getFields()

        const expectedResult = {
          edges: [
            {
              cursor: toGlobalId('dmarc', 'dmarc1'),
              node: {
                _id: 'dmarcGuidanceTags/dmarc1',
                _key: 'dmarc1',
                _rev: 'rev',
                _type: 'dmarc',
                id: 'dmarc1',
                domainId: 'domains/1',
                dmarcPhase: 1,
                timestamp: '2020-10-02T12:43:39Z',
                pPolicy: 'pPolicy',
                pct: 100,
                record: 'txtRecord',
                spPolicy: 'spPolicy',
                guidanceTags: ['dmarc1'],
              },
            },
          ],
          totalCount: 1,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('dmarc', 'dmarc1'),
            endCursor: toGlobalId('dmarc', 'dmarc1'),
          },
        }

        await expect(
          demoType.dmarc.resolve(
            { _id: 'domains/1' },
            { first: 1 },
            {
              loaders: {
                loadDmarcConnectionsByDomainId: jest
                  .fn()
                  .mockReturnValue(expectedResult),
              },
            },
          ),
        ).resolves.toEqual(expectedResult)
      })
    })
    describe('testing the spf resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = emailScanType.getFields()

        const expectedResult = {
          edges: [
            {
              cursor: toGlobalId('spf', 'spf1'),
              node: {
                _id: 'spfGuidanceTags/spf1',
                _key: 'spf1',
                _rev: 'rev',
                _type: 'spf',
                id: 'spf1',
                domainId: 'domains/1',
                lookups: 5,
                record: 'txtRecord',
                spfDefault: 'default',
                timestamp: '2020-10-02T12:43:39Z',
                guidanceTags: ['spf1'],
              },
            },
          ],
          totalCount: 1,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('spf', 'spf1'),
            endCursor: toGlobalId('spf', 'spf1'),
          },
        }
        await expect(
          demoType.spf.resolve(
            { _id: 'domains/1' },
            { first: 1 },
            {
              loaders: {
                loadSpfConnectionsByDomainId: jest
                  .fn()
                  .mockReturnValue(expectedResult),
              },
            },
          ),
        ).resolves.toEqual(expectedResult)
      })
    })
  })
})
