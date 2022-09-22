import {GraphQLUnionType} from 'graphql'

import {affiliationError, transferOrgOwnershipResult} from '../objects'

export const transferOrgOwnershipUnion = new GraphQLUnionType({
  name: 'TransferOrgOwnershipUnion',
  description: `This union is used with the \`transferOrgOwnership\` mutation, allowing for
users to transfer ownership of a given organization, and support any errors that may occur.`,
  types: [affiliationError, transferOrgOwnershipResult],
  resolveType({_type}) {
    if (_type === 'regular') {
      return transferOrgOwnershipResult
    } else {
      return affiliationError
    }
  },
})
