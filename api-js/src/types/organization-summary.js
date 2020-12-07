const { GraphQLObjectType } = require('graphql')
const { t } = require('@lingui/macro')

const { categorizedSummaryType } = require('./categorized-summary')

const organizationSummaryType = new GraphQLObjectType({
  name: 'OrganizationSummary',
  description: 'Summaries based on domains that the organization has claimed.',
  fields: () => ({
    mail: {
      type: categorizedSummaryType,
      description:
        'Summary based on mail scan results for a given organization.',
      resolve: ({ mail }, _, { i18n }) => {
        const categories = [
          {
            name: i18n._(t`pass`),
            count: mail.pass,
            percentage: Number(((mail.pass / mail.total) * 100).toFixed(1)),
          },
          {
            name: i18n._(t`fail`),
            count: mail.fail,
            percentage: Number(((mail.fail / mail.total) * 100).toFixed(1)),
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
        const categories = [
          {
            name: i18n._(t`pass`),
            count: web.pass,
            percentage: Number(((web.pass / web.total) * 100).toFixed(1)),
          },
          {
            name: i18n._(t`fail`),
            count: web.fail,
            percentage: Number(((web.fail / web.total) * 100).toFixed(1)),
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

module.exports = {
  organizationSummaryType,
}
