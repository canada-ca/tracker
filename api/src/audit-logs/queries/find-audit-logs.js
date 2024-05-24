import { connectionArgs, fromGlobalId } from 'graphql-relay'
import { GraphQLID, GraphQLString } from 'graphql'
import { logConnection } from '../objects/log-connection'
import { logOrder } from '../input/log-order'
import { t } from '@lingui/macro'
import { logFilters } from '../input/log-filters'

export const findAuditLogs = {
  type: logConnection.connectionType,
  description: 'Select activity logs a user has access to.',
  args: {
    orgId: {
      type: GraphQLID,
      description: 'The organization you wish to query the logs from.',
    },
    orderBy: {
      type: logOrder,
      description: 'Ordering options for log connections.',
    },
    search: {
      type: GraphQLString,
      description: 'String used to search for logs by initiant user or target resource.',
    },
    filters: {
      type: logFilters,
      description: 'Keywords used to filter log results.',
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
    // Get Org from db
    const org = await loadOrgByKey.load(orgId)

    // Check to see if user belongs to org
    const permission = await checkPermission({ orgId: org?._id })
    if (['admin', 'owner', 'super_admin'].includes(permission) === false) {
      throw new Error(i18n._(t`Cannot query audit logs on organization without admin permission or higher.`))
    }
    const auditLogCollection = await loadAuditLogsByOrgId({
      ...args,
      orgId: org?._key,
      permission,
    })
    console.info(`User: ${userKey} successfully retrieved audit logs.`)
    return auditLogCollection
  },
}
