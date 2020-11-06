const DataLoader = require('dataloader')
const { t } = require('@lingui/macro')

const dmarcGuidanceTagLoader = (query, i18n) =>
  new DataLoader(async (tags) => {
    let cursor
    try {
      cursor = await query`
        FOR tag IN dmarcGuidanceTags
          FILTER ${tags}[** FILTER CURRENT == tag._key]
          RETURN tag
      `
    } catch (err) {
      console.error(
        `Database error occurred when running dmarcGuidanceTagLoader: ${err}`,
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
        `Cursor error occurred when running dmarcGuidanceTagLoader: ${err}`,
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
