const moment = require('moment')

const { periodType } = require('../period')
const { detailTablesType } = require('../detail-tables')
const { categoryTotalsType } = require('../category-totals')
const { categoryPercentagesType } = require('../category-percentages')
const { PeriodEnums } = require('../../../../enums')
const { Year } = require('../../../../scalars')

describe('testing the period gql object', () => {
  describe('testing the field definitions', () => {
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
    describe('testing the month resolver', () => {
      it('returns the resolved value', () => {
        const demoType = periodType.getFields()

        expect(
          demoType.month.resolve({ startDate: '2020-01-01' }, {}, { moment }),
        ).toEqual('january')
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
