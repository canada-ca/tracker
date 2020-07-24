const { GraphQLString } = require('graphql')
const { mutationWithClientMutationId } = require('graphql-relay')
const { LanguageEnums } = require('../../enums')
const { EmailAddress } = require('../../scalars')

const updateUserProfile = new mutationWithClientMutationId({
  name: 'UpdateUserProfile',
  description:
    'This mutation allows the user to update their user profile to change various details of their current profile.',
  inputFields: () => ({
    displayName: {
      type: GraphQLString,
      description: 'The updated display name the user wishes to change to.',
    },
    userName: {
      type: EmailAddress,
      description: 'The updated user name the user wishes to change to.',
    },
    preferredLang: {
      type: LanguageEnums,
      description:
        'The updated preferred language the user wishes to change to.',
    },
  }),
  outputFields: () => ({
    status: {
      type: GraphQLString,
      description: 'The status if the user profile update was successful.',
      resolve: async () => {},
    },
  }),
  mutateAndGetPayload: async () => {},
})

module.exports = {
  updateUserProfile,
}
