import { GraphQLString, GraphQLNonNull } from 'graphql'
import { mutationWithClientMutationId } from 'graphql-relay'
import { t } from '@lingui/macro'

export const updateUserPassword = new mutationWithClientMutationId({
  name: 'UpdateUserPassword',
  description:
    'This mutation allows the user to update their account password.',
  inputFields: () => ({
    currentPassword: {
      type: GraphQLNonNull(GraphQLString),
      description:
        'The users current password to verify it is the current user.',
    },
    updatedPassword: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The new password the user wishes to change to.',
    },
    updatedPasswordConfirm: {
      type: GraphQLNonNull(GraphQLString),
      description: 'A password confirmation of their new password.',
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
      i18n,
      query,
      userKey,
      auth: { bcrypt },
      loaders: { userLoaderByKey },
      validators: { cleanseInput },
    },
  ) => {
    // Cleanse Input
    const currentPassword = cleanseInput(args.currentPassword)
    const updatedPassword = cleanseInput(args.updatedPassword)
    const updatedPasswordConfirm = cleanseInput(args.updatedPasswordConfirm)

    // Make sure user id is not undefined
    if (typeof userKey === 'undefined') {
      console.warn(
        `User attempted to update password, but the user id is undefined.`,
      )
      throw new Error(i18n._(t`Authentication error, please sign in again.`))
    }

    // Get user from db
    const user = await userLoaderByKey.load(userKey)

    if (typeof user === 'undefined') {
      console.warn(
        `User: ${userKey} attempted to update their password, but no account is associated with that id.`,
      )
      throw new Error(i18n._(t`Unable to update password. Please try again.`))
    }

    // Check to see if current passwords match
    if (!bcrypt.compareSync(currentPassword, user.password)) {
      console.warn(
        `User: ${user._key} attempted to update their password, however they did not enter the current password correctly.`,
      )
      throw new Error(
        i18n._(
          t`Unable to update password, current password does not match. Please try again.`,
        ),
      )
    }

    // Check to see if new passwords match
    if (updatedPassword !== updatedPasswordConfirm) {
      console.warn(
        `User: ${user._key} attempted to update their password, however the new passwords do not match.`,
      )
      throw new Error(
        i18n._(
          t`Unable to update password, new passwords do not match. Please try again.`,
        ),
      )
    }

    // Check to see if they meet GoC requirements
    if (updatedPassword.length < 12) {
      console.warn(
        `User: ${user._key} attempted to update their password, however the new password does not meet GoC requirements.`,
      )
      throw new Error(
        i18n._(
          t`Unable to update password, passwords are required to be 12 characters or longer. Please try again.`,
        ),
      )
    }

    // Update password in DB
    const hashedPassword = bcrypt.hashSync(updatedPassword, 10)

    try {
      await query`
        FOR user IN users
          UPDATE ${user._key} WITH { password: ${hashedPassword} } IN users
      `
    } catch (err) {
      console.error(
        `Database error ocurred when user: ${user._key} attempted to update their password: ${err}`,
      )
      throw new Error(i18n._(t`Unable to update password. Please try again.`))
    }

    console.info(`User: ${user._key} successfully updated their password.`)
    return {
      status: i18n._(t`Password was successfully updated.`),
    }
  },
})
