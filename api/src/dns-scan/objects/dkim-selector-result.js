import {GraphQLInt, GraphQLList, GraphQLObjectType, GraphQLString} from 'graphql'
import {guidanceTagType} from "../../guidance-tag"

export const dkimSelectorResultType = new GraphQLObjectType({
  name: 'DKIMSelectorResult',
  fields: () => ({
    selector: {
      type: GraphQLString,
      description: `The selector which was scanned.`,
      resolve: async ({selector}) => selector,
    },
    status: {
      type: GraphQLString,
      description: `The compliance status for DKIM for the scanned domain.`,
      resolve: async ({status}) => status,
    },
    record: {
      type: GraphQLString,
      description: `DKIM record retrieved during scan.`,
      resolve: ({record}) => record,
    },
    keyLength: {
      type: GraphQLString,
      description: 'Size of the Public Key in bits.',
      resolve: ({keyLength}) => keyLength,
    },
    keyType: {
      type: GraphQLString,
      description: 'Type of DKIM key used.',
      resolve: ({keyType}) => keyType,
    },
    publicExponent: {
      type: GraphQLInt,
      description: 'The public exponent used for DKIM.',
      resolve: ({publicExponent}) => publicExponent,
    },
    keyModulus: {
      type: GraphQLString,
      description: 'The key modulus used.',
      resolve: ({keyModulus}) => keyModulus,
    },
    positiveTags: {
      type: GraphQLList(guidanceTagType),
      description: `List of positive tags for the scanned domain from this scan.`,
      resolve: async ({positiveTags}, _, {loaders: {loadDkimGuidanceTagByTagId}}) => {
        return await loadDkimGuidanceTagByTagId({tags: positiveTags})
      },
    },
    neutralTags: {
      type: GraphQLList(guidanceTagType),
      description: `List of neutral tags for the scanned domain from this scan.`,
      resolve: async ({neutralTags}, _, {loaders: {loadDkimGuidanceTagByTagId}}) => {
        return await loadDkimGuidanceTagByTagId({tags: neutralTags})
      },
    },
    negativeTags: {
      type: GraphQLList(guidanceTagType),
      description: `List of negative tags for the scanned domain from this scan.`,
      resolve: async ({negativeTags}, _, {loaders: {loadDkimGuidanceTagByTagId}}) => {
        return await loadDkimGuidanceTagByTagId({tags: negativeTags})
      },
    },
  }),
  description: `DomainKeys Identified Mail (DKIM) permits a person, role, or
organization that owns the signing domain to claim some
responsibility for a message by associating the domain with the
message.  This can be an author's organization, an operational relay,
or one of their agents.`,
})
