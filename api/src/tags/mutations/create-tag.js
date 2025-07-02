import { GraphQLNonNull, GraphQLID, GraphQLBoolean, GraphQLString } from 'graphql'
import { fromGlobalId, mutationWithClientMutationId } from 'graphql-relay'
import { t } from '@lingui/macro'
import { createTagUnion } from '../unions'
import { TagOwnershipEnums } from '../../enums'

export const createTag = new mutationWithClientMutationId({
  name: 'CreateTag',
  description: 'Mutation used to create a new label for tagging domains.',
  inputFields: () => ({
    labelEn: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'English label that will be displayed.',
    },
    labelFr: {
      description: 'French label that will be displayed.',
      type: new GraphQLNonNull(GraphQLString),
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
      description: 'Ownership of the tag, can be `global`, `org`, or `pending`.',
      type: new GraphQLNonNull(TagOwnershipEnums),
    },
    orgId: {
      description: 'The global id of the organization to be affiliated with the tag.',
      type: GraphQLID,
    },
  }),
  outputFields: () => ({
    result: {
      type: createTagUnion,
      description: '`CreateTagUnion` returning either a `Tag`, or `TagError` object.',
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
      auth: { userRequired, verifiedRequired, checkPermission, checkSuperAdmin, superAdminRequired },
      loaders: { loadTagByTagId, loadOrgByKey },
      validators: { cleanseInput, slugify },
    },
  ) => {
    // Get User
    const user = await userRequired()
    verifiedRequired({ user })

    // Cleanse input
    const labelEn = cleanseInput(args.labelEn)
    const labelFr = cleanseInput(args.labelFr)
    const descriptionEn = cleanseInput(args.descriptionEn)
    const descriptionFr = cleanseInput(args.descriptionFr)
    const ownership = cleanseInput(args.ownership)
    const { type: _orgType, id: orgId } = fromGlobalId(cleanseInput(args.orgId))

    const insertTag = {
      tagId: slugify(`${labelEn}_${labelFr}`),
      label: { en: labelEn, fr: labelFr },
      description: {
        en: descriptionEn || '',
        fr: descriptionFr || '',
      },
      visible: args?.isVisible || true,
      ownership,
      organizations: [],
    }

    const tag = await loadTagByTagId.load(insertTag.tagId)

    if (typeof tag !== 'undefined' && !['org', 'pending'].includes(ownership)) {
      console.warn(`User: ${userKey} attempted to create a tag that already exists: ${insertTag.tagId}`)
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Tag label already in use. Please try again with a different label.`),
      }
    }

    if (ownership === 'global') {
      const isSuperAdmin = await checkSuperAdmin()
      superAdminRequired({ user, isSuperAdmin })
    }

    // Setup Transaction
    const trx = await transaction(collections)

    if (ownership === 'org') {
      if (typeof orgId === 'undefined') {
        console.warn(
          `User: ${userKey} attempted to create a tag: ${insertTag.tagId}, however organization-owned tags must have a valid organization.`,
        )
        return {
          _type: 'error',
          code: 400,
          description: i18n._(t`Unable to create tag, tagId already in use.`),
        }
      } else {
        // Check to see if org exists
        const org = await loadOrgByKey.load(orgId)
        if (typeof org === 'undefined') {
          console.warn(`User: ${userKey} attempted to create a tag to an organization: ${orgId} that does not exist.`)
          return {
            _type: 'error',
            code: 400,
            description: i18n._(t`Unable to create tag in unknown organization.`),
          }
        }

        const permission = await checkPermission({ orgId })

        if (!['super_admin', 'admin', 'owner'].includes(permission)) {
          console.warn(
            `User: ${userKey} attempted to create a tag in: ${org.slug}, however they do not have permission to do so.`,
          )
          return {
            _type: 'error',
            code: 400,
            description: i18n._(t`Permission Denied: Please contact organization admin for help with creating tag.`),
          }
        }

        if (permission !== 'super_admin' && typeof tag === 'undefined') insertTag.ownership = 'pending'

        if (typeof tag !== 'undefined') {
          insertTag.organizations = [...tag.organizations, orgId]
        } else {
          insertTag.organizations = [orgId]
        }
      }
    }

    try {
      await trx.step(
        () =>
          query`
            UPSERT { tagId: ${insertTag.tagId} }
              INSERT ${insertTag}
              UPDATE ${insertTag}
              IN tags
              RETURN NEW
          `,
      )
    } catch (err) {
      console.error(`Transaction step error occurred for user: ${userKey} when inserting new tag: ${err}`)
      await trx.abort()
      throw new Error(i18n._(t`Unable to create tag. Please try again.`))
    }

    try {
      await trx.commit()
    } catch (err) {
      console.error(`Transaction commit error occurred while user: ${userKey} was creating tag: ${err}`)
      await trx.abort()
      throw new Error(i18n._(t`Unable to create tag. Please try again.`))
    }

    // Clear dataloader incase anything was updated or inserted into tag
    await loadTagByTagId.clear(insertTag.tagId)
    const returnTag = await loadTagByTagId.load(insertTag.tagId)

    console.info(`User: ${userKey} successfully created tag ${returnTag.tagId}`)

    return {
      ...returnTag,
    }
  },
})
