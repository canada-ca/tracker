import { ArangoTools, dbNameFromFile } from 'arango-tools'
import { toGlobalId } from 'graphql-relay'
import { makeMigrations } from '../../../../migrations'
import { cleanseInput } from '../../../validators'
import { domainLoaderByKey } from '../../../domain/loaders'
import { domainType } from '../../../domain/objects'
import {
  dkimLoaderConnectionsByDomainId,
  dmarcLoaderConnectionsByDomainId,
  spfLoaderConnectionsByDomainId,
} from '../../loaders'
import {
  emailScanType,
  dkimConnection,
  dmarcConnection,
  spfConnection,
} from '../index'

const { DB_PASS: rootPass, DB_URL: url } = process.env

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
    let query,
      drop,
      truncate,
      migrate,
      collections,
      user,
      domain,
      org,
      dkim,
      dmarc,
      spf

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

      org = await collections.organizations.save({
        orgDetails: {
          en: {
            slug: 'treasury-board-secretariat',
            acronym: 'TBS',
            name: 'Treasury Board of Canada Secretariat',
            zone: 'FED',
            sector: 'TBS',
            country: 'Canada',
            province: 'Ontario',
            city: 'Ottawa',
          },
          fr: {
            slug: 'secretariat-conseil-tresor',
            acronym: 'SCT',
            name: 'Secrétariat du Conseil Trésor du Canada',
            zone: 'FED',
            sector: 'TBS',
            country: 'Canada',
            province: 'Ontario',
            city: 'Ottawa',
          },
        },
      })
      await collections.affiliations.save({
        _from: org._id,
        _to: user._id,
        permission: 'admin',
      })
      domain = await collections.domains.save({
        domain: 'test.domain.gc.ca',
        slug: 'test-domain-gc-ca',
      })
      await collections.claims.save({
        _from: org._id,
        _to: domain._id,
      })
      dkim = await collections.dkim.save({
        timestamp: '2020-10-02T12:43:39Z',
      })
      await collections.domainsDKIM.save({
        _from: domain._id,
        _to: dkim._id,
      })
      dmarc = await collections.dmarc.save({
        timestamp: '2020-10-02T12:43:39Z',
        dmarcPhase: 1,
        record: 'txtRecord',
        pPolicy: 'pPolicy',
        spPolicy: 'spPolicy',
        pct: 100,
        guidanceTags: ['dmarc1'],
      })
      await collections.domainsDMARC.save({
        _from: domain._id,
        _to: dmarc._id,
      })
      spf = await collections.spf.save({
        timestamp: '2020-10-02T12:43:39Z',
        lookups: 5,
        record: 'txtRecord',
        spfDefault: 'default',
        guidanceTags: ['spf1'],
      })
      await collections.domainsSPF.save({
        _from: domain._id,
        _to: spf._id,
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
        const demoType = emailScanType.getFields()

        const loader = domainLoaderByKey(query, user._key, {})

        const expectedResult = {
          _id: domain._id,
          _key: domain._key,
          _rev: domain._rev,
          id: domain._key,
          domain: 'test.domain.gc.ca',
          slug: 'test-domain-gc-ca',
        }

        await expect(
          demoType.domain.resolve(
            { _key: domain._key },
            {},
            { loaders: { domainLoaderByKey: loader } },
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
              cursor: toGlobalId('dkim', dkim._key),
              node: {
                _id: dkim._id,
                _key: dkim._key,
                _rev: dkim._rev,
                id: dkim._key,
                domainId: domain._id,
                timestamp: '2020-10-02T12:43:39Z',
              },
            },
          ],
          totalCount: 1,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('dkim', dkim._key),
            endCursor: toGlobalId('dkim', dkim._key),
          },
        }

        const loader = dkimLoaderConnectionsByDomainId(
          query,
          user._key,
          cleanseInput,
          {},
        )

        await expect(
          demoType.dkim.resolve(
            { _id: domain._id },
            { first: 1 },
            { loaders: { dkimLoaderConnectionsByDomainId: loader } },
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
              cursor: toGlobalId('dmarc', dmarc._key),
              node: {
                _id: dmarc._id,
                _key: dmarc._key,
                _rev: dmarc._rev,
                id: dmarc._key,
                domainId: domain._id,
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
            startCursor: toGlobalId('dmarc', dmarc._key),
            endCursor: toGlobalId('dmarc', dmarc._key),
          },
        }

        const loader = dmarcLoaderConnectionsByDomainId(
          query,
          user._key,
          cleanseInput,
          {},
        )

        await expect(
          demoType.dmarc.resolve(
            { _id: domain._id },
            { first: 1 },
            { loaders: { dmarcLoaderConnectionsByDomainId: loader } },
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
              cursor: toGlobalId('spf', spf._key),
              node: {
                _id: spf._id,
                _key: spf._key,
                _rev: spf._rev,
                id: spf._key,
                domainId: domain._id,
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
            startCursor: toGlobalId('spf', spf._key),
            endCursor: toGlobalId('spf', spf._key),
          },
        }

        const loader = spfLoaderConnectionsByDomainId(
          query,
          user._key,
          cleanseInput,
          {},
        )

        await expect(
          demoType.spf.resolve(
            { _id: domain._id },
            { first: 1 },
            { loaders: { spfLoaderConnectionsByDomainId: loader } },
          ),
        ).resolves.toEqual(expectedResult)
      })
    })
  })
})
