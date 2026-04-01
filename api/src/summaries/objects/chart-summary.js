import { GraphQLObjectType } from 'graphql'
import { categorizedSummaryType } from './categorized-summary'
import { globalIdField } from 'graphql-relay'
import { GraphQLDate } from 'graphql-scalars'

const makeCategory = (key) => ({
  type: categorizedSummaryType,
  resolve: (parent) => {
    const data = parent[key]
    const total = data.total
    const safe = total > 0
    return {
      total,
      categories: [
        { name: 'pass', count: data.pass, percentage: safe ? Number(((data.pass / total) * 100).toFixed(1)) : 0 },
        { name: 'fail', count: data.fail, percentage: safe ? Number(((data.fail / total) * 100).toFixed(1)) : 0 },
      ],
    }
  },
})

export const chartSummaryType = new GraphQLObjectType({
  name: 'ChartSummary',
  description: `This object contains the information for each type of summary that has been pre-computed`,
  fields: () => ({
    id: globalIdField('chartSummary'),
    date: {
      type: GraphQLDate,
      description: 'Date that the summary was computed.',
      resolve: ({ date }) => date,
    },
    https: { ...makeCategory('https'), description: 'https summary data' },
    dmarc: { ...makeCategory('dmarc'), description: 'dmarc summary data' },
    mail: { ...makeCategory('mail'), description: 'Summary based on mail scan results for all domains.' },
    web: { ...makeCategory('web'), description: 'Summary based on web scan results for all domains.' },
    ssl: { ...makeCategory('ssl'), description: 'Summary based on SSL scan results for all domains.' },
    webConnections: {
      ...makeCategory('web_connections'),
      description: 'Summary based on HTTPS and HSTS scan results for all domains.',
    },
    spf: { ...makeCategory('spf'), description: 'Summary based on SPF scan results for all domains.' },
    dkim: { ...makeCategory('dkim'), description: 'Summary based on DKIM scan results for all domains.' },
    dmarcPhase: {
      type: categorizedSummaryType,
      description: 'Summary based on DMARC phases for all domains.',
      resolve: ({ dmarc_phase }) => {
        const total = dmarc_phase.total
        const safe = total > 0
        const phaseNames = ['assess', 'deploy', 'enforce', 'maintain']
        return {
          total,
          categories: phaseNames.map((name) => ({
            name,
            count: dmarc_phase[name],
            percentage: safe ? Number(((dmarc_phase[name] / total) * 100).toFixed(1)) : 0,
          })),
        }
      },
    },
  }),
})
