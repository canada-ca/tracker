import { GraphQLObjectType } from 'graphql'
import { globalIdField } from 'graphql-relay'

import { categoryPercentagesType } from './category-percentages'
import { categoryTotalsType } from './category-totals'
import { detailTablesType } from './detail-tables'
import { domainType } from '../../domain/objects'
import { PeriodEnums } from '../../enums'
import { Year } from '../../scalars'
import { nodeInterface } from '../../node'

export const dmarcSummaryType = new GraphQLObjectType({
  name: 'DmarcSummary',
  description: 'Object that contains information for a dmarc summary.',
  fields: () => ({
    id: globalIdField('dmarcSummary'),
    domain: {
      type: domainType,
      description: 'The domain that the data in this dmarc summary belongs to.',
      resolve: async (
        { domainKey },
        _args,
        { loaders: { loadDomainByKey } },
      ) => {
        const domain = await loadDomainByKey.load(domainKey)
        return domain
      },
    },
    month: {
      type: PeriodEnums,
      description: 'Start date of data collection.',
      resolve: ({ startDate }, _, { moment }) => {
        let month
        if (startDate === 'thirtyDays') {
          month = moment().month()
        } else {
          month = moment(startDate).month()
        }
        return String(moment().month(month).format('MMMM')).toLowerCase()
      },
    },
    year: {
      type: Year,
      description: 'End date of data collection.',
      resolve: ({ startDate }, _, { moment }) => {
        let year
        if (startDate === 'thirtyDays') {
          year = String(moment().year())
        } else {
          year = String(moment(startDate).year())
        }
        return year
      },
    },
    categoryPercentages: {
      type: categoryPercentagesType,
      description: 'Category percentages based on the category totals.',
      resolve: async ({ _id }, _, { loaders: { loadDmarcSummaryByKey } }) => {
        const dmarcSummaryKey = _id.split('/')[1]
        const dmarcSummary = await loadDmarcSummaryByKey.load(dmarcSummaryKey)
        return {
          totalMessages: dmarcSummary.totalMessages,
          ...dmarcSummary.categoryPercentages,
        }
      },
    },
    categoryTotals: {
      type: categoryTotalsType,
      description: 'Category totals for quick viewing.',
      resolve: async ({ _id }, _, { loaders: { loadDmarcSummaryByKey } }) => {
        const dmarcSummaryKey = _id.split('/')[1]
        const dmarcSummary = await loadDmarcSummaryByKey.load(dmarcSummaryKey)
        return dmarcSummary.categoryTotals
      },
    },
    detailTables: {
      type: detailTablesType,
      description: 'Various senders for each category.',
      resolve: ({ _id }) => ({ _id }),
    },
  }),
  interfaces: [nodeInterface],
})
