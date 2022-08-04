import { t } from '@lingui/macro'

const { myTrackerType } = require('../objects')

export const findMyTracker = {
  type: myTrackerType,
  description:
    'Select all information on a selected organization that a user has access to.',
  resolve: async (
    _,
    __,
    {
      i18n,
      userKey,
      auth: { userRequired, verifiedRequired },
      loaders: { loadMyTrackerByUserId },
    },
  ) => {
    // Get User
    const user = await userRequired()
    verifiedRequired({ user })

    // Retrieve organization by slug
    const myTracker = await loadMyTrackerByUserId()

    if (typeof myTracker === 'undefined') {
      console.warn(`User ${userKey} could not retrieve organization.`)
      throw new Error(
        i18n._(t`No organization with the provided slug could be found.`),
      )
    }

    console.info(`User ${userKey} successfully retrieved personal domains.`)
    return myTracker
  },
}
