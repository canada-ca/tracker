import moment from 'moment'
import { GraphQLNonNull, GraphQLID } from 'graphql'
import { toGlobalId } from 'graphql-relay'

import { categoryTotalsType } from '../category-totals'
import { categoryPercentagesType } from '../category-percentages'
import { detailTablesType } from '../detail-tables'
import { dmarcSummaryType } from '../dmarc-summary'
import { PeriodEnums } from '../../../enums'
import { Year } from '../../../scalars'
import { domainType } from '../../../domain/objects'

describe('testing the period gql object', () => {
  describe('testing the field definitions', () => {
    it('has an id field', () => {
      const demoType = dmarcSummaryType.getFields()

      expect(demoType).toHaveProperty('id')
      expect(demoType.id.type).toMatchObject(GraphQLNonNull(GraphQLID))
    })
    it('has a domain field', () => {
      const demoType = dmarcSummaryType.getFields()

      expect(demoType).toHaveProperty('domain')
      expect(demoType.domain.type).toMatchObject(domainType)
    })
    it('has a month field', () => {
      const demoType = dmarcSummaryType.getFields()

      expect(demoType).toHaveProperty('month')
      expect(demoType.month.type).toMatchObject(PeriodEnums)
    })
    it('has a year field', () => {
      const demoType = dmarcSummaryType.getFields()

      expect(demoType).toHaveProperty('year')
      expect(demoType.year.type).toMatchObject(Year)
    })
    it('has a categoryPercentages field', () => {
      const demoType = dmarcSummaryType.getFields()

      expect(demoType).toHaveProperty('categoryPercentages')
      expect(demoType.categoryPercentages.type).toMatchObject(
        categoryPercentagesType,
      )
    })
    it('has a categoryTotals field', () => {
      const demoType = dmarcSummaryType.getFields()

      expect(demoType).toHaveProperty('categoryTotals')
      expect(demoType.categoryTotals.type).toMatchObject(categoryTotalsType)
    })
    it('has a detailTables field', () => {
      const demoType = dmarcSummaryType.getFields()

      expect(demoType).toHaveProperty('detailTables')
      expect(demoType.detailTables.type).toMatchObject(detailTablesType)
    })
  })
  describe('testing the field resolvers', () => {
    describe('testing the id resolver', () => {
      it('returns the resolved value', () => {
        const demoType = dmarcSummaryType.getFields()

        expect(demoType.id.resolve({ id: '1' })).toEqual(
          toGlobalId('dmarcSummaries', 1),
        )
      })
    })
    describe('testing the domain resolver', () => {
      it('returns the resolved field', async () => {
        const demoType = dmarcSummaryType.getFields()
        const domain = {
          _id: 'domains/1',
          _rev: 'rev',
          _key: '1',
          id: '1',
          domain: 'test.domain.gc.ca',
        }

        await expect(
          demoType.domain.resolve(
            { domainKey: domain._key },
            {},
            {
              loaders: {
                loadDomainByKey: { load: jest.fn().mockReturnValue(domain) },
              },
            },
          ),
        ).resolves.toEqual(domain)
      })
    })
    describe('testing the month resolver', () => {
      describe('startDate is set to thirty days', () => {
        let mockedMoment
        beforeEach(() => {
          mockedMoment = jest.fn().mockReturnValue({
            month() {
              return {
                format() {
                  return 'january'
                },
              }
            },
          })
        })
        it('returns the resolved value', () => {
          const demoType = dmarcSummaryType.getFields()

          expect(
            demoType.month.resolve(
              { startDate: 'thirtyDays' },
              {},
              { moment: mockedMoment },
            ),
          ).toEqual('january')
        })
      })
      describe('startDate is not set to thirty days', () => {
        it('returns the resolved value', () => {
          const demoType = dmarcSummaryType.getFields()

          expect(
            demoType.month.resolve({ startDate: '2021-01-01' }, {}, { moment }),
          ).toEqual('january')
        })
      })
    })
    describe('testing the year resolver', () => {
      describe('start date is set to thirty days', () => {
        let mockedMoment
        beforeEach(() => {
          mockedMoment = jest.fn().mockReturnValue({
            year() {
              return '2020'
            },
          })
        })
        it('returns the resolved value', () => {
          const demoType = dmarcSummaryType.getFields()

          expect(
            demoType.year.resolve(
              { startDate: 'thirtyDays' },
              {},
              { moment: mockedMoment },
            ),
          ).toEqual('2020')
        })
      })
      describe('start date is not set to thirty days', () => {
        it('returns the resolved value', () => {
          const demoType = dmarcSummaryType.getFields()

          expect(
            demoType.year.resolve({ startDate: '2020-01-01' }, {}, { moment }),
          ).toEqual('2020')
        })
      })
    })
    describe('testing the categoryPercentages resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = dmarcSummaryType.getFields()

        const expectedResult = {
          categoryPercentages: {
            pass: 5,
            fail: 5,
            passDkimOnly: 5,
            passSpfOnly: 5,
          },
          totalMessages: 10,
        }

        await expect(
          demoType.categoryPercentages.resolve(
            { _id: '1' },
            {},
            {
              loaders: {
                loadDmarcSummaryByKey: {
                  load: jest.fn().mockReturnValue(expectedResult),
                },
              },
            },
          ),
        ).resolves.toEqual({
          totalMessages: expectedResult.totalMessages,
          ...expectedResult.categoryPercentages,
        })
      })
    })
    describe('testing the categoryTotals resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = dmarcSummaryType.getFields()

        const expectedResult = {
          categoryTotals: {
            pass: 0,
            fail: 63,
            passDkimOnly: 0,
            passSpfOnly: 1834,
          },
        }

        await expect(
          demoType.categoryTotals.resolve(
            { _id: 'something/1' },
            {},
            {
              loaders: {
                loadDmarcSummaryByKey: {
                  load: jest.fn().mockReturnValue(expectedResult),
                },
              },
            },
          ),
        ).resolves.toEqual(expectedResult.categoryTotals)
      })
    })
    describe('testing the detailTables resolver', () => {
      it('returns the resolved value', () => {
        const demoType = dmarcSummaryType.getFields()

        const data = {
          _id: 'domains/1',
        }

        expect(demoType.detailTables.resolve(data)).toEqual({
          _id: 'domains/1',
        })
      })
    })
  })
})
