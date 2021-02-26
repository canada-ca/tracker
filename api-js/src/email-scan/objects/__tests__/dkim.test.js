import { ensure, dbNameFromFile } from 'arango-tools'
import { GraphQLNonNull, GraphQLID } from 'graphql'
import { GraphQLDateTime } from 'graphql-scalars'
import { toGlobalId } from 'graphql-relay'

import { databaseOptions } from '../../../../database-options'
import { cleanseInput } from '../../../validators'
import { domainLoaderByKey } from '../../../domain/loaders'
import { domainType } from '../../../domain/objects'
import { dkimResultsLoaderConnectionByDkimId } from '../../loaders'
import { dkimType, dkimResultConnection } from '../index'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the dkimType object', () => {
  describe('testing its field definitions', () => {
    it('has an id field', () => {
      const demoType = dkimType.getFields()

      expect(demoType).toHaveProperty('id')
      expect(demoType.id.type).toMatchObject(GraphQLNonNull(GraphQLID))
    })
    it('has a domain field', () => {
      const demoType = dkimType.getFields()

      expect(demoType).toHaveProperty('domain')
      expect(demoType.domain.type).toMatchObject(domainType)
    })
    it('has a timestamp field', () => {
      const demoType = dkimType.getFields()

      expect(demoType).toHaveProperty('timestamp')
      expect(demoType.timestamp.type).toMatchObject(GraphQLDateTime)
    })
    it('has a results field', () => {
      const demoType = dkimType.getFields()

      expect(demoType).toHaveProperty('results')
      expect(demoType.results.type).toMatchObject(
        dkimResultConnection.connectionType,
      )
    })
  })
  describe('testing its field resolvers', () => {
    let query, drop, truncate, collections, domain, dkim, dkimResult

    beforeAll(async () => {
      ;({ query, drop, truncate, collections } = await ensure({
        type: 'database',
        name: dbNameFromFile(__filename),
        url,
        rootPassword: rootPass,
        options: databaseOptions({ rootPass }),
      }))
    })

    beforeEach(async () => {
      domain = await collections.domains.save({
        domain: 'test.domain.gc.ca',
        slug: 'test-domain-gc-ca',
      })
      dkim = await collections.dkim.save({
        timestamp: '2020-10-02T12:43:39Z',
      })
      await collections.domainsDKIM.save({
        _from: domain._id,
        _to: dkim._id,
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
    })

    afterEach(async () => {
      await truncate()
    })

    afterAll(async () => {
      await drop()
    })

    describe('testing the id resolver', () => {
      it('returns the resolved value', () => {
        const demoType = dkimType.getFields()

        expect(demoType.id.resolve({ id: '1' })).toEqual(toGlobalId('dkim', 1))
      })
    })
    describe('testing the domain resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = dkimType.getFields()

        const loader = domainLoaderByKey(query, '1', {})

        await expect(
          demoType.domain.resolve(
            { domainId: domain._id },
            {},
            { loaders: { domainLoaderByKey: loader } },
          ),
        ).resolves.toEqual({
          _id: domain._id,
          _key: domain._key,
          _rev: domain._rev,
          _type: 'domain',
          id: domain._key,
          domain: 'test.domain.gc.ca',
          slug: 'test-domain-gc-ca',
        })
      })
    })
    describe('testing the timestamp resolver', () => {
      it('returns the resolved value', () => {
        const demoType = dkimType.getFields()

        expect(
          demoType.timestamp.resolve({ timestamp: '2020-10-02T12:43:39Z' }),
        ).toEqual(new Date('2020-10-02T12:43:39Z'))
      })
    })
    describe('testing the results resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = dkimType.getFields()

        const loader = dkimResultsLoaderConnectionByDkimId(
          query,
          '1',
          cleanseInput,
          {},
        )

        const expectedResult = {
          edges: [
            {
              cursor: toGlobalId('dkimResult', dkimResult._key),
              node: {
                _id: dkimResult._id,
                _key: dkimResult._key,
                _rev: dkimResult._rev,
                _type: 'dkimResult',
                id: dkimResult._key,
                dkimId: dkim._id,
                selector: 'selector._dkim1',
                record: 'txtRecord',
                keyLength: '2048',
                guidanceTags: ['dkim1'],
              },
            },
          ],
          totalCount: 1,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('dkimResult', dkimResult._key),
            endCursor: toGlobalId('dkimResult', dkimResult._key),
          },
        }

        await expect(
          demoType.results.resolve(
            { _id: dkim._id },
            { first: 1 },
            { loaders: { dkimResultsLoaderConnectionByDkimId: loader } },
          ),
        ).resolves.toEqual(expectedResult)
      })
    })
  })
})
