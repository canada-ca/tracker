import { GraphQLObjectType, GraphQLList } from 'graphql'
import { dkimResultSubType } from './dkim-result-sub'

export const dkimSubType = new GraphQLObjectType({
  name: 'DkimSub',
  description:
    'DKIM gql object containing the fields for the `dkimScanData` subscription.',
  fields: () => ({
    results: {
      type: GraphQLList(dkimResultSubType),
      description: 'Individual scans results for each dkim selector.',
      resolve: ({ results }) => results,
    },
  }),
})
