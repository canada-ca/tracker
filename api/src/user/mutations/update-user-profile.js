import {GraphQLString, GraphQLBoolean} from 'graphql'
import {mutationWithClientMutationId} from 'graphql-relay'
import {GraphQLEmailAddress} from 'graphql-scalars'
import {t} from '@lingui/macro'

import {LanguageEnums, TfaSendMethodEnum} from '../../enums'
import {updateUserProfileUnion} from '../unions'

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
    insideUser: {
      type: GraphQLBoolean,
      description:
        'The updated boolean which represents if the user wants to see features in progress.',
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
      collections,
      transaction,
      userKey,
      request,
      auth: {tokenize, userRequired},
      loaders: {loadUserByKey, loadUserByUserName},
      notify: {sendVerificationEmail},
      validators: {cleanseInput},
    },
  ) => {
    // Cleanse Input
    const displayName = cleanseInput(args.displayName)
    const userName = cleanseInput(args.userName).toLowerCase()
    const preferredLang = cleanseInput(args.preferredLang)
    const subTfaSendMethod = cleanseInput(args.tfaSendMethod)
    const insideUserBool = args.insideUser

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

    // Check to see if admin user is disabling TFA
    if (subTfaSendMethod === 'none') {
      // check to see if user is an admin or higher for at least one org
      let userAdmin
      try {
        userAdmin = await query`
        FOR v, e IN 1..1 INBOUND ${user._id} affiliations
        FILTER e.permission == "admin" || e.permission == "super_admin"
        LIMIT 1
        RETURN e.permission
      `
      } catch (err) {
        console.error(
          `Database error occurred when user: ${userKey} was seeing if they were an admin, err: ${err}`,
        )
        throw new Error(
          i18n._(t`Unable to verify if user is an admin, please try again.`),
        )
      }

      if (userAdmin.count > 0) {
        console.error(
          `User: ${userKey} attempted to remove MFA, however they are an admin of at least one organization.`,
        )
        return {
          _type: 'error',
          code: 403,
          description: i18n._(
            t`Permission Denied: Multi-factor authentication is required for admin accounts`,
          ),
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

    let emailValidated = user.emailValidated
    let changedUserName = false
    if (userName !== user.userName && userName !== '') {
      changedUserName = true
      emailValidated = false
    }

    // Create object containing updated data
    const updatedUser = {
      displayName: displayName || user.displayName,
      userName: userName || user.userName,
      preferredLang: preferredLang || user.preferredLang,
      tfaSendMethod: tfaSendMethod,
      emailValidated,
      insideUser:
        typeof insideUserBool !== 'undefined'
          ? insideUserBool
          : user?.insideUser,
    }

    // Setup Transaction
    const trx = await transaction(collections)

    try {
      await trx.step(
        () => query`
          WITH users
          UPSERT { _key: ${user._key} }
            INSERT ${updatedUser}
            UPDATE ${updatedUser}
            IN users
        `,
      )
    } catch (err) {
      console.error(
        `Trx step error occurred when user: ${userKey} attempted to update their profile: ${err}`,
      )
      throw new Error(i18n._(t`Unable to update profile. Please try again.`))
    }

    try {
      await trx.commit()
    } catch (err) {
      console.error(
        `Trx commit error occurred when user: ${userKey} attempted to update their profile: ${err}`,
      )
      throw new Error(i18n._(t`Unable to update profile. Please try again.`))
    }

    await loadUserByKey.clear(user._key)
    const returnUser = await loadUserByKey.load(userKey)

    if (changedUserName) {
      const token = tokenize({parameters: {userKey: returnUser._key}})

      const verifyUrl = `https://${request.get('host')}/validate/${token}`

      await sendVerificationEmail({user: returnUser, verifyUrl})
    }

    console.info(`User: ${userKey} successfully updated their profile.`)
    return {
      _type: 'success',
      status: i18n._(t`Profile successfully updated.`),
      user: returnUser,
    }
  },
})
