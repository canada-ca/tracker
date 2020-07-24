const { GraphQLNonNull } = require('graphql')
const { PeriodEnums } = require('../../enums')
const { Slug, Year } = require('../../scalars')
const { categorizedSummaryType } = require('../../types')

const dmarcReportSummary = {
  type: categorizedSummaryType,
  description:
    'A query object used to grab the data to create dmarc report doughnuts.',
  args: {
    domainSlug: {
      type: GraphQLNonNull(Slug),
      description:
        'The slugified version of the domain you wish to retrieve data for.',
    },
    period: {
      type: GraphQLNonNull(PeriodEnums),
      description: 'The period in which the user wants to retreive data from.',
    },
    year: {
      type: GraphQLNonNull(Year),
      description: 'The year in which the user wants to retreive data from.',
    },
  },
  resolve: async () => {},
}

module.exports = {
  dmarcReportSummary,
}
