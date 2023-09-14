import { GraphQLList, GraphQLObjectType, GraphQLString } from 'graphql'
import { dkimSelectorResultType } from './dkim-selector-result'
import { guidanceTagType } from '../../guidance-tag'

export const dkimType = new GraphQLObjectType({
  name: 'DKIM',
  fields: () => ({
    status: {
      type: GraphQLString,
      description: `The compliance status for DKIM for the scanned domain.`,
      resolve: async ({ status }) => status,
    },
    positiveTags: {
      type: new GraphQLList(guidanceTagType),
      description: `List of positive tags for the scanned domain from this scan.`,
      resolve: async ({ positiveTags }, _, { loaders: { loadDkimGuidanceTagByTagId } }) => {
        return await loadDkimGuidanceTagByTagId({ tags: positiveTags })
      },
    },
    neutralTags: {
      type: new GraphQLList(guidanceTagType),
      description: `List of neutral tags for the scanned domain from this scan.`,
      resolve: async ({ neutralTags }, _, { loaders: { loadDkimGuidanceTagByTagId } }) => {
        return await loadDkimGuidanceTagByTagId({ tags: neutralTags })
      },
    },
    negativeTags: {
      type: new GraphQLList(guidanceTagType),
      description: `List of negative tags for the scanned domain from this scan.`,
      resolve: async ({ negativeTags }, _, { loaders: { loadDkimGuidanceTagByTagId } }) => {
        return await loadDkimGuidanceTagByTagId({ tags: negativeTags })
      },
    },
    selectors: {
      type: new GraphQLList(dkimSelectorResultType),
      description: 'Individual scans results for each DKIM selector.',
      resolve: async ({ selectors }) => {
        const selectorArray = []
        for (const selector in selectors) {
          selectorArray.push({
            selector: selector,
            ...selectors[selector],
          })
        }
        return selectorArray
      },
    },
  }),
  description: `DomainKeys Identified Mail (DKIM) permits a person, role, or
organization that owns the signing domain to claim some
responsibility for a message by associating the domain with the
message.  This can be an author's organization, an operational relay,
or one of their agents.`,
})
