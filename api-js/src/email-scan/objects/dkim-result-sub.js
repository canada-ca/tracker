import { GraphQLObjectType, GraphQLString, GraphQLList } from 'graphql'
import { guidanceTagType } from '../../guidance-tag/objects'

export const dkimResultSubType = new GraphQLObjectType({
  name: 'DkimResultSub',
  description: 'Individual one-off scans results for the given dkim selector.',
  fields: () => ({
    selector: {
      type: GraphQLString,
      description: 'The selector the scan was ran on.',
      resolve: ({ selector }) => selector,
    },
    record: {
      type: GraphQLString,
      description: 'DKIM record retrieved during the scan of the domain.',
      resolve: ({ record }) => record,
    },
    keyLength: {
      type: GraphQLString,
      description: 'Size of the Public Key in bits',
      resolve: ({ keyLength }) => keyLength,
    },
    guidanceTags: {
      type: GraphQLList(guidanceTagType),
      description: 'Key tags found during scan.',
      resolve: async (
        { guidanceTags },
        _args,
        { loaders: { dkimGuidanceTagLoader } },
      ) => {
        const dkimTags = await dkimGuidanceTagLoader.loadMany(guidanceTags)
        return dkimTags
      },
    },
  }),
})
