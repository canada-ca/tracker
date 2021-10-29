import { GraphQLNonNull } from 'graphql'
import { t } from '@lingui/macro'
import { Slug } from '../../scalars'
import { verifiedOrganizationType } from '../objects'

export const findVerifiedOrganizationBySlug = {
  type: verifiedOrganizationType,
  description: 'Select all information on a selected verified organization.',
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
    { i18n, loaders: { loadVerifiedOrgBySlug }, validators: { cleanseInput } },
  ) => {
    // Cleanse input
    const orgSlug = cleanseInput(args.orgSlug)

    // Retrieve organization by slug
    const org = await loadVerifiedOrgBySlug.load(orgSlug)

    if (typeof org === 'undefined') {
      console.warn(`User could not retrieve verified organization.`)
      throw new Error(
        i18n._(
          t`No verified organization with the provided slug could be found.`,
        ),
      )
    }

    return org
  },
}
