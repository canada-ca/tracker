import {
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql'
import { connectionDefinitions, globalIdField } from 'graphql-relay'

import { refLinksType } from './ref-links'
import { nodeInterface } from '../../node'

export const guidanceTagType = new GraphQLObjectType({
  name: 'GuidanceTag',
  description:
    'Details for a given guidance tag based on https://github.com/canada-ca/tracker/wiki/Guidance-Tags',
  fields: () => ({
    id: globalIdField('guidanceTags'),
    tagId: {
      type: GraphQLString,
      description: 'The guidance tag ID.',
      resolve: ({ tagId }) => tagId,
    },
    tagName: {
      type: GraphQLString,
      description: 'The guidance tag name.',
      resolve: ({ tagName }) => tagName,
    },
    guidance: {
      type: GraphQLString,
      description:
        'Guidance for changes to record, or to maintain current stance.',
      resolve: ({ guidance }) => guidance,
    },
    refLinks: {
      type: GraphQLList(refLinksType),
      description: 'Links to implementation guidance for a given tag.',
      resolve: ({ refLinksGuide }) => refLinksGuide,
    },
    refLinksTech: {
      type: GraphQLList(refLinksType),
      description: 'Links to technical information for a given tag.',
      resolve: ({ refLinksTechnical }) => refLinksTechnical,
    },
  }),
  interfaces: [nodeInterface],
})

export const guidanceTagConnection = connectionDefinitions({
  name: 'GuidanceTag',
  nodeType: guidanceTagType,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description: 'The total amount of guidance tags for a given scan type.',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
})
