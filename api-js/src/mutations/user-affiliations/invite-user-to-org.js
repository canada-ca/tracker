const { GraphQLNonNull, GraphQLString } = require('graphql')
const { mutationWithClientMutationId } = require('graphql-relay')
const { LanguageEnums, RoleEnums } = require('../../enums')
const { EmailAddress, Slug } = require('../../scalars')

const inviteUserToOrg = new mutationWithClientMutationId({
  name: 'InviteUserToOrg',
  description: `This mutation allows admins and higher to invite users to any of their
    organizations, if the invited user does not have an account, they will be
    able to sign-up and be assigned to that organization in one mutation.`,
  inputFields: () => ({
    userName: {
      type: GraphQLNonNull(EmailAddress),
      description: 'Users email that you would like to invite to your org.',
    },
    requestedRole: {
      type: GraphQLNonNull(RoleEnums),
      description: 'The role which you would like this user to have.',
    },
    orgSlug: {
      type: GraphQLNonNull(Slug),
      description: 'The organization you wish to invite the user to.',
    },
    preferredLang: {
      type: GraphQLNonNull(LanguageEnums),
      description: 'The language in which the email will be sent in.',
    },
  }),
  outputFields: () => ({
    status: {
      type: GraphQLString,
      description:
        'Informs the user if the invite or invite email was successfully sent.',
      resolve: async () => {},
    },
  }),
  mutateAndGetPayload: async () => {},
})

module.exports = {
  inviteUserToOrg,
}
