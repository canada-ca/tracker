import { GraphQLNonNull, GraphQLBoolean, GraphQLString } from 'graphql'
import { mutationWithClientMutationId } from 'graphql-relay'
import { t } from '@lingui/macro'
import { updateTagUnion } from '../unions'

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
      query,
      collections,
      transaction,
      userKey,
      auth: { userRequired, verifiedRequired, checkSuperAdmin, superAdminRequired },
      validators: { cleanseInput },
      loaders: { loadTagByTagId },
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

    // Check to see if tag exists
    const currentTag = await loadTagByTagId.load(tagId)

    if (typeof currentTag === 'undefined') {
      console.warn(
        `User: ${userKey} attempted to update tag: ${tagId}, however there is no tag associated with that id.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to update unknown tag.`),
      }
    }

    // Check to see if any tags already have the label in use
    if (labelEn !== '' || labelFr !== '') {
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
          `Database error occurred during name check when user: ${userKey} attempted to update tag: ${currentTag.tagId}, ${err}`,
        )
        throw new Error(i18n._(t`Unable to update tag. Please try again.`))
      }

      if (tagLabelCheckCursor.count > 0) {
        console.error(
          `User: ${userKey} attempted to change the label of tag: ${currentTag.tagId} however it is already in use.`,
        )
        return {
          _type: 'error',
          code: 400,
          description: i18n._(t`Tag label already in use, please choose another and try again.`),
        }
      }
    }

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

    // Update domain
    const updatedTag = {
      label: {
        en: labelEn || compareTag.label.en,
        fr: labelFr || compareTag.label.fr,
      },
      description: {
        en: descriptionEn || compareTag.description.en,
        fr: descriptionFr || compareTag.description.fr,
      },
      visible: typeof args.isVisible !== 'undefined' ? args.isVisible : compareTag.visible,
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
        `Transaction step error occurred when user: ${userKey} attempted to update domain: ${tagId}, error: ${err}`,
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
    await loadTagByTagId.clear(currentTag.tagId)
    const returnTag = await loadTagByTagId.load(currentTag.tagId)

    console.info(`User: ${userKey} successfully updated tag: ${tagId}.`)

    returnTag.id = returnTag._key

    return {
      ...returnTag,
    }
  },
})
