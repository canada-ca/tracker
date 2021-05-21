import { GraphQLEmailAddress } from 'graphql-scalars'
import { t } from '@lingui/macro'
import { GraphQLNonNull } from 'graphql'

import { userSharedType } from '../objects'

export const findUserByUsername = {
  type: userSharedType,
  args: {
    userName: {
      type: GraphQLNonNull(GraphQLEmailAddress),
      description: 'Email address of user you wish to gather data for.',
    },
  },
  description: 'Query a specific user by user name.',
  resolve: async (
    _,
    args,
    {
      i18n,
      userKey,
      auth: { userRequired, checkUserIsAdminForUser },
      loaders: { loadUserByUserName },
      validators: { cleanseInput },
    },
  ) => {
    // Cleanse input
    const userName = cleanseInput(args.userName)
    // Get querying user
    await userRequired()

    const permission = await checkUserIsAdminForUser({ userName })

    if (permission) {
      // Retrieve user by userName
      const user = await loadUserByUserName.load(userName)
      user.id = user._key
      return user
    } else {
      console.warn(`User ${userKey} is not permitted to query users.`)
      throw new Error(i18n._(t`User could not be queried.`))
    }
  },
}
