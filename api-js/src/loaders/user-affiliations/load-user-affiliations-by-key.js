const DataLoader = require('dataloader')
const { t } = require('@lingui/macro')

module.exports.affiliationLoaderByKey = (query, userId, i18n) =>
  new DataLoader(async (ids) => {
    let cursor

    try {
      cursor = await query`
        FOR affiliation IN affiliations
          FILTER affiliation._key IN ${ids}
          LET orgKey = PARSE_IDENTIFIER(affiliation._from).key
          LET userKey = PARSE_IDENTIFIER(affiliation._to).key
          RETURN MERGE(affiliation, { orgKey: orgKey, userKey: userKey })
      `
    } catch (err) {
      console.error(
        `Database error occurred when user: ${userId} running affiliationLoaderByKey: ${err}`,
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
        `Cursor error occurred when user: ${userId} running affiliationLoaderByKey: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to find user affiliation(s). Please try again.`),
      )
    }

    return ids.map((id) => affiliationMap[id])
  })
