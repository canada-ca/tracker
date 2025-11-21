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
    mail: {
      type: categorizedSummaryType,
      description: 'Summary based on mail scan results for all domains.',
      resolve: ({ mail }, _) => {
        let percentPass, percentageFail
        if (mail.total <= 0) {
          percentPass = 0
          percentageFail = 0
        } else {
          percentPass = Number(((mail.pass / mail.total) * 100).toFixed(1))
          percentageFail = Number(((mail.fail / mail.total) * 100).toFixed(1))
        }

        const categories = [
          {
            name: 'pass',
            count: mail.pass,
            percentage: percentPass,
          },
          {
            name: 'fail',
            count: mail.fail,
            percentage: percentageFail,
          },
        ]

        return {
          categories,
          total: mail.total,
        }
      },
    },
    web: {
      type: categorizedSummaryType,
      description: 'Summary based on web scan results for all domains.',
      resolve: ({ web }, _) => {
        let percentPass, percentageFail
        if (web.total <= 0) {
          percentPass = 0
          percentageFail = 0
        } else {
          percentPass = Number(((web.pass / web.total) * 100).toFixed(1))
          percentageFail = Number(((web.fail / web.total) * 100).toFixed(1))
        }

        const categories = [
          {
            name: 'pass',
            count: web.pass,
            percentage: percentPass,
          },
          {
            name: 'fail',
            count: web.fail,
            percentage: percentageFail,
          },
        ]

        return {
          categories,
          total: web.total,
        }
      },
    },
    dmarcPhase: {
      type: categorizedSummaryType,
      description: 'Summary based on DMARC phases for all domains.',
      resolve: ({ dmarc_phase }, _) => {
        let percentAssess, percentDeploy, percentEnforce, percentMaintain
        if (dmarc_phase.total <= 0) {
          percentAssess = 0
          percentDeploy = 0
          percentEnforce = 0
          percentMaintain = 0
        } else {
          percentAssess = Number(((dmarc_phase.assess / dmarc_phase.total) * 100).toFixed(1))
          percentDeploy = Number(((dmarc_phase.deploy / dmarc_phase.total) * 100).toFixed(1))
          percentEnforce = Number(((dmarc_phase.enforce / dmarc_phase.total) * 100).toFixed(1))
          percentMaintain = Number(((dmarc_phase.maintain / dmarc_phase.total) * 100).toFixed(1))
        }

        const categories = [
          {
            name: 'assess',
            count: dmarc_phase.assess,
            percentage: percentAssess,
          },
          {
            name: 'deploy',
            count: dmarc_phase.deploy,
            percentage: percentDeploy,
          },
          {
            name: 'enforce',
            count: dmarc_phase.enforce,
            percentage: percentEnforce,
          },
          {
            name: 'maintain',
            count: dmarc_phase.maintain,
            percentage: percentMaintain,
          },
        ]

        return {
          categories,
          total: dmarc_phase.total,
        }
      },
    },
    ssl: {
      type: categorizedSummaryType,
      description: 'Summary based on SSL scan results for all domains.',
      resolve: ({ ssl }, _) => {
        let percentPass, percentageFail
        if (ssl.total <= 0) {
          percentPass = 0
          percentageFail = 0
        } else {
          percentPass = Number(((ssl.pass / ssl.total) * 100).toFixed(1))
          percentageFail = Number(((ssl.fail / ssl.total) * 100).toFixed(1))
        }

        const categories = [
          {
            name: 'pass',
            count: ssl.pass,
            percentage: percentPass,
          },
          {
            name: 'fail',
            count: ssl.fail,
            percentage: percentageFail,
          },
        ]

        return {
          categories,
          total: ssl.total,
        }
      },
    },
    webConnections: {
      type: categorizedSummaryType,
      description: 'Summary based on HTTPS and HSTS scan results for all domains.',
      resolve: ({ web_connections }, _) => {
        let percentPass, percentageFail
        if (web_connections.total <= 0) {
          percentPass = 0
          percentageFail = 0
        } else {
          percentPass = Number(((web_connections.pass / web_connections.total) * 100).toFixed(1))
          percentageFail = Number(((web_connections.fail / web_connections.total) * 100).toFixed(1))
        }

        const categories = [
          {
            name: 'pass',
            count: web_connections.pass,
            percentage: percentPass,
          },
          {
            name: 'fail',
            count: web_connections.fail,
            percentage: percentageFail,
          },
        ]

        return {
          categories,
          total: web_connections.total,
        }
      },
    },
    spf: {
      type: categorizedSummaryType,
      description: 'Summary based on SPF scan results for all domains.',
      resolve: ({ spf }, _) => {
        let percentPass, percentageFail
        if (spf.total <= 0) {
          percentPass = 0
          percentageFail = 0
        } else {
          percentPass = Number(((spf.pass / spf.total) * 100).toFixed(1))
          percentageFail = Number(((spf.fail / spf.total) * 100).toFixed(1))
        }

        const categories = [
          {
            name: 'pass',
            count: spf.pass,
            percentage: percentPass,
          },
          {
            name: 'fail',
            count: spf.fail,
            percentage: percentageFail,
          },
        ]

        return {
          categories,
          total: spf.total,
        }
      },
    },
    dkim: {
      type: categorizedSummaryType,
      description: 'Summary based on DKIM scan results for all domains.',
      resolve: ({ dkim }, _) => {
        let percentPass, percentageFail
        if (dkim.total <= 0) {
          percentPass = 0
          percentageFail = 0
        } else {
          percentPass = Number(((dkim.pass / dkim.total) * 100).toFixed(1))
          percentageFail = Number(((dkim.fail / dkim.total) * 100).toFixed(1))
        }

        const categories = [
          {
            name: 'pass',
            count: dkim.pass,
            percentage: percentPass,
          },
          {
            name: 'fail',
            count: dkim.fail,
            percentage: percentageFail,
          },
        ]

        return {
          categories,
          total: dkim.total,
        }
      },
    },
  }),
  description: `This object contains the information for each type of summary that has been pre-computed`,
})
