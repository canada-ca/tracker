import { GraphQLObjectType } from 'graphql'

import { categorizedSummaryType } from '../../summaries'

export const organizationSummaryType = new GraphQLObjectType({
  name: 'OrganizationSummary',
  description: 'Summaries based on domains that the organization has claimed.',
  fields: () => ({
    mail: {
      type: categorizedSummaryType,
      description:
        'Summary based on mail scan results for a given organization.',
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
      description:
        'Summary based on web scan results for a given organization.',
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
      description: 'Summary based on DMARC phases for a given organization.',
      resolve: ({ dmarc_phase }, _) => {
        let percentNotImplemented,
          percentAsses,
          percentDeploy,
          percentEnforce,
          percentMaintain
        if (dmarc_phase.total <= 0) {
          percentNotImplemented = 0
          percentAsses = 0
          percentDeploy = 0
          percentEnforce = 0
          percentMaintain = 0
        } else {
          percentNotImplemented = Number(
            ((dmarc_phase.not_implemented / dmarc_phase.total) * 100).toFixed(
              1,
            ),
          )
          percentAsses = Number(
            ((dmarc_phase.assess / dmarc_phase.total) * 100).toFixed(1),
          )
          percentDeploy = Number(
            ((dmarc_phase.deploy / dmarc_phase.total) * 100).toFixed(1),
          )
          percentEnforce = Number(
            ((dmarc_phase.enforce / dmarc_phase.total) * 100).toFixed(1),
          )
          percentMaintain = Number(
            ((dmarc_phase.maintain / dmarc_phase.total) * 100).toFixed(1),
          )
        }

        const categories = [
          {
            name: 'not implemented',
            count: dmarc_phase.not_implemented,
            percentage: percentNotImplemented,
          },
          {
            name: 'assess',
            count: dmarc_phase.assess,
            percentage: percentAsses,
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
  }),
})
