import { GraphQLNonNull, GraphQLID } from 'graphql'
import { mutationWithClientMutationId, fromGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

import { removeOrganizationUnion } from '../unions'
import ac from '../../access-control'

export const archiveOrganization = new mutationWithClientMutationId({
  name: 'ArchiveOrganization',
  description: 'This mutation allows the archival of unused organizations.',
  inputFields: () => ({
    orgId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The global id of the organization you wish you archive.',
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
      console.warn(`User: ${userKey} attempted to archive org: ${orgId}, but there is no org associated with that id.`)
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to archive unknown organization.`),
      }
    }

    // Get users permission
    const permission = await checkPermission({ orgId: organization._id })

    if (!ac.can(permission).deleteAny('organization').granted) {
      console.warn(
        `User: ${userKey} attempted to archive org: ${organization._key}, however they do not have the correct permission level. Permission: ${permission}`,
      )
      return {
        _type: 'error',
        code: 403,
        description: i18n._(t`Permission Denied: Please contact super admin for help with archiving organization.`),
      }
    }

    await organizationDS.archive({ organization })

    console.info(`User: ${userKey} successfully archived org: ${organization._key}.`)

    await auditLogs.logActivity({
      initiatedBy: {
        id: user._key,
        userName: user.userName,
        role: permission,
        ipAddress: ip,
      },
      action: 'update',
      updatedProperties: [
        {
          name: 'archived',
          oldValue: false,
          newValue: true,
        },
      ],
      target: {
        resource: {
          en: organization.name,
          fr: organization.name,
        },
        resourceType: 'organization',
      },
    })

    return {
      _type: 'result',
      status: i18n._(t`Successfully archived organization: ${organization.slug}.`),
      organization,
    }
  },
})
