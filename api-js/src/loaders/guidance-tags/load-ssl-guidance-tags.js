const DataLoader = require('dataloader')
const { t } = require('@lingui/macro')

const sslGuidanceTagLoader = (query, userKey, i18n) =>
  new DataLoader(async (tags) => {
    let cursor
    try {
      cursor = await query`
        FOR tag IN sslGuidanceTags
          FILTER tag._key IN ${tags}
          RETURN MERGE(tag, { tagId: tag._key, id: tag._key })
      `
    } catch (err) {
      console.error(
        `Database error occurred when user: ${userKey} running sslGuidanceTagLoader: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to find ssl guidance tags. Please try again.`),
      )
    }

    const tagMap = {}
    try {
      await cursor.each((tag) => {
        tagMap[tag._key] = tag
      })
    } catch (err) {
      console.error(
        `Cursor error occurred when user: ${userKey} running sslGuidanceTagLoader: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to find ssl guidance tags. Please try again.`),
      )
    }

    return tags.map((tag) => tagMap[tag])
  })

module.exports = {
  sslGuidanceTagLoader,
}
