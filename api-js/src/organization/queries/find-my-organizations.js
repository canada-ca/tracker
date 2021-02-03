import { connectionArgs } from 'graphql-relay'
import { t } from '@lingui/macro'
import { organizationConnection } from '../objects'

export const findMyOrganizations = {
  type: organizationConnection.connectionType,
  description: 'Select organizations a user has access to.',
  args: {
    ...connectionArgs,
  },
  resolve: async (
    _,
    args,
    {
      i18n,
      userKey,
      auth: { userRequired },
      loaders: { orgLoaderConnectionsByUserId },
      logger,
    },
  ) => {
    let orgConnections

    await userRequired()

    try {
      orgConnections = await orgLoaderConnectionsByUserId(args)
    } catch (err) {
      logger.error(
        `Database error occurred while user: ${userKey} was trying to gather organization connections in findMyOrganizations.`,
      )
      throw new Error(
        i18n._(t`Unable to load organizations. Please try again.`),
      )
    }

    logger.info(`User ${userKey} successfully retrieved their organizations.`)

    return orgConnections
  },
}
