import { t } from '@lingui/macro'
import { loadAllTags, loadTagByTagId, loadTagsByOrg } from './loaders'

export class TagsDataSource {
  constructor({ query, userKey, i18n, language, transaction, collections }) {
    this._query = query
    this._userKey = userKey
    this._i18n = i18n
    this._transaction = transaction
    this._collections = collections
    this.all = loadAllTags({ query, userKey, i18n, language })
    this.byTagId = loadTagByTagId({ query, userKey, i18n, language })
    this.byOrg = loadTagsByOrg({ query, userKey, i18n, language })
  }

  // Fetch the raw DB document (label/description as {en, fr} objects, not translated strings).
  // Used by mutations that need to read current field values before updating.
  async getRaw(tagId) {
    const { _query, _userKey, _i18n } = this
    let cursor
    try {
      cursor = await _query`
        WITH tags
        FOR tag IN tags
          FILTER tag.tagId == ${tagId}
          RETURN tag
      `
    } catch (err) {
      console.error(`Database error occurred while retrieving tag: ${tagId} for user: ${_userKey}, err: ${err}`)
      throw new Error(_i18n._(t`Unable to update tag. Please try again.`))
    }
    try {
      return await cursor.next()
    } catch (err) {
      console.error(`Cursor error occurred while retrieving tag: ${tagId} for user: ${_userKey}, err: ${err}`)
      throw new Error(_i18n._(t`Unable to update tag. Please try again.`))
    }
  }

  // Insert or update a tag, then return the freshly loaded record.
  async create(tag) {
    const { _query, _userKey, _i18n, _transaction, _collections } = this
    const trx = await _transaction(_collections)
    try {
      await trx.step(
        () =>
          _query`
            UPSERT { tagId: ${tag.tagId} }
              INSERT ${tag}
              UPDATE ${tag}
              IN tags
              RETURN NEW
          `,
      )
    } catch (err) {
      console.error(`Transaction step error occurred for user: ${_userKey} when inserting new tag: ${err}`)
      await trx.abort()
      throw new Error(_i18n._(t`Unable to create tag. Please try again.`))
    }
    try {
      await trx.commit()
    } catch (err) {
      console.error(`Transaction commit error occurred while user: ${_userKey} was creating tag: ${err}`)
      await trx.abort()
      throw new Error(_i18n._(t`Unable to create tag. Please try again.`))
    }
    this.byTagId.clear(tag.tagId)
    return this.byTagId.load(tag.tagId)
  }

  // Update an existing tag matched by matchTagId (which may differ from tag.tagId after a label rename),
  // then return the freshly loaded record.
  async save(matchTagId, tag) {
    const { _query, _userKey, _i18n, _transaction, _collections } = this
    const trx = await _transaction(_collections)
    try {
      await trx.step(
        async () =>
          await _query`
            WITH tags
            UPSERT { tagId: ${matchTagId} }
              INSERT ${tag}
              UPDATE ${tag}
              IN tags
          `,
      )
    } catch (err) {
      console.error(
        `Transaction step error occurred when user: ${_userKey} attempted to update tag: ${matchTagId}, error: ${err}`,
      )
      await trx.abort()
      throw new Error(_i18n._(t`Unable to update tag. Please try again.`))
    }
    try {
      await trx.commit()
    } catch (err) {
      console.error(
        `Transaction commit error occurred when user: ${_userKey} attempted to update tag: ${matchTagId}, error: ${err}`,
      )
      await trx.abort()
      throw new Error(_i18n._(t`Unable to update tag. Please try again.`))
    }
    this.byTagId.clear(tag.tagId)
    return this.byTagId.load(tag.tagId)
  }
}
