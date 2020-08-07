const { GraphQLString } = require('graphql')
const { mutationWithClientMutationId } = require('graphql-relay')
const { GraphQLEmailAddress } = require('graphql-scalars')
const { LanguageEnums } = require('../../enums')

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
      type: GraphQLEmailAddress,
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
      resolve: async (payload) => {
        return payload.status
      },
    },
  }),
  mutateAndGetPayload: async (
    args,
    {
      query,
      userId,
      loaders: { userLoaderById },
      validators: { cleanseInput },
    },
  ) => {
    // Cleanse Input
    const displayName = cleanseInput(args.displayName)
    const userName = cleanseInput(args.userName).toLowerCase()
    const preferredLang = cleanseInput(args.preferredLang)

    // Make sure userId is not undefined
    if (typeof userId === 'undefined') {
      console.warn(
        `User attempted to update their profile, but the user id is undefined.`,
      )
      throw new Error('Authentication error, please sign in again.')
    }

    // Get user info from DB
    const user = await userLoaderById.load(userId)

    if (typeof user === 'undefined') {
      console.warn(
        `User: ${userId} attempted to update their profile, but no account is associated with that id.`,
      )
      throw new Error('Unable to update profile. Please try again.')
    }

    // Create object containing updated data
    const updatedUser = {
      displayName: displayName || user.displayName,
      userName: userName || user.userName,
      preferredLang: preferredLang || user.preferredLang,
    }

    try {
      await query`
        UPSERT { _key: ${user._key} }
          INSERT ${updatedUser}
          UPDATE ${updatedUser} 
          IN users
      `
    } catch (err) {
      console.error(
        `Database error ocurred when user: ${user._key} attempted to update their profile: ${err}`,
      )
      throw new Error('Unable to update profile. Please try again.')
    }

    console.info(`User: ${user._key} successfully updated their profile.`)
    return {
      status: 'Profile successfully updated.',
    }
  },
})

module.exports = {
  updateUserProfile,
}
