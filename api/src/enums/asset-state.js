import { GraphQLEnumType } from 'graphql'

export const AssetStateEnums = new GraphQLEnumType({
  name: 'AssetStateEnums',
  values: {
    APPROVED: {
      value: 'approved',
      description: 'An asset confirmed to belong to the organization.',
    },
    DEPENDENCY: {
      value: 'dependency',
      description: 'An asset that is owned by a third party and supports the operation of organization-owned assets.',
    },
    MONITOR_ONLY: {
      value: 'monitor-only',
      description: 'An asset that is relevant to the organization but is not a direct part of the attack surface.',
    },
    CANDIDATE: {
      value: 'candidate',
      description: 'An asset that is suspected to belong to the organization but has not been confirmed.',
    },
    REQUIRES_INVESTIGATION: {
      value: 'requires-investigation',
      description: 'An asset that requires further investigation to determine its relationship to the organization.',
    },
  },
  description: "An enum used to describe how an asset relates to an organization's attack surface.",
})
