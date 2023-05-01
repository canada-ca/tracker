import { GraphQLNonNull, GraphQLID } from 'graphql'
import { mutationWithClientMutationId, fromGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

import { inviteUserToOrgUnion } from '../unions'
import { logActivity } from '../../audit-logs/mutations/log-activity'

export const requestOrgAffiliation = new mutationWithClientMutationId({
  name: 'RequestOrgAffiliation',
  description: `This mutation allows users to request to join an organization.`,
  inputFields: () => ({
    orgId: {
      type: GraphQLNonNull(GraphQLID),
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
      collections,
      transaction,
      userKey,
      auth: { userRequired, verifiedRequired, tfaRequired },
      loaders: { loadOrgByKey },
      notify: { sendOrgInviteEmail },
      validators: { cleanseInput },
    },
  ) => {
    const { id: orgId } = fromGlobalId(cleanseInput(args.orgId))

    // Get requesting user
    const user = await userRequired()

    verifiedRequired({ user })
    tfaRequired({ user })

    // Check to see if requested org exists
    const org = await loadOrgByKey.load(orgId)

    if (typeof org === 'undefined') {
      console.warn(
        `User: ${userKey} attempted to request invite to ${orgId} however there is no org associated with that id.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to request invite to unknown organization.`),
      }
    }

    // Check to see if user has already requested to join the org
    let checkIfUserHasAlreadyRequestedToJoinOrg
    try {
      checkIfUserHasAlreadyRequestedToJoinOrg = await query`
        FOR v, e IN 1..1 OUTBOUND ${org._id} affiliations
            FILTER e._to == ${user._id}
            FILTER e.permission == "pending"
            RETURN e
        `
    } catch (err) {
      console.error(
        `Database error occurred when user: ${userKey} attempted to request invite to ${orgId}, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to request invite. Please try again.`))
    }

    if (checkIfUserHasAlreadyRequestedToJoinOrg.count > 0) {
      console.warn(
        `User: ${userKey} attempted to request invite to ${orgId} however they have already requested to join that org.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to request invite to organization with which you have already requested to join.`),
      }
    }

    // Check to see if user is already a member of the org
    let checkIfUserIsAlreadyMemberOfOrg
    try {
      checkIfUserIsAlreadyMemberOfOrg = await query`
        FOR v, e IN 1..1 OUTBOUND ${org._id} affiliations
            FILTER e._to == ${user._id}
            RETURN e
        `
    } catch (err) {
      console.error(
        `Database error occurred when user: ${userKey} attempted to request invite to ${orgId}, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to request invite. Please try again.`))
    }

    if (checkIfUserIsAlreadyMemberOfOrg.count > 0) {
      console.warn(
        `User: ${userKey} attempted to request invite to ${orgId} however they are already affiliated with that org.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to request invite to organization with which you are already affiliated.`),
      }
    }

    // Setup Transaction
    const trx = await transaction(collections)

    // Create pending affiliation
    try {
      await trx.step(
        () =>
          query`
            WITH affiliations, organizations, users
            INSERT {
              _from: ${org._id},
              _to: ${user._id},
              permission: "pending",
              owner: false
            } INTO affiliations
          `,
      )
    } catch (err) {
      console.error(
        `Transaction step error occurred while user: ${userKey} attempted to request invite to org: ${org.slug}, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to invite user. Please try again.`))
    }

    // send notification to org admins
    await sendOrgInviteEmail({ orgId })

    // Commit Transaction
    try {
      await trx.commit()
    } catch (err) {
      console.error(
        `Transaction commit error occurred while user: ${userKey} attempted to request invite to org: ${org.slug}, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to request invite. Please try again.`))
    }

    console.info(`User: ${userKey} successfully requested invite to the org: ${org.slug}.`)
    await logActivity({
      transaction,
      collections,
      query,
      initiatedBy: {
        id: user._key,
        userName: user.userName,
      },
      action: 'add',
      target: {
        resource: user.userName,
        organization: {
          id: org._key,
          name: org.name,
        }, // name of resource being acted upon
        updatedProperties: [
          {
            name: 'permission',
            oldValue: null,
            newValue: 'pending',
          },
        ],
        resourceType: 'user', // user, org, domain
      },
    })

    return {
      _type: 'regular',
      status: i18n._(t`Successfully requested invite to organization, and sent notification email.`),
    }
  },
})
