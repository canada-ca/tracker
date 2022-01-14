import { GraphQLNonNull } from 'graphql'
import { t } from '@lingui/macro'
import { Slug } from '../../scalars'

const { organizationType } = require('../objects')

export const findOrganizationBySlug = {
  type: organizationType,
  description:
    'Select all information on a selected organization that a user has access to.',
  args: {
    orgSlug: {
      type: GraphQLNonNull(Slug),
      description:
        'The slugified organization name you want to retrieve data for.',
    },
  },
  resolve: async (
    _,
    args,
    {
      i18n,
      userKey,
      auth: {
        checkPermission,
        userRequired,
        verifiedRequired,
        loginRequiredBool,
      },
      loaders: { loadOrgBySlug },
      validators: { cleanseInput },
    },
  ) => {
    if (loginRequiredBool) {
      // Get User
      const user = await userRequired()
      verifiedRequired({ user })
    }

    // Cleanse input
    const orgSlug = cleanseInput(args.orgSlug)

    // Retrieve organization by slug
    const org = await loadOrgBySlug.load(orgSlug)

    if (typeof org === 'undefined') {
      console.warn(`User ${userKey} could not retrieve organization.`)
      throw new Error(
        i18n._(t`No organization with the provided slug could be found.`),
      )
    }

    if (loginRequiredBool) {
      // Check user permission for organization access
      const permission = await checkPermission({ orgId: org._id })

      if (!['super_admin', 'admin', 'user'].includes(permission)) {
        console.warn(`User ${userKey} could not retrieve organization.`)
        throw new Error(
          i18n._(
            t`Permission Denied: Could not retrieve specified organization.`,
          ),
        )
      }
    } else {
      if (org.slugEN === 'super-admin' || org.slugFR === 'super-admin') {
        // Check user permission for super-admin organization access
        const permission = await checkPermission({ orgId: org._id })

        if (!['super_admin', 'admin', 'user'].includes(permission)) {
          console.warn(`User ${userKey} could not retrieve organization.`)
          throw new Error(
            i18n._(
              t`Permission Denied: Could not retrieve specified organization.`,
            ),
          )
        }
      }
    }

    console.info(
      `User ${userKey} successfully retrieved organization ${org._key}.`,
    )
    org.id = org._key
    return org
  },
}
