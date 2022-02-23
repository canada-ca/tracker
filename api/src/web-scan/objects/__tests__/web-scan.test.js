import { ensure, dbNameFromFile } from 'arango-tools'
import { toGlobalId } from 'graphql-relay'

import { cleanseInput } from '../../../validators'
import { loadDomainByKey } from '../../../domain/loaders'
import { domainType } from '../../../domain/objects'
import {
  loadHttpsConnectionsByDomainId,
  loadSslConnectionByDomainId,
} from '../../loaders'
import { webScanType, httpsConnection, sslConnection } from '../index'

import dbschema from '../../../../database.json';

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the web scan gql object', () => {
  describe('testing the field definitions', () => {
    it('has a domain field', () => {
      const demoType = webScanType.getFields()

      expect(demoType).toHaveProperty('domain')
      expect(demoType.domain.type).toMatchObject(domainType)
    })
    it('has a https field', () => {
      const demoType = webScanType.getFields()

      expect(demoType).toHaveProperty('https')
      expect(demoType.https.type).toMatchObject(httpsConnection.connectionType)
    })
    it('has a ssl field', () => {
      const demoType = webScanType.getFields()

      expect(demoType).toHaveProperty('ssl')
      expect(demoType.ssl.type).toMatchObject(sslConnection.connectionType)
    })
  })

  describe('testing the field resolvers', () => {
    let query, drop, truncate, collections, domain, https, ssl

    beforeAll(async () => {
      ;({ query, drop, truncate, collections } = await ensure({
      variables: {
        dbname: dbNameFromFile(__filename),
        username: 'root',
        rootPassword: rootPass,
        password: rootPass,
        url,
      },

      schema: dbschema,
    }))
    })

    beforeEach(async () => {
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
      ssl = await collections.ssl.save({
        timestamp: '2020-10-02T12:43:39Z',
        guidanceTags: ['ssl1'],
      })
      await collections.domainsSSL.save({
        _from: domain._id,
        _to: ssl._id,
      })
    })

    afterEach(async () => {
      await truncate()
    })

    afterAll(async () => {
      await drop()
    })

    describe('testing the domain resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = webScanType.getFields()

        const loader = loadDomainByKey({ query, userKey: '1', i18n: {} })

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
            { _key: domain._key },
            {},
            { loaders: { loadDomainByKey: loader } },
          ),
        ).resolves.toEqual(expectedResult)
      })
    })
    describe('testing the https resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = webScanType.getFields()

        const loader = loadHttpsConnectionsByDomainId({
          query,
          userKey: '1',
          cleanseInput,
          i18n: {},
        })

        const expectedResult = {
          edges: [
            {
              cursor: toGlobalId('https', https._key),
              node: {
                _id: https._id,
                _key: https._key,
                _rev: https._rev,
                _type: 'https',
                domainId: domain._id,
                enforced: 'Strict',
                guidanceTags: ['https1'],
                hsts: 'HSTS Max Age Too Short',
                hstsAge: '31622400',
                id: https._key,
                implementation: 'Valid HTTPS',
                preloaded: 'HSTS Preloaded',
                timestamp: '2020-10-02T12:43:39Z',
              },
            },
          ],
          totalCount: 1,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('https', https._key),
            endCursor: toGlobalId('https', https._key),
          },
        }

        await expect(
          demoType.https.resolve(
            { _id: domain._id },
            { first: 1 },
            { loaders: { loadHttpsConnectionsByDomainId: loader } },
          ),
        ).resolves.toEqual(expectedResult)
      })
    })
    describe('testing the ssl resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = webScanType.getFields()

        const loader = loadSslConnectionByDomainId({
          query,
          userKey: '1',
          cleanseInput,
          i18n: {},
        })

        const expectedResult = {
          edges: [
            {
              cursor: toGlobalId('ssl', ssl._key),
              node: {
                _id: ssl._id,
                _key: ssl._key,
                _rev: ssl._rev,
                _type: 'ssl',
                domainId: domain._id,
                guidanceTags: ['ssl1'],
                id: ssl._key,
                timestamp: '2020-10-02T12:43:39Z',
              },
            },
          ],
          totalCount: 1,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('ssl', ssl._key),
            endCursor: toGlobalId('ssl', ssl._key),
          },
        }

        await expect(
          demoType.ssl.resolve(
            { _id: domain._id },
            { first: 1 },
            { loaders: { loadSslConnectionByDomainId: loader } },
          ),
        ).resolves.toEqual(expectedResult)
      })
    })
  })
})
