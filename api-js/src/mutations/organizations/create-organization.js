const { GraphQLNonNull, GraphQLString } = require('graphql')
const { mutationWithClientMutationId } = require('graphql-relay')
const { t } = require('@lingui/macro')
const { Acronym } = require('../../scalars')
const { organizationType } = require('../../types')

const createOrganization = new mutationWithClientMutationId({
  name: 'CreateOrganization',
  description:
    'This mutation allows the creation of an organization inside the database.',
  inputFields: () => ({
    acronymEN: {
      type: GraphQLNonNull(Acronym),
      description: 'The English acronym of the organization.',
    },
    acronymFR: {
      type: GraphQLNonNull(Acronym),
      description: 'The French acronym of the organization.',
    },
    nameEN: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The English name of the organization.',
    },
    nameFR: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The French name of the organization.',
    },
    zoneEN: {
      type: GraphQLNonNull(GraphQLString),
      description:
        'The English translation of the zone the organization belongs to.',
    },
    zoneFR: {
      type: GraphQLNonNull(GraphQLString),
      description:
        'The English translation of the zone the organization belongs to.',
    },
    sectorEN: {
      type: GraphQLNonNull(GraphQLString),
      description:
        'The English translation of the sector the organization belongs to.',
    },
    sectorFR: {
      type: GraphQLNonNull(GraphQLString),
      description:
        'The French translation of the sector the organization belongs to.',
    },
    countryEN: {
      type: GraphQLNonNull(GraphQLString),
      description:
        'The English translation of the country the organization resides in.',
    },
    countryFR: {
      type: GraphQLNonNull(GraphQLString),
      description:
        'The French translation of the country the organization resides in.',
    },
    provinceEN: {
      type: GraphQLNonNull(GraphQLString),
      description:
        'The English translation of the province the organization resides in.',
    },
    provinceFR: {
      type: GraphQLNonNull(GraphQLString),
      description:
        'The French translation of the province the organization resides in.',
    },
    cityEN: {
      type: GraphQLNonNull(GraphQLString),
      description:
        'The English translation of the city the organization resides in.',
    },
    cityFR: {
      type: GraphQLNonNull(GraphQLString),
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
      request,
      collections,
      transaction,
      query,
      userId,
      auth: { userRequired },
      loaders: { orgLoaderBySlug },
      validators: { cleanseInput, slugify },
    },
  ) => {
    // Cleanse Input
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

    // Create EN and FR slugs
    const slugEN = slugify(nameEN)
    const slugFR = slugify(nameFR)

    // Get user
    const user = await userRequired()

    // Check to see if org already exists
    const [orgEN, orgFR] = await orgLoaderBySlug.loadMany([slugEN, slugFR])

    if (typeof orgEN !== 'undefined' || typeof orgFR !== 'undefined') {
      console.warn(
        `User: ${userId} attempted to create an organization that already exists: ${slugEN}`,
      )
      throw new Error(
        i18n._(t`Unable to create organization. Please try again.`),
      )
    }

    // Create new organization
    const organizationDetails = {
      verified: false,
      orgDetails: {
        en: {
          slug: slugEN,
          acronym: acronymEN,
          name: nameEN,
          zone: zoneEN,
          sector: sectorEN,
          country: countryEN,
          province: provinceEN,
          city: cityEN,
        },
        fr: {
          slug: slugFR,
          acronym: acronymFR,
          name: nameFR,
          zone: zoneFR,
          sector: sectorFR,
          country: countryFR,
          province: provinceFR,
          city: cityFR,
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

    let cursor
    try {
      cursor = await trx.run(
        async () =>
          await query`
            INSERT ${organizationDetails} INTO organizations 
            RETURN MERGE({ _id: NEW._id, _key: NEW._key, _rev: NEW._rev, verified: NEW.verified }, TRANSLATE(${request.language}, NEW.orgDetails))
          `,
      )
    } catch (err) {
      console.error(
        `Transaction error occurred when user: ${userId} was creating new organization ${slugEN}: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to create organization. Please try again.`),
      )
    }
    const organization = await cursor.next()

    try {
      await trx.run(
        async () =>
          await query`
            INSERT {
              _from: ${organization._id},
              _to: ${user._id},
              permission: "admin"
            } INTO affiliations
          `,
      )
    } catch (err) {
      console.error(
        `Transaction error occurred when inserting edge definition for user: ${userId} to ${slugEN}: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to create organization. Please try again.`),
      )
    }

    try {
      await trx.commit()
    } catch (err) {
      console.error(
        `Transaction error occurred when committing new organization: ${slugEN} for user: ${userId} to db: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to create organization. Please try again.`),
      )
    }

    console.info(
      `User: ${userId} successfully created a new organization: ${slugEN}`,
    )

    return {
      organization: {
        id: organization._key,
        ...organization,
      },
    }
  },
})

module.exports = {
  createOrganization,
}
