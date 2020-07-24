const { GraphQLNonNull, GraphQLList } = require('graphql')
const { PeriodEnums } = require('../../enums')
const { Slug, Year } = require('../../scalars')
const { categorizedSummaryType } = require('../../types')

const dmarcReportSummaryList = {
  type: GraphQLList(categorizedSummaryType),
  description:
    'A query object used to grab the data to create dmarc report churro charts.',
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

const demoDmarcReportSummaryList = {
  type: GraphQLList(categorizedSummaryType),
  description:
    'Demo query object used to grab the data to create dmarc report churro charts.',
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
  dmarcReportSummaryList,
  demoDmarcReportSummaryList,
}
