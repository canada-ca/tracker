import { GraphQLString, GraphQLNonNull, GraphQLID, GraphQLBoolean } from 'graphql'
import { mutationWithClientMutationId, fromGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

import { Acronym } from '../../scalars'
import { updateOrganizationUnion } from '../unions'
import { logActivity } from '../../audit-logs/mutations/log-activity'

export const updateOrganization = new mutationWithClientMutationId({
  name: 'UpdateOrganization',
  description: 'Mutation allows the modification of organizations if any changes to the organization may occur.',
  inputFields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLID),
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
      description: 'The English translation of the zone the organization belongs to.',
    },
    zoneFR: {
      type: GraphQLString,
      description: 'The English translation of the zone the organization belongs to.',
    },
    sectorEN: {
      type: GraphQLString,
      description: 'The English translation of the sector the organization belongs to.',
    },
    sectorFR: {
      type: GraphQLString,
      description: 'The French translation of the sector the organization belongs to.',
    },
    countryEN: {
      type: GraphQLString,
      description: 'The English translation of the country the organization resides in.',
    },
    countryFR: {
      type: GraphQLString,
      description: 'The French translation of the country the organization resides in.',
    },
    provinceEN: {
      type: GraphQLString,
      description: 'The English translation of the province the organization resides in.',
    },
    provinceFR: {
      type: GraphQLString,
      description: 'The French translation of the province the organization resides in.',
    },
    cityEN: {
      type: GraphQLString,
      description: 'The English translation of the city the organization resides in.',
    },
    cityFR: {
      type: GraphQLString,
      description: 'The French translation of the city the organization resides in.',
    },
    externallyManaged: {
      type: GraphQLBoolean,
      description: 'If the organization has domains that are managed externally.',
    },
    externalId: {
      type: GraphQLString,
      description: 'String ID used to identify the organization in an external system.',
    },
  }),
  outputFields: () => ({
    result: {
      type: new GraphQLNonNull(updateOrganizationUnion),
      description: '`UpdateOrganizationUnion` returning either an `Organization`, or `OrganizationError` object.',
      resolve: (payload) => payload,
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
      request: { ip },
      auth: { checkPermission, userRequired, verifiedRequired },
      loaders: { loadOrgByKey },
      validators: { cleanseInput, slugify },
    },
  ) => {
    // Get user
    const user = await userRequired()

    verifiedRequired({ user })

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
    const externalId = cleanseInput(args.externalId)

    // Create Slug
    const slugEN = slugify(nameEN)
    const slugFR = slugify(nameFR)

    // Check to see if org exists
    const currentOrg = await loadOrgByKey.load(orgKey)

    if (typeof currentOrg === 'undefined') {
      console.warn(
        `User: ${userKey} attempted to update organization: ${orgKey}, however no organizations is associated with that id.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to update unknown organization.`),
      }
    }

    // Check to see if user has permission
    const permission = await checkPermission({ orgId: currentOrg._id })

    if (permission !== 'admin' && permission !== 'super_admin') {
      console.error(
        `User: ${userKey} attempted to update organization ${orgKey}, however they do not have the correct permission level. Permission: ${permission}`,
      )
      return {
        _type: 'error',
        code: 403,
        description: i18n._(
          t`Permission Denied: Please contact organization admin for help with updating organization.`,
        ),
      }
    }

    // Check to see if any orgs already have the name in use
    if (nameEN !== '' || nameFR !== '') {
      let orgNameCheckCursor
      try {
        orgNameCheckCursor = await query`
          WITH organizations
          FOR org IN organizations
            FILTER (org.orgDetails.en.name == ${nameEN}) OR (org.orgDetails.fr.name == ${nameFR})
            RETURN org
        `
      } catch (err) {
        console.error(
          `Database error occurred during name check when user: ${userKey} attempted to update org: ${currentOrg._key}, ${err}`,
        )
        throw new Error(i18n._(t`Unable to update organization. Please try again.`))
      }

      if (orgNameCheckCursor.count > 0) {
        console.error(
          `User: ${userKey} attempted to change the name of org: ${currentOrg._key} however it is already in use.`,
        )
        return {
          _type: 'error',
          code: 400,
          description: i18n._(t`Organization name already in use, please choose another and try again.`),
        }
      }
    }

    // Get all org details for comparison
    let orgCursor
    try {
      orgCursor = await query`
        WITH organizations
        FOR org IN organizations
          FILTER org._key == ${orgKey}
          RETURN org
      `
    } catch (err) {
      console.error(`Database error occurred while retrieving org: ${orgKey} for update, err: ${err}`)
      throw new Error(i18n._(t`Unable to update organization. Please try again.`))
    }

    let compareOrg
    try {
      compareOrg = await orgCursor.next()
    } catch (err) {
      console.error(`Cursor error occurred while retrieving org: ${orgKey} for update, err: ${err}`)
      throw new Error(i18n._(t`Unable to update organization. Please try again.`))
    }

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

    if (permission === 'super_admin' && typeof args.externallyManaged !== 'undefined') {
      updatedOrgDetails.externallyManaged = args.externallyManaged
    }

    if (permission === 'super_admin' && typeof args.externalId !== 'undefined') {
      updatedOrgDetails.externalId = externalId
    }

    // Setup Trans action
    const trx = await transaction(collections)

    // Upsert new org details
    try {
      await trx.step(
        async () =>
          await query`
            WITH organizations
            UPSERT { _key: ${orgKey} }
              INSERT ${updatedOrgDetails}
              UPDATE ${updatedOrgDetails}
              IN organizations
          `,
      )
    } catch (err) {
      console.error(`Transaction error occurred while upserting org: ${orgKey}, err: ${err}`)
      await trx.abort()
      throw new Error(i18n._(t`Unable to update organization. Please try again.`))
    }

    try {
      await trx.commit()
    } catch (err) {
      console.error(`Transaction error occurred while committing org: ${orgKey}, err: ${err}`)
      await trx.abort()
      throw new Error(i18n._(t`Unable to update organization. Please try again.`))
    }

    await loadOrgByKey.clear(orgKey)
    const organization = await loadOrgByKey.load(orgKey)

    console.info(`User: ${userKey}, successfully updated org ${orgKey}.`)

    const updatedProperties = []
    if (nameEN) {
      updatedProperties.push({
        name: 'nameEN',
        oldValue: compareOrg.orgDetails.en.name,
        newValue: nameEN,
      })
    }
    if (nameFR) {
      updatedProperties.push({
        name: 'nameFR',
        oldValue: compareOrg.orgDetails.fr.name,
        newValue: nameFR,
      })
    }
    if (acronymEN) {
      updatedProperties.push({
        name: 'acronymEN',
        oldValue: compareOrg.orgDetails.en.acronym,
        newValue: acronymEN,
      })
    }
    if (acronymFR) {
      updatedProperties.push({
        name: 'acronymFR',
        oldValue: compareOrg.orgDetails.fr.acronym,
        newValue: acronymFR,
      })
    }
    if (updatedProperties.length > 0) {
      await logActivity({
        transaction,
        collections,
        query,
        initiatedBy: {
          id: user._key,
          userName: user.userName,
          role: permission,
          ipAddress: ip,
        },
        action: 'update',
        target: {
          resource: {
            en: compareOrg.orgDetails.en.name,
            fr: compareOrg.orgDetails.fr.name,
          },
          resourceType: 'organization', // user, org, domain
          updatedProperties,
        },
      })
    }

    return organization
  },
})
