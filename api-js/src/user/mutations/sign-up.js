import { GraphQLNonNull, GraphQLString } from 'graphql'
import { mutationWithClientMutationId } from 'graphql-relay'
import { t } from '@lingui/macro'
import { GraphQLEmailAddress } from 'graphql-scalars'

import { LanguageEnums } from '../../enums'
import { signUpUnion } from '../unions'

export const signUp = new mutationWithClientMutationId({
  name: 'SignUp',
  description:
    'This mutation allows for new users to sign up for our sites services.',
  inputFields: () => ({
    displayName: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The name that will be displayed to other users.',
    },
    userName: {
      type: GraphQLNonNull(GraphQLEmailAddress),
      description: 'Email address that the user will use to authenticate with.',
    },
    password: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The password the user will authenticate with.',
    },
    confirmPassword: {
      type: GraphQLNonNull(GraphQLString),
      description:
        'A secondary password field used to confirm the user entered the correct password.',
    },
    preferredLang: {
      type: GraphQLNonNull(LanguageEnums),
      description: 'The users preferred language.',
    },
    signUpToken: {
      type: GraphQLString,
      description:
        'A token sent by email, that will assign a user to an organization with a pre-determined role.',
    },
  }),
  outputFields: () => ({
    result: {
      type: signUpUnion,
      description:
        '`SignUpUnion` returning either a `AuthResult`, or `SignUpError` object.',
      resolve: (payload) => payload,
    },
  }),
  mutateAndGetPayload: async (
    args,
    {
      i18n,
      collections,
      transaction,
      auth: { bcrypt, tokenize, verifyToken },
      loaders: { orgLoaderByKey, userLoaderByUserName, userLoaderByKey },
      validators: { cleanseInput },
    },
  ) => {
    // Cleanse Inputs
    const displayName = cleanseInput(args.displayName)
    const userName = cleanseInput(args.userName).toLowerCase()
    const password = cleanseInput(args.password)
    const confirmPassword = cleanseInput(args.confirmPassword)
    const preferredLang = cleanseInput(args.preferredLang)
    const signUpToken = cleanseInput(args.signUpToken)

    // Check to make sure password meets length requirement
    if (password.length < 12) {
      console.warn(
        `User: ${userName} tried to sign up but did not meet requirements.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Password does not meet requirements.`),
      }
    }

    // Check that password and password confirmation match
    if (password !== confirmPassword) {
      console.warn(
        `User: ${userName} tried to sign up but passwords do not match.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Passwords do not match.`),
      }
    }

    // Check to see if user already exists
    const checkUser = await userLoaderByUserName.load(userName)

    if (typeof checkUser !== 'undefined') {
      console.warn(
        `User: ${userName} tried to sign up, however there is already an account in use with that username.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Username already in use.`),
      }
    }

    // Hash Users Password
    const hashedPassword = bcrypt.hashSync(password, 10)

    // Create User Structure for insert
    const user = {
      displayName: displayName,
      userName: userName,
      password: hashedPassword,
      preferredLang: preferredLang,
      phoneValidated: false,
      emailValidated: false,
      failedLoginAttempts: 0,
      tfaSendMethod: 'none',
    }

    // Generate list of collections names
    const collectionStrings = []
    for (const property in collections) {
      collectionStrings.push(property.toString())
    }

    // Setup Transaction
    const trx = await transaction(collectionStrings)

    let insertedUser
    try {
      insertedUser = await trx.step(() => collections.users.save(user))
    } catch (err) {
      console.error(
        `Transaction step error occurred while user: ${userName} attempted to sign up, creating user: ${err}`,
      )
      throw new Error(i18n._(t`Unable to sign up. Please try again.`))
    }

    // Assign user to org
    if (signUpToken !== '') {
      // Gather token parameters
      const tokenParameters = verifyToken({
        token: signUpToken,
      })

      const tokenUserName = cleanseInput(tokenParameters.userName)
      const tokenOrgKey = cleanseInput(tokenParameters.orgKey)
      const tokenRequestedRole = cleanseInput(tokenParameters.requestedRole)

      if (userName !== tokenUserName) {
        console.warn(
          `User: ${userName} attempted to sign up with an invite token, however emails do not match.`,
        )
        return {
          _type: 'error',
          code: 400,
          description: i18n._(
            t`Unable to sign up, please contact org admin for a new invite.`,
          ),
        }
      }

      const checkOrg = await orgLoaderByKey.load(tokenOrgKey)
      if (typeof checkOrg === 'undefined') {
        console.warn(
          `User: ${userName} attempted to sign up with an invite token, however the org could not be found.`,
        )
        return {
          _type: 'error',
          code: 400,
          description: i18n._(
            t`Unable to sign up, please contact org admin for a new invite.`,
          ),
        }
      }

      try {
        await trx.step(() =>
          collections.affiliations.save({
            _from: checkOrg._id,
            _to: insertedUser._id,
            permission: tokenRequestedRole,
          }),
        )
      } catch (err) {
        console.error(
          `Transaction step error occurred while user: ${userName} attempted to sign up, assigning affiliation: ${err}`,
        )
        throw new Error(i18n._(t`Unable to sign up. Please try again.`))
      }
    }

    try {
      await trx.commit()
    } catch (err) {
      console.error(
        `Transaction commit error occurred while user: ${userName} attempted to sign up: ${err}`,
      )
      throw new Error(i18n._(t`Unable to sign up. Please try again.`))
    }

    // Generate JWT
    const token = tokenize({ parameters: { userKey: insertedUser._key } })

    const returnUser = await userLoaderByKey.load(insertedUser._key)

    console.info(`User: ${userName} successfully created a new account.`)

    return {
      _type: 'authResult',
      token,
      user: returnUser,
    }
  },
})
