import { connectionArgs, fromGlobalId } from 'graphql-relay'
import { GraphQLID, GraphQLString } from 'graphql'
import { logConnection } from '../objects/log-connection'
import { logOrder } from '../input/log-order'
import { t } from '@lingui/macro'

export const findAuditLogs = {
  type: logConnection.connectionType,
  description: '',
  args: {
    orgId: {
      type: GraphQLID,
      description: 'The organization you wish to remove the domain from.',
    },
    orderBy: {
      type: logOrder,
      description: '',
    },
    search: {
      type: GraphQLString,
      description: 'String used to search for domains.',
    },
    ...connectionArgs,
  },
  resolve: async (
    _,
    args,
    {
      userKey,
      i18n,
      auth: { checkPermission, userRequired, verifiedRequired },
      loaders: { loadAuditLogsByOrgId, loadOrgByKey },
      validators: { cleanseInput },
    },
  ) => {
    const user = await userRequired()
    verifiedRequired({ user })
    const { type: _orgType, id: orgId } = fromGlobalId(cleanseInput(args.orgId))
    // Check to see if user belongs to org
    const permission = await checkPermission({ orgId })
    // Get Org from db
    const org = await loadOrgByKey.load(orgId)
    if (permission === 'admin' || permission === 'super_admin') {
      const auditLogCollection = await loadAuditLogsByOrgId({
        ...args,
        orgId: org?._key,
        permission,
      })
      console.info(`User: ${userKey} successfully retrieved audit logs.`)
      return auditLogCollection
    }
    throw new Error(
      i18n._(
        t`Cannot query audit logs on organization without admin permission or higher.`,
      ),
    )
  },
}
