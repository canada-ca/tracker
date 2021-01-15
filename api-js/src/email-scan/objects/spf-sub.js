import {
  GraphQLInt,
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
} from 'graphql'
import { guidanceTagType } from '../../guidance-tag/objects'

export const spfSubType = new GraphQLObjectType({
  name: 'SpfSub',
  description:
    'SPF gql object containing the fields for the `dkimScanData` subscription.',
  fields: () => ({
    lookups: {
      type: GraphQLInt,
      description: `The amount of DNS lookups.`,
      resolve: ({ lookups }) => lookups,
    },
    record: {
      type: GraphQLString,
      description: `SPF record retrieved during the scan of the given domain.`,
      resolve: ({ record }) => record,
    },
    spfDefault: {
      type: GraphQLString,
      description: `Instruction of what a recipient should do if there is not a match to your SPF record.`,
      resolve: ({ spfDefault }) => spfDefault,
    },
    guidanceTags: {
      type: GraphQLList(guidanceTagType),
      description: `Key tags found during scan.`,
      resolve: async (
        { guidanceTags },
        _args,
        { loaders: { spfGuidanceTagLoader } },
      ) => {
        const spfTags = await spfGuidanceTagLoader.loadMany(guidanceTags)
        return spfTags
      },
    },
  }),
})
