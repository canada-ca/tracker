const { GraphQLNonNull } = require('graphql')
const { t } = require('@lingui/macro')
const { Slug } = require('../../scalars')
const { verifiedOrganizationType } = require('../../types')

const findVerifiedOrganizationBySlug = {
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
    { i18n, loaders: { verifiedOrgLoaderBySlug }, validators: { cleanseInput } },
  ) => {
    // Cleanse input
    const orgSlug = cleanseInput(args.orgSlug)

    // Retrieve organization by slug
    const org = await verifiedOrgLoaderBySlug.load(orgSlug)

    if (typeof org === 'undefined') {
      console.warn(`User could not retrieve verified organization.`)
      throw new Error(
        i18n._(t`No organization with the provided slug could be found.`),
      )
    }

    return org
  },
}

module.exports = {
  findVerifiedOrganizationBySlug,
}
