import { ArangoTools, dbNameFromFile } from 'arango-tools'
import moment from 'moment'

import { makeMigrations } from '../../../../migrations'
import {
  categoryTotalsType,
  categoryPercentagesType,
  detailTablesType,
  periodType,
} from '../index'
import { PeriodEnums } from '../../../enums'
import { Year, Domain } from '../../../scalars'
import { domainLoaderByKey } from '../../../domain/loaders'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('testing the period gql object', () => {
  describe('testing the field definitions', () => {
    it('has a domain field', () => {
      const demoType = periodType.getFields()

      expect(demoType).toHaveProperty('domain')
      expect(demoType.domain.type).toMatchObject(Domain)
    })
    it('has a month field', () => {
      const demoType = periodType.getFields()

      expect(demoType).toHaveProperty('month')
      expect(demoType.month.type).toMatchObject(PeriodEnums)
    })
    it('has a year field', () => {
      const demoType = periodType.getFields()

      expect(demoType).toHaveProperty('year')
      expect(demoType.year.type).toMatchObject(Year)
    })
    it('has a categoryPercentages field', () => {
      const demoType = periodType.getFields()

      expect(demoType).toHaveProperty('categoryPercentages')
      expect(demoType.categoryPercentages.type).toMatchObject(
        categoryPercentagesType,
      )
    })
    it('has a categoryTotals field', () => {
      const demoType = periodType.getFields()

      expect(demoType).toHaveProperty('categoryTotals')
      expect(demoType.categoryTotals.type).toMatchObject(categoryTotalsType)
    })
    it('has a detailTables field', () => {
      const demoType = periodType.getFields()

      expect(demoType).toHaveProperty('detailTables')
      expect(demoType.detailTables.type).toMatchObject(detailTablesType)
    })
  })

  describe('testing the field resolvers', () => {
    describe('testing the domain resolver', () => {
      let query, drop, truncate, migrate, collections, domain

      beforeAll(async () => {
        ;({ migrate } = await ArangoTools({ rootPass, url }))
        ;({ query, drop, truncate, collections } = await migrate(
          makeMigrations({
            databaseName: dbNameFromFile(__filename),
            rootPass,
          }),
        ))

        domain = await collections.domains.save({
          domain: 'test.domain.gc.ca',
        })
      })

      afterAll(async () => {
        await truncate()
        await drop()
      })

      it('returns the resolved field', async () => {
        const demoType = periodType.getFields()

        const loader = domainLoaderByKey(query, '1', {})

        await expect(
          demoType.domain.resolve(
            { domainKey: domain._key },
            {},
            { loaders: { domainLoaderByKey: loader } },
          ),
        ).resolves.toEqual('test.domain.gc.ca')
      })
    })
    describe('testing the month resolver', () => {
      it('returns the resolved value', () => {
        const demoType = periodType.getFields()

        expect(demoType.month.resolve({ selectedMonth: 'january' })).toEqual(
          'january',
        )
      })
    })
    describe('testing the year resolver', () => {
      it('returns the resolved value', () => {
        const demoType = periodType.getFields()

        expect(
          demoType.year.resolve({ startDate: '2020-01-01' }, {}, { moment }),
        ).toEqual('2020')
      })
    })
    describe('testing the categoryPercentages resolver', () => {
      it('returns the resolved value', () => {
        const demoType = periodType.getFields()

        const categoryTotals = {
          pass: 0,
          'pass-spf-only': 1834,
          'pass-dkim-only': 0,
          fail: 63,
        }

        const expectedResult = {
          pass: 0,
          'pass-spf-only': 1834,
          'pass-dkim-only': 0,
          fail: 63,
        }

        expect(
          demoType.categoryPercentages.resolve({ categoryTotals }),
        ).toEqual(expectedResult)
      })
    })
    describe('testing the categoryTotals resolver', () => {
      it('returns the resolved value', () => {
        const demoType = periodType.getFields()

        const categoryTotals = {
          pass: 0,
          'pass-spf-only': 1834,
          'pass-dkim-only': 0,
          fail: 63,
        }

        const expectedResult = {
          pass: 0,
          'pass-spf-only': 1834,
          'pass-dkim-only': 0,
          fail: 63,
        }

        expect(demoType.categoryTotals.resolve({ categoryTotals })).toEqual(
          expectedResult,
        )
      })
    })
    describe('testing the detailTables resolver', () => {
      it('returns the resolved value', () => {
        const demoType = periodType.getFields()

        const detailTables = {
          dkimFailure: {},
          dmarcFailure: {},
          fullPass: {},
          spfFailure: {},
        }

        const expectedResult = {
          dkimFailure: {},
          dmarcFailure: {},
          fullPass: {},
          spfFailure: {},
        }

        expect(demoType.detailTables.resolve({ detailTables })).toEqual(
          expectedResult,
        )
      })
    })
  })
})
