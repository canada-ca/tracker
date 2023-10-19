import { GraphQLObjectType } from 'graphql'
import { categorizedSummaryType } from './categorized-summary'
import { globalIdField } from 'graphql-relay'
import { GraphQLDate } from 'graphql-scalars'

export const chartSummaryType = new GraphQLObjectType({
  name: 'ChartSummary',
  fields: () => ({
    id: globalIdField('chartSummary'),
    date: {
      type: GraphQLDate,
      description: 'Date that the summary was computed.',
      resolve: ({ date }) => date,
    },
    https: {
      type: categorizedSummaryType,
      description: 'https summary data',
      resolve: ({ https }) => {
        let percentPass, percentageFail
        if (https.total <= 0) {
          percentPass = 0
          percentageFail = 0
        } else {
          percentPass = Number(((https.pass / https.total) * 100).toFixed(1))
          percentageFail = Number(((https.fail / https.total) * 100).toFixed(1))
        }

        const categories = [
          {
            name: 'pass',
            count: https.pass,
            percentage: percentPass,
          },
          {
            name: 'fail',
            count: https.fail,
            percentage: percentageFail,
          },
        ]

        return {
          categories,
          total: https.total,
        }
      },
    },
    dmarc: {
      type: categorizedSummaryType,
      description: 'dmarc summary data',
      resolve: ({ dmarc }) => {
        let percentPass, percentageFail
        if (dmarc.total <= 0) {
          percentPass = 0
          percentageFail = 0
        } else {
          percentPass = Number(((dmarc.pass / dmarc.total) * 100).toFixed(1))
          percentageFail = Number(((dmarc.fail / dmarc.total) * 100).toFixed(1))
        }

        const categories = [
          {
            name: 'pass',
            count: dmarc.pass,
            percentage: percentPass,
          },
          {
            name: 'fail',
            count: dmarc.fail,
            percentage: percentageFail,
          },
        ]

        return {
          categories,
          total: dmarc.total,
        }
      },
    },
  }),
  description: `This object contains the information for each type of summary that has been pre-computed`,
})
