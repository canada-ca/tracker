import { GraphQLNonNull, GraphQLBoolean, GraphQLString, GraphQLID } from 'graphql'
import { fromGlobalId, mutationWithClientMutationId } from 'graphql-relay'
import { t } from '@lingui/macro'
import { updateTagUnion } from '../unions'
import { TagOwnershipEnums } from '../../enums'
import { logActivity } from '../../audit-logs'

export const updateTag = new mutationWithClientMutationId({
  name: 'UpdateTag',
  description: 'Mutation used to update labels for tagging domains.',
  inputFields: () => ({
    tagId: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'A unique identifier for the tag.',
    },
    labelEn: {
      type: GraphQLString,
      description: 'English label that will be displayed.',
    },
    labelFr: {
      description: 'French label that will be displayed.',
      type: GraphQLString,
    },
    descriptionEn: {
      description: 'English description of what the tag describes about a domain.',
      type: GraphQLString,
    },
    descriptionFr: {
      description: 'French description of what the tag describes about a domain.',
      type: GraphQLString,
    },
    isVisible: {
      description: 'Value used to decide if users should see the tag.',
      type: GraphQLBoolean,
    },
    ownership: {
      type: TagOwnershipEnums,
      description: 'Ownership of the tag, can be `global`, `org`, or `pending`.',
    },
    orgId: {
      description: 'The global id of the organization to be affiliated with the tag.',
      type: GraphQLID,
    },
  }),
  outputFields: () => ({
    result: {
      type: updateTagUnion,
      description: '`UpdateTagUnion` returning either a `Tag`, or `TagError` object.',
      resolve: (payload) => payload,
    },
  }),
  mutateAndGetPayload: async (
    args,
    {
      i18n,
      request,
      query,
      collections,
      transaction,
      userKey,
      auth: { userRequired, verifiedRequired, checkSuperAdmin, superAdminRequired, checkPermission },
      validators: { cleanseInput, slugify },
      loaders: { loadTagByTagId, loadOrgByKey },
    },
  ) => {
    // Get User
    const user = await userRequired()
    verifiedRequired({ user })

    // Cleanse input
    const tagId = cleanseInput(args.tagId)
    const labelEn = cleanseInput(args.labelEn)
    const labelFr = cleanseInput(args.labelFr)
    const descriptionEn = cleanseInput(args.descriptionEn)
    const descriptionFr = cleanseInput(args.descriptionFr)
    const ownership = cleanseInput(args.ownership)
    const isVisible = args.isVisible
    const { type: _orgType, id: orgId } = fromGlobalId(cleanseInput(args.orgId))

    let tagCursor
    try {
      tagCursor = await query`
        WITH tags
        FOR tag IN tags
          FILTER tag.tagId == ${tagId}
          RETURN tag
      `
    } catch (err) {
      console.error(`Database error occurred while retrieving tag: ${tagId} for update, err: ${err}`)
      throw new Error(i18n._(t`Unable to update tag. Please try again.`))
    }

    let compareTag
    try {
      compareTag = await tagCursor.next()
    } catch (err) {
      console.error(`Cursor error occurred while retrieving tag: ${tagId} for update, err: ${err}`)
      throw new Error(i18n._(t`Unable to update tag. Please try again.`))
    }

    if (typeof compareTag === 'undefined') {
      console.warn(
        `User: ${userKey} attempted to update tag: ${tagId}, however there is no tag associated with that id.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to update unknown tag.`),
      }
    }

    const isSuperAdmin = await checkSuperAdmin()
    if (['global', 'pending'].includes(compareTag.ownership)) superAdminRequired({ user, isSuperAdmin })

    let permission, org
    if (compareTag.ownership === 'org') {
      if (typeof orgId === 'undefined') {
        console.warn(
          `User: ${userKey} attempted to update a tag: ${compareTag.tagId}, however organization-owned tags must have a valid organization.`,
        )
        return {
          _type: 'error',
          code: 400,
          description: i18n._(t`Unable to update tag, orgId is invalid.`),
        }
      }
      // Check to see if org exists
      org = await loadOrgByKey.load(orgId)
      if (typeof org === 'undefined') {
        console.warn(`User: ${userKey} attempted to update a tag to an organization: ${orgId} that does not exist.`)
        return {
          _type: 'error',
          code: 400,
          description: i18n._(t`Unable to update tag in unknown organization.`),
        }
      }

      permission = await checkPermission({ orgId: org._id })
      if (!['super_admin', 'admin', 'owner'].includes(permission)) {
        console.warn(
          `User: ${userKey} attempted to update a tag in: ${org.slug}, however they do not have permission to do so.`,
        )
        return {
          _type: 'error',
          code: 400,
          description: i18n._(t`Permission Denied: Please contact organization admin for help with creating tag.`),
        }
      }

      if (!compareTag.organizations.includes(org._key)) {
        console.warn(
          `User: ${userKey} attempted to update a tag in: ${org.slug}, however the tag does not belong to this org.`,
        )
        return {
          _type: 'error',
          code: 400,
          description: i18n._(t`Permission Denied: Please contact organization admin for help with creating tag.`),
        }
      }

      if (compareTag.organizations.length > 1 && !isSuperAdmin) {
        console.warn(
          `User: ${userKey} attempted to update a tag in: ${org.slug}, however the tag belongs to more than one org.`,
        )
        return {
          _type: 'error',
          code: 400,
          description: i18n._(t`Permission Denied: Please contact super admin for help with updating tag.`),
        }
      }
    }

    const updatedTagId = slugify(`${labelEn || compareTag.label.en}-${labelFr || compareTag.label.fr}`)

    if (tagId !== updatedTagId) {
      const existingTag = await loadTagByTagId.load(updatedTagId)
      if (typeof existingTag !== 'undefined' && !['org', 'pending'].includes(compareTag.ownership)) {
        console.warn(`User: ${userKey} attempted to update a tag that already exists: ${updatedTagId}`)
        return {
          _type: 'error',
          code: 400,
          description: i18n._(t`Tag label already in use. Please try again with a different label.`),
        }
      }
    }

    // Update tag
    const updatedTag = {
      tagId: updatedTagId,
      label: {
        en: labelEn || compareTag.label.en,
        fr: labelFr || compareTag.label.fr,
      },
      description: {
        en: descriptionEn || compareTag.description.en,
        fr: descriptionFr || compareTag.description.fr,
      },
      visible: typeof isVisible !== 'undefined' ? isVisible : compareTag.visible,
      ownership: ownership || compareTag.ownership,
    }

    // Setup Transaction
    const trx = await transaction(collections)

    try {
      await trx.step(
        async () =>
          await query`
          WITH tags
          UPSERT { tagId: ${tagId} }
            INSERT ${updatedTag}
            UPDATE ${updatedTag}
            IN tags
      `,
      )
    } catch (err) {
      console.error(
        `Transaction step error occurred when user: ${userKey} attempted to update tag: ${tagId}, error: ${err}`,
      )
      await trx.abort()
      throw new Error(i18n._(t`Unable to update tag. Please try again.`))
    }

    // Commit transaction
    try {
      await trx.commit()
    } catch (err) {
      console.error(
        `Transaction commit error occurred when user: ${userKey} attempted to update tag: ${tagId}, error: ${err}`,
      )
      await trx.abort()
      throw new Error(i18n._(t`Unable to update tag. Please try again.`))
    }

    // Clear dataloader and load updated tag
    await loadTagByTagId.clear(updatedTag.tagId)
    const returnTag = await loadTagByTagId.load(updatedTag.tagId)

    console.info(`User: ${userKey} successfully updated tag: ${tagId}.`)

    const updatedProperties = []
    if (labelEn) {
      updatedProperties.push({
        name: 'labelEn',
        oldValue: compareTag.label.en,
        newValue: labelEn,
      })
    }
    if (labelFr) {
      updatedProperties.push({
        name: 'labelFr',
        oldValue: compareTag.label.fr,
        newValue: labelFr,
      })
    }
    if (descriptionEn) {
      updatedProperties.push({
        name: 'descriptionEn',
        oldValue: compareTag.description.en,
        newValue: descriptionEn,
      })
    }
    if (descriptionFr) {
      updatedProperties.push({
        name: 'descriptionFr',
        oldValue: compareTag.description.fr,
        newValue: descriptionFr,
      })
    }
    if (typeof isVisible !== 'undefined') {
      updatedProperties.push({
        name: 'visible',
        oldValue: compareTag.visible,
        newValue: isVisible,
      })
    }
    if (typeof ownership !== 'undefined') {
      updatedProperties.push({
        name: 'ownership',
        oldValue: compareTag.ownership,
        newValue: ownership,
      })
    }

    await logActivity({
      transaction,
      collections,
      query,
      initiatedBy: {
        id: user._key,
        userName: user.userName,
        role: isSuperAdmin ? 'super_admin' : permission,
        ipAddress: request.ip,
      },
      action: 'update',
      target: {
        resource: updatedTag.tagId,
        updatedProperties,
        organization: org && {
          id: org._key,
          name: org.name,
        }, // name of resource being acted upon
        resourceType: 'tag', // user, org, domain
      },
    })

    return returnTag
  },
})
