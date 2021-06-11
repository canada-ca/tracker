import { GraphQLNonNull, GraphQLID } from 'graphql'
import { mutationWithClientMutationId, fromGlobalId } from 'graphql-relay'
import { GraphQLEmailAddress } from 'graphql-scalars'
import { t } from '@lingui/macro'

import { inviteUserToOrgUnion } from '../unions'
import { LanguageEnums, RoleEnums } from '../../enums'

export const inviteUserToOrg = new mutationWithClientMutationId({
  name: 'InviteUserToOrg',
  description: `This mutation allows admins and higher to invite users to any of their
organizations, if the invited user does not have an account, they will be
able to sign-up and be assigned to that organization in one mutation.`,
  inputFields: () => ({
    userName: {
      type: GraphQLNonNull(GraphQLEmailAddress),
      description: 'Users email that you would like to invite to your org.',
    },
    requestedRole: {
      type: GraphQLNonNull(RoleEnums),
      description: 'The role which you would like this user to have.',
    },
    orgId: {
      type: GraphQLNonNull(GraphQLID),
      description: 'The organization you wish to invite the user to.',
    },
    preferredLang: {
      type: GraphQLNonNull(LanguageEnums),
      description: 'The language in which the email will be sent in.',
    },
  }),
  outputFields: () => ({
    result: {
      type: inviteUserToOrgUnion,
      description:
        '`InviteUserToOrgUnion` returning either a `InviteUserToOrgResult`, or `InviteUserToOrgError` object.',
      resolve: (payload) => payload,
    },
  }),
  mutateAndGetPayload: async (
    args,
    {
      i18n,
      query,
      request,
      collections,
      transaction,
      userKey,
      auth: { checkPermission, tokenize, userRequired, verifiedRequired },
      loaders: { loadOrgByKey, loadUserByUserName },
      notify: { sendOrgInviteCreateAccount, sendOrgInviteEmail },
      validators: { cleanseInput },
    },
  ) => {
    const userName = cleanseInput(args.userName).toLowerCase()
    const requestedRole = cleanseInput(args.requestedRole)
    const { id: orgId } = fromGlobalId(cleanseInput(args.orgId))
    const preferredLang = cleanseInput(args.preferredLang)

    // Get requesting user
    const user = await userRequired()

    verifiedRequired({ user })

    // Make sure user is not inviting themselves
    if (user.userName === userName) {
      console.warn(
        `User: ${userKey} attempted to invite themselves to ${orgId}.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to invite yourself to an org.`),
      }
    }

    // Check to see if requested org exists
    const org = await loadOrgByKey.load(orgId)

    if (typeof org === 'undefined') {
      console.warn(
        `User: ${userKey} attempted to invite user: ${userName} to ${orgId} however there is no org associated with that id.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to invite user to unknown organization.`),
      }
    }

    // Check to see requesting users permission to the org is
    const permission = await checkPermission({ orgId: org._id })

    if (
      typeof permission === 'undefined' ||
      permission === 'user' ||
      (permission === 'admin' && requestedRole === 'super_admin')
    ) {
      console.warn(
        `User: ${userKey} attempted to invite user: ${userName} to org: ${org._key} with role: ${requestedRole} but does not have permission to do so.`,
      )
      return {
        _type: 'error',
        code: 403,
        description: i18n._(
          t`Permission Denied: Please contact organization admin for help with user invitations.`,
        ),
      }
    }

    // Check to see if requested user exists
    const requestedUser = await loadUserByUserName.load(userName)

    // If there is not associated account with that user name send invite to org with create account
    if (typeof requestedUser === 'undefined') {
      const token = tokenize({
        parameters: { userName, orgKey: org._key, requestedRole },
      })
      const createAccountLink = `${request.protocol}://${request.get(
        'host',
      )}/create-user/${token}`

      await sendOrgInviteCreateAccount({
        user: { userName: userName, preferredLang },
        orgName: org.name,
        createAccountLink,
      })

      console.info(
        `User: ${userKey} successfully invited user: ${userName} to the service, and org: ${org.slug}.`,
      )

      return {
        _type: 'regular',
        status: i18n._(
          t`Successfully sent invitation to service, and organization email.`,
        ),
      }
    }
    // If account is found add just add affiliation
    else {
      // Generate list of collections names
      const collectionStrings = []
      for (const property in collections) {
        collectionStrings.push(property.toString())
      }

      // Setup Transaction
      const trx = await transaction(collectionStrings)

      // Create affiliation
      try {
        await trx.step(() =>
          query`
            WITH affiliations, organizations, users
            INSERT {
              _from: ${org._id},
              _to: ${requestedUser._id},
              permission: ${requestedRole}
            } INTO affiliations
          `,
        )
      } catch (err) {
        console.error(
          `Transaction step error occurred while user: ${userKey} attempted to invite user: ${requestedUser._key} to org: ${org.slug}, error: ${err}`,
        )
        throw new Error(
          i18n._(t`Unable to add user to organization. Please try again.`),
        )
      }

      await sendOrgInviteEmail({
        user: requestedUser,
        orgName: org.name,
      })

      // Commit affiliation
      try {
        await trx.commit()
      } catch (err) {
        console.error(
          `Transaction commit error occurred while user: ${userKey} attempted to invite user: ${requestedUser._key} to org: ${org.slug}, error: ${err}`,
        )
        throw new Error(i18n._(t`Unable to invite user. Please try again.`))
      }

      console.info(
        `User: ${userKey} successfully invited user: ${requestedUser._key} to the org: ${org.slug}.`,
      )

      return {
        _type: 'regular',
        status: i18n._(
          t`Successfully invited user to organization, and sent notification email.`,
        ),
      }
    }
  },
})
