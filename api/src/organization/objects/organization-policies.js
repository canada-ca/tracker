import { GraphQLBoolean, GraphQLObjectType } from 'graphql'

export const organizationPoliciesType = new GraphQLObjectType({
  name: 'OrganizationPolicies',
  description: 'Policies that apply to a given organization.',
  fields: () => ({
    psd: {
      type: GraphQLBoolean,
      description: 'Whether the Policy on Service and Digital applies to this organization.',
      resolve: ({ psd }) => psd ?? false,
    },
    pgs: {
      type: GraphQLBoolean,
      description: 'Whether the Policy on Government Security applies to this organization.',
      resolve: ({ pgs }) => pgs ?? false,
    },
  }),
})