import { GraphQLNonNull, GraphQLID, GraphQLBoolean, GraphQLString } from 'graphql'
import { fromGlobalId, mutationWithClientMutationId } from 'graphql-relay'
import { t } from '@lingui/macro'
import { createTagUnion } from '../unions'

export const createTag = new mutationWithClientMutationId({
  name: 'CreateTag',
  description: 'Mutation used to create a new label for tagging domains.',
  inputFields: () => ({
    tagId: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'A unique identifier for the tag.',
    },
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
      auth: { userRequired, checkSuperAdmin, superAdminRequired, verifiedRequired },
      loaders: { loadTagByTagId },
      validators: { cleanseInput },
    },
  ) => {
    // Get User
    const user = await userRequired()
    verifiedRequired({ user })

    const isSuperAdmin = await checkSuperAdmin()
    superAdminRequired({ user, isSuperAdmin })

    // Cleanse input
    const tagId = cleanseInput(args.tagId)
    const labelEn = cleanseInput(args.labelEn)
    const labelFr = cleanseInput(args.labelFr)
    const descriptionEn = cleanseInput(args.descriptionEn)
    const descriptionFr = cleanseInput(args.descriptionFr)

    const insertTag = {
      tagId: tagId.toLowerCase(),
      label: { en: labelEn, fr: labelFr },
      description: {
        en: descriptionEn || '',
        fr: descriptionFr || '',
      },
      visible: args?.isVisible || false,
    }

    const tag = await loadTagByTagId.load(insertTag.tagId)
    if (typeof tag !== 'undefined') {
      console.warn(
        `User: ${userKey} attempted to create a tag: ${insertTag.tagId}, however a tag with that identifier already exists.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to create tag, tagId already in use.`),
      }
    }

    // Check to see if any tags already have the label in use
    let tagLabelCheckCursor
    try {
      tagLabelCheckCursor = await query`
          WITH tags
          FOR tag IN tags
            FILTER (tag.label.en == ${labelEn}) OR (tag.label.fr == ${labelFr})
            RETURN tag
        `
    } catch (err) {
      console.error(
        `Database error occurred during name check when user: ${userKey} attempted to create tag: ${insertTag.tagId}, ${err}`,
      )
      throw new Error(i18n._(t`Unable to create tag. Please try again.`))
    }

    if (tagLabelCheckCursor.count > 0) {
      console.error(
        `User: ${userKey} attempted to create a tag: ${insertTag.tagId} however the label is already in use.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Tag label already in use, please choose another and try again.`),
      }
    }

    if (ownership === 'global') {
      const isSuperAdmin = await checkSuperAdmin()
      superAdminRequired({ user, isSuperAdmin })
    }

    // Setup Transaction
    const trx = await transaction(collections)

    try {
      await trx.step(
        () =>
          query`
            UPSERT { tagId: ${insertTag.tagId} }
              INSERT ${insertTag}
              UPDATE { }
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
