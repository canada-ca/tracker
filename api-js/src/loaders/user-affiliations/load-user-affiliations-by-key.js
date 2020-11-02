const DataLoader = require('dataloader')
const { t } = require('@lingui/macro')

module.exports.affiliationLoaderByKey = (query, i18n) =>
  new DataLoader(async (ids) => {
    let cursor

    try {
      cursor = await query`
        FOR affiliation IN affiliations
          FILTER ${ids}[** FILTER CURRENT == affiliation._key]
          RETURN affiliation
      `
    } catch (err) {
      console.error(
        `Database error occurred when running affiliationLoaderByKey: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to find user affiliation(s). Please try again.`),
      )
    }

    const affiliationMap = {}
    try {
      await cursor.each((affiliation) => {
        affiliationMap[affiliation._key] = affiliation
      })
    } catch (err) {
      console.error(
        `Cursor error occurred during affiliationLoaderByKey: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to find user affiliation(s). Please try again.`),
      )
    }

    return ids.map((id) => affiliationMap[id])
  })
