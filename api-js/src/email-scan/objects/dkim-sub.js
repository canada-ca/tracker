import { GraphQLObjectType, GraphQLList, GraphQLID } from 'graphql'

import { domainType } from '../../domain/objects'
import { StatusEnum } from '../../enums/status'
import { dkimResultSubType } from './dkim-result-sub'

export const dkimSubType = new GraphQLObjectType({
  name: 'DkimSub',
  description:
    'DKIM gql object containing the fields for the `dkimScanData` subscription.',
  fields: () => ({
    sharedId: {
      type: GraphQLID,
      description: `The shared id to match scans together.`,
      resolve: ({ sharedId }) => sharedId,
    },
    domain: {
      type: domainType,
      description: `The domain the scan was ran on.`,
      resolve: async ({ domainKey }, _, { loaders: { loadDomainByKey } }) => {
        const domain = await loadDomainByKey.load(domainKey)
        return domain
      },
    },
    status: {
      type: StatusEnum,
      description: 'The success status of the scan.',
      resolve: ({ status }) => status,
    },
    results: {
      type: GraphQLList(dkimResultSubType),
      description: 'Individual scans results for each dkim selector.',
      resolve: ({ results }) => results,
    },
  }),
})
