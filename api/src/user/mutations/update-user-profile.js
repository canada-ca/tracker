import { GraphQLString, GraphQLBoolean } from 'graphql'
import { mutationWithClientMutationId } from 'graphql-relay'
import { GraphQLEmailAddress } from 'graphql-scalars'
import { t } from '@lingui/macro'

import { TfaSendMethodEnum } from '../../enums'
import { updateUserProfileUnion } from '../unions'
import { emailUpdatesInput } from '../inputs/email-update-options'

const { AUTHENTICATED_KEY, AUTH_TOKEN_EXPIRY } = process.env

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
    tfaSendMethod: {
      type: TfaSendMethodEnum,
      description: 'The method in which the user wishes to have their TFA code sent via.',
    },
    insideUser: {
      type: GraphQLBoolean,
      description: 'The updated boolean which represents if the user wants to see features in progress.',
    },
    emailUpdateOptions: {
      type: emailUpdatesInput,
      description:
        'A number of different emails the user can optionally receive periodically that provide updates about their organization.',
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
      userKey,
      request,
      auth: { tokenize, userRequired },
      dataSources: { user: userDataSource },
      notify: { sendVerificationEmail },
      validators: { cleanseInput },
    },
  ) => {
    // Cleanse Input
    const displayName = cleanseInput(args.displayName)
    const userName = cleanseInput(args.userName).toLowerCase()
    const subTfaSendMethod = cleanseInput(args.tfaSendMethod)
    const insideUserBool = args.insideUser
    const emailUpdateOptions = args.emailUpdateOptions

    // Get user info from DB
    const user = await userRequired()

    // Check to see if username is already in use
    if (userName !== '') {
      const checkUser = await userDataSource.byUserName.load(userName)
      if (typeof checkUser !== 'undefined') {
        console.warn(`User: ${userKey} attempted to update their username, but the username is already in use.`)
        return {
          _type: 'error',
          code: 400,
          description: i18n._(t`Username not available, please try another.`),
        }
      }
    }

    // Check to see if admin user is disabling TFA
    if (subTfaSendMethod === 'none') {
      const userAdmin = await userDataSource.isAdminForAnyOrg({ userId: user._id })
      if (userAdmin) {
        console.error(
          `User: ${userKey} attempted to remove MFA, however they are an admin of at least one organization.`,
        )
        return {
          _type: 'error',
          code: 403,
          description: i18n._(t`Permission Denied: Multi-factor authentication is required for admin accounts`),
        }
      }
    }

    let tfaSendMethod
    if (subTfaSendMethod === 'phone' && user.phoneValidated) {
      tfaSendMethod = 'phone'
    } else if (subTfaSendMethod === 'email' && user.emailValidated) {
      tfaSendMethod = 'email'
    } else if (subTfaSendMethod === 'none' || typeof user.tfaSendMethod === 'undefined') {
      tfaSendMethod = 'none'
    } else {
      tfaSendMethod = user.tfaSendMethod
    }

    let changedUserName = false
    if (userName !== user.userName && userName !== '') {
      changedUserName = true
    }

    // Create object containing updated data expect username. Username is handled separately for verification.
    const updatedUser = {
      displayName: displayName || user.displayName,
      tfaSendMethod: tfaSendMethod,
      insideUser: typeof insideUserBool !== 'undefined' ? insideUserBool : user?.insideUser,
      emailUpdateOptions: typeof emailUpdateOptions !== 'undefined' ? emailUpdateOptions : user?.emailUpdateOptions,
    }

    await userDataSource.updateProfile({ userKey: user._key, updatedUser })

    await userDataSource.byKey.clear(user._key)
    const returnUser = await userDataSource.byKey.load(userKey)

    if (changedUserName) {
      const token = tokenize({
        expiresIn: AUTH_TOKEN_EXPIRY,
        parameters: { userKey: returnUser._key, userName: userName },
        secret: String(AUTHENTICATED_KEY),
      })

      const verifyUrl = `https://${request.get('host')}/validate/${token}`

      await sendVerificationEmail({
        userName: userName,
        displayName: returnUser.displayName,
        verifyUrl: verifyUrl,
        userKey: returnUser._key,
      })
    }

    console.info(`User: ${userKey} successfully updated their profile.`)
    return {
      _type: 'success',
      status: i18n._(t`Profile successfully updated.`),
      user: returnUser,
    }
  },
})
