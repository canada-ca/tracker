const DataLoader = require('dataloader')
const { t } = require('@lingui/macro')

const dmarcGuidanceTagLoader = (query, userId, i18n) =>
  new DataLoader(async (tags) => {
    let cursor
    try {
      cursor = await query`
        FOR tag IN dmarcGuidanceTags
          FILTER tag._key IN ${tags}
          RETURN MERGE(tag, { tagId: tag._key, id: tag._key })
      `
    } catch (err) {
      console.error(
        `Database error occurred when user: ${userId} running dmarcGuidanceTagLoader: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to find dmarc guidance tags. Please try again.`),
      )
    }

    const tagMap = {}
    try {
      await cursor.each((tag) => {
        tagMap[tag._key] = tag
      })
    } catch (err) {
      console.error(
        `Cursor error occurred when user: ${userId} running dmarcGuidanceTagLoader: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to find dmarc guidance tags. Please try again.`),
      )
    }

    return tags.map((tag) => tagMap[tag])
  })

module.exports = {
  dmarcGuidanceTagLoader,
}
