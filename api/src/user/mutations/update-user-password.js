import { GraphQLString, GraphQLNonNull } from 'graphql'
import { mutationWithClientMutationId } from 'graphql-relay'
import { t } from '@lingui/macro'

import { updateUserPasswordUnion } from '../unions'

export const updateUserPassword = new mutationWithClientMutationId({
  name: 'UpdateUserPassword',
  description: 'This mutation allows the user to update their account password.',
  inputFields: () => ({
    currentPassword: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The users current password to verify it is the current user.',
    },
    updatedPassword: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The new password the user wishes to change to.',
    },
    updatedPasswordConfirm: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'A password confirmation of their new password.',
    },
  }),
  outputFields: () => ({
    result: {
      type: updateUserPasswordUnion,
      description:
        '`UpdateUserPasswordUnion` returning either a `UpdateUserPasswordResultType`, or `UpdateUserPasswordError` object.',
      resolve: (payload) => payload,
    },
  }),
  mutateAndGetPayload: async (
    args,
    { i18n, query, collections, transaction, auth: { bcrypt, userRequired }, validators: { cleanseInput } },
  ) => {
    // Cleanse Input
    const currentPassword = cleanseInput(args.currentPassword)
    const updatedPassword = cleanseInput(args.updatedPassword)
    const updatedPasswordConfirm = cleanseInput(args.updatedPasswordConfirm)

    // Get user from db
    const user = await userRequired()

    // Check to see if current passwords match
    if (!bcrypt.compareSync(currentPassword, user.password)) {
      console.warn(
        `User: ${user._key} attempted to update their password, however they did not enter the current password correctly.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to update password, current password does not match. Please try again.`),
      }
    }

    // Check to see if new passwords match
    if (updatedPassword !== updatedPasswordConfirm) {
      console.warn(`User: ${user._key} attempted to update their password, however the new passwords do not match.`)
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to update password, new passwords do not match. Please try again.`),
      }
    }

    // Check to see if they meet GoC requirements
    if (updatedPassword.length < 12) {
      console.warn(
        `User: ${user._key} attempted to update their password, however the new password does not meet GoC requirements.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to update password, passwords do not match requirements. Please try again.`),
      }
    }

    // Update password in DB
    const hashedPassword = bcrypt.hashSync(updatedPassword, 10)

    // Setup Transaction
    const trx = await transaction(collections)

    try {
      await trx.step(
        () => query`
          WITH users
          FOR user IN users
            UPDATE ${user._key} WITH { password: ${hashedPassword} } IN users
        `,
      )
    } catch (err) {
      console.error(`Trx step error occurred when user: ${user._key} attempted to update their password: ${err}`)
      await trx.abort()
      throw new Error(i18n._(t`Unable to update password. Please try again.`))
    }

    try {
      await trx.commit()
    } catch (err) {
      console.error(`Trx commit error occurred when user: ${user._key} attempted to update their password: ${err}`)
      await trx.abort()
      throw new Error(i18n._(t`Unable to update password. Please try again.`))
    }

    console.info(`User: ${user._key} successfully updated their password.`)
    return {
      _type: 'regular',
      status: i18n._(t`Password was successfully updated.`),
    }
  },
})
