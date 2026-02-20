import { GraphQLNonNull, GraphQLString, GraphQLBoolean } from 'graphql'
import { mutationWithClientMutationId } from 'graphql-relay'
import { t } from '@lingui/macro'

import { Acronym } from '../../scalars'
import { createOrganizationUnion } from '../unions'
import { logActivity } from '../../audit-logs/mutations/log-activity'

export const createOrganization = new mutationWithClientMutationId({
  name: 'CreateOrganization',
  description: 'This mutation allows the creation of an organization inside the database.',
  inputFields: () => ({
    acronymEN: {
      type: new GraphQLNonNull(Acronym),
      description: 'The English acronym of the organization.',
    },
    acronymFR: {
      type: new GraphQLNonNull(Acronym),
      description: 'The French acronym of the organization.',
    },
    nameEN: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The English name of the organization.',
    },
    nameFR: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The French name of the organization.',
    },
    externalId: {
      type: GraphQLString,
      description: 'String ID used to identify the organization in an external system.',
    },
    verified: {
      type: GraphQLBoolean,
      description: 'If the organization is verified.',
    },
  }),
  outputFields: () => ({
    result: {
      type: createOrganizationUnion,
      description: '`CreateOrganizationUnion` returning either an `Organization`, or `OrganizationError` object.',
      resolve: (payload) => payload,
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
      userKey,
      request: { ip },
      auth: { userRequired, verifiedRequired, checkSuperAdmin, superAdminRequired },
      loaders: { loadOrgBySlug },
      validators: { cleanseInput, slugify },
    },
  ) => {
    // Get user
    const user = await userRequired()

    verifiedRequired({ user })
    const isSuperAdmin = await checkSuperAdmin()

    if (args.verified === true) {
      superAdminRequired({ user, isSuperAdmin })
    }

    // Cleanse Input
    const acronymEN = cleanseInput(args.acronymEN)
    const acronymFR = cleanseInput(args.acronymFR)
    const nameEN = cleanseInput(args.nameEN)
    const nameFR = cleanseInput(args.nameFR)
    const externalId = cleanseInput(args.externalId)

    // Create EN and FR slugs
    const slugEN = slugify(nameEN)
    const slugFR = slugify(nameFR)

    // Check to see if org already exists
    const [orgEN, orgFR] = await loadOrgBySlug.loadMany([slugEN, slugFR])

    if (typeof orgEN !== 'undefined' || typeof orgFR !== 'undefined') {
      console.warn(`User: ${userKey} attempted to create an organization that already exists: ${slugEN}`)
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Organization name already in use. Please try again with a different name.`),
      }
    }

    // Create new organization
    const organizationDetails = {
      verified: args.verified || false,
      externallyManaged: false,
      externalId,
      orgDetails: {
        en: {
          slug: slugEN,
          acronym: acronymEN,
          name: nameEN,
        },
        fr: {
          slug: slugFR,
          acronym: acronymFR,
          name: nameFR,
        },
      },
    }

    // Setup Trans action
    const trx = await transaction(collections)

    let cursor
    try {
      cursor = await trx.step(
        () =>
          query`
            WITH organizations
            INSERT ${organizationDetails} INTO organizations
            RETURN MERGE(
              {
                _id: NEW._id,
                _key: NEW._key,
                _rev: NEW._rev,
                _type: "organization",
                id: NEW._key,
                verified: NEW.verified,
                domainCount: 0,
                summaries: NEW.summaries
              },
              TRANSLATE(${request.language}, NEW.orgDetails)
            )
          `,
      )
    } catch (err) {
      console.error(`Transaction error occurred when user: ${userKey} was creating new organization ${slugEN}: ${err}`)
      await trx.abort()
      throw new Error(i18n._(t`Unable to create organization. Please try again.`))
    }
    const organization = await cursor.next()

    try {
      await trx.step(
        () =>
          query`
            WITH affiliations, organizations, users
            INSERT {
              _from: ${organization._id},
              _to: ${user._id},
              permission: "owner",
            } INTO affiliations
          `,
      )
    } catch (err) {
      console.error(
        `Transaction error occurred when inserting edge definition for user: ${userKey} to ${slugEN}: ${err}`,
      )
      await trx.abort()
      throw new Error(i18n._(t`Unable to create organization. Please try again.`))
    }

    try {
      await trx.commit()
    } catch (err) {
      console.error(
        `Transaction error occurred when committing new organization: ${slugEN} for user: ${userKey} to db: ${err}`,
      )
      await trx.abort()
      throw new Error(i18n._(t`Unable to create organization. Please try again.`))
    }

    console.info(`User: ${userKey} successfully created a new organization: ${slugEN}`)
    await logActivity({
      transaction,
      collections,
      query,
      initiatedBy: {
        id: user._key,
        userName: user.userName,
        ipAddress: ip,
      },
      action: 'create',
      target: {
        resource: {
          en: organizationDetails.orgDetails.en.name,
          fr: organizationDetails.orgDetails.fr.name,
        }, // name of resource being acted upon
        resourceType: 'organization', // user, org, domain
      },
    })

    return organization
  },
})
