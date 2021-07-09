import { t } from '@lingui/macro'
import { GraphQLID, GraphQLNonNull } from 'graphql'
import { mutationWithClientMutationId } from 'graphql-relay'

import { transferOrgOwnershipUnion } from '../unions'

export const transferOrgOwnership = new mutationWithClientMutationId({
  name: 'TransferOrgOwnership',
  description: 'This mutation allows a user to transfer org ownership to another user in the given org.',
  inputFields: () => ({
    orgId: {
      type: GraphQLNonNull(GraphQLID),
      description: '',
    },
    userId: {
      type: GraphQLNonNull(GraphQLID),
      description: '',
    },
  }),
})
