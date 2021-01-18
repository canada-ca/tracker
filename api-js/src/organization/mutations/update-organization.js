import { GraphQLString, GraphQLNonNull, GraphQLID } from 'graphql'
import { mutationWithClientMutationId, fromGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

import { Acronym } from '../../scalars'
import { organizationType } from '../objects'

export const updateOrganization = new mutationWithClientMutationId({
  name: 'UpdateOrganization',
  description:
    'Mutation allows the modification of organizations if any changes to the organization may occur.',
  inputFields: () => ({
    id: {
      type: GraphQLNonNull(GraphQLID),
      description: 'The global id of the organization to be updated.',
    },
    acronymEN: {
      type: Acronym,
      description: 'The English acronym of the organization.',
    },
    acronymFR: {
      type: Acronym,
      description: 'The French acronym of the organization.',
    },
    nameEN: {
      type: GraphQLString,
      description: 'The English name of the organization.',
    },
    nameFR: {
      type: GraphQLString,
      description: 'The French name of the organization.',
    },
    zoneEN: {
      type: GraphQLString,
      description:
        'The English translation of the zone the organization belongs to.',
    },
    zoneFR: {
      type: GraphQLString,
      description:
        'The English translation of the zone the organization belongs to.',
    },
    sectorEN: {
      type: GraphQLString,
      description:
        'The English translation of the sector the organization belongs to.',
    },
    sectorFR: {
      type: GraphQLString,
      description:
        'The French translation of the sector the organization belongs to.',
    },
    countryEN: {
      type: GraphQLString,
      description:
        'The English translation of the country the organization resides in.',
    },
    countryFR: {
      type: GraphQLString,
      description:
        'The French translation of the country the organization resides in.',
    },
    provinceEN: {
      type: GraphQLString,
      description:
        'The English translation of the province the organization resides in.',
    },
    provinceFR: {
      type: GraphQLString,
      description:
        'The French translation of the province the organization resides in.',
    },
    cityEN: {
      type: GraphQLString,
      description:
        'The English translation of the city the organization resides in.',
    },
    cityFR: {
      type: GraphQLString,
      description:
        'The French translation of the city the organization resides in.',
    },
  }),
  outputFields: () => ({
    organization: {
      type: organizationType,
      description: 'The newly created organization.',
      resolve: async (payload) => {
        return payload.organization
      },
    },
  }),
  mutateAndGetPayload: async (
    args,
    {
      i18n,
      query,
      collections,
      transaction,
      userKey,
      auth: { checkPermission, userRequired },
      loaders: { orgLoaderByKey },
      validators: { cleanseInput, slugify },
    },
  ) => {
    // Cleanse Input
    const { type: _orgType, id: orgKey } = fromGlobalId(cleanseInput(args.id))
    const acronymEN = cleanseInput(args.acronymEN)
    const acronymFR = cleanseInput(args.acronymFR)
    const nameEN = cleanseInput(args.nameEN)
    const nameFR = cleanseInput(args.nameFR)
    const zoneEN = cleanseInput(args.zoneEN)
    const zoneFR = cleanseInput(args.zoneFR)
    const sectorEN = cleanseInput(args.sectorEN)
    const sectorFR = cleanseInput(args.sectorFR)
    const countryEN = cleanseInput(args.countryEN)
    const countryFR = cleanseInput(args.countryFR)
    const provinceEN = cleanseInput(args.provinceEN)
    const provinceFR = cleanseInput(args.provinceFR)
    const cityEN = cleanseInput(args.cityEN)
    const cityFR = cleanseInput(args.cityFR)

    // Create Slug
    const slugEN = slugify(nameEN)
    const slugFR = slugify(nameFR)

    // Get user
    await userRequired()

    // Check to see if org exists
    const currentOrg = await orgLoaderByKey.load(orgKey)

    if (typeof currentOrg === 'undefined') {
      console.warn(
        `User: ${userKey} attempted to update organization: ${orgKey}, however no organizations is associated with that id.`,
      )
      throw new Error(
        i18n._(t`Unable to update organization. Please try again.`),
      )
    }

    // Check to see if user has permission
    const permission = await checkPermission({ orgId: currentOrg._id })

    if (permission !== 'admin' && permission !== 'super_admin') {
      console.error(
        `User: ${userKey} attempted to update organization ${orgKey}, however they do not have the correct permission level. Permission: ${permission}`,
      )
      throw new Error(
        i18n._(t`Unable to update organization. Please try again.`),
      )
    }

    // Get all org details
    let orgCursor
    try {
      orgCursor = await query`
        FOR org IN organizations
          FILTER org._key == ${orgKey}
          RETURN org
      `
    } catch (err) {
      console.error(
        `Database error occurred while retrieving org: ${orgKey} for update, err: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to update organization. Please try again.`),
      )
    }

    const compareOrg = await orgCursor.next()

    const updatedOrgDetails = {
      orgDetails: {
        en: {
          slug: slugEN || compareOrg.orgDetails.en.slug,
          acronym: acronymEN || compareOrg.orgDetails.en.acronym,
          name: nameEN || compareOrg.orgDetails.en.name,
          zone: zoneEN || compareOrg.orgDetails.en.zone,
          sector: sectorEN || compareOrg.orgDetails.en.sector,
          country: countryEN || compareOrg.orgDetails.en.country,
          province: provinceEN || compareOrg.orgDetails.en.province,
          city: cityEN || compareOrg.orgDetails.en.city,
        },
        fr: {
          slug: slugFR || compareOrg.orgDetails.fr.slug,
          acronym: acronymFR || compareOrg.orgDetails.fr.acronym,
          name: nameFR || compareOrg.orgDetails.fr.name,
          zone: zoneFR || compareOrg.orgDetails.fr.zone,
          sector: sectorFR || compareOrg.orgDetails.fr.sector,
          country: countryFR || compareOrg.orgDetails.fr.country,
          province: provinceFR || compareOrg.orgDetails.fr.province,
          city: cityFR || compareOrg.orgDetails.fr.city,
        },
      },
    }

    // Generate list of collections names
    const collectionStrings = []
    for (const property in collections) {
      collectionStrings.push(property.toString())
    }

    // Setup Trans action
    const trx = await transaction(collectionStrings)

    // Upsert new org details
    try {
      await trx.run(
        async () =>
          await query`
            UPSERT { _key: ${orgKey} }
              INSERT ${updatedOrgDetails}
              UPDATE ${updatedOrgDetails}
              IN organizations
          `,
      )
    } catch (err) {
      console.error(
        `Transaction error occurred while upserting org: ${orgKey}, err: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to update organization. Please try again.`),
      )
    }

    try {
      await trx.commit()
    } catch (err) {
      console.error(
        `Transaction error occurred while committing org: ${orgKey}, err: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to update organization. Please try again.`),
      )
    }

    await orgLoaderByKey.clear(orgKey)
    const organization = await orgLoaderByKey.load(orgKey)

    console.info(`User: ${userKey}, successfully updated org ${orgKey}.`)
    return {
      organization,
    }
  },
})
