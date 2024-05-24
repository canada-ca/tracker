import { GraphQLDate } from 'graphql-scalars'
import { chartSummaryType } from '../chart-summary'
import { categorizedSummaryType } from '../categorized-summary'

describe('given the summary category gql object', () => {
  describe('testing its field definitions', () => {
    it('has a date field', () => {
      const demoType = chartSummaryType.getFields()

      expect(demoType).toHaveProperty('date')
      expect(demoType.date.type).toMatchObject(GraphQLDate)
    })
    it('has a https field', () => {
      const demoType = chartSummaryType.getFields()

      expect(demoType).toHaveProperty('https')
      expect(demoType.https.type).toMatchObject(categorizedSummaryType)
    })
    it('has a dmarc field', () => {
      const demoType = chartSummaryType.getFields()

      expect(demoType).toHaveProperty('dmarc')
      expect(demoType.dmarc.type).toMatchObject(categorizedSummaryType)
    })
  })
  describe('testing the field resolvers', () => {
    describe('testing the date resolver', () => {
      it('returns the resolved value', () => {
        const demoType = chartSummaryType.getFields()

        expect(demoType.date.resolve({ date: '2021-01-01' })).toEqual('2021-01-01')
      })
    })
    describe('testing the https resolver', () => {
      it('returns the resolved value', () => {
        const demoType = chartSummaryType.getFields()

        expect(demoType.https.resolve({ https: { pass: 1, fail: 0, total: 1 } })).toEqual({
          categories: [
            { name: 'pass', count: 1, percentage: 100 },
            { name: 'fail', count: 0, percentage: 0 },
          ],
          total: 1,
        })
      })
    })
    describe('testing the percentage resolver', () => {
      it('returns the resolved value', () => {
        const demoType = chartSummaryType.getFields()

        expect(demoType.dmarc.resolve({ dmarc: { pass: 1, fail: 0, total: 1 } })).toEqual({
          categories: [
            { name: 'pass', count: 1, percentage: 100 },
            { name: 'fail', count: 0, percentage: 0 },
          ],
          total: 1,
        })
      })
    })
  })
})
