import {GraphQLBoolean} from 'graphql'
import {t} from '@lingui/macro'

export const isUserSuperAdmin = {
  type: GraphQLBoolean,
  description: 'Query used to check if the user has a super admin role.',
  resolve: async (_, __, {i18n, query, userKey, auth: {userRequired}}) => {
    const user = await userRequired()

    let userAdmin
    try {
      userAdmin = await query`
      FOR v, e IN 1..1 INBOUND ${user._id} affiliations
      FILTER e.permission == "super_admin"
      LIMIT 1
      RETURN e.permission
      `
    } catch (err) {
      console.error(
        `Database error occurred when user: ${userKey} was seeing if they were a super admin, err: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to verify if user is a super admin, please try again.`),
      )
    }

    if (userAdmin.count > 0) {
      return true
    }

    return false
  },
}
