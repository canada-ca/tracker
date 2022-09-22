import {GraphQLInt, GraphQLList, GraphQLObjectType, GraphQLString} from 'graphql'
import {guidanceTagType} from '../../guidance-tag/objects'

export const spfType = new GraphQLObjectType({
  name: 'SPF',
  fields: () => ({
    status: {
      type: GraphQLString,
      description: `The compliance status for SPF for the scanned domain.`,
      resolve: async ({status}) => status,
    },
    record: {
      type: GraphQLString,
      description: `SPF record retrieved during the scan of the given domain.`,
      resolve: ({record}) => record,
    },
    lookups: {
      type: GraphQLInt,
      description: `The amount of DNS lookups.`,
      resolve: ({lookups}) => lookups,
    },
    spfDefault: {
      type: GraphQLString,
      description: `Instruction of what a recipient should do if there is not a match to your SPF record.`,
      resolve: ({spfDefault}) => spfDefault,
    },
    positiveTags: {
      type: GraphQLList(guidanceTagType),
      description: `List of positive tags for the scanned domain from this scan.`,
      resolve: async ({positiveTags}, _, {loaders: {loadSpfGuidanceTagByTagId}}) => {
        return await loadSpfGuidanceTagByTagId({tags: positiveTags})
      },
    },
    neutralTags: {
      type: GraphQLList(guidanceTagType),
      description: `List of neutral tags for the scanned domain from this scan.`,
      resolve: async ({neutralTags}, _, {loaders: {loadSpfGuidanceTagByTagId}}) => {
        return await loadSpfGuidanceTagByTagId({tags: neutralTags})
      },
    },
    negativeTags: {
      type: GraphQLList(guidanceTagType),
      description: `List of negative tags for the scanned domain from this scan.`,
      resolve: async ({negativeTags}, _, {loaders: {loadSpfGuidanceTagByTagId}}) => {
        return await loadSpfGuidanceTagByTagId({tags: negativeTags})
      },
    },
  }),
  description: `Email on the Internet can be forged in a number of ways.  In
particular, existing protocols place no restriction on what a sending
host can use as the "MAIL FROM" of a message or the domain given on
the SMTP HELO/EHLO commands.  Version 1 of the Sender Policy Framework (SPF)
protocol is where Administrative Management Domains (ADMDs) can explicitly
authorize the hosts that are allowed to use their domain names, and a
receiving host can check such authorization.`,
})
