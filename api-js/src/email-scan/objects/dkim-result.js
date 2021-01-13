import { GraphQLInt, GraphQLObjectType, GraphQLString } from 'graphql'
import { connectionArgs, connectionDefinitions, globalIdField } from 'graphql-relay'
import { GraphQLJSON } from 'graphql-scalars'

import { dkimType } from './dkim'

export const dkimResultType = new GraphQLObjectType({
  name: 'DKIMResult',
  fields: () => ({
    id: globalIdField('dkimResult'),
    dkim: {
      type: dkimType,
      description: 'The dkim scan information that this result belongs to.',
      resolve: async ({ dkimId }, _, { loaders: { dkimLoaderByKey } }) => {
        const dkimKey = dkimId.split('/')[1]
        const dkim = await dkimLoaderByKey.load(dkimKey)
        dkim.id = dkim._key
        return dkim
      },
    },
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
    rawJson: {
      type: GraphQLJSON,
      description: 'Raw scan result.',
      resolve: ({ rawJson }) => JSON.stringify(rawJson),
    },
    guidanceTags: {
      type: guidanceTagConnection.connectionType,
      args: {
        ...connectionArgs,
      },
      description: 'Key tags found during scan.',
      resolve: async (
        { guidanceTags },
        args,
        { loaders: { dkimGuidanceTagConnectionsLoader } },
      ) => {
        const dkimTags = await dkimGuidanceTagConnectionsLoader({
          dkimGuidanceTags: guidanceTags,
          ...args,
        })
        return dkimTags
      },
    },
  }),
  interfaces: [nodeInterface],
  description: 'Individual scans results for the given dkim selector.',
})

export const dkimResultConnection = connectionDefinitions({
  name: 'DKIMResult',
  nodeType: dkimResultType,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description:
        'The total amount of dkim results related to a given domain.',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
})