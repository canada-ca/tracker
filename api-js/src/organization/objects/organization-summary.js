import { GraphQLObjectType } from 'graphql'
import { t } from '@lingui/macro'

import { categorizedSummaryType } from '../../summaries'

export const organizationSummaryType = new GraphQLObjectType({
  name: 'OrganizationSummary',
  description: 'Summaries based on domains that the organization has claimed.',
  fields: () => ({
    mail: {
      type: categorizedSummaryType,
      description:
        'Summary based on mail scan results for a given organization.',
      resolve: ({ mail }, _, { i18n }) => {
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
            name: i18n._(t`pass`),
            count: mail.pass,
            percentage: percentPass,
          },
          {
            name: i18n._(t`fail`),
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
      resolve: ({ web }, _, { i18n }) => {
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
            name: i18n._(t`pass`),
            count: web.pass,
            percentage: percentPass,
          },
          {
            name: i18n._(t`fail`),
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
  }),
})
