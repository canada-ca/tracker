import { GraphQLObjectType, GraphQLList } from 'graphql'

import { domainType } from '../../domain/objects'
import { dkimResultSubType } from './dkim-result-sub'

export const dkimSubType = new GraphQLObjectType({
  name: 'DkimSub',
  description:
    'DKIM gql object containing the fields for the `dkimScanData` subscription.',
  fields: () => ({
    domain: {
      type: domainType,
      description: `The domain the scan was ran on.`,
      resolve: async ({ domainKey }, _, { loaders: { loadDomainByKey } }) => {
        const domain = await loadDomainByKey.load(domainKey)
        return domain
      },
    },
    results: {
      type: GraphQLList(dkimResultSubType),
      description: 'Individual scans results for each dkim selector.',
      resolve: ({ results }) => results,
    },
  }),
})
