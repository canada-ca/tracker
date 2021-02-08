import { GraphQLObjectType, GraphQLList } from 'graphql'
import { guidanceTagType } from '../../guidance-tag/objects'

export const sslSubType = new GraphQLObjectType({
  name: 'SslSub',
  description:
    'SSL gql object containing the fields for the `dkimScanData` subscription.',
  fields: () => ({
    guidanceTags: {
      type: GraphQLList(guidanceTagType),
      description: `Key tags found during DMARC Scan.`,
      resolve: async (
        { guidanceTags },
        _args,
        { loaders: { sslGuidanceTagLoader } },
      ) => {
        const sslTags = await sslGuidanceTagLoader.loadMany(guidanceTags)
        return sslTags
      },
    },
  }),
})
