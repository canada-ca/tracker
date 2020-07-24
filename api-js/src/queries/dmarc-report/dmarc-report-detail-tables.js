const { GraphQLNonNull } = require('graphql')
const { PeriodEnums } = require('../../enums')
const { Slug, Year } = require('../../scalars')
const { dmarcReportDetailedTablesType } = require('../../types')

const dmarcReportDetailTables = {
  type: dmarcReportDetailedTablesType,
  description: 'Query used for gathering data for dmarc report detail tables.',
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

const demoDmarcReportDetailTables = {
  type: dmarcReportDetailedTablesType,
  description:
    'Demo query used for gathering data for dmarc report detail tables.',
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
  dmarcReportDetailTables,
  demoDmarcReportDetailTables,
}
