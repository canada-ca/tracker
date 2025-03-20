import { GraphQLObjectType } from 'graphql'

import * as affiliationMutations from './affiliation/mutations'
import * as domainMutations from './domain/mutations'
import * as organizationMutations from './organization/mutations'
import * as userMutations from './user/mutations'
import * as tagMutations from './tags/mutations'

export const createMutationSchema = () => {
  return new GraphQLObjectType({
    name: 'Mutation',
    fields: () => ({
      // Affiliations Mutations
      ...affiliationMutations,
      // Domain Mutations
      ...domainMutations,
      // Organization Mutations
      ...organizationMutations,
      // User Mutations
      ...userMutations,
      ...tagMutations,
    }),
  })
}
