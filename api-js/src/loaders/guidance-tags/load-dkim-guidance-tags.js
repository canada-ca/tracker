const DataLoader = require('dataloader')
const { t } = require('@lingui/macro')

const dkimGuidanceTagLoader = (query, i18n) =>
  new DataLoader(async (tags) => {
    let cursor
    try {
      cursor = await query`
        FOR tag IN dkimGuidanceTags
          FILTER ${tags}[** FILTER CURRENT == tag._key]
          RETURN MERGE(tag, { tagId: tag._key })
      `
    } catch (err) {
      console.error(
        `Database error occurred when running dkimGuidanceTagLoader: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to find dkim guidance tags. Please try again.`),
      )
    }

    const tagMap = {}
    try {
      await cursor.each((tag) => {
        tagMap[tag._key] = tag
      })
    } catch (err) {
      console.error(
        `Cursor error occurred when running dkimGuidanceTagLoader: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to find dkim guidance tags. Please try again.`),
      )
    }

    return tags.map((tag) => tagMap[tag])
  })

module.exports = {
  dkimGuidanceTagLoader,
}
