import { GraphQLNonNull, GraphQLID } from 'graphql'
import { mutationWithClientMutationId, fromGlobalId } from 'graphql-relay'
import { GraphQLEmailAddress } from 'graphql-scalars'
import { t } from '@lingui/macro'

import { inviteUserToOrgUnion } from '../unions'
import { logActivity } from '../../audit-logs/mutations/log-activity'
import { InvitationRoleEnums } from '../../enums'

export const inviteUserToOrg = new mutationWithClientMutationId({
  name: 'InviteUserToOrg',
  description: `This mutation allows admins and higher to invite users to any of their
organizations, if the invited user does not have an account, they will be
able to sign-up and be assigned to that organization in one mutation.`,
  inputFields: () => ({
    userName: {
      type: new GraphQLNonNull(GraphQLEmailAddress),
      description: 'Users email that you would like to invite to your org.',
    },
    requestedRole: {
      type: new GraphQLNonNull(InvitationRoleEnums),
      description: 'The role which you would like this user to have.',
    },
    orgId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The organization you wish to invite the user to.',
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
      auth: { checkPermission, tokenize, userRequired, verifiedRequired, tfaRequired },
      loaders: { loadOrgByKey, loadUserByUserName },
      notify: { sendOrgInviteCreateAccount, sendOrgInviteEmail },
      validators: { cleanseInput },
    },
  ) => {
    const userName = cleanseInput(args.userName).toLowerCase()
    const requestedRole = cleanseInput(args.requestedRole)
    const { id: orgId } = fromGlobalId(cleanseInput(args.orgId))

    // Get requesting user
    const user = await userRequired()

    verifiedRequired({ user })
    tfaRequired({ user })

    // Make sure user is not inviting themselves
    if (user.userName === userName) {
      console.warn(`User: ${userKey} attempted to invite themselves to ${orgId}.`)
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

    // Only admins, owners, and super admins may invite users to an org
    // Only super admins may create owners and other super admins
    if (
      (['user', 'admin'].includes(requestedRole) && !['admin', 'owner', 'super_admin'].includes(permission)) ||
      (['super_admin', 'owner'].includes(requestedRole) && permission !== 'super_admin')
    ) {
      console.warn(
        `User: ${userKey} attempted to invite user: ${userName} to org: ${org._key} with role: ${requestedRole} but does not have permission to do so.`,
      )
      return {
        _type: 'error',
        code: 403,
        description: i18n._(t`Permission Denied: Please contact organization admin for help with user invitations.`),
      }
    }

    // Get org names to use in email
    let orgNamesCursor
    try {
      orgNamesCursor = await query`
        LET org = DOCUMENT(organizations, ${org._id})
        RETURN {
          "orgNameEN": org.orgDetails.en.name,
          "orgNameFR": org.orgDetails.fr.name,
        }
      `
    } catch (err) {
      console.error(
        `Database error occurred when user: ${userKey} attempted to invite user: ${userName} to org: ${org._key}. Error while creating cursor for retrieving organization names. error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to invite user to organization. Please try again.`))
    }

    let orgNames
    try {
      orgNames = await orgNamesCursor.next()
    } catch (err) {
      console.error(
        `Cursor error occurred when user: ${userKey} attempted to invite user: ${userName} to org: ${org._key}. Error while retrieving organization names. error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to invite user to organization. Please try again.`))
    }

    // Check to see if requested user exists
    const requestedUser = await loadUserByUserName.load(userName)

    // If there is not associated account with that username send invite to org with create account
    if (typeof requestedUser === 'undefined') {
      const token = tokenize({
        expiresIn: '3d',
        parameters: { userName, orgKey: org._key, requestedRole },
      })
      const createAccountLink = `https://${request.get('host')}/create-user/${token}`

      await sendOrgInviteCreateAccount({
        user: { userName: userName },
        orgNameEN: orgNames.orgNameEN,
        orgNameFR: orgNames.orgNameFR,
        createAccountLink,
      })

      console.info(`User: ${userKey} successfully invited user: ${userName} to the service, and org: ${org.slug}.`)
      await logActivity({
        transaction,
        collections,
        query,
        initiatedBy: {
          id: user._key,
          userName: user.userName,
          role: permission,
        },
        action: 'add',
        target: {
          resource: userName,
          organization: {
            id: org._key,
            name: org.name,
          }, // name of resource being acted upon
          resourceType: 'user', // user, org, domain
          updatedProperties: [{ name: 'role', oldValue: '', newValue: requestedRole }],
        },
      })

      return {
        _type: 'regular',
        status: i18n._(t`Successfully sent invitation to service, and organization email.`),
      }
    }

    // If account is found, check if already affiliated with org
    let affiliationCursor
    try {
      affiliationCursor = await query`
        WITH affiliations, organizations, users
        FOR v, e IN 1..1 INBOUND ${requestedUser._id} affiliations
          FILTER e._from == ${org._id}
          RETURN e
      `
    } catch (err) {
      console.error(
        `Database error occurred when user: ${userKey} attempted to invite user: ${requestedUser._key} to org: ${org.slug}, error: ${err}`,
      )
      return {
        _type: 'error',
        code: 500,
        description: i18n._(t`Unable to invite user to organization. Please try again.`),
      }
    }

    if (affiliationCursor.count > 0) {
      // If affiliation is found, return error
      console.warn(
        `User: ${userKey} attempted to invite user: ${requestedUser._key} to org: ${org.slug} however they are already affiliated with that org.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to invite user to organization. User is already affiliated with organization.`),
      }
    }

    // User is not affiliated with org, create affiliation

    // Setup Transaction
    const trx = await transaction(collections)

    // Create affiliation
    try {
      await trx.step(
        () =>
          query`
            WITH affiliations, organizations, users
            INSERT {
              _from: ${org._id},
              _to: ${requestedUser._id},
              permission: ${requestedRole},
            } INTO affiliations
          `,
      )
    } catch (err) {
      console.error(
        `Transaction step error occurred while user: ${userKey} attempted to invite user: ${requestedUser._key} to org: ${org.slug}, error: ${err}`,
      )
      await trx.abort()
      return {
        _type: 'error',
        code: 500,
        description: i18n._(t`Unable to invite user. Please try again.`),
      }
    }

    await sendOrgInviteEmail({
      user: requestedUser,
      orgNameEN: orgNames.orgNameEN,
      orgNameFR: orgNames.orgNameFR,
    })

    // Commit affiliation
    try {
      await trx.commit()
    } catch (err) {
      console.error(
        `Transaction commit error occurred while user: ${userKey} attempted to invite user: ${requestedUser._key} to org: ${org.slug}, error: ${err}`,
      )
      await trx.abort()
      return {
        _type: 'error',
        code: 500,
        description: i18n._(t`Unable to invite user. Please try again.`),
      }
    }

    console.info(`User: ${userKey} successfully invited user: ${requestedUser._key} to the org: ${org.slug}.`)
    await logActivity({
      transaction,
      collections,
      query,
      initiatedBy: {
        id: user._key,
        userName: user.userName,
        role: permission,
      },
      action: 'add',
      target: {
        resource: userName,
        organization: {
          id: org._key,
          name: org.name,
        }, // name of resource being acted upon
        updatedProperties: [{ name: 'role', oldValue: '', newValue: requestedRole }],
        resourceType: 'user', // user, org, domain
      },
    })

    return {
      _type: 'regular',
      status: i18n._(t`Successfully invited user to organization, and sent notification email.`),
    }
  },
})
