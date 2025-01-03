import { GraphQLBoolean, GraphQLNonNull, GraphQLString } from 'graphql'
import { mutationWithClientMutationId } from 'graphql-relay'
import { t } from '@lingui/macro'
import { GraphQLEmailAddress } from 'graphql-scalars'

import { signUpUnion } from '../unions'
import { logActivity } from '../../audit-logs/mutations/log-activity'
import ms from 'ms'
import { emailUpdateOptionsType } from '../objects/email-update-options'

const { REFRESH_TOKEN_EXPIRY, SIGN_IN_KEY, AUTH_TOKEN_EXPIRY, TRACKER_PRODUCTION } = process.env

export const signUp = new mutationWithClientMutationId({
  name: 'SignUp',
  description: 'This mutation allows for new users to sign up for our sites services.',
  inputFields: () => ({
    displayName: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The name that will be displayed to other users.',
    },
    userName: {
      type: new GraphQLNonNull(GraphQLEmailAddress),
      description: 'Email address that the user will use to authenticate with.',
    },
    password: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The password the user will authenticate with.',
    },
    confirmPassword: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'A secondary password field used to confirm the user entered the correct password.',
    },
    signUpToken: {
      type: GraphQLString,
      description: 'A token sent by email, that will assign a user to an organization with a pre-determined role.',
    },
    rememberMe: {
      type: GraphQLBoolean,
      defaultValue: false,
      description: 'Whether or not the user wants to stay signed in after leaving the site.',
    },
  }),
  outputFields: () => ({
    result: {
      type: signUpUnion,
      description: '`SignUpUnion` returning either a `TFASignInResult`, or `SignUpError` object.',
      resolve: (payload) => payload,
    },
  }),
  mutateAndGetPayload: async (
    args,
    {
      i18n,
      collections,
      query,
      transaction,
      uuidv4,
      auth: { bcrypt, tokenize, verifyToken },
      loaders: { loadOrgByKey, loadUserByUserName, loadUserByKey },
      notify: { sendAuthEmail },
      validators: { cleanseInput },
    },
  ) => {
    // Cleanse Inputs
    const displayName = cleanseInput(args.displayName)
    const userName = cleanseInput(args.userName).toLowerCase()
    const password = cleanseInput(args.password)
    const confirmPassword = cleanseInput(args.confirmPassword)
    const signUpToken = cleanseInput(args.signUpToken)
    const rememberMe = args.rememberMe

    const isProduction = TRACKER_PRODUCTION === 'true'
    if (isProduction === false) {
      console.warn(`User: ${userName} tried to sign up but did not meet requirements.`)
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`User is trying to register for a non-production environment.`),
      }
    }

    // Check to make sure password meets length requirement
    if (password.length < 12) {
      console.warn(`User: ${userName} tried to sign up but did not meet requirements.`)
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Password does not meet requirements.`),
      }
    }

    // Check that password and password confirmation match
    if (password !== confirmPassword) {
      console.warn(`User: ${userName} tried to sign up but passwords do not match.`)
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Passwords do not match.`),
      }
    }

    // Check to see if user already exists
    const checkUser = await loadUserByUserName.load(userName)

    if (typeof checkUser !== 'undefined') {
      console.warn(`User: ${userName} tried to sign up, however there is already an account in use with that email.`)
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Email already in use.`),
      }
    }

    // Hash Users Password
    const hashedPassword = bcrypt.hashSync(password, 10)

    const refreshId = uuidv4()
    const tfaCode = Math.floor(100000 + Math.random() * 900000)

    // dynamically grabs email sub options
    const emailUpdateOptions = Object.fromEntries(
      Object.keys(emailUpdateOptionsType.getFields()).map((option) => [option, true]),
    )

    // Create User Structure for insert
    const user = {
      displayName: displayName,
      userName: userName,
      password: hashedPassword,
      phoneValidated: false,
      emailValidated: false,
      insideUser: false,
      receiveUpdateEmails: true,
      emailUpdateOptions,
      failedLoginAttempts: 0,
      tfaSendMethod: 'email',
      tfaCode: tfaCode,
      refreshInfo: {
        refreshId,
        rememberMe,
        expiresAt: new Date(new Date().getTime() + ms(String(REFRESH_TOKEN_EXPIRY))),
      },
    }

    // Setup Transaction
    const trx = await transaction(collections)

    let insertedUserCursor
    try {
      insertedUserCursor = await trx.step(
        () => query`
          WITH users
          INSERT ${user} INTO users
          RETURN MERGE(
            {
              id: NEW._key,
              _type: "user"
            },
            NEW
          )
        `,
      )
    } catch (err) {
      console.error(
        `Transaction step error occurred while user: ${userName} attempted to sign up, creating user: ${err}`,
      )
      await trx.abort()
      throw new Error(i18n._(t`Unable to sign up. Please try again.`))
    }

    let insertedUser
    try {
      insertedUser = await insertedUserCursor.next()
    } catch (err) {
      console.error(`Cursor error occurred while user: ${userName} attempted to sign up, creating user: ${err}`)
      await trx.abort()
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
        console.warn(`User: ${userName} attempted to sign up with an invite token, however emails do not match.`)
        await trx.abort()
        return {
          _type: 'error',
          code: 400,
          description: i18n._(t`Unable to sign up, please contact org admin for a new invite.`),
        }
      }

      const checkOrg = await loadOrgByKey.load(tokenOrgKey)
      if (typeof checkOrg === 'undefined') {
        console.warn(`User: ${userName} attempted to sign up with an invite token, however the org could not be found.`)
        await trx.abort()
        return {
          _type: 'error',
          code: 400,
          description: i18n._(t`Unable to sign up, please contact org admin for a new invite.`),
        }
      }

      try {
        await trx.step(
          () =>
            query`
            WITH affiliations, organizations, users
            INSERT {
              _from: ${checkOrg._id},
              _to: ${insertedUser._id},
              permission: ${tokenRequestedRole},
            } INTO affiliations
          `,
        )
      } catch (err) {
        console.error(
          `Transaction step error occurred while user: ${userName} attempted to sign up, assigning affiliation: ${err}`,
        )
        await trx.abort()
        throw new Error(i18n._(t`Unable to sign up. Please try again.`))
      }
    }

    try {
      await trx.commit()
    } catch (err) {
      console.error(`Transaction commit error occurred while user: ${userName} attempted to sign up: ${err}`)
      await trx.abort()
      throw new Error(i18n._(t`Unable to sign up. Please try again.`))
    }

    const returnUser = await loadUserByKey.load(insertedUser._key)
    await sendAuthEmail({ user: returnUser })

    const authenticateToken = tokenize({
      expiresIn: AUTH_TOKEN_EXPIRY,
      parameters: { userKey: insertedUser._key },
      secret: String(SIGN_IN_KEY),
    })

    console.info(`User: ${userName} successfully created a new account, and sent auth msg.`)
    await logActivity({
      transaction,
      collections,
      query,
      initiatedBy: {
        userName,
      },
      action: 'create',
      target: {
        resource: userName, // name of resource being acted upon
        resourceType: 'user', // user, org, domain
      },
    })

    return {
      _type: 'tfa',
      sendMethod: 'email',
      authenticateToken,
    }
  },
})
