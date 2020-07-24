const { GraphQLNonNull, GraphQLString } = require('graphql')
const { mutationWithClientMutationId } = require('graphql-relay')
const { RoleEnums } = require('../../enums')
const { EmailAddress, Slug } = require('../../scalars')

const updateUserRole = new mutationWithClientMutationId({
  name: 'UpdateUserRole',
  description: `This mutation allows super admins, and admins of the given organization to
    update the permission level of a given user that already belongs to the
    given organization.`,
  inputFields: () => ({
    userName: {
      type: GraphQLNonNull(EmailAddress),
      description: 'The username of the user you wish to update their role to.',
    },
    orgSlug: {
      type: GraphQLNonNull(Slug),
      description:
        'The organization that the admin, and the user both belong to.',
    },
    role: {
      type: GraphQLNonNull(RoleEnums),
      description:
        'The role that the admin wants to give to the selected user.',
    },
  }),
  outputFields: () => ({
    statis: {
      type: GraphQLString,
      description: 'Informs the user if the user role update was successful.',
      resolve: async () => {},
    },
  }),
  mutateAndGetPayload: async () => {},
})

module.exports = {
  updateUserRole,
}
