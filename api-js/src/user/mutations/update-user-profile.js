import { GraphQLString } from 'graphql'
import { mutationWithClientMutationId } from 'graphql-relay'
import { GraphQLEmailAddress } from 'graphql-scalars'
import { t } from '@lingui/macro'

import { LanguageEnums, TfaSendMethodEnum } from '../../enums'
import { updateUserProfileUnion } from '../unions'

export const updateUserProfile = new mutationWithClientMutationId({
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
    tfaSendMethod: {
      type: TfaSendMethodEnum,
      description:
        'The method in which the user wishes to have their TFA code sent via.',
    },
  }),
  outputFields: () => ({
    result: {
      type: updateUserProfileUnion,
      description:
        '`UpdateUserProfileUnion` returning either a `UpdateUserProfileResult`, or `UpdateUserProfileError` object.',
      resolve: (payload) => payload,
    },
  }),
  mutateAndGetPayload: async (
    args,
    {
      i18n,
      query,
      userKey,
      auth: { userRequired },
      loaders: { loadUserByKey, loadUserByUserName },
      validators: { cleanseInput },
    },
  ) => {
    // Cleanse Input
    const displayName = cleanseInput(args.displayName)
    const userName = cleanseInput(args.userName).toLowerCase()
    const preferredLang = cleanseInput(args.preferredLang)
    const subTfaSendMethod = cleanseInput(args.tfaSendMethod)

    // Get user info from DB
    const user = await userRequired()

    // Check to see if user name is already in use
    if (userName !== '') {
      const checkUser = await loadUserByUserName.load(userName)
      if (typeof checkUser !== 'undefined') {
        console.warn(
          `User: ${userKey} attempted to update their username, but the username is already in use.`,
        )
        return {
          _type: 'error',
          code: 400,
          description: i18n._(t`Username not available, please try another.`),
        }
      }
    }

    let tfaSendMethod
    if (subTfaSendMethod === 'phone' && user.phoneValidated) {
      tfaSendMethod = 'phone'
    } else if (subTfaSendMethod === 'email' && user.emailValidated) {
      tfaSendMethod = 'email'
    } else if (
      subTfaSendMethod === 'none' ||
      typeof user.tfaSendMethod === 'undefined'
    ) {
      tfaSendMethod = 'none'
    } else {
      tfaSendMethod = user.tfaSendMethod
    }

    // Create object containing updated data
    const updatedUser = {
      displayName: displayName || user.displayName,
      userName: userName || user.userName,
      preferredLang: preferredLang || user.preferredLang,
      tfaSendMethod: tfaSendMethod,
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
      throw new Error(i18n._(t`Unable to update profile. Please try again.`))
    }

    await loadUserByKey.clear(user._key)
    const returnUser = await loadUserByKey.load(userKey)

    console.info(`User: ${user._key} successfully updated their profile.`)
    return {
      _type: 'success',
      status: i18n._(t`Profile successfully updated.`),
      user: returnUser,
    }
  },
})
