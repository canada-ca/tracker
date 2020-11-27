const {
  GraphQLInt,
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
} = require('graphql')
const { guidanceTagType } = require('../base/guidance-tags')

const dmarcSubType = new GraphQLObjectType({
  name: 'DmarcSub',
  description:
    'DMARC gql object containing the fields for the `dkimScanData` subscription.',
  fields: () => ({
    dmarcPhase: {
      type: GraphQLInt,
      description: `DMARC phase found during scan.`,
      resolve: ({ dmarcPhase }) => dmarcPhase,
    },
    record: {
      type: GraphQLString,
      description: `DMARC record retrieved during scan.`,
      resolve: ({ record }) => record,
    },
    pPolicy: {
      type: GraphQLString,
      description: `The requested policy you wish mailbox providers to apply
when your email fails DMARC authentication and alignment checks. `,
      resolve: ({ pPolicy }) => pPolicy,
    },
    spPolicy: {
      type: GraphQLString,
      description: `This tag is used to indicate a requested policy for all
subdomains where mail is failing the DMARC authentication and alignment checks.`,
      resolve: ({ spPolicy }) => spPolicy,
    },
    pct: {
      type: GraphQLInt,
      description: `The percentage of messages to which the DMARC policy is to be applied.`,
      resolve: ({ pct }) => pct,
    },
    guidanceTags: {
      type: GraphQLList(guidanceTagType),
      description: `Key tags found during DMARC Scan.`,
      resolve: async (
        { guidanceTags },
        _args,
        { loaders: { dmarcGuidanceTagLoader } },
      ) => {
        const dmarcTags = await dmarcGuidanceTagLoader.loadMany(guidanceTags)
        return dmarcTags
      },
    },
  }),
})

module.exports = {
  dmarcSubType,
}
