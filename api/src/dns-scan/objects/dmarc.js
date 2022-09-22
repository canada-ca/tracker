import {GraphQLInt, GraphQLList, GraphQLObjectType, GraphQLString} from 'graphql'
import {guidanceTagType} from '../../guidance-tag/objects'

export const dmarcType = new GraphQLObjectType({
  name: 'DMARC',
  fields: () => ({
    status: {
      type: GraphQLString,
      description: `The compliance status for DMARC for the scanned domain.`,
      resolve: async ({status}) => status,
    },
    record: {
      type: GraphQLString,
      description: `DMARC record retrieved during scan.`,
      resolve: ({record}) => record,
    },
    pPolicy: {
      type: GraphQLString,
      description: `The requested policy you wish mailbox providers to apply
when your email fails DMARC authentication and alignment checks. `,
      resolve: ({pPolicy}) => pPolicy,
    },
    spPolicy: {
      type: GraphQLString,
      description: `This tag is used to indicate a requested policy for all
subdomains where mail is failing the DMARC authentication and alignment checks.`,
      resolve: ({spPolicy}) => spPolicy,
    },
    pct: {
      type: GraphQLInt,
      description: `The percentage of messages to which the DMARC policy is to be applied.`,
      resolve: ({pct}) => pct,
    },
    phase: {
      type: GraphQLString,
      description: `The current phase of the DMARC implementation.`,
      resolve: ({phase}) => phase,
    },
    positiveTags: {
      type: GraphQLList(guidanceTagType),
      description: `List of positive tags for the scanned domain from this scan.`,
      resolve: async ({positiveTags}, _, {loaders: {loadDmarcGuidanceTagByTagId}}) => {
        return await loadDmarcGuidanceTagByTagId({tags: positiveTags})
      },
    },
    neutralTags: {
      type: GraphQLList(guidanceTagType),
      description: `List of neutral tags for the scanned domain from this scan.`,
      resolve: async ({neutralTags}, _, {loaders: {loadDmarcGuidanceTagByTagId}}) => {
        return await loadDmarcGuidanceTagByTagId({tags: neutralTags})
      },
    },
    negativeTags: {
      type: GraphQLList(guidanceTagType),
      description: `List of negative tags for the scanned domain from this scan.`,
      resolve: async ({negativeTags}, _, {loaders: {loadDmarcGuidanceTagByTagId}}) => {
        return await loadDmarcGuidanceTagByTagId({tags: negativeTags})
      },
    },
  }),
  description: `Domain-based Message Authentication, Reporting, and Conformance
(DMARC) is a scalable mechanism by which a mail-originating
organization can express domain-level policies and preferences for
message validation, disposition, and reporting, that a mail-receiving
organization can use to improve mail handling.`,
})
