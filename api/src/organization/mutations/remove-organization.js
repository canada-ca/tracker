import { GraphQLNonNull, GraphQLID } from 'graphql'
import { mutationWithClientMutationId, fromGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

import { removeOrganizationUnion } from '../unions'
import ac from '../../access-control'

export const removeOrganization = new mutationWithClientMutationId({
  name: 'RemoveOrganization',
  description: 'This mutation allows the removal of unused organizations.',
  inputFields: () => ({
    orgId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The global id of the organization you wish you remove.',
    },
  }),
  outputFields: () => ({
    result: {
      type: new GraphQLNonNull(removeOrganizationUnion),
      description: '`RemoveOrganizationUnion` returning either an `OrganizationResult`, or `OrganizationError` object.',
      resolve: (payload) => payload,
    },
  }),
  mutateAndGetPayload: async (
    args,
    {
      i18n,
      userKey,
      request: { ip },
      auth: { checkPermission, userRequired, verifiedRequired },
      validators: { cleanseInput },
      dataSources: { auditLogs, organization: organizationDS },
    },
  ) => {
    // Get user
    const user = await userRequired()

    verifiedRequired({ user })

    // Cleanse Input
    const { type: _orgType, id: orgId } = fromGlobalId(cleanseInput(args.orgId))

    // Get org from db
    const organization = await organizationDS.byKey.load(orgId)

    // Check to see if org exists
    if (!organization) {
      console.warn(`User: ${userKey} attempted to remove org: ${orgId}, but there is no org associated with that id.`)
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to remove unknown organization.`),
      }
    }

    // Get users permission
    const permission = await checkPermission({ orgId: organization._id })

    if (!ac.can(permission).deleteOwn('organization').granted) {
      console.warn(
        `User: ${userKey} attempted to remove org: ${organization._key}, however the user does not have permission to this organization.`,
      )
      return {
        _type: 'error',
        code: 403,
        description: i18n._(
          t`Permission Denied: Please contact organization admin for help with removing organization.`,
        ),
      }
    }

    // Check to see if org is verified check, and the user is super admin
    if (organization.verified && !ac.can(permission).deleteAny('organization').granted) {
      console.warn(
        `User: ${userKey} attempted to remove org: ${organization._key}, however the user is not a super admin.`,
      )
      return {
        _type: 'error',
        code: 403,
        description: i18n._(t`Permission Denied: Please contact super admin for help with removing organization.`),
      }
    }

    const compareOrg = await organizationDS.getRawByKey({ orgKey: organization._key })
    await organizationDS.remove({ organization })

    console.info(`User: ${userKey} successfully removed org: ${organization._key}.`)
    await auditLogs.logActivity({
      initiatedBy: {
        id: user._key,
        userName: user.userName,
        role: permission,
        ipAddress: ip,
      },
      action: 'delete',
      target: {
        resource: {
          en: compareOrg?.orgDetails.en.name || organization.name,
          fr: compareOrg?.orgDetails.fr.name || organization.name,
        },
        resourceType: 'organization',
      },
    })

    return {
      _type: 'result',
      status: i18n._(t`Successfully removed organization: ${organization.slug}.`),
      organization,
    }
  },
})
