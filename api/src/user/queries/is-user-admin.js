import { GraphQLBoolean, GraphQLID } from 'graphql'
import { fromGlobalId } from 'graphql-relay'

export const isUserAdmin = {
  type: GraphQLBoolean,
  description: 'Query used to check if the user has an admin role.',
  args: {
    orgId: {
      type: GraphQLID,
      description: 'Optional org id to see if user is an admin for the requested org.',
    },
  },
  resolve: async (
    _,
    args,
    {
      auth: { checkPermission, userRequired },
      dataSources: { user: userDataSource, organization: organizationDataSource },
      validators: { cleanseInput },
    },
  ) => {
    const { id: orgKey } = fromGlobalId(cleanseInput(args.orgId))
    const user = await userRequired()

    // check if for a specific org
    if (orgKey) {
      const org = await organizationDataSource.byKey.load(orgKey)
      const permission = await checkPermission({ orgId: org._id })

      return ['admin', 'owner', 'super_admin'].includes(permission)
    }

    // check to see if user is an admin or higher for at least one org
    return userDataSource.isAdminForAnyOrg({ userId: user._id })
  },
}
