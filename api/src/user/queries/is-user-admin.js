import {t} from '@lingui/macro'
import {GraphQLBoolean, GraphQLID} from 'graphql'
import {fromGlobalId} from 'graphql-relay'

export const isUserAdmin = {
  type: GraphQLBoolean,
  description: 'Query used to check if the user has an admin role.',
  args: {
    orgId: {
      type: GraphQLID,
      description:
        'Optional org id to see if user is an admin for the requested org.',
    },
  },
  resolve: async (
    _,
    args,
    {
      i18n,
      query,
      userKey,
      auth: {checkPermission, userRequired},
      loaders: {loadOrgByKey},
      validators: {cleanseInput},
    },
  ) => {
    const {id: orgKey} = fromGlobalId(cleanseInput(args.orgId))

    const user = await userRequired()

    // check if for a specific org
    if (orgKey !== '') {
      const org = await loadOrgByKey.load(orgKey)

      const permission = await checkPermission({orgId: org._id})

      if (permission === 'admin' || permission === 'super_admin') {
        return true
      }

      return false
    }

    // check to see if user is an admin or higher for at least one org
    let userAdmin
    try {
      userAdmin = await query`
        FOR v, e IN 1..1 INBOUND ${user._id} affiliations
        FILTER e.permission == "admin" || e.permission == "super_admin"
        LIMIT 1
        RETURN e.permission
      `
    } catch (err) {
      console.error(
        `Database error occurred when user: ${userKey} was seeing if they were an admin, err: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to verify if user is an admin, please try again.`),
      )
    }

    if (userAdmin.count > 0) {
      return true
    }

    return false
  },
}
